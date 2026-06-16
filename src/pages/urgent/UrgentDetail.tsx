import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  MessageCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Phone,
  Copy,
  ExternalLink,
  Car,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUrgentStore } from '../../stores/urgentStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrderStore } from '../../stores/orderStore';
import QuoteItem from '../../components/business/QuoteItem';
import RelayPanel from '../../components/business/RelayPanel';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { useCountdown } from '../../hooks/useCountdown';
import { Quote, SortType } from '../../types';
import {
  formatPrice,
  formatPriceShort,
  formatTime,
  formatDistance,
  formatQuantity,
  formatWarrantyDays,
} from '../../utils/format';

type TabType = 'quotes' | 'relay';
type PriceSortType = 'total' | 'price';
type QuoteViewMode = 'list' | 'compare';

const statusTextMap = {
  active: '紧急招募中',
  quoted: '已有供应商报价',
  locked: '交易已锁定',
  completed: '交易已完成',
  expired: '急件已过期',
};

const statusColorMap = {
  active: 'from-red-500 to-orange-500',
  quoted: 'from-blue-500 to-cyan-500',
  locked: 'from-amber-500 to-yellow-500',
  completed: 'from-green-500 to-emerald-500',
  expired: 'from-gray-400 to-gray-500',
};

function DetailCountdown({ expiresAt }: { expiresAt: string }) {
  const { remaining, isCompleted, days, hours, minutes, seconds } = useCountdown(expiresAt);

  const getColor = () => {
    if (isCompleted) return 'text-gray-500';
    if (remaining < 2 * 60 * 60 * 1000) return 'text-red-600';
    if (remaining < 12 * 60 * 60 * 1000) return 'text-amber-600';
    return 'text-green-600';
  };

  const timeBlocks = [
    { value: days, label: '天', show: days > 0 },
    { value: hours, label: '时', show: true },
    { value: minutes, label: '分', show: true },
    { value: seconds, label: '秒', show: true },
  ];

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Clock size={16} />
        <span className="text-sm font-medium">已结束</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock size={16} className={getColor()} />
      <div className="flex items-center gap-1">
        {timeBlocks
          .filter((b) => b.show)
          .map((block, i) => (
            <div key={i} className="flex items-center">
              <span className={cn('text-sm font-bold tabular-nums', getColor())}>
                {String(block.value).padStart(2, '0')}
              </span>
              <span className={cn('text-xs', getColor(), 'opacity-70')}>{block.label}</span>
              {i < timeBlocks.filter((b) => b.show).length - 1 && (
                <span className={cn('mx-0.5 font-bold', getColor())}>:</span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl">
        <Package size={48} className="text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            src={images[current]}
            alt={`配件图片${current + 1}`}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrent(i)}
                animate={{
                  width: i === current ? 20 : 6,
                  backgroundColor: i === current ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                }}
                transition={{ duration: 0.2 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur text-white text-xs font-medium">
          {current + 1}/{images.length}
        </div>
      )}
    </div>
  );
}

function QuoteCompareView({
  quotes,
  selectedQuoteId,
  onSelectQuote,
  onAcceptQuote,
  isPublisher,
  onChat,
  acceptedQuoteId,
}: {
  quotes: Quote[];
  selectedQuoteId: string | null;
  onSelectQuote: (id: string) => void;
  onAcceptQuote: (id: string) => void;
  isPublisher: boolean;
  onChat: () => void;
  acceptedQuoteId?: string;
}) {
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

  if (quotes.length === 0) {
    return (
      <Card variant="outlined" padding="lg">
        <div className="py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Truck size={28} className="text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            暂无供应商报价
          </h3>
          <p className="text-sm text-gray-400">
            {isPublisher ? '邀请供应商报价或稍等片刻' : '成为第一个报价的供应商'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[700px]">
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-8 gap-2 py-2 px-2 text-[10px] font-semibold text-gray-500">
            <div className="col-span-1 text-center">运总价</div>
            <div className="col-span-1 text-center">单价</div>
            <div className="col-span-1 text-center">城市</div>
            <div className="col-span-1 text-center">距离</div>
            <div className="col-span-1 text-center">当天发车</div>
            <div className="col-span-1 text-center">质保</div>
            <div className="col-span-1 text-center">信誉</div>
            <div className="col-span-1 text-center">操作</div>
          </div>
        </div>

        <div className="space-y-2 py-2">
          {quotes.map((quote, index) => {
            const isSelected = selectedQuoteId === quote.id;
            const isAccepted = acceptedQuoteId === quote.id;
            return (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => onSelectQuote(quote.id)}
                className={cn(
                  'grid grid-cols-8 gap-2 items-center p-3 rounded-2xl border-2 cursor-pointer transition-all relative',
                  isAccepted
                    ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                    : isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/10'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                )}
              >
                {isAccepted && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold shadow-sm">
                    ✓ 已采纳
                  </div>
                )}
                <div className="col-span-1 text-center">
                  <div className="text-sm font-bold text-red-600">
                    {formatPriceShort(quote.totalPrice)}
                  </div>
                  <div className="text-[9px] text-gray-400">含运费</div>
                </div>

                <div className="col-span-1 text-center">
                  <div className="text-sm font-semibold text-gray-700">
                    {formatPriceShort(quote.price)}
                  </div>
                  <div className="text-[9px] text-gray-400">不含运</div>
                </div>

                <div className="col-span-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <MapPin size={10} className="text-blue-500" />
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {quote.sourceCity}
                    </span>
                  </div>
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-xs text-gray-600">
                    {formatDistance(quote.distanceKm)}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  {quote.canShipToday ? (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold">
                      当天发
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">
                      1-2天
                    </span>
                  )}
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-[10px] text-gray-700 font-medium">
                    {quote.warrantyDays > 0 ? `${quote.warrantyDays}天` : '无'}
                  </span>
                </div>

                <div className="col-span-1">
                  <div className="flex flex-col items-center gap-0.5">
                    {renderStars(quote.supplier.reputation.starRating)}
                    <div className="text-[9px] text-gray-500">
                      {(quote.supplier.reputation.positiveRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="col-span-1 flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChat();
                    }}
                  >
                    <MessageCircle size={14} />
                  </Button>
                  {isPublisher && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptQuote(quote.id);
                      }}
                    >
                      采纳
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function UrgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getUrgentPostById, acceptQuote, setRelayItemStatus, createRelayItem, isLoading, fetchUrgentPosts } = useUrgentStore();
  const { user } = useAuthStore();
  const orderStore = useOrderStore();

  const [activeTab, setActiveTab] = useState<TabType>('quotes');
  const [priceSort, setPriceSort] = useState<PriceSortType>('total');
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteViewMode, setQuoteViewMode] = useState<QuoteViewMode>('list');
  const [compareSelectedQuoteId, setCompareSelectedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    fetchUrgentPosts();
  }, [fetchUrgentPosts]);

  const post = useMemo(() => {
    if (!id) return null;
    return getUrgentPostById(id) || null;
  }, [id, getUrgentPostById]);

  const sortedQuotes = useMemo(() => {
    if (!post) return [];
    const quotes = [...post.quotes];
    const sorted = quotes.sort((a, b) => {
      const aVal = priceSort === 'total' ? a.totalPrice : a.price;
      const bVal = priceSort === 'total' ? b.totalPrice : b.price;
      return aVal - bVal;
    });
    const acceptedQuote = post.acceptedQuoteId
      ? sorted.find(q => q.id === post.acceptedQuoteId)
      : null;
    const otherQuotes = sorted.filter(q => q.id !== post.acceptedQuoteId);
    return acceptedQuote ? [acceptedQuote, ...otherQuotes] : otherQuotes;
  }, [post, priceSort]);

  const minQuotePrice = sortedQuotes.length > 0 ? sortedQuotes[0].totalPrice : 0;
  const avgQuotePrice =
    post?.quotes.length
      ? post.quotes.reduce((sum, q) => sum + q.totalPrice, 0) / post.quotes.length
      : 0;

  const isPublisher = user?.id === post?.publisherId;

  const handleAcceptQuote = (quoteId: string) => {
    if (!post || !id) return;
    acceptQuote(id, quoteId);
    setSelectedQuote(post.quotes.find((q) => q.id === quoteId) || null);
    setShowGuaranteeModal(true);
  };

  const handleConfirmRelay = (relayId: string) => {
    setRelayItemStatus(relayId, 'confirmed');
  };

  const handleChat = () => {
    alert('跳转到聊天页面');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.partName || '急找配件',
        text: post?.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  if (isLoading || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  const carPlatformText = `${post.carPlatform.brand} ${post.carPlatform.series} ${post.carPlatform.year} ${post.carPlatform.model}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-1.5">
              <Badge variant={post.status === 'active' ? 'urgent' : post.status === 'quoted' ? 'info' : post.status === 'locked' ? 'warning' : post.status === 'completed' ? 'success' : 'default'} size="md">
                {statusTextMap[post.status]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Share2 size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-4 space-y-4">
        <div className={cn(
          "rounded-2xl p-4 text-white",
          "bg-gradient-to-r",
          statusColorMap[post.status]
        )}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold mb-1 line-clamp-2">{post.partName}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                {post.partNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-xs">
                    <Copy size={10} />
                    OE号: {post.partNumber}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-xs">
                  <Package size={10} />
                  需求 x{formatQuantity(post.quantity)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/20">
            <DetailCountdown expiresAt={post.expiresAt} />
            <div className="text-right">
              <div className="text-xs opacity-80 mb-0.5">
                {sortedQuotes.length > 0 ? '最低报价' : '暂无报价'}
              </div>
              <div className="text-xl font-bold">
                {sortedQuotes.length > 0 ? formatPriceShort(minQuotePrice) : '—'}
              </div>
            </div>
          </div>
        </div>

        <Card variant="outlined" padding="md">
          <div className="flex items-start gap-3 mb-4">
            <div className="relative flex-shrink-0">
              <img
                src={post.publisher.avatar}
                alt={post.publisher.name}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
              />
              {post.publisher.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <ShieldCheck size={11} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {post.publisher.name}
                </span>
                {post.publisher.reputation.starRating >= 4.8 && (
                  <Badge variant="reputation-high" size="sm">金牌商家</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                <MapPin size={11} />
                {post.publisher.city} · {post.publisher.company}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star size={11} className="fill-current" />
                  <span className="font-medium">{post.publisher.reputation.starRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{post.publisher.reputation.totalDeals}笔交易</span>
                <span className="text-gray-400">·</span>
                <span className="text-green-600">
                  {(post.publisher.reputation.positiveRate * 100).toFixed(0)}%好评
                </span>
              </div>
            </div>
            {!isPublisher && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<MessageCircle size={14} />}
                onClick={handleChat}
              >
                联系
              </Button>
            )}
          </div>

          {post.images.length > 0 && <ImageCarousel images={post.images} />}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Car size={14} className="text-blue-500" />
              <span className="text-xs font-medium text-gray-900">适配车型</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip variant="primary" size="sm">
                {post.carPlatform.brand}
              </Chip>
              <Chip variant="default" size="sm">
                {post.carPlatform.series}
              </Chip>
              {post.carPlatform.year && (
                <Chip variant="default" size="sm">
                  {post.carPlatform.year}款
                </Chip>
              )}
              <Chip variant="outline" size="sm">
                {carPlatformText}
              </Chip>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-purple-500" />
              <span className="text-xs font-medium text-gray-900">详细描述</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {post.description}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-xl bg-blue-50">
              <div className="text-lg font-bold text-blue-600">{post.quotes.length}</div>
              <div className="text-[10px] text-blue-500">供应商报价</div>
            </div>
            <div className="p-2 rounded-xl bg-orange-50">
              <div className="text-lg font-bold text-orange-600">{post.relayList.length}</div>
              <div className="text-[10px] text-orange-500">接龙补货</div>
            </div>
            <div className="p-2 rounded-xl bg-green-50">
              <div className="text-lg font-bold text-green-600">
                {sortedQuotes.length > 0 ? formatPriceShort(avgQuotePrice) : '—'}
              </div>
              <div className="text-[10px] text-green-500">平均报价</div>
            </div>
          </div>
        </Card>

        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl sticky top-[105px] z-30">
          <button
            onClick={() => setActiveTab('quotes')}
            className={cn(
              "flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === 'quotes'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            )}
          >
            <Truck size={14} />
            报价列表
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'quotes' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
            )}>
              {post.quotes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('relay')}
            className={cn(
              "flex-1 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              activeTab === 'relay'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            )}
          >
            <Package size={14} />
            接龙补货
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'relay' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
            )}>
              {post.relayList.length}
            </span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'quotes' ? (
            <motion.div
              key="quotes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {sortedQuotes.length > 0 && (
                <Card variant="default" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 flex-1">
                      共 <span className="font-semibold text-gray-700">{sortedQuotes.length}</span> 条报价
                    </div>
                    <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setQuoteViewMode('list')}
                        className={cn(
                          "px-2.5 h-7 rounded-md text-xs font-medium flex items-center gap-1 transition-all",
                          quoteViewMode === 'list'
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-500"
                        )}
                      >
                        List
                      </button>
                      <button
                        onClick={() => setQuoteViewMode('compare')}
                        className={cn(
                          "px-2.5 h-7 rounded-md text-xs font-medium flex items-center gap-1 transition-all",
                          quoteViewMode === 'compare'
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-500"
                        )}
                      >
                        Compare
                      </button>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setPriceSort('total')}
                        className={cn(
                          "px-2.5 h-7 rounded-md text-xs font-medium flex items-center gap-1 transition-all",
                          priceSort === 'total'
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-500"
                        )}
                      >
                        <ArrowUpDown size={11} />
                        含运费
                      </button>
                      <button
                        onClick={() => setPriceSort('price')}
                        className={cn(
                          "px-2.5 h-7 rounded-md text-xs font-medium flex items-center gap-1 transition-all",
                          priceSort === 'price'
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-500"
                        )}
                      >
                        <ArrowUpDown size={11} />
                        不含运
                      </button>
                    </div>
                  </div>
                </Card>
              )}

              {sortedQuotes.length === 0 ? (
                <Card variant="outlined" padding="lg">
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <Truck size={28} className="text-gray-300" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">
                      暂无供应商报价
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {isPublisher ? '邀请供应商报价或稍等片刻' : '成为第一个报价的供应商'}
                    </p>
                    {!isPublisher && (
                      <Button variant="primary" size="sm">
                        我要报价
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <AnimatePresence mode="wait">
                  {quoteViewMode === 'list' ? (
                    <motion.div
                      key="list-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {sortedQuotes.map((quote, i) => (
                        <QuoteItem
                          key={quote.id}
                          quote={quote}
                          index={i}
                          sortBy={priceSort}
                          isAccepted={post.acceptedQuoteId === quote.id}
                          onAccept={isPublisher ? () => handleAcceptQuote(quote.id) : undefined}
                          onChat={handleChat}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="compare-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <QuoteCompareView
                        quotes={sortedQuotes}
                        selectedQuoteId={compareSelectedQuoteId}
                        onSelectQuote={setCompareSelectedQuoteId}
                        onAcceptQuote={handleAcceptQuote}
                        isPublisher={isPublisher}
                        onChat={handleChat}
                        acceptedQuoteId={post.acceptedQuoteId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="relay"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RelayPanel
                post={post}
                onSubmitRelay={(qty, price) => {
                  if (!user || !id) return;
                  createRelayItem(id, {
                    supplierId: user.id,
                    quantity: qty,
                    unitPrice: price,
                    remark: '接龙补货',
                  });
                }}
                onConfirmRelay={isPublisher ? handleConfirmRelay : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showGuaranteeModal && selectedQuote && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuaranteeModal(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">发起担保交易</h3>
                    <p className="text-xs text-gray-500">平台担保，安全可靠</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                <Card variant="outlined" padding="md">
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                    <img
                      src={selectedQuote.supplier.avatar}
                      alt={selectedQuote.supplier.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedQuote.supplier.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedQuote.sourceCity} · {formatDistance(selectedQuote.distanceKm)}
                      </div>
                    </div>
                    <Badge variant="success" size="sm" icon={<CheckCircle2 size={10} />}>
                      已采纳
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">配件名称</span>
                      <span className="text-gray-900 font-medium">{post.partName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">配件单价</span>
                      <span className="text-gray-900">{formatPrice(selectedQuote.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">数量</span>
                      <span className="text-gray-900">x{formatQuantity(post.quantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">运输费用</span>
                      <span className="text-gray-900">{formatPrice(selectedQuote.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">发货时效</span>
                      <span className={selectedQuote.canShipToday ? "text-green-600 font-medium" : "text-gray-900"}>
                        {selectedQuote.canShipToday ? '当天发货' : '1-2天发货'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">质保服务</span>
                      <span className="text-gray-900">{formatWarrantyDays(selectedQuote.warrantyDays)}</span>
                    </div>
                    <div className="h-px bg-gray-100 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">应付总额</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatPrice(selectedQuote.totalPrice * post.quantity)}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card variant="default" padding="md" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900 mb-1">平台担保服务</div>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-blue-500" />
                          货款由平台托管，确认适配无误后付款
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-blue-500" />
                          提供{formatWarrantyDays(selectedQuote.warrantyDays)}质保服务
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-blue-500" />
                          争议可申请平台仲裁，保障双方权益
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700">
                      <strong>定金说明：</strong>需支付总额30%作为定金
                      （{formatPrice(selectedQuote.totalPrice * post.quantity * 0.3)}），
                      确认收货后支付尾款。
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3">
                <Button
                  variant="secondary"
                  block
                  onClick={() => setShowGuaranteeModal(false)}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  block
                  leftIcon={<Shield size={16} />}
                  onClick={() => {
                    if (selectedQuote && post && user) {
                      const totalPrice = selectedQuote.totalPrice * post.quantity;
                      const newOrder = orderStore.createOrder({
                        buyerId: user.id,
                        supplierId: selectedQuote.supplierId,
                        sourceType: 'urgent',
                        sourceId: post.id,
                        sourceQuoteId: selectedQuote.id,
                        partInfo: {
                          partName: post.partName,
                          partNumber: post.partNumber,
                          carPlatform: post.carPlatform,
                          quantity: post.quantity,
                          unitPrice: selectedQuote.price,
                          conditionType: selectedQuote.conditionType,
                          images: post.images,
                          quoteSnapshot: selectedQuote,
                        },
                        totalAmount: totalPrice,
                        depositAmount: Math.round(totalPrice * 0.3),
                        finalAmount: totalPrice,
                        shippingFee: selectedQuote.shippingFee,
                        isRelayParent: false,
                      });
                      setShowGuaranteeModal(false);
                      navigate(`/order/${newOrder.id}`, { replace: true });
                    }
                  }}
                >
                  确认下单
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 pb-safe"
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {!isPublisher ? (
            <>
              <Button
                variant="icon"
                size="md"
                onClick={handleChat}
                className="flex-shrink-0"
              >
                <MessageCircle size={20} />
              </Button>
              <Button
                variant="icon"
                size="md"
                onClick={handleChat}
                className="flex-shrink-0"
              >
                <Phone size={20} />
              </Button>
              <Button
                variant="primary"
                size="lg"
                block
                leftIcon={<Sparkles size={18} />}
              >
                我要报价
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                block
                leftIcon={<Share2 size={16} />}
                onClick={handleShare}
              >
                分享求购
              </Button>
              <Button
                variant="primary"
                size="lg"
                block
                leftIcon={<Shield size={18} />}
                disabled={post.quotes.length === 0}
                onClick={() => {
                  if (sortedQuotes.length > 0) {
                    handleAcceptQuote(sortedQuotes[0].id);
                  }
                }}
              >
                发起担保
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
