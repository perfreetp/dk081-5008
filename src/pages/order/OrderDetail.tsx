import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MoreHorizontal,
  ChevronRight,
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Shield,
  Lock,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Coins,
  AlertTriangle,
  Package,
  Truck,
  FileCheck,
  Clock,
  Users,
  Link2,
  Eye,
  TrendingUp,
  Car,
  Hash,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { useAuthStore } from '../../stores/authStore';
import OrderTimeline from '../../components/business/OrderTimeline';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { AdaptConfirm, GuaranteeOrder, OrderStatus, Quote, RelaySubOrderSnapshot } from '../../types';

const STATUS_HEADER_CONFIG: Record<
  OrderStatus,
  {
    gradient: string;
    iconBg: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }
> = {
  pending_payment: {
    gradient: 'from-gray-500 via-gray-600 to-gray-700',
    iconBg: 'bg-white/20',
    title: '等待支付定金',
    subtitle: '请在30分钟内完成支付，超时订单将自动取消',
    icon: <Clock size={22} className="text-white" />,
  },
  deposited: {
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    iconBg: 'bg-white/20',
    title: '定金已锁定',
    subtitle: '平台已托管保证金，卖家正在备货中',
    icon: <Lock size={22} className="text-white" />,
  },
  preparing: {
    gradient: 'from-blue-500 via-indigo-500 to-blue-600',
    iconBg: 'bg-white/20',
    title: '卖家备货中',
    subtitle: '货物正在打包，请耐心等待发货',
    icon: <Package size={22} className="text-white" />,
  },
  shipped: {
    gradient: 'from-indigo-500 via-violet-500 to-indigo-600',
    iconBg: 'bg-white/20',
    title: '货物运输中',
    subtitle: '物流正在派送，请保持电话畅通',
    icon: <Truck size={22} className="text-white" />,
  },
  delivered: {
    gradient: 'from-violet-500 via-purple-500 to-violet-600',
    iconBg: 'bg-white/20',
    title: '等待验货适配',
    subtitle: '货物已签收，请尽快验货并确认适配结果',
    icon: <FileCheck size={22} className="text-white" />,
  },
  adapt_confirmed: {
    gradient: 'from-emerald-500 via-teal-500 to-emerald-600',
    iconBg: 'bg-white/20',
    title: '适配通过',
    subtitle: '请确认无误后释放尾款给卖家',
    icon: <CheckCircle2 size={22} className="text-white" />,
  },
  completed: {
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    iconBg: 'bg-white/20',
    title: '订单已完成',
    subtitle: '交易圆满完成，感谢您的信任',
    icon: <Sparkles size={22} className="text-white" />,
  },
  disputing: {
    gradient: 'from-red-500 via-rose-500 to-red-600',
    iconBg: 'bg-white/20',
    title: '争议处理中',
    subtitle: '平台正在介入处理，请配合提供举证材料',
    icon: <AlertTriangle size={22} className="text-white" />,
  },
  cancelled: {
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    iconBg: 'bg-white/20',
    title: '订单已取消',
    subtitle: '订单已关闭，保证金原路退回',
    icon: <XCircle size={22} className="text-white" />,
  },
};

const CONDITION_LABEL: Record<string, string> = {
  new: '全新原厂',
  used: '拆车件',
  refurbished: '专业翻新',
};

type AdaptResult = 'fit' | 'wrong' | 'pending';

