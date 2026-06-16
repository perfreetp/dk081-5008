import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  AlertTriangle,
  Upload,
  X,
  CheckCircle2,
  Clock,
  Users,
  Scale,
  Shield,
  Lock,
  FileText,
  Send,
  MessageCircle,
  Award,
  TrendingDown,
  TrendingUp,
  Handshake,
  UserX,
  Package,
  ChevronRight,
  Camera,
  MessageSquare,
  Gavel,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { DisputeRecord, GuaranteeOrder } from '../../types';

const DISPUTE_REASONS = [
  { key: 'wrong_part', label: '配件型号不符', icon: <Package size={16} /> },
  { key: 'damaged', label: '运输损坏', icon: <Package size={16} /> },
  { key: 'not_fit', label: '无法适配安装', icon: <X size={16} /> },
  { key: 'fake', label: '假货/翻新冒充', icon: <Shield size={16} /> },
  { key: 'missing', label: '缺件少件', icon: <Package size={16} /> },
  { key: 'other', label: '其他问题', icon: <MessageCircle size={16} /> },
];

type ResolutionType = 'resolved_buyer' | 'resolved_supplier' | 'resolved_split';

interface ResolutionOption {
  key: ResolutionType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  gradient: string;
  badgeGradient: string;
  buyerPercent: number;
  supplierPercent: number;
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    key: 'resolved_buyer',
    label: '买家胜诉',
    sublabel: '全额退款',
    icon: <UserX size={20} />,
    gradient: 'from-blue-500 to-indigo-600',
    badgeGradient: 'from-blue-500/10 to-indigo-500/10',
    buyerPercent: 100,
    supplierPercent: 0,
  },
  {
    key: 'resolved_supplier',
    label: '卖家胜诉',
    sublabel: '全额打款',
    icon: <Award size={20} />,
    gradient: 'from-emerald-500 to-teal-600',
    badgeGradient: 'from-emerald-500/10 to-teal-500/10',
    buyerPercent: 0,
    supplierPercent: 100,
  },
  {
    key: 'resolved_split',
    label: '五五分账',
    sublabel: '各承担一半',
    icon: <Handshake size={20} />,
    gradient: 'from-amber-500 to-orange-600',
    badgeGradient: 'from-amber-500/10 to-orange-500/10',
    buyerPercent: 50,
    supplierPercent: 50,
  },
];

interface ArbitrationStep {
  key: string;
  label: string;
  desc: string;
  completed: boolean;
  active: boolean;
}

