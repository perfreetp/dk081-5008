import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Shield,
  MessageCircle,
  Phone,
  UserPlus,
  Check,
  MapPin,
  Calendar,
  Award,
  Clock,
  Package,
  ChevronRight,
  MoreHorizontal,
  ThumbsUp,
  AlertTriangle,
  Truck,
  Crown,
  Building2,
  ArrowRight,
  Share2,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Chip from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import { useReputationStore } from '@/stores/reputationStore';
import type { ReputationEvaluation } from '@/stores/reputationStore';
import { guaranteeOrders } from '@/mock/data';
import { cn } from '@/lib/utils';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDaysAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}个月前`;
};

const renderStars = (rating: number, size = 14) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            className={cn(
              filled ? 'text-amber-400 fill-amber-400' : 'text-ink-200'
            )}
          />
        );
      })}
    </div>
  );
};

const orderStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  completed: { label: '已完成', variant: 'success' },
  delivered: { label: '已送达', variant: 'info' },
  shipped: { label: '已发货', variant: 'info' },
  'deposit-paid': { label: '已付定金', variant: 'warning' },
  'pending-payment': { label: '待付款', variant: 'warning' },
  dispute: { label: '纠纷中', variant: 'danger' },
  refunded: { label: '已退款', variant: 'default' },
};

export default function PeerProfile() {
  const navigate = useNavigate();
  const { userId = 'u002' } = useParams();
  const {
    getUserById,
    getEvaluationsByUser,
    getAverageRating,
    quickList,
    addQuickListEntry,
    peerProfiles,
  } = useReputationStore();

  const [activeTab, setActiveTab] = useState<'evaluations' | 'orders'>('evaluations');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');

  const user = useMemo(() => getUserById(userId), [getUserById, userId]);
  const evaluations = useMemo(() => getEvaluationsByUser(userId), [getEvaluationsByUser, userId]);
  const avgRating = useMemo(() => getAverageRating(userId), [getAverageRating, userId]);
  const peerProfile = useMemo(
    () => peerProfiles.find((p) => p.userId === userId),
    [peerProfiles, userId]
  );
  const isInQuickList = useMemo(
    () => quickList.some((q) => q.userId === userId),
    [quickList, userId]
  );

  const relatedOrders = useMemo(() => {
    return guaranteeOrders
      .filter(
        (o) => o.buyerId === userId || o.sellerId === userId
      )
      .slice(0, 8);
  }, [userId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-500">未找到该用户</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

  const { reputation } = user;

  const handleAddToQuickList = () => {
    if (isInQuickList) {
      alert('已在快捷名单中');
      return;
    }
    addQuickListEntry({
      userId,
      category: 'supplier',
      tags: user.reputation.quickTags,
      remark: note || user.company,
    });
    alert('已添加到快捷名单');
    setShowNoteInput(false);
    setNote('');
  };

  const handleGuarantee = () => {
    alert(`即将发起与 ${user.name} 的担保交易`);
  };

  const handleChat = () => {
    alert(`正在打开与 ${user.name} 的聊天窗口`);
  };

  const handleContact = () => {
    alert(`正在拨打 ${user.name} 的电话`);
  };

  const tagColors = [
    'bg-green-50 text-green-700 border-green-200',
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-purple-50 text-purple-700 border-purple-200',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-ink-50 pb-32"
    >
      <div className="relative overflow-hidden bg-gradient-primary px-4 pt-10 pb-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-40 w-40 rounded-full bg-primary-300 blur-3xl" />
        </div>

        <div className="relative">
          <div className="mb-5 flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              >
                <Share2 size={18} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              >
                <MoreHorizontal size={20} />
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-20 w-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                />
                {user.verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 border-3 border-white shadow-lg"
                  >
                    <Crown size={14} className="text-white fill-white" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
                {user.verified && (
                  <Badge variant="reputation-high" size="sm" dot>
                    已认证
                  </Badge>
                )}
                {isInQuickList && (
                  <Badge variant="success" size="sm" icon={<Check size={10} />}>
                    快捷名单
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-white/80 truncate">{user.company}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                  <MapPin size={12} className="text-white/70" />
                  <span className="text-xs text-white/90">{user.city}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                  <Calendar size={12} className="text-white/70" />
                  <span className="text-xs text-white/90">入驻 {getDaysAgo(user.createdAt)} 天</span>
                </div>
                {peerProfile?.dealCount !== undefined && (
                  <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <Package size={12} className="text-white/70" />
                    <span className="text-xs text-white/90">合作 {peerProfile.dealCount} 次</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {renderStars(reputation.starRating)}
                  <span className="text-sm font-bold text-white">{reputation.starRating.toFixed(1)}</span>
                </div>
                <span className="h-4 w-px bg-white/30" />
                <span className="text-xs text-white/80">
                  <span className="font-semibold text-white">{reputation.totalDeals}</span> 笔成交
                </span>
              </div>
            </div>
          </motion.div>

          {peerProfile?.note && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/15"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">📝</span>
                <p className="text-sm text-white/90">{peerProfile.note}</p>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {reputation.quickTags.map((tag, idx) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05, type: 'spring' }}
              >
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border backdrop-blur-md',
                    tagColors[idx % tagColors.length]
                  )}
                >
                  <ThumbsUp size={10} />
                  {tag}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-4"
          >
            <p className="mb-2 text-xs text-white/70 flex items-center gap-1">
              <Award size={12} />
              认证徽章
            </p>
            <div className="flex flex-wrap gap-2">
              {user.certificationBadges.map((badge, idx) => (
                <motion.div
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.08, type: 'spring' }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-500/20 px-3 py-1.5 border border-amber-300/30"
                >
                  <Shield size={12} className="text-amber-300" />
                  <span className="text-xs font-semibold text-amber-200">{badge}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-12 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                  <Star size={18} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-700">信誉数据</h3>
                  <p className="text-xs text-ink-400">综合评分 {avgRating.toFixed(1)} / 5.0</p>
                </div>
              </div>
              <Badge variant={reputation.pigeonRate <= 0.02 ? 'success' : reputation.pigeonRate <= 0.05 ? 'warning' : 'danger'} size="sm">
                {reputation.pigeonRate <= 0.02 ? '信誉优秀' : reputation.pigeonRate <= 0.05 ? '信誉良好' : '需关注'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-2xl bg-green-50 p-3 text-center border border-green-100">
                  <p className="text-xs text-green-700 mb-1">好评率</p>
                  <p className="text-xl font-bold text-green-600">
                    {(reputation.positiveRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl bg-red-50 p-3 text-center border border-red-100">
                  <p className="text-xs text-red-700 mb-1">放鸽子率</p>
                  <p className="text-xl font-bold text-red-600">
                    {(reputation.pigeonRate * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 text-center border border-amber-100">
                  <p className="text-xs text-amber-700 mb-1">错发率</p>
                  <p className="text-xl font-bold text-amber-600">
                    {(reputation.wrongShipRate * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-500">物流速度</span>
                    <span className="text-xs font-semibold text-ink-700">4.8分</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '96%' }}
                      transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-500">配件质量</span>
                    <span className="text-xs font-semibold text-ink-700">4.9分</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '98%' }}
                      transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-500">服务态度</span>
                    <span className="text-xs font-semibold text-ink-700">4.7分</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '94%' }}
                      transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card variant="elevated" padding="none" className="overflow-visible">
            <div className="border-b border-gray-100">
              <div className="flex items-center relative">
                {(['evaluations', 'orders'] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'flex-1 relative py-3.5 text-sm font-medium transition-colors',
                        isActive ? 'text-primary-600' : 'text-ink-500 hover:text-ink-700'
                      )}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {tab === 'evaluations' ? (
                          <>
                            <ThumbsUp size={14} />
                            历史评价
                            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-600">
                              {evaluations.length}
                            </span>
                          </>
                        ) : (
                          <>
                            <Package size={14} />
                            交易记录
                            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-600">
                              {relatedOrders.length}
                            </span>
                          </>
                        )}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="peerTabIndicator"
                          className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary-600"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'evaluations' ? (
                  <motion.div
                    key="evaluations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {evaluations.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-ink-400">暂无评价</p>
                      </div>
                    ) : (
                      evaluations.map((ev: ReputationEvaluation, idx) => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            'rounded-2xl bg-ink-50 p-4',
                            idx !== evaluations.length - 1 && 'mb-3'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={ev.evaluator.avatar}
                              alt={ev.evaluator.name}
                              className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-ink-700 truncate">
                                      {ev.evaluator.name}
                                    </p>
                                    {ev.evaluator.verified && (
                                      <Badge variant="reputation-high" size="sm" dot>
                                        认证
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    {renderStars(ev.rating, 12)}
                                    <span className="text-[10px] text-ink-400">
                                      {getDaysAgo(ev.createdAt)}
                                    </span>
                                    {ev.orderId && (
                                      <span className="text-[10px] text-ink-400">
                                        · 订单 {ev.orderId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {ev.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {ev.tags.map((tag, tIdx) => (
                                    <Chip
                                      key={tag}
                                      variant="default"
                                      size="sm"
                                    >
                                      {tag}
                                    </Chip>
                                  ))}
                                </div>
                              )}

                              <p className="mt-2 text-sm text-ink-600 leading-relaxed">
                                {ev.content}
                              </p>

                              {ev.images.length > 0 && (
                                <div className="mt-3 flex gap-2">
                                  {ev.images.slice(0, 4).map((img, iIdx) => (
                                    <img
                                      key={iIdx}
                                      src={img}
                                      alt=""
                                      className="h-16 w-16 rounded-xl object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative"
                  >
                    {relatedOrders.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-ink-400">暂无交易记录</p>
                      </div>
                    ) : (
                      <div className="relative pl-6">
                        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-200 via-primary-100 to-transparent" />
                        {relatedOrders.map((order, idx) => {
                          const statusInfo =
                            orderStatusMap[order.status] || orderStatusMap['pending-payment'];
                          const isLast = idx === relatedOrders.length - 1;
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.06 }}
                              className={cn('relative pb-5', isLast && 'pb-0')}
                            >
                              <div className="absolute -left-[18px] top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-primary-400 shadow-sm">
                                <div className="h-2 w-2 rounded-full bg-primary-500" />
                              </div>

                              <div className="rounded-2xl bg-ink-50 p-3 hover:bg-ink-100/70 transition-colors cursor-pointer">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Truck size={12} className="text-ink-400" />
                                      <p className="text-sm font-semibold text-ink-700 truncate">
                                        {order.title}
                                      </p>
                                    </div>
                                    <p className="text-[10px] text-ink-400">
                                      {order.orderNo} · {formatDate(order.createdAt)}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={statusInfo.variant}
                                    size="sm"
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-accent-600">
                                      ¥{order.totalAmount.toLocaleString()}
                                    </span>
                                    {order.sellerRating && (
                                      <div className="flex items-center gap-0.5">
                                        {renderStars(order.sellerRating, 10)}
                                        <span className="text-[10px] text-amber-600 ml-0.5">
                                          {order.sellerRating}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <button className="flex items-center gap-0.5 text-xs text-primary-600 font-medium">
                                    详情
                                    <ChevronRight size={12} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="px-4 py-3">
          <AnimatePresence mode="wait">
            {showNoteInput ? (
              <motion.div
                key="noteInput"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1.5 block">
                    添加备注（可选）
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例如：长期合作伙伴、价格优惠等"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    block
                    onClick={() => {
                      setShowNoteInput(false);
                      setNote('');
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    block
                    onClick={handleAddToQuickList}
                  >
                    确认添加
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Button
                  variant="icon"
                  size="lg"
                  onClick={handleContact}
                  className="!bg-blue-50 !text-blue-600 !border-blue-200"
                >
                  <Phone size={20} />
                </Button>
                <Button
                  variant="icon"
                  size="lg"
                  onClick={handleChat}
                  className="!bg-green-50 !text-green-600 !border-green-200"
                >
                  <MessageCircle size={20} />
                </Button>

                {isInQuickList ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    block
                    leftIcon={<Check size={18} />}
                    disabled
                  >
                    已在名单
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    block
                    leftIcon={<UserPlus size={18} />}
                    onClick={() => setShowNoteInput(true)}
                  >
                    加入名单
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  block
                  leftIcon={<Shield size={18} />}
                  onClick={handleGuarantee}
                  className="!bg-gradient-to-r !from-accent-500 !to-accent-600"
                >
                  发起担保
                  <ArrowRight size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
