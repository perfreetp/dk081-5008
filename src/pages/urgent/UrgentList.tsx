import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Flame,
  Clock,
  Filter,
  TrendingUp,
  Bell,
  X,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUrgentStore } from '../../stores/urgentStore';
import { useAuthStore } from '../../stores/authStore';
import UrgentCard from '../../components/business/UrgentCard';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { UrgentPost } from '../../types';

type FilterCategory = 'all' | 'lighting' | 'appearance' | 'mechanical' | 'electronics' | 'chassis' | 'engine';
type SortType = 'latest' | 'urgent' | 'nearby' | 'mostQuoted';
type StatusTab = 'all' | 'active' | 'quoted' | 'completed';

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '招募中' },
  { key: 'quoted', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

const categoryFilters: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'lighting', label: '照明系统' },
  { key: 'appearance', label: '外观覆盖' },
  { key: 'mechanical', label: '机械传动' },
  { key: 'electronics', label: '电子电器' },
  { key: 'chassis', label: '底盘悬挂' },
  { key: 'engine', label: '发动机件' },
];

const sortOptions: { key: SortType; label: string; icon: React.ReactNode }[] = [
  { key: 'latest', label: '最新发布', icon: <Clock size={12} /> },
  { key: 'urgent', label: '最紧急', icon: <Flame size={12} /> },
  { key: 'nearby', label: '距离最近', icon: <MapPin size={12} /> },
  { key: 'mostQuoted', label: '报价最多', icon: <TrendingUp size={12} /> },
];

