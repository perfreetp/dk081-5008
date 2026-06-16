import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Shield,
  Phone,
  Filter,
  ArrowLeft,
  Users,
  Star,
  MapPin,
  Building2,
} from 'lucide-react';
import QuickListCard from '@/components/business/QuickListCard';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { useReputationStore, type QuickListEntry } from '@/stores/reputationStore';
import { cn } from '@/lib/utils';

type TabKey = 'all' | 'regular' | 'highRep' | 'local';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Users size={14} /> },
  { key: 'regular', label: '常合作', icon: <Star size={14} /> },
  { key: 'highRep', label: '高信誉', icon: <Shield size={14} /> },
  { key: 'local', label: '本地商', icon: <MapPin size={14} /> },
];

export default function QuickList() {
  const navigate = useNavigate();
  const { quickList, users, removeQuickListEntry } = useReputationStore();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchValue, setSearchValue] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredList = useMemo(() => {
    let result = [...quickList];

    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase();
      result = result.filter(
        (e) =>
          e.user.name.toLowerCase().includes(kw) ||
          e.user.company.toLowerCase().includes(kw) ||
          e.user.city.toLowerCase().includes(kw) ||
          e.remark.toLowerCase().includes(kw) ||
          e.tags.some((t) => t.toLowerCase().includes(kw))
      );
    }

    if (activeTab === 'regular') {
      result = result.filter((e) => {
        const profile = users.find((u) => u.id === e.userId);
        return (profile?.reputation.totalDeals || 0) >= 50;
      });
    } else if (activeTab === 'highRep') {
      result = result.filter((e) => e.user.reputation.starRating >= 4.8 && e.user.verified);
    } else if (activeTab === 'local') {
      result = result.filter((e) => e.user.city.includes('上海') || e.user.city.includes('广州'));
    }

    return result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }, [quickList, searchValue, activeTab, users]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((e) => e.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.size} 项吗？`)) {
      selectedIds.forEach((id) => removeQuickListEntry(id));
      setSelectedIds(new Set());
      setSelectMode(false);
    }
  };

  const handleBatchGuarantee = () => {
    alert(`已选择 ${selectedIds.size} 位合作商，即将发起批量担保`);
  };

  const handleContact = (entry: QuickListEntry) => {
    alert(`正在联系 ${entry.user.name}...`);
  };

  const handleGuarantee = (entry: QuickListEntry) => {
    alert(`正在发起与 ${entry.user.name} 的担保交易...`);
  };

  const stats = useMemo(() => {
    return {
      total: quickList.length,
      regular: quickList.filter((e) => (e.user.reputation.totalDeals || 0) >= 50).length,
      highRep: quickList.filter((e) => e.user.reputation.starRating >= 4.8 && e.user.verified).length,
      local: quickList.filter((e) => e.user.city.includes('上海')).length,
    };
  }, [quickList]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-ink-50 pb-28"
    >
      <div className="sticky top-0 z-30 bg-gradient-to-b from-white to-white/95 backdrop-blur-md shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-600 hover:bg-ink-100"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-ink-700">快捷名单</h1>
              <p className="text-xs text-ink-400">共 {stats.total} 位合作伙伴</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectMode(!selectMode)}
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-all',
                selectMode
                  ? 'bg-primary-600 text-white'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
              )}
            >
              {selectMode ? <CheckSquare size={16} /> : <Square size={16} />}
              <span className="hidden sm:inline">{selectMode ? '取消' : '批量'}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-sm shadow-accent-500/20"
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-primary-400 focus-within:shadow-md focus-within:shadow-primary-500/10 transition-all"
          >
            <Search size={18} className="text-ink-400 flex-shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索姓名、店铺、城市、标签..."
              className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none"
            />
            {searchValue && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setSearchValue('')}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-ink-500 hover:bg-ink-200"
              >
                <span className="text-xs">✕</span>
              </motion.button>
            )}
          </motion.div>
        </div>

        <div className="border-t border-gray-100 px-4 py-2.5">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count =
                tab.key === 'all'
                  ? stats.total
                  : tab.key === 'regular'
                  ? stats.regular
                  : tab.key === 'highRep'
                  ? stats.highRep
                  : stats.local;
              return (
                <motion.button
                  key={tab.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex-shrink-0 px-3 py-2"
                >
                  <span
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium transition-colors',
                      isActive ? 'text-primary-600' : 'text-ink-500 hover:text-ink-700'
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    <span
                      className={cn(
                        'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-500'
                      )}
                    >
                      {count}
                    </span>
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="quickListTabIndicator"
                      className="absolute -bottom-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary-600"
                    />
                  )}
                </motion.button>
              );
            })}
            <div className="flex-1" />
            <button className="flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-500 hover:bg-ink-100">
              <Filter size={14} />
              <span>筛选</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {selectMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 bg-white/80 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm"
                >
                  {selectedIds.size === filteredList.length && filteredList.length > 0 ? (
                    <CheckSquare size={18} className="text-primary-600" />
                  ) : (
                    <Square size={18} className="text-ink-400" />
                  )}
                  <span className="font-medium text-ink-600">全选</span>
                  <span className="text-ink-400">
                    ({selectedIds.size}/{filteredList.length})
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Phone size={14} />}
                    disabled={selectedIds.size === 0}
                  >
                    群通知
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Shield size={14} />}
                    disabled={selectedIds.size === 0}
                    onClick={handleBatchGuarantee}
                  >
                    批量担保
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-red-600 hover:!bg-red-50"
                    leftIcon={<Trash2 size={14} />}
                    disabled={selectedIds.size === 0}
                    onClick={handleBatchDelete}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-4">
        {filteredList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
              <Building2 size={40} className="text-ink-300" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-ink-600">
              {searchValue ? '未找到匹配的合作商' : '暂无快捷名单'}
            </h3>
            <p className="mb-4 text-sm text-ink-400">
              {searchValue ? '试试换个关键词搜索' : '添加常合作商，下次联系更方便'}
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowAddModal(true)}
            >
              添加合作商
            </Button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {filteredList.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                    opacity: { duration: 0.2 },
                    delay: idx % 4 * 0.03,
                  }}
                >
                  <QuickListCard
                    entry={entry}
                    selected={selectedIds.has(entry.id)}
                    selectMode={selectMode}
                    onToggleSelect={() => toggleSelect(entry.id)}
                    onClick={() => navigate(`/reputation/peer/${entry.userId}`)}
                    onContact={() => handleContact(entry)}
                    onGuarantee={() => handleGuarantee(entry)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink-200" />
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-700">添加合作商</h3>
                <Badge variant="info" size="sm">
                  快捷名单
                </Badge>
              </div>

              <Card variant="outlined" padding="sm" className="mb-5">
                <div className="space-y-3">
                  {users.slice(0, 3).map((u) => (
                    <motion.div
                      key={u.id}
                      whileHover={{ backgroundColor: '#F5F7FA' }}
                      className="flex items-center gap-3 rounded-xl p-2 cursor-pointer"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-11 w-11 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink-700">{u.name}</p>
                          {u.verified && (
                            <Badge variant="reputation-high" size="sm" dot>
                              认证
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 truncate">{u.company}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          alert(`已添加 ${u.name} 到快捷名单`);
                          setShowAddModal(false);
                        }}
                      >
                        添加
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Button
                variant="ghost"
                block
                onClick={() => setShowAddModal(false)}
              >
                取消
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!selectMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-accent-500/30"
            >
              <Plus size={18} />
              <span>添加合作商</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
