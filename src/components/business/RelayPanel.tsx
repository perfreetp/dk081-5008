import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Check, Clock, Truck, Package, Plus, Users, X, ChevronDown, ChevronUp, Shield, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RelayItem, UrgentPost } from '../../types';
import Card from '../ui/Card';
import Chip from '../ui/Chip';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatPrice, formatQuantity, formatTime } from '../../utils/format';
import { useOrderStore } from '../../stores/orderStore';

interface RelayPanelProps {
  post: UrgentPost;
  onJoinRelay?: () => void;
  onSubmitRelay?: (qty: number, price: number) => void;
  onConfirmRelay?: (relayId: string) => void;
}

const statusConfig: Record<
  RelayItem['status'],
  { label: string; variant: 'default' | 'warning' | 'success' | 'info'; icon: React.ReactNode }
> = {
  intention: {
    label: '意向中',
    variant: 'default',
    icon: <Clock size={10} />,
  },
  confirmed: {
    label: '已确认',
    variant: 'warning',
    icon: <Check size={10} />,
  },
  shipped: {
    label: '已发货',
    variant: 'info',
    icon: <Truck size={10} />,
  },
  received: {
    label: '已收货',
    variant: 'success',
    icon: <Package size={10} />,
  },
};

function AvatarStack({ items }: { items: RelayItem[] }) {
  const maxVisible = 5;
  const visibleItems = items.slice(0, maxVisible);
  const hiddenCount = Math.max(0, items.length - maxVisible);

  return (
    <div className="flex items-center -space-x-2">
      {visibleItems.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          style={{ zIndex: visibleItems.length - i }}
        >
          <div className="relative">
            <img
              src={item.supplier.avatar}
              alt={item.supplier.name}
              className={cn(
                "w-8 h-8 rounded-full border-2 border-white shadow-sm",
                item.status === 'confirmed' && "ring-2 ring-amber-400 ring-offset-1",
                item.status === 'shipped' && "ring-2 ring-blue-400 ring-offset-1",
                item.status === 'received' && "ring-2 ring-green-400 ring-offset-1"
              )}
            />
            <AnimatePresence>
              {item.status !== 'intention' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                  style={{
                    backgroundColor:
                      item.status === 'confirmed'
                        ? '#F59E0B'
                        : item.status === 'shipped'
                          ? '#3B82F6'
                          : '#10B981',
                  }}
                >
                  <Check size={7} className="text-white" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
      {hiddenCount > 0 && (
        <div
          className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-500"
          style={{ zIndex: 0 }}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}

function RelayCard({
  item,
  onConfirm,
  index,
  selected,
  onSelect,
  showCheckbox,
}: {
  item: RelayItem;
  onConfirm?: () => void;
  index: number;
  selected: boolean;
  onSelect: () => void;
  showCheckbox: boolean;
}) {
  const config = statusConfig[item.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -1 }}
      className={cn(
        "p-3 rounded-xl border transition-all",
        selected
          ? "bg-indigo-50 border-indigo-200"
          : "bg-gray-50 border-gray-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {showCheckbox && (
          <button
            onClick={onSelect}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
              selected
                ? "bg-indigo-500 border-indigo-500"
                : "bg-white border-gray-300 hover:border-indigo-400"
            )}
          >
            {selected && <Check size={12} className="text-white" strokeWidth={3} />}
          </button>
        )}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img
            src={item.supplier.avatar}
            alt={item.supplier.name}
            className="w-9 h-9 rounded-full border border-gray-200 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-medium text-gray-900 truncate">
                {item.supplier.name}
              </span>
              <Badge variant={config.variant} size="sm" icon={config.icon}>
                {config.label}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>{item.supplier.city}</span>
              <span>·</span>
              <span>{formatTime(item.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-gray-900">
            {formatPrice(item.unitPrice)}
          </div>
          <div className="text-xs text-gray-400">
            x{formatQuantity(item.quantity)}
          </div>
        </div>
      </div>

      {item.remark && (
        <p className="mt-2 text-xs text-gray-500 pl-11">{item.remark}</p>
      )}

      {item.status === 'intention' && onConfirm && !showCheckbox && (
        <div className="mt-2.5 pl-11">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Check size={13} />}
            onClick={onConfirm}
            className="w-full"
          >
            确认接龙
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
  totalAmount,
  depositAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedItems: RelayItem[];
  totalAmount: number;
  depositAmount: number;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
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
            <h2 className="text-base font-bold text-gray-900">确认合并下单</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            共 {selectedItems.length} 家供应商，{selectedItems.reduce((s, i) => s + i.quantity, 0)} 件商品
          </p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-200px)]">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-800">供应商明细</div>
            {selectedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
              >
                <img
                  src={item.supplier.avatar}
                  alt={item.supplier.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {item.supplier.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {item.supplier.city} · x{item.quantity}件
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    单价 {formatPrice(item.unitPrice)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">订单总额</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(totalAmount)}</span>
            </div>
            <div className="h-px bg-amber-100 my-2" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-amber-800">
                  保证金(30%)
                </div>
                <div className="text-[10px] text-amber-600">
                  平台托管，保障交易安全
                </div>
              </div>
              <span className="text-base font-bold text-amber-700">
                {formatPrice(depositAmount)}
              </span>
            </div>
            <ul className="text-[10px] text-amber-600 space-y-1 ml-10">
              <li>· 支付后锁定各供应商货源</li>
              <li>· 适配确认后分别结算尾款</li>
              <li>· 如有争议平台介入仲裁</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <div className="flex items-center gap-2.5">
            <Button
              size="lg"
              variant="secondary"
              block
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              size="lg"
              variant="primary"
              block
              onClick={onConfirm}
              leftIcon={<ShoppingCart size={16} />}
              className="bg-gradient-to-r from-indigo-500 to-violet-500"
            >
              确认下单
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function RelayPanel({ post, onJoinRelay, onSubmitRelay, onConfirmRelay }: RelayPanelProps) {
  const navigate = useNavigate();
  const { createRelayParentOrder } = useOrderStore();
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [joinQty, setJoinQty] = useState(1);
  const [joinPrice, setJoinPrice] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relayList = post.relayList;
  const totalQuantity = relayList.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = relayList.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);
  const confirmedCount = relayList.filter((r) => r.status !== 'intention').length;
  const minPrice = relayList.length > 0 ? Math.min(...relayList.map((r) => r.unitPrice)) : 0;

  const selectableItems = useMemo(() => 
    relayList.filter(r => r.status === 'intention'),
    [relayList]
  );

  const selectedItems = useMemo(() => 
    relayList.filter(r => selectedIds.has(r.id)),
    [relayList, selectedIds]
  );

  const selectedTotalQty = useMemo(() => 
    selectedItems.reduce((sum, r) => sum + r.quantity, 0),
    [selectedItems]
  );

  const selectedTotalAmount = useMemo(() => 
    selectedItems.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0),
    [selectedItems]
  );

  const depositAmount = Math.round(selectedTotalAmount * 0.3);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === selectableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map(r => r.id)));
    }
  };

  const handleSubmitRelay = () => {
    const price = parseFloat(joinPrice);
    if (joinQty > 0 && price > 0 && onSubmitRelay) {
      onSubmitRelay(joinQty, price);
      setJoinQty(1);
      setJoinPrice('');
      setShowJoinPanel(false);
    }
  };

  const toggleJoinPanel = () => {
    if (onSubmitRelay) {
      setShowJoinPanel(!showJoinPanel);
    } else if (onJoinRelay) {
      onJoinRelay();
    }
  };

  const handleMergeOrder = async () => {
    if (selectedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const parentOrder = createRelayParentOrder(post.id, Array.from(selectedIds));
      setShowConfirmModal(false);
      setSelectedIds(new Set());
      navigate(`/order/${parentOrder.id}`);
    } catch (error) {
      console.error('创建接龙订单失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="outlined" padding="none" className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Link2 size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                接龙补货
                <span className="text-xs font-normal text-gray-400">
                  拼单更优惠
                </span>
              </div>
              <div className="text-xs text-gray-500">
                接龙人数 {relayList.length} · 总数量 {formatQuantity(totalQuantity)} · 总金额 {formatPrice(totalAmount)}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={onSubmitRelay ? (showJoinPanel ? <ChevronUp size={14} /> : <Plus size={14} />) : <Plus size={14} />}
            onClick={toggleJoinPanel}
            whileTap={{ scale: 0.95 }}
          >
            {onSubmitRelay ? (showJoinPanel ? '收起' : '加入接龙') : '加入接龙'}
          </Button>
        </div>

        <AnimatePresence>
          {showJoinPanel && onSubmitRelay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] text-orange-600 mb-1">数量</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setJoinQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-orange-200 text-orange-600 font-bold flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-gray-900">{joinQty}</span>
                      <button
                        onClick={() => setJoinQty((q) => q + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-orange-200 text-orange-600 font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-orange-600 mb-1">单价</label>
                    <div className="flex items-center gap-1 px-3 h-8 rounded-lg bg-white border border-orange-200">
                      <span className="text-orange-600 text-sm font-bold">¥</span>
                      <input
                        type="number"
                        value={joinPrice}
                        onChange={(e) => setJoinPrice(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 w-full bg-transparent outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  block
                  onClick={handleSubmitRelay}
                  disabled={joinQty <= 0 || !joinPrice || parseFloat(joinPrice) <= 0}
                  className="bg-gradient-to-r from-orange-500 to-amber-500"
                >
                  提交接龙
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {relayList.length > 0 && (
          <>
            <div className="mb-4">
              <AvatarStack items={relayList} />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-center">
                <div className="text-[10px] text-orange-500 mb-0.5">参与人数</div>
                <div className="text-base font-bold text-orange-600 flex items-center justify-center gap-0.5">
                  <Users size={12} />
                  {relayList.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-amber-500 mb-0.5">已确认</div>
                <div className="text-base font-bold text-amber-600 flex items-center justify-center gap-0.5">
                  <Check size={12} />
                  {confirmedCount}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-500 mb-0.5">总数量</div>
                <div className="text-base font-bold text-gray-700 flex items-center justify-center gap-0.5">
                  <Package size={12} />
                  {formatQuantity(totalQuantity)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-red-500 mb-0.5">最低单价</div>
                <div className="text-base font-bold text-red-600">
                  {minPrice > 0 && formatPrice(minPrice)}
                </div>
              </div>
            </div>

            {selectableItems.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <ShoppingCart size={13} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">选中接龙</div>
                      <div className="text-[11px] text-gray-500">
                        已选 <span className="font-bold text-indigo-600">{selectedItems.length}</span> 家供应商 · 
                        合计 <span className="font-bold text-indigo-600">{formatQuantity(selectedTotalQty)}</span> 件 · 
                        金额 <span className="font-bold text-indigo-600">{formatPrice(selectedTotalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={selectAll}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    {selectedIds.size === selectableItems.length ? '取消全选' : '全选'}
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  block
                  disabled={selectedItems.length === 0}
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 disabled:from-gray-300 disabled:to-gray-400"
                  leftIcon={<ShoppingCart size={14} />}
                >
                  一键合并下单
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {relayList.map((item, i) => (
                <RelayCard
                  key={item.id}
                  item={item}
                  index={i}
                  onConfirm={onConfirmRelay ? () => onConfirmRelay(item.id) : undefined}
                  selected={selectedIds.has(item.id)}
                  onSelect={() => toggleSelect(item.id)}
                  showCheckbox={selectableItems.length > 0 && item.status === 'intention'}
                />
              ))}
            </div>

            {totalAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-gray-900 text-white flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] text-gray-400">接龙总金额</div>
                  <div className="text-lg font-bold">{formatPrice(totalAmount)}</div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-white text-gray-900 hover:bg-gray-100 shadow-none"
                >
                  合并下单
                </Button>
              </motion.div>
            )}
          </>
        )}

        {relayList.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Link2 size={24} className="text-orange-400" />
            </div>
            <div className="text-sm text-gray-500 mb-1">暂无供应商接龙</div>
            <div className="text-xs text-gray-400 mb-3">
              成为第一个接龙的供应商，获得更多曝光
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={toggleJoinPanel}
            >
              立即接龙
            </Button>
          </motion.div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleMergeOrder}
        selectedItems={selectedItems}
        totalAmount={selectedTotalAmount}
        depositAmount={depositAmount}
      />
    </Card>
  );
}
