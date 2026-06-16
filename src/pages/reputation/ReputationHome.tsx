import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Award,
  ShieldCheck,
  Users,
  AlertTriangle,
  PackageX,
  TrendingUp,
  ChevronRight,
  MapPin,
  Calendar,
  ArrowUpRight,
  BadgeCheck,
  Crown,
  Sparkles,
  UserPlus,
  Search,
} from 'lucide-react';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Chip from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import ReputationChart from '@/components/business/ReputationChart';
import QuickListCard from '@/components/business/QuickListCard';
import { useAuthStore } from '@/stores/authStore';
import { useReputationStore } from '@/stores/reputationStore';
import { cn } from '@/lib/utils';

const badgeIcons: Record<string, React.ReactNode> = {
  '金牌商家': <Crown size={14} />,
  '诚信认证': <ShieldCheck size={14} />,
  '质保承诺': <BadgeCheck size={14} />,
  '极速发货': <Sparkles size={14} />,
};

const getDaysAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export default function ReputationHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { quickList } = useReputationStore();

  const reputation = user?.reputation;

  const starRating = reputation?.starRating || 4.9;
  const totalDeals = reputation?.totalDeals || 1256;
  const pigeonRate = reputation?.pigeonRate || 0.02;
  const wrongShipRate = reputation?.wrongShipRate || 0.01;
  const positiveRate = reputation?.positiveRate || 0.99;

  const recent30Stats = useMemo(() => {
    return {
      deals: Math.floor(totalDeals * 0.12),
      successRate: 98.5,
      avgResponseTime: '2.3小时',
      newPartners: 8,
    };
  }, [totalDeals]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < fullStars || (i === fullStars && hasHalf);
          return (
            <Star
              key={i}
              size={16}
              className={cn(
                filled ? 'text-amber-400 fill-amber-400' : 'text-ink-200'
              )}
            />
          );
        })}
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-ink-50 pb-28"
    >
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-hero px-4 pt-10 pb-20"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute -left-10 top-40 h-48 w-48 rounded-full bg-primary-300 blur-3xl" />
        </div>

        <div className="relative">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">信誉档案</h1>
              <p className="mt-1 text-sm text-white/70">您的商业信誉名片</p>
            </div>
            <Button
              variant="icon"
              size="md"
              className="!bg-white/10 !border-white/20 text-white backdrop-blur-md hover:!bg-white/20"
              onClick={() => {}}
            >
              <Search size={20} />
            </Button>
          </div>

          <div className="relative rounded-3xl bg-white/10 p-5 backdrop-blur-xl border border-white/15 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <img
                    src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={user?.name}
                    className="h-20 w-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                  />
                  {user?.verified && (
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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white truncate">{user?.name || '张伟'}</h2>
                  {user?.verified && (
                    <Badge variant="reputation-high" size="sm" dot>
                      已认证
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-white/80 truncate">{user?.company || '诚信汽配旗舰店'}</p>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <MapPin size={12} className="text-white/70" />
                    <span className="text-xs text-white/90">{user?.city || '上海市'}</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1">
                    <Calendar size={12} className="text-white/70" />
                    <span className="text-xs text-white/90">入驻 {getDaysAgo(user?.createdAt || '2021-03-15')} 天</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {renderStars(starRating)}
                    <span className="text-sm font-bold text-white">{starRating.toFixed(1)}</span>
                  </div>
                  <span className="h-4 w-px bg-white/30" />
                  <span className="text-xs text-white/80">
                    <span className="font-semibold text-white">{totalDeals}</span> 笔成交
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/15">
              <p className="mb-2.5 text-xs text-white/70">认证徽章</p>
              <div className="flex flex-wrap gap-2">
                {(user?.certificationBadges || ['金牌商家', '诚信认证', '质保承诺']).map((badge, idx) => (
                  <motion.div
                    key={badge}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1, type: 'spring', stiffness: 400 }}
                  >
                    <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-500/20 px-3 py-1.5 border border-amber-300/30">
                      <span className="text-amber-300">
                        {badgeIcons[badge] || <Award size={12} />}
                      </span>
                      <span className="text-xs font-semibold text-amber-200">{badge}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 -mt-12 space-y-4">
        <motion.div variants={itemVariants}>
          <Card variant="elevated" padding="md" className="overflow-visible">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                  <TrendingUp size={18} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-700">信誉数据看板</h3>
                  <p className="text-xs text-ink-400">核心指标一目了然</p>
                </div>
              </div>
              <Chip variant="ghost" size="sm" icon={<ArrowUpRight size={14} />}>
                详情
              </Chip>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 p-4 border border-red-100"
                >
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <AlertTriangle size={60} className="text-red-500" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-1 mb-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-xs font-medium text-red-700">放鸽子率</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {(pigeonRate * 100).toFixed(2)}%
                    </p>
                    <p className="mt-1 text-[10px] text-red-600/70">
                      优于 {(98 - pigeonRate * 100).toFixed(0)}% 同行
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/50 p-4 border border-amber-100"
                >
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <PackageX size={60} className="text-amber-500" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-1 mb-2">
                      <PackageX size={14} className="text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">错发率</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {(wrongShipRate * 100).toFixed(2)}%
                    </p>
                    <p className="mt-1 text-[10px] text-amber-700/70">
                      行业平均 2.35%
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100/50 p-4 border border-green-100"
                >
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Users size={60} className="text-green-500" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-1 mb-2">
                      <Users size={14} className="text-green-600" />
                      <span className="text-xs font-medium text-green-700">成交数</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{totalDeals}</p>
                    <p className="mt-1 text-[10px] text-green-700/70">
                      好评率 {(positiveRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReputationChart pigeonRate={pigeonRate} totalDeals={totalDeals} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="elevated" padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50">
                  <Calendar size={18} className="text-accent-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-700">近30天交易统计</h3>
                  <p className="text-xs text-ink-400">本月业务表现</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-ink-50 p-4">
                  <p className="text-xs text-ink-500">成交笔数</p>
                  <p className="mt-1 text-2xl font-bold text-ink-700">
                    {recent30Stats.deals}
                    <span className="ml-1 text-xs font-normal text-green-600">+12%</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-ink-50 p-4">
                  <p className="text-xs text-ink-500">交易成功率</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {recent30Stats.successRate}%
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '98.5%' }}
                      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-ink-50 p-4">
                  <p className="text-xs text-ink-500">平均响应时间</p>
                  <p className="mt-1 text-2xl font-bold text-primary-600">
                    {recent30Stats.avgResponseTime}
                  </p>
                  <p className="mt-2 text-[10px] text-ink-400">优于行业平均 3.8小时</p>
                </div>
                <div className="rounded-2xl bg-ink-50 p-4">
                  <p className="text-xs text-ink-500">新增合作伙伴</p>
                  <p className="mt-1 text-2xl font-bold text-accent-600">
                    {recent30Stats.newPartners}
                    <span className="ml-1 text-xs font-normal">人</span>
                  </p>
                  <p className="mt-2 text-[10px] text-ink-400">合作关系正在扩展</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="elevated" padding="md" className="overflow-visible">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                  <Users size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-700">快捷名单</h3>
                  <p className="text-xs text-ink-400">常合作商快速联系</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/reputation/quicklist')}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                查看全部
                <ChevronRight size={14} />
              </button>
            </CardHeader>
            <CardContent>
              {quickList.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
                    <Users size={32} className="text-ink-300" />
                  </div>
                  <p className="text-sm font-medium text-ink-600">暂无快捷名单</p>
                  <p className="mt-1 text-xs text-ink-400">添加常合作商，联系更高效</p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    leftIcon={<UserPlus size={16} />}
                    onClick={() => navigate('/reputation/quicklist')}
                  >
                    添加合作商
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {quickList.slice(0, 3).map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <QuickListCard
                        entry={entry}
                        compact={idx === 2}
                        onClick={() => navigate(`/reputation/peer/${entry.userId}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
