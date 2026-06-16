import { motion } from 'framer-motion';
import { MapPin, Truck, Clock, ShieldCheck, Star, MessageCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Quote } from '../../types';
import Card from '../ui/Card';
import Chip from '../ui/Chip';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import { formatPrice, formatDistance, formatTime, formatWarrantyDays, formatStarRating } from '../../utils/format';

interface QuoteItemProps {
  quote: Quote;
  isAccepted?: boolean;
  onAccept?: () => void;
  onChat?: () => void;
  index?: number;
  sortBy?: 'total' | 'price';
}

const conditionTextMap: Record<Quote['conditionType'], string> = {
  new: '全新件',
  used: '拆车件',
  refurbished: '翻新件',
};

export default function QuoteItem({
  quote,
  isAccepted = false,
  onAccept,
  onChat,
  index = 0,
  sortBy = 'total',
}: QuoteItemProps) {
  const mainPrice = sortBy === 'total' ? quote.totalPrice : quote.price;
  const mainLabel = sortBy === 'total' ? '含运费总价' : '配件单价';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card
        variant="outlined"
        padding="none"
        className={cn(
          "overflow-hidden relative",
          isAccepted && "ring-2 ring-orange-500 bg-gradient-to-br from-orange-50/80 to-amber-50/60"
        )}
      >
        {isAccepted && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold shadow-sm shadow-orange-500/20">
                <CheckCircle2 size={12} />
                已采纳
              </span>
            </div>
          </>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={quote.supplier.avatar}
                  alt={quote.supplier.name}
                  className="w-11 h-11 rounded-full border-2 border-white shadow-sm"
                />
                {quote.supplier.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <ShieldCheck size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {quote.supplier.name}
                  </span>
                  {quote.supplier.reputation.starRating >= 4.5 && (
                    <Badge variant="reputation-high" size="sm" dot>
                      金牌
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span>{quote.supplier.reputation.starRating.toFixed(1)}</span>
                  </div>
                  <span>·</span>
                  <span>{quote.supplier.reputation.totalDeals}笔成交</span>
                  <span>·</span>
                  <span className="text-green-600">
                    {(quote.supplier.reputation.positiveRate * 100).toFixed(0)}%好评
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {quote.supplier.reputation.quickTags.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-[10px] text-gray-400 mb-0.5">{mainLabel}</div>
              <motion.div
                key={mainPrice}
                initial={{ scale: 1.1, color: '#EF4444' }}
                animate={{ scale: 1, color: '#DC2626' }}
                className="text-xl font-bold"
                style={{ color: '#DC2626' }}
              >
                {formatPrice(mainPrice)}
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg",
              sortBy === 'total' ? "bg-gray-50" : "bg-primary-50"
            )}>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400">配件单价</div>
                <div className={cn(
                  "text-sm font-semibold",
                  sortBy === 'price' ? "text-primary-600" : "text-gray-700"
                )}>
                  {formatPrice(quote.price)}
                </div>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg",
              sortBy === 'total' ? "bg-primary-50" : "bg-gray-50"
            )}>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400">含运费总价</div>
                <div className={cn(
                  "text-sm font-semibold",
                  sortBy === 'total' ? "text-primary-600" : "text-gray-700"
                )}>
                  {formatPrice(quote.totalPrice)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <Chip variant="default" size="sm" icon={<MapPin size={12} className="text-blue-500" />}>
              {quote.sourceCity}
              <span className="text-gray-400 ml-1">{formatDistance(quote.distanceKm)}</span>
            </Chip>
            {quote.canShipToday ? (
              <Chip variant="primary" size="sm" icon={<Truck size={12} />}>
                当天发货
              </Chip>
            ) : (
              <Chip variant="default" size="sm" icon={<Clock size={12} />}>
                1-2天发货
              </Chip>
            )}
            <Chip variant="outline" size="sm">
              {conditionTextMap[quote.conditionType]}
            </Chip>
            <Badge variant="success" size="sm">
              {formatWarrantyDays(quote.warrantyDays)}
            </Badge>
          </div>

          {quote.remark && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-2.5 bg-gray-50 rounded-lg mb-3"
            >
              <p className="text-xs text-gray-600 leading-relaxed">
                "{quote.remark}"
              </p>
            </motion.div>
          )}

          <div className={cn(
            "flex items-center justify-between pt-3 border-t border-gray-100",
            "gap-2"
          )}>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              <span>{formatTime(quote.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<MessageCircle size={14} />}
                onClick={onChat}
              >
                联系
              </Button>
              {!isAccepted && onAccept && (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ChevronRight size={14} />}
                  onClick={onAccept}
                  whileTap={{ scale: 0.95 }}
                >
                  采纳报价
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
