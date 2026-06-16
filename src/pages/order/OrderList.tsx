import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronRight,
  Filter,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Package,
  PackageSearch,
  Users,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Coins,
  Link2,
  Lock,
  Sparkles,
  Phone,
  MessageCircle,
  Gavel,
  Paperclip,
  Snowflake,
  Handshake,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { useAuthStore } from '../../stores/authStore';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card, { CardContent } from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { formatTime } from '../../utils/format';
import { GuaranteeOrder, OrderStatus, AfterSalesActionType } from '../../types';

type TabKey = 'pending_payment' | 'pending_ship' | 'pending_confirm' | 'completed' | 'dispute';
type SourceType = 'all' | 'urgent' | 'stock' | 'relay';
type AfterSalesFilter = 'none' | 'pending_inspection' | 'near_timeout' | 'in_dispute';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  statuses: OrderStatus[];
  color: string;
  activeBg: string;
}

interface SourceTabConfig {
  key: SourceType;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeBg: string;
  activeColor: string;
}

const TABS: TabConfig[] = [
  {
    key: 'pending_payment',
    label: '待支付',
    icon: <Clock size={14} />,
    statuses: ['pending_payment'],
    color: 'text-gray-600',
    activeBg: 'bg-gray-100',
  },
  {
    key: 'pending_ship',
    label: '待发货',
    icon: <Package size={14} />,
    statuses: ['deposited', 'preparing'],
    color: 'text-amber-600',
    activeBg: 'bg-amber-50',
  },
  {
    key: 'pending_confirm',
    label: '待确认',
    icon: <Truck size={14} />,
    statuses: ['shipped', 'delivered', 'adapt_confirmed'],
    color: 'text-blue-600',
    activeBg: 'bg-blue-50',
  },
  {
    key: 'completed',
    label: '已完成',
    icon: <CheckCircle2 size={14} />,
    statuses: ['completed'],
    color: 'text-green-600',
    activeBg: 'bg-green-50',
  },
  {
    key: 'dispute',
    label: '争议中',
    icon: <AlertTriangle size={14} />,
    statuses: ['disputing'],
    color: 'text-red-600',
    activeBg: 'bg-red-50',
  },
];

const SOURCE_TABS: SourceTabConfig[] = [
  {
    key: 'all',
    label: '全部',
    icon: <Filter size={12} />,
    color: 'text-gray-500',
    activeBg: 'bg-gray-100',
    activeColor: 'text-gray-700',
  },
  {
    key: 'urgent',
    label: '急件来源',
    icon: <AlertTriangle size={12} />,
    color: 'text-orange-500',
    activeBg: 'bg-orange-100',
    activeColor: 'text-orange-600',
  },
  {
    key: 'stock',
    label: '现货来源',
    icon: <Package size={12} />,
    color: 'text-blue-500',
    activeBg: 'bg-blue-100',
    activeColor: 'text-blue-600',
  },
  {
    key: 'relay',
    label: '接龙来源',
    icon: <Users size={12} />,
    color: 'text-green-500',
    activeBg: 'bg-green-100',
    activeColor: 'text-green-600',
  },
];

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending_payment: { label: '待支付定金', variant: 'default' },
  deposited: { label: '定金已付', variant: 'warning' },
  preparing: { label: '备货中', variant: 'warning' },
  shipped: { label: '运输中', variant: 'info' },
  delivered: { label: '已签收待适配', variant: 'info' },
  adapt_confirmed: { label: '适配通过待尾款', variant: 'success' },
  completed: { label: '已完成', variant: 'success' },
  disputing: { label: '争议处理中', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'default' },
};

const CONDITION_LABEL: Record<string, string> = {
  new: '全新',
  used: '拆车',
  refurbished: '翻新',
};

