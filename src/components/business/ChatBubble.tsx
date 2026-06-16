import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  ShieldCheck,
  Truck,
  ShoppingCart,
  FileText,
  Clock,
  Star,
  Play,
  MapPin,
} from 'lucide-react';
import { ChatMessage, QuotePayload, PartCardPayload, OrderCardPayload, User } from '@/types';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatPrice, formatTimeShort, formatWarrantyDays } from '@/utils/format';

export interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  sender?: User;
  onGuarantee?: (payload: PartCardPayload) => void;
  onViewOrder?: (payload: OrderCardPayload) => void;
  onViewQuote?: (payload: QuotePayload) => void;
  onImageClick?: (imageUrl: string) => void;
  onMentionClick?: (userId: string) => void;
  index?: number;
}

const bubbleVariants = {
  hidden: (isOwn: boolean) => ({
    opacity: 0,
    x: isOwn ? 30 : -30,
    y: 10,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
      duration: 0.3,
    },
  },
};

const renderMentions = (content: string, onMentionClick?: (userId: string) => void) => {
  const parts = content.split(/(@[\u4e00-\u9fa5a-zA-Z0-9_]+)\b/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const userName = part.slice(1);
      return (
        <span
          key={i}
          onClick={() => onMentionClick?.(userName)}
          className="text-primary-600 font-medium cursor-pointer hover:underline"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const TextContent = ({
  content,
  onMentionClick,
}: {
  content: string;
  onMentionClick?: (userId: string) => void;
}) => (
  <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
    {renderMentions(content, onMentionClick)}
  </div>
);

const ImageContent = ({
  content,
  isOwn,
  onImageClick,
}: {
  content: string;
  isOwn: boolean;
  onImageClick?: (url: string) => void;
}) => (
  <div
    className={cn(
      'rounded-xl overflow-hidden cursor-pointer',
      isOwn ? 'ring-2 ring-white' : 'ring-2 ring-gray-100'
    )}
    onClick={() => onImageClick?.(content)}
  >
    <img
      src={content}
      alt="消息图片"
      className="max-w-[220px] max-h-[260px] object-cover"
      loading="lazy"
    />
  </div>
);

const VoiceBars = ({ duration, isPlaying }: { duration: number; isPlaying: boolean }) => {
  const bars = Math.min(Math.max(Math.ceil(duration / 2), 5), 15);
  return (
    <div className="flex items-center gap-0.5 h-5">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          animate={
            isPlaying
              ? {
                  height: ['40%', '100%', '60%', '90%', '40%'],
                  transition: {
                    duration: 0.8 + (i % 3) * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.05,
                  },
                }
              : undefined
          }
          className={cn(
            'w-1 rounded-full',
            isPlaying ? 'bg-white' : 'bg-current'
          )}
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
  );
};

const VoiceContent = ({
  content,
  isOwn,
}: {
  content: string;
  isOwn: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const duration = parseInt(content) || 3;

  return (
    <div
      className={cn(
        'flex items-center gap-3 min-w-[110px] cursor-pointer select-none',
        isPlaying && 'opacity-80'
      )}
      onClick={() => setIsPlaying(!isPlaying)}
    >
      <motion.div
        whileTap={{ scale: 0.92 }}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isOwn ? 'bg-white/20' : 'bg-gray-200'
        )}
      >
        {isPlaying ? (
          <Volume2 size={16} className={isOwn ? 'text-white' : 'text-gray-600'} />
        ) : (
          <Play size={16} className={isOwn ? 'text-white' : 'text-gray-600'} />
        )}
      </motion.div>
      <VoiceBars duration={duration} isPlaying={isPlaying} />
      <span
        className={cn(
          'text-xs font-medium tabular-nums flex-shrink-0',
          isOwn ? 'text-white/90' : 'text-gray-500'
        )}
      >
        {duration}"
      </span>
    </div>
  );
};

const QuoteContent = ({
  payload,
  isOwn,
  onViewQuote,
}: {
  payload: QuotePayload;
  isOwn: boolean;
  onViewQuote?: (p: QuotePayload) => void;
}) => (
  <Card
    variant={isOwn ? 'elevated' : 'outlined'}
    padding="none"
    clickable
    onClick={() => onViewQuote?.(payload)}
    className={cn('w-[260px] overflow-hidden', isOwn && 'bg-primary-50 border-none')}
  >
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            isOwn ? 'bg-primary-600' : 'bg-accent-500'
          )}
        >
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <div className={cn('text-sm font-semibold', isOwn ? 'text-primary-700' : 'text-ink-700')}>
            报价单
          </div>
          <div className="text-[10px] text-gray-400">点击查看详情</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white/60">
          <div className="text-[10px] text-gray-400 mb-0.5">配件单价</div>
          <div className="text-sm font-bold text-accent-600">{formatPrice(payload.price)}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/60">
          <div className="text-[10px] text-gray-400 mb-0.5">运费</div>
          <div className="text-sm font-semibold text-gray-600">{formatPrice(payload.shippingFee)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="text-xs text-gray-500">含运费总价</div>
        <div className="text-lg font-bold text-danger-600">
          {formatPrice(payload.price + payload.shippingFee)}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {payload.canShipToday ? (
          <Badge variant="success" size="sm" icon={<Truck size={10} />}>
            当天发货
          </Badge>
        ) : (
          <Badge variant="default" size="sm" icon={<Clock size={10} />}>
            1-2天发货
          </Badge>
        )}
      </div>
    </div>
  </Card>
);

const PartCardContent = ({
  payload,
  isOwn,
  onGuarantee,
}: {
  payload: PartCardPayload;
  isOwn: boolean;
  onGuarantee?: (p: PartCardPayload) => void;
}) => (
  <Card
    variant={isOwn ? 'elevated' : 'outlined'}
    padding="none"
    className="w-[280px] overflow-hidden"
  >
    <div className="relative">
      <div className="aspect-[4/3] w-full overflow-hidden bg-ink-50">
        <img
          src={`https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400`}
          alt={payload.partName}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute top-2 left-2">
        <Badge variant="info" size="sm">
          配件商品
        </Badge>
      </div>
    </div>

    <div className="p-3.5">
      <h4 className="text-sm font-semibold text-ink-700 mb-1 line-clamp-1">{payload.partName}</h4>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <MapPin size={11} className="text-gray-400" />
          <span className="text-[11px] text-gray-500 truncate">{payload.supplierName}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-bold text-accent-600">{formatPrice(payload.price)}</span>
        <span className="text-[11px] text-gray-400">/件</span>
      </div>

      <Button
        variant={isOwn ? 'ghost' : 'primary'}
        size="sm"
        block
        leftIcon={<ShieldCheck size={14} />}
        onClick={() => onGuarantee?.(payload)}
        className={cn(isOwn && '!bg-primary-50 !text-primary-700')}
      >
        一键担保下单
      </Button>
    </div>
  </Card>
);

const OrderStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' | 'danger' }> = {
  pending_payment: { label: '待付款', variant: 'warning' },
  deposited: { label: '已付定金', variant: 'info' },
  preparing: { label: '备货中', variant: 'warning' },
  shipped: { label: '已发货', variant: 'info' },
  delivered: { label: '已送达', variant: 'info' },
  adapt_confirmed: { label: '适配确认', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  disputing: { label: '纠纷中', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'default' },
};

const OrderCardContent = ({
  payload,
  isOwn,
  onViewOrder,
}: {
  payload: OrderCardPayload;
  isOwn: boolean;
  onViewOrder?: (p: OrderCardPayload) => void;
}) => {
  const statusInfo = OrderStatusMap[payload.status] || {
    label: payload.status,
    variant: 'default' as const,
  };

  return (
    <Card
      variant={isOwn ? 'elevated' : 'outlined'}
      padding="none"
      clickable
      onClick={() => onViewOrder?.(payload)}
      className="w-[260px] overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div>
              <div className={cn('text-sm font-semibold', isOwn ? 'text-primary-700' : 'text-ink-700')}>
                担保订单
              </div>
              <div className="text-[10px] text-gray-400">NO.{payload.orderNo}</div>
            </div>
          </div>
          <Badge variant={statusInfo.variant} size="sm">
            {statusInfo.label}
          </Badge>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-success-50 to-primary-50 mb-3">
          <div className="flex items-baseline justify-between">
            <div className="text-xs text-gray-500">订单金额</div>
            <div className="text-xl font-bold text-danger-600">{formatPrice(payload.amount)}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <ShieldCheck size={12} className="text-success-500" />
          <span>平台担保 · 安全交易</span>
        </div>
      </div>
    </Card>
  );
};

const SystemContent = ({ content, isOwn }: { content: string; isOwn: boolean }) => (
  <div
    className={cn(
      'text-center px-4 py-2 rounded-xl text-xs',
      isOwn
        ? 'bg-primary-500/10 text-primary-700'
        : 'bg-gray-100 text-gray-500'
    )}
  >
    {content}
  </div>
);

export default function ChatBubble({
  message,
  isOwn,
  sender,
  onGuarantee,
  onViewOrder,
  onViewQuote,
  onImageClick,
  onMentionClick,
  index = 0,
}: ChatBubbleProps) {
  const bubbleBg = isOwn
    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
    : 'bg-white text-ink-700 shadow-card border border-gray-100';

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <TextContent content={message.content} onMentionClick={onMentionClick} />;
      case 'image':
        return <ImageContent content={message.content} isOwn={isOwn} onImageClick={onImageClick} />;
      case 'voice':
        return <VoiceContent content={message.content} isOwn={isOwn} />;
      case 'quote':
        return (
          <QuoteContent
            payload={message.payload as QuotePayload}
            isOwn={isOwn}
            onViewQuote={onViewQuote}
          />
        );
      case 'part_card':
        return (
          <PartCardContent
            payload={message.payload as PartCardPayload}
            isOwn={isOwn}
            onGuarantee={onGuarantee}
          />
        );
      case 'order_card':
        return (
          <OrderCardContent
            payload={message.payload as OrderCardPayload}
            isOwn={isOwn}
            onViewOrder={onViewOrder}
          />
        );
      case 'system':
        return <SystemContent content={message.content} isOwn={isOwn} />;
      default:
        return <TextContent content={message.content} onMentionClick={onMentionClick} />;
    }
  };

  if (message.type === 'system' && !sender) {
    return (
      <motion.div
        custom={isOwn}
        initial="hidden"
        animate="visible"
        variants={bubbleVariants}
        transition={{ delay: index * 0.03 }}
        className="flex justify-center my-3"
      >
        <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      custom={isOwn}
      initial="hidden"
      animate="visible"
      variants={bubbleVariants}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex gap-2.5 mb-3 max-w-full',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className="flex-shrink-0 relative">
        {sender ? (
          <>
            <img
              src={sender.avatar}
              alt={sender.name}
              className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
            />
            {sender.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
                <ShieldCheck size={9} className="text-white" strokeWidth={3} />
              </div>
            )}
          </>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
            <FileText size={16} className="text-gray-400" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col max-w-[75%] min-w-0',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {sender && (
          <div
            className={cn(
              'flex items-center gap-1.5 mb-1',
              isOwn ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span className="text-[11px] font-medium text-gray-600">{sender.name}</span>
            {sender.reputation?.starRating >= 4.5 && (
              <div className="flex items-center gap-0.5">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-amber-600 font-semibold">
                  {sender.reputation.starRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl',
            bubbleBg,
            isOwn
              ? 'rounded-tr-md'
              : 'rounded-tl-md',
            message.type === 'system' && '!bg-transparent !shadow-none !border-none !p-0'
          )}
        >
          {renderContent()}
        </div>

        <span
          className={cn(
            'text-[10px] text-gray-400 mt-1',
            isOwn ? 'text-right' : 'text-left'
          )}
        >
          {formatTimeShort(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
