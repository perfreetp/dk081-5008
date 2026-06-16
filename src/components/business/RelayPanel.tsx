import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Check, Clock, Truck, Package, Plus, Users, X, ChevronDown, ChevronUp } from 'lucide-react';
import { RelayItem, UrgentPost } from '../../types';
import Card from '../ui/Card';
import Chip from '../ui/Chip';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatPrice, formatQuantity, formatTime } from '../../utils/format';

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
}: {
  item: RelayItem;
  onConfirm?: () => void;
  index: number;
}) {
  const config = statusConfig[item.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -1 }}
      className="p-3 rounded-xl bg-gray-50 border border-gray-100"
    >
      <div className="flex items-start justify-between gap-3">
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

      {item.status === 'intention' && onConfirm && (
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

export default function RelayPanel({ post, onJoinRelay, onSubmitRelay, onConfirmRelay }: RelayPanelProps) {
  const [showJoinPanel, setShowJoinPanel] = useState(false);
  const [joinQty, setJoinQty] = useState(1);
  const [joinPrice, setJoinPrice] = useState('');

  const relayList = post.relayList;
  const totalQuantity = relayList.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = relayList.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);
  const confirmedCount = relayList.filter((r) => r.status !== 'intention').length;
  const minPrice = relayList.length > 0 ? Math.min(...relayList.map((r) => r.unitPrice)) : 0;

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

            <div className="space-y-2">
              {relayList.map((item, i) => (
                <RelayCard
                  key={item.id}
                  item={item}
                  index={i}
                  onConfirm={onConfirmRelay ? () => onConfirmRelay(item.id) : undefined}
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
    </Card>
  );
}
