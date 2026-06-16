import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Package,
  Truck,
  XCircle,
  Shield,
  FileCheck,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderStatus, OrderTimelineItem } from '@/types';

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    pulse: boolean;
  }
> = {
  pending_payment: {
    label: '待支付',
    icon: <Clock size={14} />,
    color: 'bg-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    pulse: false,
  },
  deposited: {
    label: '定金已付',
    icon: <Lock size={14} />,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    pulse: false,
  },
  preparing: {
    label: '备货中',
    icon: <Package size={14} />,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    pulse: false,
  },
  shipped: {
    label: '已发货',
    icon: <Truck size={14} />,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    pulse: false,
  },
  delivered: {
    label: '已签收',
    icon: <FileCheck size={14} />,
    color: 'bg-violet-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    pulse: true,
  },
  adapt_confirmed: {
    label: '适配通过',
    icon: <CheckCircle2 size={14} />,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    pulse: false,
  },
  completed: {
    label: '已完成',
    icon: <Coins size={14} />,
    color: 'bg-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    pulse: false,
  },
  disputing: {
    label: '争议中',
    icon: <AlertTriangle size={14} />,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    pulse: true,
  },
  cancelled: {
    label: '已取消',
    icon: <XCircle size={14} />,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    pulse: false,
  },
};

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  duration?: number;
  className?: string;
}

function AnimatedNumber({ value, prefix = '¥', duration = 1500, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased * 100) / 100);
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(2)}
    </span>
  );
}

interface OrderTimelineProps {
  items: OrderTimelineItem[];
  currentStatus: OrderStatus;
  depositAmount?: number;
  showDisputeBanner?: boolean;
  disputeReason?: string;
  className?: string;
}

export default function OrderTimeline({
  items,
  currentStatus,
  depositAmount,
  showDisputeBanner,
  disputeReason,
  className,
}: OrderTimelineProps) {
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.12,
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
  };

  const currentIndex = items.findIndex((item) => item.status === currentStatus);

  return (
    <div className={cn('space-y-4', className)}>
      {showDisputeBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 p-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(239,68,68,0.08),transparent_50%)]" />
          <div className="relative flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-red-700">订单存在争议</span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded-md">
                  处理中
                </span>
              </div>
              <p className="text-xs text-red-600/80 line-clamp-2">
                {disputeReason || '平台正在核实，请配合提供相关举证材料'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] font-medium text-red-600">45%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {depositAmount !== undefined && depositAmount > 0 && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, repeatDelay: 3, ease: 'easeInOut' }}
            className="absolute -right-2 -top-2 w-24 h-24 rounded-full bg-amber-200/30 blur-xl"
          />
          <div className="relative flex items-center gap-4">
            <motion.div
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Lock size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-2xl border-2 border-amber-400"
              />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Shield size={14} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">平台保证金已锁定</span>
              </div>
              <AnimatedNumber
                value={depositAmount}
                className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent"
              />
              <p className="text-[11px] text-amber-700/70 mt-0.5">
                交易完成前由平台托管，保障双方权益
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="relative pl-8">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-gray-100" />

        <div className="space-y-1">
          {items.map((item, index) => {
            const config = STATUS_CONFIG[item.status];
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <motion.div
                key={`${item.status}-${index}`}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                className="relative pb-5 last:pb-0"
              >
                <div className="absolute left-0 top-0 -translate-x-1/2">
                  <div className="relative">
                    {isCurrent && config.pulse && (
                      <motion.span
                        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                        className={cn(
                          'absolute inset-0 rounded-full',
                          config.color,
                          'opacity-40'
                        )}
                      />
                    )}
                    <motion.div
                      whileHover={isCurrent ? { scale: 1.1 } : undefined}
                      className={cn(
                        'relative w-8 h-8 rounded-full flex items-center justify-center border-2 z-10',
                        isPast || isCurrent
                          ? cn(config.color, 'border-white', 'text-white shadow-md')
                          : cn('bg-white', config.borderColor, config.textColor, 'opacity-60')
                      )}
                    >
                      {config.icon}
                    </motion.div>
                  </div>
                </div>

                <div className="ml-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isPast || isCurrent ? 'text-gray-900' : 'text-gray-400'
                      )}
                    >
                      {config.label}
                    </span>
                    {isCurrent && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-medium rounded-md',
                          config.bgColor,
                          config.textColor
                        )}
                      >
                        当前
                      </motion.span>
                    )}
                    <span
                      className={cn(
                        'text-[11px]',
                        isPast || isCurrent ? 'text-gray-400' : 'text-gray-300'
                      )}
                    >
                      {new Date(item.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xs leading-relaxed',
                      isPast || isCurrent ? 'text-gray-600' : 'text-gray-400'
                    )}
                  >
                    {item.remark}
                  </p>
                  {item.images && item.images.length > 0 && (isPast || isCurrent) && (
                    <div className="mt-2 flex gap-1.5">
                      {item.images.slice(0, 4).map((img, imgIdx) => (
                        <motion.div
                          key={imgIdx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.12 + 0.2 + imgIdx * 0.05 }}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-100"
                        >
                          <img
                            src={img}
                            alt={`凭证${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                      {item.images.length > 4 && (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 border border-gray-100">
                          +{item.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {currentStatus === 'delivered' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: items.length * 0.12 + 0.3 }}
              className="relative pb-0"
            >
              <div className="absolute left-0 top-0 -translate-x-1/2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="relative w-8 h-8 rounded-full border-2 border-dashed border-violet-400 bg-white flex items-center justify-center z-10"
                >
                  <span className="text-violet-500">
                    <CheckCircle2 size={14} />
                  </span>
                </motion.div>
              </div>
              <div className="ml-2">
                <span className="text-sm font-semibold text-violet-600">等待您的操作</span>
                <p className="text-xs text-gray-500 mt-1">请尽快验货并确认适配结果</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