export default function DisputePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getOrderById, resolveDispute, initiateDispute, updateDispute, addAfterSalesAction } = useOrderStore();

  const [order, setOrder] = useState<GuaranteeOrder | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [buyerStatement, setBuyerStatement] = useState('');
  const [supplierStatement, setSupplierStatement] = useState('我是按照订单要求发货的原厂拆车件，发货前已确认型号无误。建议买家联系维修厂确认安装方式。');
  const [selectedResolution, setSelectedResolution] = useState<ResolutionType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [arbitrationProgress, setArbitrationProgress] = useState(45);

  useEffect(() => {
    if (id) {
      const found = getOrderById(id);
      if (found) {
        setOrder(found);
        if (found.dispute) {
          setIsInitiating(false);
        } else {
          setIsInitiating(true);
        }
      } else {
        navigate('/order');
      }
    }
  }, [id, getOrderById, navigate]);

  useEffect(() => {
    if (!isInitiating) {
      const timer = setInterval(() => {
        setArbitrationProgress((prev) => {
          if (prev >= 75) return prev;
          return prev + Math.random() * 3;
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isInitiating]);

  const frozenAmount = order?.dispute?.frozenAmount || order?.totalAmount || 0;

  const arbitrationSteps: ArbitrationStep[] = useMemo(() => {
    const progress = arbitrationProgress;
    return [
      {
        key: 'apply',
        label: '申请发起',
        desc: '买家提交争议申请',
        completed: true,
        active: false,
      },
      {
        key: 'evidence',
        label: '证据收集',
        desc: '双方提交举证材料',
        completed: progress >= 30,
        active: progress >= 20 && progress < 30,
      },
      {
        key: 'review',
        label: '专员审核',
        desc: '平台专员核实证据',
        completed: progress >= 60,
        active: progress >= 30 && progress < 60,
      },
      {
        key: 'mediate',
        label: '双方调解',
        desc: '协调和解方案',
        completed: progress >= 85,
        active: progress >= 60 && progress < 85,
      },
      {
        key: 'result',
        label: '仲裁结果',
        desc: '执行最终裁定',
        completed: progress >= 100,
        active: progress >= 85 && progress < 100,
      },
    ];
  }, [arbitrationProgress]);

  const handleAddImage = () => {
    if (evidenceImages.length >= 9) return;
    const newImg = `https://picsum.photos/300/300?random=${Date.now()}`;
    setEvidenceImages([...evidenceImages, newImg]);
  };

  const handleRemoveImage = (index: number) => {
    setEvidenceImages(evidenceImages.filter((_, i) => i !== index));
  };

  const handleInitiateDispute = () => {
    if (!order || !selectedReason) return;
    const reasonConfig = DISPUTE_REASONS.find((r) => r.key === selectedReason);
    initiateDispute(order.id, order.buyerId, reasonConfig?.label || '争议', evidenceImages);
    addAfterSalesAction(
      order.id,
      'apply_dispute',
      `${reasonConfig?.label || '争议'}：${buyerStatement || '无详细描述'}`,
      evidenceImages.length > 0 ? evidenceImages : undefined
    );
    addAfterSalesAction(order.id, 'freeze_funds', `争议冻结资金 ¥${frozenAmount.toFixed(2)}`);
    const updated = getOrderById(order.id);
    if (updated) {
      setOrder(updated);
      setIsInitiating(false);
    }
  };

  const handleConfirmResolution = () => {
    if (!order || !selectedResolution) return;
    const option = RESOLUTION_OPTIONS.find((o) => o.key === selectedResolution)!;
    const buyerAmount = Math.round((frozenAmount * option.buyerPercent) / 100);
    const supplierAmount = Math.round((frozenAmount * option.supplierPercent) / 100);
    const remarks: Record<ResolutionType, string> = {
      resolved_buyer: `经平台核实，配件确实存在${DISPUTE_REASONS.find((r) => r.key === selectedReason)?.label || '问题'}，支持买家全额退款。`,
      resolved_supplier: '经平台核实，卖家发货符合订单约定，配件不存在描述不符问题，支持卖家全额收款。',
      resolved_split: '鉴于双方均存在一定责任，经平台调解，双方各承担50%损失，冻结资金五五分账。',
    };
    addAfterSalesAction(
      order.id,
      'arbitration_decision',
      `仲裁结果：${option.label}（买家¥${buyerAmount}，卖家¥${supplierAmount}）。${remarks[selectedResolution]}`
    );
    resolveDispute(order.id, selectedResolution, remarks[selectedResolution], buyerAmount, supplierAmount);
    const updated = getOrderById(order.id);
    if (updated) setOrder(updated);
    setShowConfirm(false);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-red-500 via-rose-500 to-red-600 pt-3 pb-16 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative px-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-white text-center">
              <div className="text-xs font-semibold">争议处理</div>
              <div className="text-[10px] opacity-70 font-mono">{order.orderNo}</div>
            </div>
            <div className="w-9" />
          </div>

          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 relative"
            >
              <AlertTriangle size={26} className="text-white" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-2xl border-2 border-white/40"
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xl font-bold text-white mb-1"
              >
                {isInitiating ? '发起争议申请' : '争议处理中'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[12px] text-white/80 leading-relaxed"
              >
                {isInitiating
                  ? '请详细描述问题并上传举证材料，平台将在24小时内介入'
                  : '平台专员正在核实双方证据，请保持电话畅通'}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center">
                <Lock size={18} className="text-amber-900" />
              </div>
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center"
              >
                <Gavel size={8} className="text-white" strokeWidth={3} />
              </motion.div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/70 mb-0.5">已冻结交易资金</div>
              <div className="text-2xl font-bold text-yellow-300">
                ¥{frozenAmount.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="warning" size="sm">
                仲裁待决
              </Badge>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="px-4 -mt-10 space-y-3">
        {!isInitiating && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                  <Gavel size={12} className="text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">仲裁进度</h3>
              </div>
              <span className="text-xs font-bold text-red-600">
                {Math.round(arbitrationProgress)}%
              </span>
            </div>

            <div className="mb-5">
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${arbitrationProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full relative"
                >
                  <motion.div
                    animate={{ x: ['-100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>提交</span>
                <span>举证</span>
                <span>审核</span>
                <span>调解</span>
                <span>结案</span>
              </div>
            </div>

            <div className="relative pl-6 space-y-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-200 via-orange-200 to-gray-100" />
              {arbitrationSteps.map((step, idx) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-6 top-0">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all',
                        step.completed
                          ? 'bg-green-500 border-green-400'
                          : step.active
                          ? 'bg-orange-500 border-orange-400 animate-pulse'
                          : 'bg-white border-gray-200'
                      )}
                    >
                      {step.completed && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className={cn(
                          'text-xs font-semibold mb-0.5',
                          step.completed
                            ? 'text-green-700'
                            : step.active
                            ? 'text-orange-600'
                            : 'text-gray-500'
                        )}
                      >
                        {step.label}
                      </div>
                      <p className="text-[11px] text-gray-500">{step.desc}</p>
                    </div>
                    {step.active && (
                      <Badge variant="warning" size="sm" dot>
                        进行中
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {isInitiating && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle size={12} className="text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">选择争议原因</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {DISPUTE_REASONS.map((reason) => (
                <button
                  key={reason.key}
                  onClick={() => setSelectedReason(reason.key)}
                  className={cn(
                    'relative flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                    selectedReason === reason.key
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      selectedReason === reason.key
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {reason.icon}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold truncate',
                      selectedReason === reason.key ? 'text-red-700' : 'text-gray-700'
                    )}
                  >
                    {reason.label}
                  </span>
                  {selectedReason === reason.key && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
                    >
                      <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Camera size={12} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">举证图片</h3>
            </div>
            <span className="text-[11px] text-gray-400">{evidenceImages.length}/9</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {evidenceImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  src={img}
                  alt={`举证${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </motion.div>
            ))}
            {evidenceImages.length < 9 && (
              <button
                onClick={handleAddImage}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/50 transition-colors flex flex-col items-center justify-center gap-1.5"
              >
                <Upload size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">上传凭证</span>
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={12} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-800">
                {isInitiating ? '问题描述' : '买家陈述'}
              </span>
            </div>
            <textarea
              value={buyerStatement}
              onChange={(e) => setBuyerStatement(e.target.value)}
              placeholder="请详细描述遇到的问题，包括时间、情况、诉求等..."
              rows={4}
              disabled={!isInitiating}
              className={cn(
                'w-full px-3.5 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 transition-all resize-none',
                isInitiating
                  ? 'bg-gray-50 border-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300'
                  : 'bg-blue-50/50 border-blue-100'
              )}
            />
          </div>
        </Card>

        {!isInitiating && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users size={12} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">双方陈述</h3>
              </div>
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-3 border-l-2 border-blue-400"
              >
                <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white">
                  买
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-800">
                    {order.buyer.name}
                  </span>
                  <Badge variant="info" size="sm">
                    买家
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {order.dispute?.createdAt
                      ? new Date(order.dispute.createdAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed bg-blue-50/50 rounded-lg p-2.5">
                  {order.dispute?.reason
                    ? `收到的配件存在「${order.dispute.reason}」问题，与订单描述严重不符，已安装但无法正常使用，要求平台介入处理并全额退款。`
                    : buyerStatement || '买家已提交争议申请，正在补充详细描述...'}
                </p>
                {order.dispute?.evidenceImages && order.dispute.evidenceImages.length > 0 && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {order.dispute.evidenceImages.slice(0, 4).map((img, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-100"
                      >
                        <img src={img} alt={`举证${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative pl-3 border-l-2 border-emerald-400"
              >
                <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white">
                  卖
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-gray-800">
                    {order.supplier.name}
                  </span>
                  <Badge variant="success" size="sm">
                    卖家
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    {new Date(Date.now() - 12 * 3600 * 1000).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed bg-emerald-50/50 rounded-lg p-2.5">
                  {supplierStatement}
                </p>
              </motion.div>
            </div>

            {order.dispute?.arbitratorRemark && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield size={12} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">
                    平台专员备注
                  </span>
                  <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md">
                    官方
                  </span>
                </div>
                <p className="text-[11px] text-amber-700/80 leading-relaxed">
                  {order.dispute.arbitratorRemark}
                </p>
              </motion.div>
            )}
          </Card>
        )}

        {arbitrationProgress >= 70 && !order.dispute?.resolvedAt && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Scale size={12} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">解冻方案建议</h3>
              </div>
              <Badge variant="reputation-mid" size="sm">
                AI智能建议
              </Badge>
            </div>

            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              基于双方举证材料和历史交易数据，平台提供以下裁定方案供参考，点击选择后确认执行。
            </p>

            <div className="space-y-2.5">
              {RESOLUTION_OPTIONS.map((option, idx) => (
                <motion.button
                  key={option.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedResolution(option.key)}
                  className={cn(
                    'relative w-full p-4 rounded-2xl border-2 text-left transition-all overflow-hidden',
                    selectedResolution === option.key
                      ? `border-transparent bg-gradient-to-r ${option.badgeGradient}`
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  )}
                >
                  {selectedResolution === option.key && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`absolute inset-0 bg-gradient-to-r ${option.gradient} opacity-5`}
                    />
                  )}

                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                        selectedResolution === option.key
                          ? `bg-gradient-to-br ${option.gradient} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {option.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-sm font-bold',
                            selectedResolution === option.key ? 'text-gray-900' : 'text-gray-800'
                          )}
                        >
                          {option.label}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-md font-medium',
                            selectedResolution === option.key
                              ? `bg-gradient-to-r ${option.gradient} text-white`
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {option.sublabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[8px] font-bold">
                            买
                          </div>
                          <span className="text-[11px] font-semibold">
                            ¥{Math.round((frozenAmount * option.buyerPercent) / 100)}
                          </span>
                          <TrendingDown
                            size={11}
                            className={option.buyerPercent > 0 ? 'text-green-500' : 'text-gray-300'}
                          />
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${option.buyerPercent}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.1 + 0.2 }}
                            className={`h-full bg-gradient-to-r ${option.gradient}`}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp
                            size={11}
                            className={option.supplierPercent > 0 ? 'text-emerald-500' : 'text-gray-300'}
                          />
                          <span className="text-[11px] font-semibold">
                            ¥{Math.round((frozenAmount * option.supplierPercent) / 100)}
                          </span>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[8px] font-bold">
                            卖
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Clock size={10} />
                          <span>预计24小时内到账</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                        selectedResolution === option.key
                          ? `bg-gradient-to-br ${option.gradient}`
                          : 'border-2 border-gray-200'
                      )}
                    >
                      {selectedResolution === option.key && (
                        <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        )}

        <Card padding="none" className="overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-primary-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-900">关联订单</h3>
            </div>
            <button
              onClick={() => navigate(`/order/${order.id}`)}
              className="text-xs text-primary-600 font-medium flex items-center gap-0.5"
            >
              查看订单 <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {order.partInfo.images?.[0] ? (
                  <img
                    src={order.partInfo.images[0]}
                    alt={order.partInfo.partName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={22} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                  {order.partInfo.partName}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
                  <span>{order.partInfo.carPlatform.brand}</span>
                  <span>x{order.partInfo.quantity}</span>
                </div>
                <div className="text-[11px] font-bold text-accent-500">
                  订单金额 ¥{order.totalAmount}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 safe-area-bottom">
        {isInitiating ? (
          <div className="flex items-center gap-2.5">
            <Button size="lg" variant="secondary" block onClick={() => navigate(-1)}>
              取消申请
            </Button>
            <Button
              size="lg"
              variant="primary"
              block
              onClick={handleInitiateDispute}
              disabled={!selectedReason}
              leftIcon={<Send size={16} />}
            >
              提交争议申请
            </Button>
          </div>
        ) : selectedResolution && arbitrationProgress >= 70 ? (
          <Button
            size="lg"
            variant="primary"
            block
            onClick={() => setShowConfirm(true)}
            leftIcon={<Gavel size={16} />}
          >
            确认执行裁定方案
          </Button>
        ) : (
          <div className="flex items-center gap-2.5">
            <Button
              size="lg"
              variant="secondary"
              block
              leftIcon={<MessageCircle size={16} />}
            >
              联系对方
            </Button>
            <Button
              size="lg"
              variant="primary"
              block
              leftIcon={<Shield size={16} />}
            >
              联系平台专员
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-4 right-4 top-1/2 z-50 -translate-y-1/2 bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 pb-4">
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                  >
                    <Gavel size={32} className="text-white" strokeWidth={2} />
                  </motion.div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                  确认执行仲裁结果
                </h3>
                <p className="text-xs text-gray-500 text-center leading-relaxed mb-5">
                  此操作不可撤销，确认后平台将按照以下方案划拨冻结资金
                </p>

                {selectedResolution && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      'p-4 rounded-2xl mb-5',
                      `bg-gradient-to-r ${RESOLUTION_OPTIONS.find((o) => o.key === selectedResolution)!.badgeGradient}`
                    )}
                  >
                    {(() => {
                      const opt = RESOLUTION_OPTIONS.find((o) => o.key === selectedResolution)!;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/60 text-gray-700 font-medium">
                              {opt.sublabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1">
                              买家获得
                              <span className="font-bold text-orange-600">
                                ¥{Math.round((frozenAmount * opt.buyerPercent) / 100)}
                              </span>
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1">
                              卖家获得
                              <span className="font-bold text-emerald-600">
                                ¥{Math.round((frozenAmount * opt.supplierPercent) / 100)}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600/80 leading-relaxed">
                    裁定一旦执行不可逆转，请务必确认方案无误。如有异议可在3个工作日内联系平台申诉。
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    block
                    onClick={() => setShowConfirm(false)}
                  >
                    再想想
                  </Button>
                  <Button
                    size="lg"
                    variant="primary"
                    block
                    onClick={handleConfirmResolution}
                  >
                    确认执行
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
