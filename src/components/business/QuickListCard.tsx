import { motion } from 'framer-motion';
import { Phone, Shield, MessageCircle, Star, MapPin, MoreHorizontal, Check } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Chip from '@/components/ui/Chip';
import type { QuickListEntry } from '@/stores/reputationStore';
import { cn } from '@/lib/utils';

interface QuickListCardProps {
  entry: QuickListEntry;
  compact?: boolean;
  selected?: boolean;
  selectMode?: boolean;
  onClick?: () => void;
  onContact?: () => void;
  onGuarantee?: () => void;
  onToggleSelect?: () => void;
  className?: string;
}

const categoryLabel: Record<string, { label: string; color: string }> = {
  supplier: { label: '供应商', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  buyer: { label: '采购商', color: 'bg-green-50 text-green-700 border-green-200' },
  dismantler: { label: '拆解厂', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  logistics: { label: '物流商', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function QuickListCard({
  entry,
  compact = false,
  selected = false,
  selectMode = false,
  onClick,
  onContact,
  onGuarantee,
  onToggleSelect,
  className,
}: QuickListCardProps) {
  const { user, category, tags, remark } = entry;
  const { reputation } = user;
  const catInfo = categoryLabel[category] || categoryLabel.supplier;

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact?.();
  };

  const handleGuaranteeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGuarantee?.();
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{
        y: -4,
        boxShadow: '0 12px 32px rgba(15, 39, 72, 0.12), 0 4px 12px rgba(15, 39, 72, 0.06)',
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white p-4 shadow-card cursor-pointer border border-transparent transition-all duration-200',
        selected && 'border-primary-400 ring-2 ring-primary-100',
        className
      )}
    >
      {selectMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleSelectClick}
          className={cn(
            'absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all cursor-pointer',
            selected
              ? 'border-primary-500 bg-primary-500'
              : 'border-gray-300 bg-white hover:border-primary-400'
          )}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Check size={14} className="text-white" strokeWidth={3} />
            </motion.div>
          )}
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-sm"
            />
            {user.verified && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 border-2 border-white shadow-sm"
              >
                <Star size={10} className="text-white fill-white" />
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-ink-700 truncate">{user.name}</h4>
                <Badge size="sm" variant="default" className={cn('!border', catInfo.color)}>
                  {catInfo.label}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-ink-500 truncate">{user.company}</p>
            </div>
            {!selectMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-amber-600">
                {reputation.starRating.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-ink-400">
              <MapPin size={12} />
              <span className="text-xs">{user.city}</span>
            </div>
            <span className="text-xs text-ink-400">
              {reputation.totalDeals}笔成交
            </span>
          </div>

          {!compact && remark && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 line-clamp-1"
            >
              💬 {remark}
            </motion.p>
          )}

          {!compact && tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag, idx) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Chip variant="default" size="sm">
                    {tag}
                  </Chip>
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.1 }}
          className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleContactClick}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100 transition-colors"
          >
            <Phone size={14} />
            <span>一键联系</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleContactClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors"
          >
            <MessageCircle size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGuaranteeClick}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-accent-500/20 hover:from-accent-600 hover:to-accent-700 transition-all"
          >
            <Shield size={14} />
            <span>发起担保</span>
          </motion.button>
        </motion.div>
      )}

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(135deg, rgba(47, 95, 153, 0.03) 0%, rgba(255, 107, 53, 0.03) 100%)',
        }}
        whileHover={{ opacity: 1 }}
      />
    </motion.div>
  );
}