export default function UrgentList() {
  const navigate = useNavigate();
  const { urgentPosts, fetchUrgentPosts, isLoading } = useUrgentStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [activeSort, setActiveSort] = useState<SortType>('latest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [statusFilter, setStatusFilter] = useState<UrgentPost['status'] | 'all'>('all');
  const [hasRelay, setHasRelay] = useState(false);
  const [hasQuote, setHasQuote] = useState(false);

  useEffect(() => {
    fetchUrgentPosts();
  }, [fetchUrgentPosts]);

  const filteredPosts = useMemo(() => {
    let result = [...urgentPosts];

    result = result.filter((p) => new Date(p.expiresAt).getTime() > Date.now());

    if (activeCategory !== 'all') {
      const categoryKeyMap: Record<string, string> = {
        lighting: '照明系统',
        appearance: '外观覆盖',
        mechanical: '机械传动',
        electronics: '电子电器',
        chassis: '底盘悬挂',
        engine: '发动机件',
      };
      result = result.filter((p) => p.category === categoryKeyMap[activeCategory] || p.category === activeCategory);
      result = result.filter((p) => p.status === 'active' || p.status === 'quoted');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.partName.toLowerCase().includes(query) ||
          p.partNumber?.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.carPlatform.brand.toLowerCase().includes(query) ||
          p.carPlatform.series.toLowerCase().includes(query)
      );
    }

    if (statusTab !== 'all') {
      if (statusTab === 'active') {
        result = result.filter((p) => p.status === 'active');
      } else if (statusTab === 'quoted') {
        result = result.filter((p) => p.status === 'quoted');
      } else if (statusTab === 'completed') {
        result = result.filter((p) => p.status === 'completed');
      }
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (hasRelay) {
      result = result.filter((p) => p.relayList.length > 0);
    }

    if (hasQuote) {
      result = result.filter((p) => p.quotes.length > 0);
    }

    switch (activeSort) {
      case 'urgent':
        result.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
        break;
      case 'mostQuoted':
        result.sort((a, b) => b.quotes.length - a.quotes.length);
        break;
      case 'nearby':
        if (user?.address) {
          const userCity = (user as any).city || user.address.split('市')[0] + '市';
          result = result.filter((p) => p.publisher.city === userCity);
        }
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [urgentPosts, searchQuery, activeCategory, activeSort, statusTab, statusFilter, hasRelay, hasQuote, user]);

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) + (hasRelay ? 1 : 0) + (hasQuote ? 1 : 0);

  const handleCardClick = (postId: string) => {
    navigate(`/urgent/${postId}`);
  };

  const handlePublish = () => {
    navigate('/urgent/publish');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Flame size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">急找频道</h1>
                <p className="text-[10px] text-gray-400">全行业实时急件，快速响应</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUrgentPosts()}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
              </button>
              <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative">
                <Bell size={16} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索配件名称、OE号、车型..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </motion.button>
              )}
            </div>
            <button
              onClick={() => setShowFilterPanel(true)}
              className={cn(
                "h-10 px-3 rounded-xl flex items-center gap-1.5 transition-colors",
                activeFiltersCount > 0
                  ? "bg-primary-50 text-primary-600 border border-primary-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Filter size={15} />
              {activeFiltersCount > 0 && (
                <span className="text-xs font-medium">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 whitespace-nowrap">
            {categoryFilters.map((cat) => (
              <Chip
                key={cat.key}
                variant={activeCategory === cat.key ? 'primary' : 'default'}
                size="md"
                selected={activeCategory === cat.key}
                onSelect={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="px-4 pb-3 border-t border-gray-50">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  "flex items-center gap-1 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                  statusTab === tab.key
                    ? "text-primary-600 border-primary-500"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-3 border-t border-gray-50">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setActiveSort(opt.key)}
                className={cn(
                  "flex items-center gap-1 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                  activeSort === opt.key
                    ? "text-primary-600 border-primary-500"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-3 space-y-3">
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-gray-500">已选筛选：</span>
            {statusFilter !== 'all' && (
              <Chip
                variant="primary"
                size="sm"
                closable
                onClose={() => setStatusFilter('all')}
              >
                {statusFilter === 'active'
                  ? '紧急招募'
                  : statusFilter === 'quoted'
                    ? '已获报价'
                    : statusFilter === 'locked'
                      ? '已锁定'
                      : statusFilter === 'completed'
                        ? '已完成'
                        : '已过期'}
              </Chip>
            )}
            {hasRelay && (
              <Chip variant="primary" size="sm" closable onClose={() => setHasRelay(false)}>
                有接龙
              </Chip>
            )}
            {hasQuote && (
              <Chip variant="primary" size="sm" closable onClose={() => setHasQuote(false)}>
                有报价
              </Chip>
            )}
            <button
              onClick={() => {
                setStatusFilter('all');
                setHasRelay(false);
                setHasQuote(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              清除全部
            </button>
          </motion.div>
        )}

        {filteredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between text-xs text-gray-500 px-1"
          >
            <span>
              共 <span className="font-semibold text-gray-700">{filteredPosts.length}</span> 条急件
            </span>
            {user?.address && activeSort === 'nearby' && (
              <span className="flex items-center gap-1 text-primary-600">
                <MapPin size={10} />
                {(user as any).city || user.address.split('市')[0] + '市'}同城优先
              </span>
            )}
          </motion.div>
        )}

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white border border-gray-100 animate-pulse"
                  >
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Search size={32} className="text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  暂无匹配的急件
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  试试调整筛选条件或清除搜索
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    setStatusFilter('all');
                    setHasRelay(false);
                    setHasQuote(false);
                  }}
                >
                  重置筛选
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {filteredPosts.map((post, index) => (
                  <UrgentCard
                    key={post.id}
                    post={post}
                    index={index}
                    onClick={() => handleCardClick(post.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showFilterPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterPanel(false)}
              className="fixed inset-0 z-50 bg-black/40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">筛选条件</h3>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-5 overflow-y-auto max-h-[60vh]">
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} />
                    急件状态
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'active', 'quoted', 'locked', 'completed', 'expired'] as const).map(
                      (s) => (
                        <Chip
                          key={s}
                          variant={statusFilter === s ? 'primary' : 'default'}
                          size="sm"
                          selected={statusFilter === s}
                          onSelect={() => setStatusFilter(s)}
                        >
                          {s === 'all'
                            ? '全部'
                            : s === 'active'
                              ? '紧急招募'
                              : s === 'quoted'
                                ? '已获报价'
                                : s === 'locked'
                                  ? '已锁定'
                                  : s === 'completed'
                                    ? '已完成'
                                    : '已过期'}
                        </Chip>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">其他条件</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={hasRelay}
                        onChange={(e) => setHasRelay(e.target.checked)}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">有接龙补货</div>
                        <div className="text-xs text-gray-400">多供应商拼单报价</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={hasQuote}
                        onChange={(e) => setHasQuote(e.target.checked)}
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">已有供应商报价</div>
                        <div className="text-xs text-gray-400">至少一条报价记录</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3">
                <Button
                  variant="secondary"
                  block
                  onClick={() => {
                    setStatusFilter('all');
                    setHasRelay(false);
                    setHasQuote(false);
                  }}
                >
                  重置
                </Button>
                <Button
                  variant="primary"
                  block
                  onClick={() => setShowFilterPanel(false)}
                >
                  应用筛选
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 15 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handlePublish}
        className="fixed right-4 bottom-20 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/40 flex items-center justify-center"
      >
        <Plus size={24} className="text-white" strokeWidth={2.5} />
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-2xl border-2 border-red-400/50"
        />
      </motion.button>
    </div>
  );
}