interface SubOrderItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierAvatar: string;
  supplierCity: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  price: number;
  status: string;
  statusColor: string;
  statusBadgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const SUBORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending_payment: { label: '待支付', color: 'bg-gray-100 text-gray-600', variant: 'default' },
  deposited: { label: '定金已付', color: 'bg-amber-100 text-amber-600', variant: 'warning' },
  preparing: { label: '备货中', color: 'bg-amber-100 text-amber-600', variant: 'warning' },
  shipped: { label: '运输中', color: 'bg-blue-100 text-blue-600', variant: 'info' },
  delivered: { label: '已签收', color: 'bg-indigo-100 text-indigo-600', variant: 'info' },
  adapt_confirmed: { label: '适配通过', color: 'bg-emerald-100 text-emerald-600', variant: 'success' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-600', variant: 'success' },
  disputing: { label: '争议中', color: 'bg-red-100 text-red-600', variant: 'danger' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', variant: 'default' },
};

function QuoteSnapshotCard({ quote }: { quote: Quote }) {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={10}
            className={cn(
              i < fullStars
                ? 'text-amber-400 fill-amber-400'
                : i === fullStars && hasHalf
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={quote.supplier.avatar}
          alt={quote.supplier.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {quote.supplier.name}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            {renderStars(quote.supplier.reputation.starRating)}
            <span>·</span>
            <span>{quote.supplier.reputation.totalDeals}笔交易</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-white border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">运总价</div>
          <div className="text-base font-bold text-red-600">
            ¥{quote.totalPrice.toFixed(0)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">配件单价</div>
          <div className="text-base font-bold text-gray-700">
            ¥{quote.price.toFixed(0)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">运费</div>
          <div className="text-sm font-semibold text-gray-700">
            ¥{quote.shippingFee.toFixed(0)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white border border-gray-100">
          <div className="text-[10px] text-gray-400 mb-0.5">来源城市</div>
          <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <MapPin size={11} className="text-blue-500" />
            {quote.sourceCity}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {quote.canShipToday && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-100 text-green-600 text-[10px] font-bold">
            <Truck size={10} />
            当天发车
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-medium">
          距离 {quote.distanceKm.toFixed(0)}km
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-medium">
          <Shield size={10} />
          {quote.warrantyDays > 0 ? `${quote.warrantyDays}天质保` : '无质保'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-medium">
          {(quote.supplier.reputation.positiveRate * 100).toFixed(0)}% 履约率
        </span>
      </div>

      {quote.remark && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-700 italic">"{quote.remark}"</p>
        </div>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getOrderById, confirmAdaptation, completeOrder, payDeposit } = useOrderStore();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<GuaranteeOrder | null>(null);
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [adaptResult, setAdaptResult] = useState<AdaptResult>('pending');
  const [adaptImages, setAdaptImages] = useState<string[]>([]);
  const [adaptRemark, setAdaptRemark] = useState('');
  const [expandedRelay, setExpandedRelay] = useState(true);

  useEffect(() => {
    if (id) {
      const found = getOrderById(id);
      if (found) {
        setOrder(found);
      } else {
        navigate('/order');
      }
    }
  }, [id, getOrderById, navigate]);

  const headerConfig = useMemo(
    () => (order ? STATUS_HEADER_CONFIG[order.status] : null),
    [order]
  );

  const subOrders: SubOrderItem[] = useMemo(() => {
    if (!order?.isRelayParent) return [];
    
    const snapshots = order.relaySubOrderSnapshots || [];
    if (snapshots.length > 0) {
      return snapshots.map((snap: RelaySubOrderSnapshot) => {
        const statusConfig = SUBORDER_STATUS_CONFIG[snap.status];
        const subOrder = getOrderById(snap.subOrderId);
        return {
          id: snap.subOrderId,
          supplierId: snap.supplierId,
          supplierName: snap.supplierName,
          supplierAvatar: snap.supplierAvatar,
          supplierCity: subOrder?.supplier.city || '',
          partName: order.partInfo.partName,
          quantity: snap.quantity,
          unitPrice: snap.unitPrice,
          price: snap.amount,
          status: statusConfig.label,
          statusColor: statusConfig.color,
          statusBadgeVariant: statusConfig.variant,
        };
      });
    }
    
    const relayIds = order.relayOrderIds || order.relaySubOrders || [];
    return relayIds.map((oid) => {
      const subOrder = getOrderById(oid);
      const status = subOrder?.status || 'pending_payment';
      const statusConfig = SUBORDER_STATUS_CONFIG[status];
      return {
        id: oid,
        supplierId: subOrder?.supplierId || '',
        supplierName: subOrder?.supplier.name || '未知供应商',
        supplierAvatar: subOrder?.supplier.avatar || '',
        supplierCity: subOrder?.supplier.city || '',
        partName: order.partInfo.partName,
        quantity: subOrder?.partInfo.quantity || 1,
        unitPrice: subOrder?.partInfo.unitPrice || 0,
        price: subOrder?.totalAmount || 0,
        status: statusConfig.label,
        statusColor: statusConfig.color,
        statusBadgeVariant: statusConfig.variant,
      };
    });
  }, [order, getOrderById]);

  const parentOrder = useMemo(() => {
    if (order?.isRelayParent) return null;
    const allOrders = useOrderStore.getState().orders;
    return allOrders.find(o => 
      o.isRelayParent && 
      (o.relayOrderIds?.includes(order!.id) || o.relaySubOrders?.includes(order!.id))
    );
  }, [order]);

  const finalPayment = useMemo(() => {
    if (!order) return 0;
    return Math.max(0, order.totalAmount - order.depositAmount - order.shippingFee);
  }, [order]);

  const handleAddImage = () => {
    if (adaptImages.length >= 6) return;
    const newImg = `https://picsum.photos/200/200?random=${Date.now()}`;
    setAdaptImages([...adaptImages, newImg]);
  };

  const handleRemoveImage = (index: number) => {
    setAdaptImages(adaptImages.filter((_, i) => i !== index));
  };

  const handleSubmitAdapt = () => {
    if (!order || adaptResult === 'pending') return;
    const resultMap: Record<AdaptResult, AdaptConfirm['result']> = {
      fit: 'fit',
      wrong: 'wrong',
      pending: 'partial',
    };
    confirmAdaptation(order.id, resultMap[adaptResult], adaptImages, adaptRemark);
    const updated = getOrderById(order.id);
    if (updated) setOrder(updated);
    setShowAdaptModal(false);
    setAdaptResult('pending');
    setAdaptImages([]);
    setAdaptRemark('');
  };

  const handleReleaseFinal = () => {
    if (!order) return;
    completeOrder(order.id);
    const updated = getOrderById(order.id);
    if (updated) setOrder(updated);
  };

  const handlePayDeposit = () => {
    if (!order) return;
    payDeposit(order.id);
    const updated = getOrderById(order.id);
    if (updated) setOrder(updated);
    setShowPayModal(false);
  };

  if (!order || !headerConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isBuyer = true;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-gradient-to-br ${headerConfig.gradient} pt-3 pb-16 overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative px-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-white">
              <div className="text-[10px] opacity-70 font-mono">订单编号</div>
              <div className="text-xs font-medium">{order.orderNo}</div>
            </div>
            <button className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className={`w-14 h-14 rounded-2xl ${headerConfig.iconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0`}
            >
              {headerConfig.icon}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl font-bold text-white"
                >
                  {headerConfig.title}
                </motion.h1>
                {order.isRelayParent && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25, type: 'spring' }}
                    className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                  >
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      <Link2 size={10} />
                      接龙担保订单
                    </span>
                  </motion.div>
                )}
              </div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[12px] text-white/80 leading-relaxed"
              >
                {headerConfig.subtitle}
              </motion.p>
            </div>
          </div>

          {order.status === 'deposited' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center">
                  <Shield size={18} className="text-amber-900" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 rounded-xl border border-amber-300"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-white/70">平台托管保证金</span>
                  <span className="text-lg font-bold text-yellow-300">
                    ¥{order.depositAmount}
                  </span>
                </div>
                <p className="text-[10px] text-white/60 mt-0.5">
                  交易完成前保障双方权益，平台不挪用
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="px-4 -mt-10 space-y-3">
        {parentOrder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 flex items-center gap-3 cursor-pointer hover:from-indigo-100 hover:to-violet-100 transition-colors"
            onClick={() => navigate(`/order/${parentOrder.id}`)}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Link2 size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                归属接龙主订单
                <Badge variant="info" size="sm">
                  {parentOrder.relaySummary?.totalSuppliers || 0}家供应商
                </Badge>
              </div>
              <div className="text-[11px] text-indigo-500 font-mono mt-0.5">
                {parentOrder.orderNo}
              </div>
            </div>
            <ChevronRight size={16} className="text-indigo-400 flex-shrink-0" />
          </motion.div>
        )}

        {order.isRelayParent && order.relaySummary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card padding="md" className="bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Users size={12} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">接龙汇总</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2.5 rounded-xl bg-white">
                  <div className="text-[10px] text-gray-400 mb-0.5">供应商数</div>
                  <div className="text-lg font-bold text-indigo-600">
                    {order.relaySummary.totalSuppliers}
                    <span className="text-[10px] font-normal text-gray-400 ml-0.5">家</span>
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-white">
                  <div className="text-[10px] text-gray-400 mb-0.5">总数量</div>
                  <div className="text-lg font-bold text-violet-600">
                    {order.relaySummary.totalQty}
                    <span className="text-[10px] font-normal text-gray-400 ml-0.5">件</span>
                  </div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-white">
                  <div className="text-[10px] text-gray-400 mb-0.5">总金额</div>
                  <div className="text-lg font-bold text-accent-500">
                    ¥{order.relaySummary.totalAmount}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center">
                <TrendingUp size={12} className="text-primary-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">订单进度</h3>
            </div>
            <button
              onClick={() => order.status === 'disputing' && navigate(`/order/${order.id}/dispute`)}
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                order.status === 'disputing' ? 'text-red-600' : 'text-primary-600'
              )}
            >
              {order.status === 'disputing' ? '查看争议' : '查看详情'}
              <ChevronRight size={12} />
            </button>
          </div>
          <OrderTimeline
            items={order.timeline}
            currentStatus={order.status}
            depositAmount={order.depositAmount}
            showDisputeBanner={order.status === 'disputing'}
            disputeReason={order.dispute?.reason}
          />
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">配件详情快照</h3>
            <Badge variant="info" size="sm">
              下单时快照
            </Badge>
          </div>

          <div className="flex gap-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
              {order.partInfo.images?.[0] ? (
                <img
                  src={order.partInfo.images[0]}
                  alt={order.partInfo.partName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package size={28} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                {order.partInfo.partName}
              </h4>

              <div className="flex flex-wrap gap-1.5">
                <Chip size="sm" variant="default">
                  {CONDITION_LABEL[order.partInfo.conditionType] || '拆车件'}
                </Chip>
                <Chip size="sm" variant="outline" icon={<Hash size={10} />}>
                  {order.partInfo.quantity} 件
                </Chip>
                {order.sourceType === 'urgent' && (
                  <Chip size="sm" variant="primary">
                    急件
                  </Chip>
                )}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Car size={11} className="text-gray-400" />
                  <span>{order.partInfo.carPlatform.brand} {order.partInfo.carPlatform.series}</span>
                </div>
                {order.partInfo.partNumber && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Layers size={11} className="text-gray-400" />
                    <span className="font-mono">OE: {order.partInfo.partNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-[10px] text-gray-400">单价</span>
                <span className="text-base font-bold text-accent-500">
                  ¥{order.partInfo.unitPrice.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {order.partInfo.images && order.partInfo.images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {order.partInfo.images.map((img, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                >
                  <img src={img} alt={`配件${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {order.partInfo.quoteSnapshot && (
          <Card padding="md" className="border-2 border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Sparkles size={12} className="text-orange-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">本次报价快照</h3>
              </div>
              <Badge variant="warning" size="sm">
                采纳时快照
              </Badge>
            </div>

            <QuoteSnapshotCard quote={order.partInfo.quoteSnapshot} />
          </Card>
        )}

        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">交易双方</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {order.buyer.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {order.buyer.name}
                  </span>
                  <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                    买家
                  </span>
                  {order.buyer.verified && (
                    <Badge variant="success" size="sm" dot>
                      已认证
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-0.5">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                    <span>{order.buyer.reputation.starRating}</span>
                  </div>
                  <span className="text-gray-200">·</span>
                  <span>{order.buyer.reputation.totalDeals}笔交易</span>
                  <span className="text-gray-200">·</span>
                  <MapPin size={10} className="text-gray-400" />
                  <span>{order.buyer.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                  <Phone size={15} />
                </button>
                <button className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors">
                  <MessageCircle size={15} />
                </button>
              </div>
            </div>

            <div className="relative h-px bg-gray-100 mx-2">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <ChevronRight size={12} className="text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {order.supplier.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {order.supplier.name}
                  </span>
                  <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                    卖家
                  </span>
                  {order.supplier.verified && (
                    <Badge variant="reputation-high" size="sm">
                      金牌商家
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-0.5">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                    <span>{order.supplier.reputation.starRating}</span>
                  </div>
                  <span className="text-gray-200">·</span>
                  <span>{order.supplier.reputation.totalDeals}笔交易</span>
                  <span className="text-gray-200">·</span>
                  <MapPin size={10} className="text-gray-400" />
                  <span>{order.supplier.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                  <Phone size={15} />
                </button>
                <button className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors">
                  <MessageCircle size={15} />
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">费用明细</h3>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">配件货款 ({order.partInfo.quantity}件)</span>
              <span className="text-sm font-medium text-gray-900">
                ¥{(order.partInfo.unitPrice * order.partInfo.quantity).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">物流运费</span>
              <span className="text-sm font-medium text-gray-900">
                ¥{order.shippingFee.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">订单总额</span>
              <span className="text-base font-bold text-accent-500">
                ¥{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock size={13} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-800">已付定金(平台托管)</span>
              </div>
              <span className="text-sm font-bold text-amber-700">
                -¥{order.depositAmount.toFixed(2)}
              </span>
            </div>
            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'pending_payment' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins size={13} className="text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-800">待付尾款</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  ¥{finalPayment.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {order.isRelayParent && subOrders.length > 0 && (
          <Card padding="none" className="overflow-hidden">
            <button
              onClick={() => setExpandedRelay(!expandedRelay)}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 to-violet-50/80 hover:from-indigo-50 hover:to-violet-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Users size={13} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    接龙子订单
                    <Badge variant="info" size="sm">
                      {subOrders.length}家
                    </Badge>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    聚合 {order.partInfo.partName}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedRelay ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="text-indigo-500"
              >
                <ChevronRight size={18} />
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedRelay && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2.5">
                    {subOrders.map((sub, idx) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/order/${sub.id}`)}
                      >
                        <div className="flex-shrink-0 relative">
                          <img
                            src={sub.supplierAvatar}
                            alt={sub.supplierName}
                            className="w-10 h-10 rounded-xl border border-gray-200"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {sub.supplierName}
                            </span>
                            <Badge variant={sub.statusBadgeVariant} size="sm">
                              {sub.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
                            <MapPin size={9} className="text-gray-400" />
                            <span>{sub.supplierCity}</span>
                            <span className="text-gray-300">·</span>
                            <span>x{sub.quantity}件</span>
                            <span className="text-gray-300">·</span>
                            <span>单价 ¥{sub.unitPrice}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">{sub.partName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-accent-500">¥{sub.price}</div>
                          <ChevronRight size={10} className="text-gray-300 ml-auto mt-0.5" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {order.adaptConfirm && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">适配确认记录</h3>
              <Badge
                variant={
                  order.adaptConfirm.result === 'fit'
                    ? 'success'
                    : order.adaptConfirm.result === 'wrong'
                    ? 'danger'
                    : 'warning'
                }
                size="sm"
              >
                {order.adaptConfirm.result === 'fit'
                  ? '完美适配'
                  : order.adaptConfirm.result === 'wrong'
                  ? '无法适配'
                  : '部分适配'}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mb-3">{order.adaptConfirm.remark || '无备注'}</p>
            {order.adaptConfirm.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {order.adaptConfirm.images.map((img, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100"
                  >
                    <img src={img} alt={`对比${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 safe-area-bottom">
        {order.status === 'pending_payment' && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-400">待支付定金</div>
              <div className="text-xl font-bold text-accent-500">¥{order.depositAmount}</div>
            </div>
            <Button size="lg" variant="primary" onClick={() => setShowPayModal(true)}>
              立即支付定金
            </Button>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="flex items-center gap-2.5">
            <Button
              size="lg"
              variant="secondary"
              block
              onClick={() => navigate(`/order/${order.id}/dispute`)}
              leftIcon={<AlertTriangle size={16} />}
            >
              申请争议
            </Button>
            <Button
              size="lg"
              variant="primary"
              block
              onClick={() => setShowAdaptModal(true)}
              leftIcon={<CheckCircle2 size={16} />}
            >
              确认适配
            </Button>
          </div>
        )}

        {order.status === 'adapt_confirmed' && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-400">待释放尾款</div>
              <div className="text-xl font-bold text-emerald-600">¥{finalPayment}</div>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={handleReleaseFinal}
              leftIcon={<Coins size={16} />}
            >
              释放尾款
            </Button>
          </div>
        )}

        {order.status === 'disputing' && (
          <div className="flex items-center gap-2.5">
            <Button
              size="lg"
              variant="secondary"
              block
              leftIcon={<MessageCircle size={16} />}
            >
              联系平台
            </Button>
            <Button
              size="lg"
              variant="primary"
              block
              onClick={() => navigate(`/order/${order.id}/dispute`)}
              leftIcon={<Eye size={16} />}
            >
              查看争议进度
            </Button>
          </div>
        )}

        {(order.status === 'completed' || order.status === 'cancelled') && (
          <div className="flex items-center gap-2.5">
            <Button size="lg" variant="secondary" block>
              再来一单
            </Button>
            <Button size="lg" variant="primary" block>
              {order.status === 'completed' ? '评价卖家' : '查看退款'}
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdaptModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdaptModal(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">适配结果确认</h2>
                  <button
                    onClick={() => setShowAdaptModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  请上传配件安装对比图，确认适配情况
                </p>
              </div>

              <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-2.5">选择适配结果</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: 'fit' as AdaptResult, label: '完美适配', icon: <CheckCircle2 size={20} />, color: 'emerald' },
                      { key: 'wrong' as AdaptResult, label: '无法适配', icon: <XCircle size={20} />, color: 'red' },
                      { key: 'pending' as AdaptResult, label: '待核实', icon: <HelpCircle size={20} />, color: 'amber' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setAdaptResult(opt.key)}
                        className={cn(
                          'relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all',
                          adaptResult === opt.key
                            ? opt.color === 'emerald'
                              ? 'border-emerald-500 bg-emerald-50'
                              : opt.color === 'red'
                              ? 'border-red-500 bg-red-50'
                              : 'border-amber-500 bg-amber-50'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            opt.color === 'emerald'
                              ? 'bg-emerald-100 text-emerald-600'
                              : opt.color === 'red'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-600'
                          )}
                        >
                          {opt.icon}
                        </div>
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            adaptResult === opt.key
                              ? opt.color === 'emerald'
                                ? 'text-emerald-700'
                                : opt.color === 'red'
                                ? 'text-red-700'
                                : 'text-amber-700'
                              : 'text-gray-600'
                          )}
                        >
                          {opt.label}
                        </span>
                        {adaptResult === opt.key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              'absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center',
                              opt.color === 'emerald'
                                ? 'bg-emerald-500'
                                : opt.color === 'red'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                            )}
                          >
                            <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="text-sm font-semibold text-gray-800">上传对比图</div>
                    <span className="text-[11px] text-gray-400">{adaptImages.length}/6</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {adaptImages.map((img, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                      >
                        <img src={img} alt={`对比图${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </motion.div>
                    ))}
                    {adaptImages.length < 6 && (
                      <button
                        onClick={handleAddImage}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/50 transition-colors flex flex-col items-center justify-center gap-1.5"
                      >
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400">添加图片</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-2.5">备注说明</div>
                  <textarea
                    value={adaptRemark}
                    onChange={(e) => setAdaptRemark(e.target.value)}
                    placeholder="请描述适配情况或遇到的问题（选填）"
                    rows={3}
                    className="w-full px-3.5 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                <div className="flex items-center gap-2.5">
                  <Button
                    size="lg"
                    variant="secondary"
                    block
                    onClick={() => setShowAdaptModal(false)}
                  >
                    取消
                  </Button>
                  <Button
                    size="lg"
                    variant="primary"
                    block
                    onClick={handleSubmitAdapt}
                    disabled={adaptResult === 'pending'}
                  >
                    提交确认
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayModal(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
            >
              <div className="px-4 pt-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">支付定金</h2>
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 relative"
                >
                  <Lock size={36} className="text-white" strokeWidth={2.5} />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-3xl border-2 border-amber-400"
                  />
                </motion.div>
                <p className="text-xs text-gray-500 mb-1">平台托管保证金</p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent mb-1"
                >
                  ¥{order.depositAmount.toFixed(2)}
                </motion.div>
                <p className="text-[11px] text-gray-400 mb-6">
                  订单总额 ¥{order.totalAmount.toFixed(2)} · 定金比例 {Math.round((order.depositAmount / order.totalAmount) * 100)}%
                </p>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6 text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-amber-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-amber-800">平台资金安全保障</span>
                  </div>
                  <ul className="text-[11px] text-amber-700/80 space-y-1 ml-6">
                    <li>· 交易完成前定金由平台托管</li>
                    <li>· 适配通过后释放尾款给卖家</li>
                    <li>· 如有争议平台介入仲裁</li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  variant="primary"
                  block
                  onClick={handlePayDeposit}
                  leftIcon={<Lock size={16} />}
                >
                  确认支付 ¥{order.depositAmount}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
