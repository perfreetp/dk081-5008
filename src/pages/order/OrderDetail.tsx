import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
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
  Gavel,
  Paperclip,
  Snowflake,
  History,
  Check,
  Trash2,
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { useAuthStore } from '../../stores/authStore';
import OrderTimeline from '../../components/business/OrderTimeline';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { formatTime } from '../../utils/format';
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
  goodsAmount: number;
  shippingFee: number;
  totalAmount: number;
  depositAmount: number;
  status: string;
  statusColor: string;
  statusBadgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  rawStatus: OrderStatus;
  selectable: boolean;
  isCancelled: boolean;
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

const AFTER_SALES_ACTION_CONFIG: Record<'confirm_adaptation' | 'apply_dispute' | 'contact_seller' | 'contact_buyer' | 'submit_evidence' | 'arbitration_decision' | 'release_final' | 'freeze_funds' | 'cancel_order', {
  label: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  borderColor: string;
  textColor: string;
}> = {
  confirm_adaptation: {
    label: '确认适配',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: <CheckCircle2 size={14} />,
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  apply_dispute: {
    label: '申请争议',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: <AlertTriangle size={14} />,
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  contact_seller: {
    label: '联系卖家',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: <MessageCircle size={14} />,
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  contact_buyer: {
    label: '联系买家',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: <MessageCircle size={14} />,
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  submit_evidence: {
    label: '提交举证',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: <Paperclip size={14} />,
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  arbitration_decision: {
    label: '仲裁裁决',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    icon: <Gavel size={14} />,
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  release_final: {
    label: '释放尾款',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    icon: <Coins size={14} />,
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  freeze_funds: {
    label: '冻结资金',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: <Snowflake size={14} />,
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  cancel_order: {
    label: '取消订单',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    icon: <XCircle size={14} />,
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
  },
};

function QuoteSnapshotCard({ quote, onClick }: { quote: Quote; onClick?: () => void }) {
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
    <div className={cn("space-y-3", onClick && "cursor-pointer hover:opacity-90 transition-opacity")} onClick={onClick}>
      <div className="flex items-center gap-3">
        <img
          src={quote.supplier.avatar}
          alt={quote.supplier.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
            {quote.supplier.name}
            {onClick && <ChevronRight size={12} className="text-orange-500" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin size={10} className="text-blue-500" />
              <span>{quote.supplier.city}</span>
            </div>
            <span>·</span>
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
  const location = useLocation();
  const { getOrderById, confirmAdaptation, completeOrder, payDeposit, cancelSubOrders, cancelOrder, addAfterSalesAction } = useOrderStore();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<GuaranteeOrder | null>(null);
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCancelSubModal, setShowCancelSubModal] = useState(false);
  const [showCancelSingleModal, setShowCancelSingleModal] = useState(false);
  const [adaptResult, setAdaptResult] = useState<AdaptResult>('pending');
  const [adaptImages, setAdaptImages] = useState<string[]>([]);
  const [adaptRemark, setAdaptRemark] = useState('');
  const [expandedRelay, setExpandedRelay] = useState(true);
  const [highlightAdaptSection, setHighlightAdaptSection] = useState(false);
  const adaptSectionRef = useRef<HTMLDivElement | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedSubOrderIds, setSelectedSubOrderIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const fromAfterSales = (location.state as { fromAfterSales?: string })?.fromAfterSales;
    if (fromAfterSales && order && (order.status === 'delivered' || order.status === 'adapt_confirmed')) {
      setTimeout(() => {
        if (adaptSectionRef.current) {
          adaptSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightAdaptSection(true);
          setTimeout(() => setHighlightAdaptSection(false), 3000);
        }
      }, 500);
    }
  }, [location.state, order]);

  const headerConfig = useMemo(
    () => (order ? STATUS_HEADER_CONFIG[order.status] : null),
    [order]
  );

  const [expandedSubOrderIds, setExpandedSubOrderIds] = useState<Set<string>>(new Set());

  const subOrders: SubOrderItem[] = useMemo(() => {
    if (!order?.isRelayParent) return [];
    
    const snapshots = order.relaySubOrderSnapshots || [];
    if (snapshots.length > 0) {
      return snapshots.map((snap: RelaySubOrderSnapshot) => {
        const statusConfig = SUBORDER_STATUS_CONFIG[snap.status];
        const subOrder = getOrderById(snap.subOrderId);
        const rawStatus = snap.status;
        const isCancelled = rawStatus === 'cancelled';
        const selectable = ['pending_payment', 'deposited'].includes(rawStatus);
        return {
          id: snap.subOrderId,
          supplierId: snap.supplierId,
          supplierName: snap.supplierName,
          supplierAvatar: snap.supplierAvatar,
          supplierCity: snap.supplierCity || subOrder?.supplier.city || '',
          partName: order.partInfo.partName,
          quantity: snap.quantity,
          unitPrice: snap.unitPrice,
          price: snap.totalAmount,
          goodsAmount: snap.amount,
          shippingFee: snap.shippingFee,
          totalAmount: snap.totalAmount,
          depositAmount: snap.depositAmount,
          status: statusConfig.label,
          statusColor: statusConfig.color,
          statusBadgeVariant: statusConfig.variant,
          rawStatus,
          selectable,
          isCancelled,
        };
      });
    }
    
    const relayIds = order.relayOrderIds || order.relaySubOrders || [];
    return relayIds.map((oid) => {
      const subOrder = getOrderById(oid);
      const rawStatus = subOrder?.status || 'pending_payment';
      const statusConfig = SUBORDER_STATUS_CONFIG[rawStatus];
      const qty = subOrder?.partInfo.quantity || 1;
      const unitPrice = subOrder?.partInfo.unitPrice || 0;
      const goodsAmount = qty * unitPrice;
      const isCancelled = rawStatus === 'cancelled';
      const selectable = ['pending_payment', 'deposited'].includes(rawStatus);
      return {
        id: oid,
        supplierId: subOrder?.supplierId || '',
        supplierName: subOrder?.supplier.name || '未知供应商',
        supplierAvatar: subOrder?.supplier.avatar || '',
        supplierCity: subOrder?.supplier.city || '',
        partName: order.partInfo.partName,
        quantity: qty,
        unitPrice,
        price: subOrder?.totalAmount || 0,
        goodsAmount,
        shippingFee: subOrder?.shippingFee || 10,
        totalAmount: subOrder?.totalAmount || 0,
        depositAmount: subOrder?.depositAmount || 0,
        status: statusConfig.label,
        statusColor: statusConfig.color,
        statusBadgeVariant: statusConfig.variant,
        rawStatus,
        selectable,
        isCancelled,
      };
    });
  }, [order, getOrderById]);

  const selectableSubOrders = useMemo(() => subOrders.filter((s) => s.selectable), [subOrders]);
  const cancelledCount = useMemo(() => subOrders.filter((s) => s.isCancelled).length, [subOrders]);
  const activeCount = subOrders.length - cancelledCount;

  const toggleSubOrderSelect = (subId: string) => {
    setSelectedSubOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  const toggleSelectAllSubOrders = () => {
    if (selectedSubOrderIds.size === selectableSubOrders.length) {
      setSelectedSubOrderIds(new Set());
    } else {
      setSelectedSubOrderIds(new Set(selectableSubOrders.map((s) => s.id)));
    }
  };

  const exitBatchMode = () => {
    setIsBatchMode(false);
    setSelectedSubOrderIds(new Set());
  };

  const handleBatchCancel = () => {
    if (!order || selectedSubOrderIds.size === 0) return;
    cancelSubOrders(order.id, Array.from(selectedSubOrderIds));
    const updated = getOrderById(order.id);
    if (updated) setOrder(updated);
    setShowCancelSubModal(false);
    exitBatchMode();
  };

  const handleSingleCancel = () => {
    if (!order) return;
    cancelOrder(order.id, '用户取消订单');
    const updated = getOrderById(order.id);
    if (updated) setOrder(updated);
    setShowCancelSingleModal(false);
  };

  const selectedSubOrders = useMemo(
    () => subOrders.filter((s) => selectedSubOrderIds.has(s.id)),
    [subOrders, selectedSubOrderIds]
  );
  const selectedCancelTotal = useMemo(
    () => selectedSubOrders.reduce((sum, s) => sum + s.totalAmount, 0),
    [selectedSubOrders]
  );

  const toggleSubOrderExpand = (id: string) => {
    setExpandedSubOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
            className="space-y-3"
          >
            {cancelledCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-amber-50 border border-amber-200"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-amber-800">
                    已取消 {cancelledCount} 家子订单，剩余 {activeCount} 家正常进行
                  </span>
                </div>
              </motion.div>
            )}
            <Card padding="md" className="bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Users size={12} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">接龙汇总</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
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
              {order.relaySummary.cancelledAmount && order.relaySummary.cancelledAmount > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">原总额</span>
                    <span className="font-medium text-gray-700 line-through">
                      ¥{order.relaySummary.originalTotalAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-red-500">取消</span>
                    <span className="font-medium text-red-600">-¥{order.relaySummary.cancelledAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-amber-200/50">
                    <span className="text-emerald-600">现总额</span>
                    <span className="font-bold text-emerald-700">¥{order.relaySummary.totalAmount}</span>
                  </div>
                </div>
              )}
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

            <QuoteSnapshotCard
              quote={order.partInfo.quoteSnapshot}
              onClick={order.sourceType === 'urgent' && order.sourceId ? () => navigate(`/urgent/${order.sourceId}`) : undefined}
            />
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
            <div className="px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 to-violet-50/80">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setExpandedRelay(!expandedRelay)}
                  className="flex items-center gap-2 flex-1"
                >
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
                </button>
                <motion.div
                  animate={{ rotate: expandedRelay ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-indigo-500"
                >
                  <ChevronRight size={18} />
                </motion.div>
              </div>
              {!isBatchMode ? (
                selectableSubOrders.length > 0 && (
                  <button
                    onClick={() => setIsBatchMode(true)}
                    className="ml-2 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 text-[11px] font-medium hover:bg-indigo-50 transition-colors flex items-center gap-1"
                  >
                    批量操作
                  </button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-600">
                    已选 <span className="font-bold text-indigo-600">{selectedSubOrderIds.size}</span> 家 / 共 {selectableSubOrders.length} 家
                  </span>
                  <button
                    onClick={toggleSelectAllSubOrders}
                    className="px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 text-[10px] font-medium hover:bg-gray-50"
                  >
                    {selectedSubOrderIds.size === selectableSubOrders.length && selectableSubOrders.length > 0
                      ? '取消全选'
                      : '全选'}
                  </button>
                  <button
                    onClick={exitBatchMode}
                    className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium hover:bg-gray-200"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>

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
                    {subOrders.map((sub, idx) => {
                      const isExpanded = expandedSubOrderIds.has(sub.id);
                      const isSelected = selectedSubOrderIds.has(sub.id);
                      return (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "rounded-xl overflow-hidden transition-all",
                            sub.isCancelled ? "bg-gray-100 opacity-75" : "bg-gray-50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-3 p-3 transition-colors",
                              !sub.isCancelled && !isBatchMode && "hover:bg-gray-100 cursor-pointer",
                              sub.isCancelled && "cursor-not-allowed",
                              isSelected && "bg-indigo-50 border border-indigo-100"
                            )}
                            onClick={() => {
                              if (sub.isCancelled) return;
                              if (isBatchMode && sub.selectable) {
                                toggleSubOrderSelect(sub.id);
                              } else if (!isBatchMode) {
                                toggleSubOrderExpand(sub.id);
                              }
                            }}
                          >
                            {isBatchMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (sub.selectable) {
                                    toggleSubOrderSelect(sub.id);
                                  }
                                }}
                                className={cn(
                                  "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                  sub.selectable
                                    ? isSelected
                                      ? "bg-indigo-500 border-indigo-500"
                                      : "bg-white border-gray-300 hover:border-indigo-400 cursor-pointer"
                                    : "bg-gray-200 border-gray-200 cursor-not-allowed"
                                )}
                                disabled={!sub.selectable}
                              >
                                {isSelected && sub.selectable && (
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                )}
                              </button>
                            )}
                            <div className="flex-shrink-0 relative">
                              <img
                                src={sub.supplierAvatar}
                                alt={sub.supplierName}
                                className={cn(
                                  "w-10 h-10 rounded-xl border",
                                  sub.isCancelled ? "border-gray-300 grayscale" : "border-gray-200"
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn(
                                  "text-xs font-semibold truncate",
                                  sub.isCancelled ? "text-gray-500" : "text-gray-800"
                                )}>
                                  {sub.supplierName}
                                </span>
                                {sub.isCancelled ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[9px] font-bold">
                                    已取消
                                  </span>
                                ) : (
                                  <Badge variant={sub.statusBadgeVariant} size="sm">
                                    {sub.status}
                                  </Badge>
                                )}
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
                            <div className="flex items-center gap-2">
                              <div className="text-right flex-shrink-0">
                                <div className={cn(
                                  "text-sm font-bold",
                                  sub.isCancelled ? "text-gray-400 line-through" : "text-accent-500"
                                )}>
                                  ¥{sub.totalAmount}
                                </div>
                              </div>
                              {!isBatchMode && !sub.isCancelled && (
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown size={16} className="text-gray-400" />
                                </motion.div>
                              )}
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {isExpanded && !sub.isCancelled && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3">
                                  <div className="ml-13 p-3 rounded-xl bg-white border border-gray-100 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Package size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-600">货款</span>
                                        <span className="text-[10px] text-gray-400">
                                          ({sub.quantity} × ¥{sub.unitPrice})
                                        </span>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-800">
                                        ¥{sub.goodsAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Truck size={12} className="text-gray-400" />
                                        <span className="text-xs text-gray-600">运费</span>
                                        <span className="text-[10px] text-gray-400">(系统预估)</span>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-800">
                                        ¥{sub.shippingFee.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="h-px bg-gray-100" />
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Shield size={12} className="text-amber-500" />
                                        <span className="text-xs text-gray-600">定金(30%)</span>
                                      </div>
                                      <span className="text-sm font-bold text-amber-600">
                                        ¥{sub.depositAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-100">
                                      <span className="text-xs text-gray-600">子订单合计</span>
                                      <span className="text-sm font-bold text-red-500">
                                        ¥{sub.totalAmount.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-xs text-gray-500">当前状态</span>
                                      <Badge variant={sub.statusBadgeVariant} size="sm">
                                        {sub.status}
                                      </Badge>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/order/${sub.id}`);
                                      }}
                                      className="w-full mt-1 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                    >
                                      查看子订单详情
                                      <ChevronRight size={12} />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isBatchMode && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <Button
                  size="lg"
                  variant="danger"
                  block
                  leftIcon={<Trash2 size={16} />}
                  disabled={selectedSubOrderIds.size === 0}
                  onClick={() => setShowCancelSubModal(true)}
                  className={selectedSubOrderIds.size === 0 ? "opacity-50 cursor-not-allowed" : ""}
                >
                  批量取消选中子订单
                </Button>
              </div>
            )}
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

        {(order.timeline.filter(t => t.actionType).length > 0) && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center">
                <History size={14} className="text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">处理记录</h3>
              <span className="text-[10px] text-gray-400 ml-auto">
                共 {order.timeline.filter(t => t.actionType).length} 条
              </span>
            </div>
            <div className="relative pl-2">
              {order.timeline
                .filter(t => t.actionType)
                .map((item, idx, arr) => {
                  const config = item.actionType ? AFTER_SALES_ACTION_CONFIG[item.actionType] : null;
                  if (!config) return null;
                  const operatorLabel =
                    item.operatorId === order.buyerId
                      ? order.buyer.name
                      : item.operatorId === order.supplierId
                      ? order.supplier.name
                      : '平台';
                  return (
                    <div key={idx} className="relative pb-4 last:pb-0">
                      {idx !== arr.length - 1 && (
                        <div className="absolute left-4 top-7 w-px h-[calc(100%-28px)] bg-gray-200" />
                      )}
                      <div className="flex gap-3">
                        <div className={cn(
                          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                          config.iconBg
                        )}>
                          <div className={config.iconColor}>{config.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={cn('text-xs font-semibold', config.textColor)}>
                              {config.label}
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {formatTime(item.timestamp)}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mb-1">
                            操作人：<span className="text-gray-700">{operatorLabel}</span>
                          </div>
                          {item.remark && (
                            <p className="text-xs text-gray-600 leading-relaxed mb-2">
                              {item.remark}
                            </p>
                          )}
                          {item.images && item.images.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {item.images.slice(0, 6).map((img, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-100"
                                >
                                  <img
                                    src={img}
                                    alt={`凭证${imgIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {item.images.length > 6 && (
                                <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                                  +{item.images.length - 6}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 safe-area-bottom">
        {order.status === 'pending_payment' && !order.isRelayParent && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-400">待支付定金</div>
              <div className="text-xl font-bold text-accent-500">¥{order.depositAmount}</div>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowCancelSingleModal(true)}
                className="border-red-300 text-red-500 hover:bg-red-50"
              >
                取消订单
              </Button>
              <Button size="lg" variant="primary" onClick={() => setShowPayModal(true)}>
                立即支付定金
              </Button>
            </div>
          </div>
        )}

        {(order.status === 'deposited' || order.status === 'preparing') && !order.isRelayParent && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-400">当前状态</div>
              <div className="text-base font-bold text-gray-900">
                {order.status === 'deposited' ? '定金已锁定' : '备货中'}
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setShowCancelSingleModal(true)}
              className="border-red-300 text-red-500 hover:bg-red-50"
            >
              取消订单
            </Button>
          </div>
        )}

        {order.status === 'pending_payment' && order.isRelayParent && (
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
          <div
            ref={adaptSectionRef}
            className={cn(
              'flex items-center gap-2.5 transition-all duration-500',
              highlightAdaptSection && 'ring-4 ring-blue-400/50 ring-offset-2 rounded-xl -mx-1 px-1 py-1 animate-pulse'
            )}
          >
            <Button
              size="lg"
              variant="secondary"
              block
              onClick={() => {
                if (id) addAfterSalesAction(id, 'apply_dispute', '买家发起争议申请');
                navigate(`/order/${order.id}/dispute`);
              }}
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
              onClick={() => {
                if (id && user) {
                  const actionType = user.id === order.buyerId ? 'contact_seller' : 'contact_buyer';
                  addAfterSalesAction(id, actionType, '争议期间沟通');
                }
              }}
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

      <AnimatePresence>
        {showCancelSubModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelSubModal(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden"
            >
              <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle size={16} />
                    批量取消子订单
                  </h2>
                  <button
                    onClick={() => setShowCancelSubModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-180px)]">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    确认取消以下 {selectedSubOrders.length} 家子订单？
                  </p>
                  <p className="text-xs text-red-600 leading-relaxed">
                    取消后定金将原路退回，操作不可撤销。
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedSubOrders.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img
                          src={sub.supplierAvatar}
                          alt={sub.supplierName}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {sub.supplierName}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        ¥{sub.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-gray-900 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">合计取消</span>
                    <span className="text-lg font-bold text-red-400">
                      ¥{selectedCancelTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                <div className="flex items-center gap-2.5">
                  <Button
                    size="lg"
                    variant="secondary"
                    block
                    onClick={() => setShowCancelSubModal(false)}
                  >
                    再想想
                  </Button>
                  <Button
                    size="lg"
                    variant="danger"
                    block
                    onClick={handleBatchCancel}
                    leftIcon={<Trash2 size={16} />}
                  >
                    残忍取消
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelSingleModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelSingleModal(false)}
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
                  <h2 className="text-base font-bold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle size={16} />
                    取消订单确认
                  </h2>
                  <button
                    onClick={() => setShowCancelSingleModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    确认取消此订单？
                  </p>
                  <p className="text-xs text-red-600 leading-relaxed">
                    取消后定金将原路退回，操作不可撤销。
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-900 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">订单编号</span>
                    <span className="text-xs font-mono text-gray-300">{order.orderNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">取消金额</span>
                    <span className="text-lg font-bold text-red-400">
                      ¥{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-2.5">
                  <Button
                    size="lg"
                    variant="secondary"
                    block
                    onClick={() => setShowCancelSingleModal(false)}
                  >
                    再想想
                  </Button>
                  <Button
                    size="lg"
                    variant="danger"
                    block
                    onClick={handleSingleCancel}
                    leftIcon={<Trash2 size={16} />}
                  >
                    确认取消
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