const AFTER_SALES_ACTION_CONFIG: Record<AfterSalesActionType, { label: string; color: string; icon: React.ReactNode }> = {
  confirm_adaptation: { label: '确认适配', color: 'text-green-600', icon: <CheckCircle2 size={10} /> },
  apply_dispute: { label: '申请争议', color: 'text-red-600', icon: <AlertTriangle size={10} /> },
  contact_seller: { label: '联系卖家', color: 'text-blue-600', icon: <MessageCircle size={10} /> },
  contact_buyer: { label: '联系买家', color: 'text-blue-600', icon: <MessageCircle size={10} /> },
  submit_evidence: { label: '提交举证', color: 'text-purple-600', icon: <Paperclip size={10} /> },
  arbitration_decision: { label: '仲裁裁决', color: 'text-amber-600', icon: <Gavel size={10} /> },
  release_final: { label: '释放尾款', color: 'text-green-600', icon: <Coins size={10} /> },
  freeze_funds: { label: '冻结资金', color: 'text-red-600', icon: <Snowflake size={10} /> },
  cancel_order: { label: '取消订单', color: 'text-gray-500', icon: <X size={10} /> },
};

function OrderCard({
  order,
  index,
  onClick,
  isHighlighted = false,
  afterSalesFilter = 'none',
  onQuickAction,
}: {
  order: GuaranteeOrder;
  index: number;
  onClick: () => void;
  isHighlighted?: boolean;
  afterSalesFilter?: AfterSalesFilter;
  onQuickAction?: (action: string, orderId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeoutBar, setShowTimeoutBar] = useState(false);
  const badge = STATUS_BADGE[order.status];
  const isBuyer = true;

  const getAlertType = (): AfterSalesFilter => {
    if (order.status === 'disputing') return 'in_dispute';
    if (order.status === 'delivered') {
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const deliveredItem = order.timeline.find((t) => t.status === 'delivered');
      const deliveredTime = deliveredItem
        ? new Date(deliveredItem.timestamp).getTime()
        : new Date(order.createdAt).getTime();
      if (Date.now() - deliveredTime > threeDaysMs) {
        return 'near_timeout';
      }
      return 'pending_inspection';
    }
    return 'none';
  };

  const alertType = getAlertType();

  const alertBadgeConfig = {
    pending_inspection: { color: 'bg-blue-500', text: '待验货', textColor: 'text-blue-600', bg: 'bg-blue-50' },
    near_timeout: { color: 'bg-orange-500', text: '快超时', textColor: 'text-orange-600', bg: 'bg-orange-50' },
    in_dispute: { color: 'bg-red-500', text: '争议中', textColor: 'text-red-600', bg: 'bg-red-50' },
  };

  const getSourceIcon = () => {
    switch (order.sourceType) {
      case 'urgent':
        return (
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[10px] font-bold">
            急
          </span>
        );
      case 'stock':
        return (
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
            现
          </span>
        );
      case 'relay':
        return (
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
            接
          </span>
        );
      default:
        return null;
    }
  };

  const subOrders = useMemo(() => {
    if (!order.isRelayParent || !order.relayOrderIds?.length) return [];
    return order.relayOrderIds.map((id, i) => ({
      id,
      supplierName: ['陈记汽配', '老王拆车件', '广州速配'][i % 3],
      partName: order.partInfo.partName,
      price: Math.round(order.partInfo.unitPrice * (0.9 + Math.random() * 0.2)),
      status: (['已发货', '备货中', '已签收'] as const)[i % 3],
    }));
  }, [order]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(isHighlighted && 'scale-[1.02] z-10')}
    >
      <Card
        padding="none"
        className={cn(
          'overflow-hidden transition-all',
          isHighlighted && 'ring-4 ring-orange-400/30 border-2 border-orange-400',
          order.sourceType === 'relay' && 'border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30'
        )}
      >
        <div onClick={onClick} className="cursor-pointer">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-gray-400 font-mono">{order.orderNo}</span>
              {getSourceIcon()}
              {order.sourceType === 'relay' && (
                <Badge variant="info" size="sm" icon={<Link2 size={10} />}>
                  接龙
                </Badge>
              )}
              {order.isRelayParent && (
                <Badge variant="default" size="sm" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  {order.relayOrderIds?.length || order.relaySubOrders?.length || 0}家供应商
                </Badge>
              )}
              {alertType !== 'none' && (
                <div className="flex items-center gap-1">
                  {alertType === 'near_timeout' ? (
                    <span className="relative flex h-2 w-2">
                      <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', alertBadgeConfig[alertType].color)} />
                      <span className={cn('relative inline-flex rounded-full h-2 w-2', alertBadgeConfig[alertType].color)} />
                    </span>
                  ) : (
                    <span className={cn('w-2 h-2 rounded-full', alertBadgeConfig[alertType].color)} />
                  )}
                  <span className={cn('text-[10px] font-semibold', alertBadgeConfig[alertType].textColor)}>
                    {alertBadgeConfig[alertType].text}
                  </span>
                </div>
              )}
            </div>
            <Badge variant={badge.variant} size="sm" dot>
              {badge.label}
            </Badge>
          </div>

          <div className="px-4 pb-3 flex gap-3">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {order.partInfo.images?.[0] ? (
                <img
                  src={order.partInfo.images[0]}
                  alt={order.partInfo.partName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <FileText size={28} />
                </div>
              )}
              <div className="absolute left-1 bottom-1 px-1.5 py-0.5 text-[9px] font-medium rounded bg-black/60 text-white">
                {CONDITION_LABEL[order.partInfo.conditionType] || '拆车'}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                {order.partInfo.partName}
              </h3>
              {order.partInfo.partNumber && (
                <p className="text-[11px] text-gray-400 mb-1 font-mono">
                  OE: {order.partInfo.partNumber}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1.5">
                <span>{order.partInfo.carPlatform.brand}</span>
                <span className="text-gray-200">·</span>
                <span>x{order.partInfo.quantity}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-gray-400">订单总额</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-accent-500">
                      ¥{order.totalAmount.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">
                      ¥{Math.round(order.totalAmount * 1.1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-primary-600 font-medium">
                  查看详情
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {afterSalesFilter !== 'none' && alertType === 'near_timeout' && (
          <div className="mx-4 mt-3 mb-1 p-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-600 flex-shrink-0" />
            <p className="text-[11px] text-orange-700 flex-1">
              签收已超过3天未确认，系统将在7天后自动确认适配
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction?.('contact_seller', order.id);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-orange-200 text-[10px] font-medium text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <MessageCircle size={10} />
              联系卖家
            </button>
          </div>
        )}

        <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <div className="flex items-center gap-1">
              {isBuyer ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold">
                    卖
                  </span>
                  <span className="truncate max-w-[80px]">{order.supplier.name}</span>
                </>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[9px] font-bold">
                    买
                  </span>
                  <span className="truncate max-w-[80px]">{order.buyer.name}</span>
                </>
              )}
            </div>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-1">
              <Coins size={10} className="text-amber-500" />
              <span>定金 ¥{order.depositAmount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {afterSalesFilter === 'pending_inspection' && alertType === 'pending_inspection' && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e: any) => {
                  e.stopPropagation();
                  onQuickAction?.('confirm_adapt', order.id);
                }}
              >
                立即确认适配
              </Button>
            )}
            {afterSalesFilter === 'near_timeout' && alertType === 'near_timeout' && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onQuickAction?.('contact_seller', order.id);
                  }}
                  leftIcon={<MessageCircle size={12} />}
                >
                  联系卖家
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onQuickAction?.('confirm_adapt', order.id);
                  }}
                >
                  确认适配
                </Button>
              </>
            )}
            {afterSalesFilter === 'in_dispute' && alertType === 'in_dispute' && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e: any) => {
                  e.stopPropagation();
                  onQuickAction?.('view_dispute', order.id);
                }}
              >
                查看进度
              </Button>
            )}
            {afterSalesFilter === 'none' && (
              <>
                {order.status === 'pending_payment' && (
                  <Button size="sm" variant="primary">
                    去支付
                  </Button>
                )}
                {order.status === 'delivered' && (
                  <Button size="sm" variant="primary">
                    确认适配
                  </Button>
                )}
                {order.status === 'adapt_confirmed' && (
                  <Button size="sm" variant="primary">
                    释放尾款
                  </Button>
                )}
                {order.status === 'shipped' && (
                  <Button size="sm" variant="secondary">
                    查看物流
                  </Button>
                )}
                {order.status === 'disputing' && (
                  <Button size="sm" variant="primary">
                    处理争议
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {(() => {
          const actionItems = order.timeline.filter((t) => t.actionType);
          if (actionItems.length === 0) return null;
          const lastAction = actionItems[actionItems.length - 1];
          const actionConfig = AFTER_SALES_ACTION_CONFIG[lastAction.actionType!];
          const operatorName = lastAction.operatorId === order.buyerId ? order.buyer.name : lastAction.operatorId === order.supplierId ? order.supplier.name : '平台';
          return (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/80 flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">最近：</span>
              <span className="text-gray-500">{formatTime(lastAction.timestamp)}</span>
              <span className={cn('flex items-center gap-1 font-medium', actionConfig.color)}>
                {actionConfig.icon}
                {actionConfig.label}
              </span>
              <span className="text-gray-500">{operatorName}</span>
            </div>
          );
        })()}

        {order.isRelayParent && subOrders.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-full px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-violet-50/50 hover:from-indigo-50 hover:to-violet-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link2 size={13} className="text-indigo-500" />
                <span className="text-xs font-medium text-indigo-700">
                  接龙子订单聚合
                </span>
                <span className="text-[10px] text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-md">
                  {subOrders.length} 家供应商
                </span>
              </div>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-indigo-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden bg-white"
                >
                  <div className="px-4 py-3 space-y-2">
                    {subOrders.map((sub, idx) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={onClick}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {sub.supplierName.slice(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-800 truncate">
                              {sub.supplierName}
                            </span>
                            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {sub.partName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-accent-500">
                            ¥{sub.price}
                          </div>
                          <ChevronRight size={10} className="text-gray-300 ml-auto" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    orders,
    fetchOrders,
    isLoading,
    getPendingInspectionOrders,
    getNearTimeoutOrders,
    getInDisputeOrders,
  } = useOrderStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('pending_ship');
  const [activeSourceTab, setActiveSourceTab] = useState<SourceType>('all');
  const [afterSalesFilter, setAfterSalesFilter] = useState<AfterSalesFilter>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [onlyRelay, setOnlyRelay] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | '90d'>('all');

  const highlightOrderId = (location.state as { highlightOrderId?: string })?.highlightOrderId;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const latestOrder = useMemo(() => {
    return sortedOrders[0] || null;
  }, [sortedOrders]);

  const pendingPaymentCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending_payment').length;
  }, [orders]);

  const preparingCount = useMemo(() => {
    return orders.filter((o) => o.status === 'preparing' || o.status === 'deposited').length;
  }, [orders]);

  const pendingInspectionCount = useMemo(() => getPendingInspectionOrders().length, [getPendingInspectionOrders]);
  const nearTimeoutCount = useMemo(() => getNearTimeoutOrders().length, [getNearTimeoutOrders]);
  const inDisputeCount = useMemo(() => getInDisputeOrders().length, [getInDisputeOrders]);
  const totalAlertsCount = pendingInspectionCount + nearTimeoutCount + inDisputeCount;

  const filteredOrders = useMemo(() => {
    let result: GuaranteeOrder[];

    if (afterSalesFilter !== 'none') {
      switch (afterSalesFilter) {
        case 'pending_inspection':
          result = getPendingInspectionOrders();
          break;
        case 'near_timeout':
          result = getNearTimeoutOrders();
          break;
        case 'in_dispute':
          result = getInDisputeOrders();
          break;
        default:
          result = orders;
      }
    } else {
      const activeTabConfig = TABS.find((t) => t.key === activeTab)!;
      result = orders.filter((o) => activeTabConfig.statuses.includes(o.status));
    }

    if (activeSourceTab !== 'all') {
      result = result.filter((o) => o.sourceType === activeSourceTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.partInfo.partName.toLowerCase().includes(q) ||
          o.partInfo.partNumber?.toLowerCase().includes(q) ||
          o.buyer.name.toLowerCase().includes(q) ||
          o.supplier.name.toLowerCase().includes(q)
      );
    }

    if (onlyRelay) result = result.filter((o) => o.isRelayParent);
    if (onlyUrgent) result = result.filter((o) => o.sourceType === 'urgent');

    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((o) => new Date(o.createdAt).getTime() > cutoff);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, activeTab, activeSourceTab, searchQuery, onlyRelay, onlyUrgent, timeRange, afterSalesFilter, getPendingInspectionOrders, getNearTimeoutOrders, getInDisputeOrders]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      pending_payment: 0,
      pending_ship: 0,
      pending_confirm: 0,
      completed: 0,
      dispute: 0,
    };
    orders.forEach((o) => {
      for (const tab of TABS) {
        if (tab.statuses.includes(o.status)) {
          counts[tab.key]++;
          break;
        }
      }
    });
    return counts;
  }, [orders]);

  const activeFiltersCount = (onlyRelay ? 1 : 0) + (onlyUrgent ? 1 : 0) + (timeRange !== 'all' ? 1 : 0);

  const handleCardClick = (orderId: string, status: OrderStatus) => {
    if (afterSalesFilter === 'in_dispute') {
      navigate(`/order/${orderId}/dispute`);
      return;
    }
    if (status === 'disputing') {
      navigate(`/order/${orderId}/dispute`);
    } else if (afterSalesFilter === 'pending_inspection' || afterSalesFilter === 'near_timeout') {
      navigate(`/order/${orderId}`, { state: { fromAfterSales: afterSalesFilter } });
    } else {
      navigate(`/order/${orderId}`);
    }
  };

  const handleAfterSalesCardClick = (type: AfterSalesFilter) => {
    setAfterSalesFilter(type);
    if (type === 'pending_inspection' || type === 'near_timeout') {
      setActiveTab('pending_confirm');
    } else if (type === 'in_dispute') {
      setActiveTab('dispute');
    }
  };

  const handleClearAfterSalesFilter = () => {
    setAfterSalesFilter('none');
    setActiveTab('pending_ship');
    setActiveSourceTab('all');
  };

  const handleQuickAction = (action: string, orderId: string) => {
    const { addAfterSalesAction } = useOrderStore.getState();
    switch (action) {
      case 'confirm_adapt':
        navigate(`/order/${orderId}`, { state: { fromAfterSales: afterSalesFilter } });
        break;
      case 'view_dispute':
        navigate(`/order/${orderId}/dispute`);
        break;
      case 'contact_seller':
        addAfterSalesAction(orderId, 'contact_seller', '用户发起联系卖家');
        alert('正在跳转到联系卖家页面...');
        break;
      default:
        break;
    }
  };

  const afterSalesDeskConfig: Record<Exclude<AfterSalesFilter, 'none'>, { title: string; gradient: string; textColor: string; count: number }> = {
    pending_inspection: {
      title: '待验货适配',
      gradient: 'from-blue-600 to-blue-400',
      textColor: 'text-blue-600',
      count: pendingInspectionCount,
    },
    near_timeout: {
      title: '快超时',
      gradient: 'from-orange-600 to-orange-400',
      textColor: 'text-orange-600',
      count: nearTimeoutCount,
    },
    in_dispute: {
      title: '争议中',
      gradient: 'from-red-600 to-red-400',
      textColor: 'text-red-600',
      count: inDisputeCount,
    },
  };

  const isAfterSalesDeskMode = afterSalesFilter !== 'none';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'sticky top-0 z-40 backdrop-blur-lg border-b transition-all',
          isAfterSalesDeskMode
            ? cn('bg-gradient-to-r', afterSalesDeskConfig[afterSalesFilter as Exclude<AfterSalesFilter, 'none'>].gradient, 'border-white/20')
            : 'bg-white/90 border-gray-100'
        )}
      >
        {isAfterSalesDeskMode ? (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  {afterSalesFilter === 'pending_inspection' && <PackageSearch size={20} className="text-white" />}
                  {afterSalesFilter === 'near_timeout' && <Clock size={20} className="text-white" />}
                  {afterSalesFilter === 'in_dispute' && <AlertTriangle size={20} className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white">售后处理台</h1>
                    <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white text-[10px] font-semibold">
                      {afterSalesDeskConfig[afterSalesFilter as Exclude<AfterSalesFilter, 'none'>].title}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70">专注处理此类售后问题</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-white">
                    {afterSalesDeskConfig[afterSalesFilter as Exclude<AfterSalesFilter, 'none'>].count}
                  </div>
                  <div className="text-[10px] text-white/70">待处理</div>
                </div>
                <button
                  onClick={handleClearAfterSalesFilter}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors"
                >
                  <X size={14} />
                  清除筛选
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center">
                  <ArrowRightLeft size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">担保订单</h1>
                  <p className="text-[10px] text-gray-400">平台托管，交易无忧</p>
                </div>
              </div>
              <button
                onClick={() => fetchOrders()}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <RefreshCw
                  size={16}
                  className={cn('text-gray-600', isLoading && 'animate-spin')}
                />
              </button>
            </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索订单号、配件、商家..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </motion.button>
              )}
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={cn(
                'h-10 px-3 rounded-xl flex items-center gap-1.5 transition-colors',
                activeFiltersCount > 0
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Filter size={15} />
              {activeFiltersCount > 0 && (
                <span className="text-xs font-medium">{activeFiltersCount}</span>
              )}
            </button>
          </div>
          </div>
        )}

        {!isAfterSalesDeskMode && (
          <AnimatePresence>
            {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-50"
            >
              <div className="px-4 py-3 space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">时间范围</div>
                  <div className="flex gap-2">
                    {(['all', '7d', '30d', '90d'] as const).map((t) => (
                      <Chip
                        key={t}
                        size="sm"
                        variant={timeRange === t ? 'primary' : 'default'}
                        selected={timeRange === t}
                        onSelect={() => setTimeRange(t)}
                      >
                        {t === 'all' ? '全部' : t === '7d' ? '近7天' : t === '30d' ? '近30天' : '近90天'}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">特殊标记</div>
                  <div className="flex gap-2 flex-wrap">
                    <Chip
                      size="sm"
                      variant={onlyRelay ? 'primary' : 'default'}
                      selected={onlyRelay}
                      onSelect={() => setOnlyRelay(!onlyRelay)}
                      icon={<Users size={11} />}
                    >
                      接龙订单
                    </Chip>
                    <Chip
                      size="sm"
                      variant={onlyUrgent ? 'primary' : 'default'}
                      selected={onlyUrgent}
                      onSelect={() => setOnlyUrgent(!onlyUrgent)}
                      icon={<AlertTriangle size={11} />}
                    >
                      急件来源
                    </Chip>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {!isAfterSalesDeskMode && (
          <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {SOURCE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSourceTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                  activeSourceTab === tab.key
                    ? cn(tab.activeBg, tab.activeColor, 'shadow-sm')
                    : cn(tab.color, 'hover:bg-gray-50')
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          </div>
        )}

        <div className={cn(
          'px-4 overflow-x-auto scrollbar-hide',
          isAfterSalesDeskMode ? 'py-3 bg-white/10' : 'pb-3'
        )}>
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? isAfterSalesDeskMode
                      ? 'bg-white/25 text-white shadow-sm'
                      : cn(tab.activeBg, tab.color, 'shadow-sm')
                    : isAfterSalesDeskMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={cn(
                      'min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                      activeTab === tab.key
                        ? isAfterSalesDeskMode
                          ? 'bg-white/30 text-white'
                          : 'bg-white/80 text-inherit'
                        : isAfterSalesDeskMode
                          ? 'bg-white/20 text-white/80'
                          : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {tabCounts[tab.key] > 99 ? '99+' : tabCounts[tab.key]}
                  </span>
                )}
                {activeTab === tab.key && !isAfterSalesDeskMode && (
                  <motion.div
                    layoutId="orderTabIndicator"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-current"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          {pendingPaymentCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setActiveTab('pending_payment')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <div className="relative">
                <Coins size={14} className="text-red-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                  {pendingPaymentCount}
                </span>
              </div>
              <span className="text-xs font-medium text-red-700">待支付定金</span>
            </motion.button>
          )}
          {preparingCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setActiveTab('pending_ship')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              <div className="relative">
                <Lock size={14} className="text-orange-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                  {preparingCount}
                </span>
              </div>
              <span className="text-xs font-medium text-orange-700">锁货中</span>
            </motion.button>
          )}
        </div>

        {latestOrder && !highlightOrderId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              padding="none"
              className="overflow-hidden border-2 border-transparent bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100"
              style={{
                backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #f97316, #fbbf24, #f97316)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              <div
                onClick={() => handleCardClick(latestOrder.id, latestOrder.status)}
                className="cursor-pointer p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold">
                      <Sparkles size={10} />
                      刚创建
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {latestOrder.orderNo}
                    </span>
                  </div>
                  <Badge variant={STATUS_BADGE[latestOrder.status].variant} size="sm" dot>
                    {STATUS_BADGE[latestOrder.status].label}
                  </Badge>
                </div>

                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {latestOrder.partInfo.images?.[0] ? (
                      <img
                        src={latestOrder.partInfo.images[0]}
                        alt={latestOrder.partInfo.partName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <FileText size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                      {latestOrder.partInfo.partName}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
                      <span>{latestOrder.partInfo.carPlatform.brand}</span>
                      <span className="text-gray-200">·</span>
                      <span>x{latestOrder.partInfo.quantity}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-gray-400">总额</span>
                      <span className="text-lg font-bold text-accent-500">
                        ¥{latestOrder.totalAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-primary-600 font-medium">
                    查看详情
                    <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {!isAfterSalesDeskMode && totalAlertsCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="grid grid-cols-3 gap-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                onClick={() => handleAfterSalesCardClick('pending_inspection')}
                className={cn(
                  'cursor-pointer p-3 rounded-2xl border transition-all',
                  pendingInspectionCount === 0
                    ? 'bg-gray-50 border-gray-100 opacity-50'
                    : 'bg-white border-blue-100 hover:bg-blue-50/50 hover:border-blue-200'
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center',
                    pendingInspectionCount === 0 ? 'bg-gray-200' : 'bg-blue-100'
                  )}>
                    <PackageSearch size={14} className={pendingInspectionCount === 0 ? 'text-gray-400' : 'text-blue-600'} />
                  </div>
                  <span className={cn(
                    'text-xs font-bold',
                    pendingInspectionCount === 0 ? 'text-gray-400' : 'text-blue-700'
                  )}>
                    待验货适配
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    'text-xl font-extrabold',
                    pendingInspectionCount === 0 ? 'text-gray-300' : 'text-blue-600'
                  )}>
                    {pendingInspectionCount}
                  </span>
                  <span className={cn(
                    'text-[10px]',
                    pendingInspectionCount === 0 ? 'text-gray-300' : 'text-blue-400'
                  )}>
                    单
                  </span>
                </div>
                <p className={cn(
                  'text-[10px] mt-1 leading-tight',
                  pendingInspectionCount === 0 ? 'text-gray-300' : 'text-blue-500/70'
                )}>
                  已签收未做适配确认
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => handleAfterSalesCardClick('near_timeout')}
                className={cn(
                  'cursor-pointer p-3 rounded-2xl border transition-all',
                  nearTimeoutCount === 0
                    ? 'bg-gray-50 border-gray-100 opacity-50'
                    : 'bg-white border-orange-100 hover:bg-orange-50/50 hover:border-orange-200'
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center',
                    nearTimeoutCount === 0 ? 'bg-gray-200' : 'bg-orange-100'
                  )}>
                    <Clock size={14} className={nearTimeoutCount === 0 ? 'text-gray-400' : 'text-orange-600'} />
                  </div>
                  <span className={cn(
                    'text-xs font-bold',
                    nearTimeoutCount === 0 ? 'text-gray-400' : 'text-orange-700'
                  )}>
                    快超时
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    'text-xl font-extrabold',
                    nearTimeoutCount === 0 ? 'text-gray-300' : 'text-orange-600'
                  )}>
                    {nearTimeoutCount}
                  </span>
                  <span className={cn(
                    'text-[10px]',
                    nearTimeoutCount === 0 ? 'text-gray-300' : 'text-orange-400'
                  )}>
                    单
                  </span>
                </div>
                <p className={cn(
                  'text-[10px] mt-1 leading-tight',
                  nearTimeoutCount === 0 ? 'text-gray-300' : 'text-orange-500/70'
                )}>
                  签收超3天未确认
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                onClick={() => handleAfterSalesCardClick('in_dispute')}
                className={cn(
                  'cursor-pointer p-3 rounded-2xl border transition-all',
                  inDisputeCount === 0
                    ? 'bg-gray-50 border-gray-100 opacity-50'
                    : 'bg-white border-red-100 hover:bg-red-50/50 hover:border-red-200'
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center',
                    inDisputeCount === 0 ? 'bg-gray-200' : 'bg-red-100'
                  )}>
                    <AlertTriangle size={14} className={inDisputeCount === 0 ? 'text-gray-400' : 'text-red-600'} />
                  </div>
                  <span className={cn(
                    'text-xs font-bold',
                    inDisputeCount === 0 ? 'text-gray-400' : 'text-red-700'
                  )}>
                    处理中
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    'text-xl font-extrabold',
                    inDisputeCount === 0 ? 'text-gray-300' : 'text-red-600'
                  )}>
                    {inDisputeCount}
                  </span>
                  <span className={cn(
                    'text-[10px]',
                    inDisputeCount === 0 ? 'text-gray-300' : 'text-red-400'
                  )}>
                    单
                  </span>
                </div>
                <p className={cn(
                  'text-[10px] mt-1 leading-tight',
                  inDisputeCount === 0 ? 'text-gray-300' : 'text-red-500/70'
                )}>
                  正在仲裁的争议
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-center gap-2"
          >
            <span className="text-xl">🎉</span>
            <span className="text-sm font-medium text-green-700">暂无售后提醒</span>
          </motion.div>
        )}

        {!isAfterSalesDeskMode && afterSalesFilter !== 'none' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-gray-500">售后筛选：</span>
            <Chip
              variant={afterSalesFilter === 'pending_inspection' ? 'primary' : 'warning'}
              size="sm"
              icon={afterSalesFilter === 'pending_inspection' ? <PackageSearch size={11} /> : afterSalesFilter === 'near_timeout' ? <Clock size={11} /> : <AlertTriangle size={11} />}
              closable
              onClose={handleClearAfterSalesFilter}
            >
              {afterSalesFilter === 'pending_inspection' && `待验货 (${pendingInspectionCount})`}
              {afterSalesFilter === 'near_timeout' && `快超时 (${nearTimeoutCount})`}
              {afterSalesFilter === 'in_dispute' && `争议中 (${inDisputeCount})`}
            </Chip>
            <button
              onClick={handleClearAfterSalesFilter}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              清除筛选
            </button>
          </motion.div>
        )}

        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-gray-500">已选：</span>
            {timeRange !== 'all' && (
              <Chip
                variant="primary"
                size="sm"
                closable
                onClose={() => setTimeRange('all')}
              >
                {timeRange === '7d' ? '近7天' : timeRange === '30d' ? '近30天' : '近90天'}
              </Chip>
            )}
            {onlyRelay && (
              <Chip variant="primary" size="sm" closable onClose={() => setOnlyRelay(false)}>
                接龙订单
              </Chip>
            )}
            {onlyUrgent && (
              <Chip variant="primary" size="sm" closable onClose={() => setOnlyUrgent(false)}>
                急件来源
              </Chip>
            )}
            <button
              onClick={() => {
                setTimeRange('all');
                setOnlyRelay(false);
                setOnlyUrgent(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              清除
            </button>
          </motion.div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            共 <span className="font-semibold text-gray-700">{filteredOrders.length}</span> 条订单
          </span>
          {user?.address && (
            <span className="text-gray-400">
              {(user as any).city || user.address.split('市')[0] + '市'} · 本地优先
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white border border-gray-100 animate-pulse"
                >
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-5/6" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FileText size={32} className="text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {afterSalesFilter !== 'none' ? '暂无此类提醒' : '暂无相关订单'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {afterSalesFilter !== 'none'
                  ? '当前筛选条件下没有售后提醒订单'
                  : '换个状态筛选或清除搜索条件试试'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('pending_ship');
                  setTimeRange('all');
                  setOnlyRelay(false);
                  setOnlyUrgent(false);
                  setAfterSalesFilter('none');
                }}
              >
                重置筛选
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  onClick={() => handleCardClick(order.id, order.status)}
                  isHighlighted={highlightOrderId === order.id}
                  afterSalesFilter={afterSalesFilter}
                  onQuickAction={handleQuickAction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
