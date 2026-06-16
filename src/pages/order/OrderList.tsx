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
  Users,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Coins,
  Link2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../stores/orderStore';
import { useAuthStore } from '../../stores/authStore';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card, { CardContent } from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { GuaranteeOrder, OrderStatus } from '../../types';

type TabKey = 'pending_payment' | 'pending_ship' | 'pending_confirm' | 'completed' | 'dispute';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  statuses: OrderStatus[];
  color: string;
  activeBg: string;
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

function OrderCard({
  order,
  index,
  onClick,
}: {
  order: GuaranteeOrder;
  index: number;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = STATUS_BADGE[order.status];
  const isBuyer = true;

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
    >
      <Card padding="none" className="overflow-hidden">
        <div onClick={onClick} className="cursor-pointer">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-mono">{order.orderNo}</span>
              {order.isRelayParent && (
                <Badge variant="info" size="sm" icon={<Users size={10} />}>
                  接龙 {order.relayOrderIds?.length || 0}家
                </Badge>
              )}
              {order.sourceType === 'urgent' && (
                <Badge variant="urgent" size="sm" dot>
                  急件来源
                </Badge>
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
          </div>
        </div>

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
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('pending_ship');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [onlyRelay, setOnlyRelay] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | '90d'>('all');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const activeTabConfig = TABS.find((t) => t.key === activeTab)!;
    let result = orders.filter((o) => activeTabConfig.statuses.includes(o.status));

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
  }, [orders, activeTab, searchQuery, onlyRelay, onlyUrgent, timeRange]);

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
    if (status === 'disputing') {
      navigate(`/order/${orderId}/dispute`);
    } else {
      navigate(`/order/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100"
      >
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

        <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? cn(tab.activeBg, tab.color, 'shadow-sm')
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
                        ? 'bg-white/80 text-inherit'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {tabCounts[tab.key] > 99 ? '99+' : tabCounts[tab.key]}
                  </span>
                )}
                {activeTab === tab.key && (
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
              <h3 className="text-base font-semibold text-gray-700 mb-1">暂无相关订单</h3>
              <p className="text-sm text-gray-400 mb-4">
                换个状态筛选或清除搜索条件试试
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
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
