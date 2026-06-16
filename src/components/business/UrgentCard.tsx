import { motion } from 'framer-motion';
import { MapPin, Truck, ShieldCheck } from 'lucide-react';
import { UrgentPost } from '../../types';
import { useCountdown } from '../../hooks/useCountdown';
import Card from '../ui/Card';
import Chip from '../ui/Chip';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';
import { formatPriceShort, formatDistance, formatTime } from '../../utils/format';

interface UrgentCardProps {
  post: UrgentPost;
  onClick?: () => void;
  index?: number;
}

const statusTextMap: Record<UrgentPost['status'], string> = {
  active: '紧急招募',
  quoted: '已获报价',
  locked: '已锁定',
  completed: '已完成',
  expired: '已过期',
};

const statusVariantMap: Record<UrgentPost['status'], 'urgent' | 'info' | 'warning' | 'success' | 'default'> = {
  active: 'urgent',
  quoted: 'info',
  locked: 'warning',
  completed: 'success',
  expired: 'default',
};

function CountdownRing({ expiresAt }: { expiresAt: string }) {
  const { remaining, isCompleted, formatted } = useCountdown(expiresAt);
  const totalMs = 72 * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, remaining / totalMs));
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (isCompleted) return '#9CA3AF';
    if (progress < 0.1) return '#EF4444';
    if (progress < 0.3) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="4"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          initial={false}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[10px] font-semibold"
          style={{ color: getColor() }}
        >
          {isCompleted ? '已结束' : formatted.split(':')[0] !== undefined && formatted.length <= 5 ? formatted : `${Math.ceil(remaining / 3600000)}h`}
        </span>
        <span className="text-[8px] text-gray-400">剩余</span>
      </div>
    </div>
  );
}

export default function UrgentCard({ post, onClick, index = 0 }: UrgentCardProps) {
  const carPlatformText = `${post.carPlatform.brand} ${post.carPlatform.series}`;
  const minQuotePrice = post.quotes.length > 0 ? Math.min(...post.quotes.map(q => q.totalPrice)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card variant="outlined" padding="none" onClick={onClick} className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <CountdownRing expiresAt={post.expiresAt} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                  {post.partName}
                </h3>
                <Badge variant={statusVariantMap[post.status]} size="sm">
                  {statusTextMap[post.status]}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                <Chip variant="primary" size="sm" className="bg-blue-50 text-blue-700 border-blue-200">
                  {carPlatformText}
                </Chip>
                {post.partNumber && (
                  <Chip variant="default" size="sm">
                    {post.partNumber}
                  </Chip>
                )}
                <Chip variant="default" size="sm" icon={<ShieldCheck size={12} className="text-green-600" />}>
                  x{post.quantity}
                </Chip>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {post.description}
              </p>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin size={12} />
                  <span>{post.publisher.city}</span>
                </div>
                {post.images.length > 0 && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                    <img
                      src={post.images[0]}
                      alt={post.partName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                {post.images.length > 1 && (
                  <span className="text-gray-400">+{post.images.length - 1}图</span>
                )}
              </div>
            </div>
          </div>

          <div className={cn(
            "mt-3 pt-3 border-t border-gray-100",
            "flex items-center justify-between"
          )}>
            <div className="flex items-center gap-2">
              <img
                src={post.publisher.avatar}
                alt={post.publisher.name}
                className="w-6 h-6 rounded-full border border-gray-200"
              />
              <span className="text-xs text-gray-600">{post.publisher.name}</span>
              <span className="text-xs text-gray-400">· {formatTime(post.createdAt)}</span>
            </div>

            <div className="flex items-center gap-3">
              {post.quotes.length > 0 && (
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">最低报价</div>
                  <div className="text-sm font-bold text-red-500">
                    {minQuotePrice && formatPriceShort(minQuotePrice)}
                  </div>
                </div>
              )}
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                post.quotes.length > 0
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-500"
              )}>
                <Truck size={12} />
                <span>{post.quotes.length}报价</span>
              </div>
              {post.relayList.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-xs">
                  <span>接龙{post.relayList.length}</span>
                </div>
              )}
            </div>
          </div>

          {post.quotes.length >= 2 && (
            <div className="mt-2 flex items-center -space-x-2">
              {post.quotes.slice(0, 3).map((quote, i) => (
                <img
                  key={quote.id}
                  src={quote.supplier.avatar}
                  alt={quote.supplier.name}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 border-white",
                    i === 0 ? "z-30" : i === 1 ? "z-20" : "z-10"
                  )}
                />
              ))}
              {post.quotes.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] text-gray-500 z-0">
                  +{post.quotes.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
