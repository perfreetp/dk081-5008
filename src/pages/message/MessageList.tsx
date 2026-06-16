import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Pin,
  VolumeX,
  Volume2,
  Trash2,
  MoreHorizontal,
  Users,
  FileText,
  ShoppingCart,
  Settings,
  Crown,
  Medal,
  Award,
  ChevronRight,
  MessageCircle,
  CheckCheck,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/format';
import {
  useMessageStore,
  ExtendedChatSession,
} from '@/stores/messageStore';
import { ChatMessage, User, GroupMemberRank } from '@/types';

type TabType = 'all' | 'quote' | 'order' | 'system';

const TABS: Array<{ key: TabType; label: string; icon: React.ReactNode }> = [
  { key: 'all', label: '全部', icon: <MessageCircle size={16} /> },
  { key: 'quote', label: '报价', icon: <FileText size={16} /> },
  { key: 'order', label: '订单', icon: <ShoppingCart size={16} /> },
  { key: 'system', label: '系统', icon: <Bell size={16} /> },
];

const SYSTEM_CATEGORIES = [
  {
    id: 'order_notify',
    title: '订单通知',
    desc: '担保订单、发货提醒、签收确认',
    unread: 2,
    color: 'from-primary-500 to-primary-600',
    icon: ShoppingCart,
  },
  {
    id: 'quote_notify',
    title: '报价提醒',
    desc: '新报价、采纳通知、竞价排名',
    unread: 5,
    color: 'from-accent-500 to-accent-600',
    icon: FileText,
  },
  {
    id: 'system_announce',
    title: '系统公告',
    desc: '平台规则、活动通知、功能更新',
    unread: 0,
    color: 'from-success-500 to-success-600',
    icon: Bell,
  },
  {
    id: 'reputation_update',
    title: '信誉动态',
    desc: '信誉分变化、评价提醒、排名更新',
    unread: 1,
    color: 'from-amber-500 to-amber-600',
    icon: Award,
  },
];

interface SwipeActionsState {
  [sessionId: string]: number;
}

const getMessageSummary = (msg: ChatMessage) => {
  switch (msg.type) {
    case 'text':
      return msg.content;
    case 'image':
      return '[图片]';
    case 'voice':
      return `[语音 ${msg.content}"]`;
    case 'quote':
      return '[报价单] 点击查看详情';
    case 'part_card':
      return '[配件卡片] 一键担保下单';
    case 'order_card':
      return '[订单卡片] 查看订单详情';
    case 'system':
      return msg.content;
    default:
      return msg.content;
  }
};

const ReputationRankBadges = ({ ranks }: { ranks: GroupMemberRank[] }) => {
  const medals = [
    { bg: 'from-amber-400 to-yellow-500', icon: Crown, ring: 'ring-amber-200' },
    { bg: 'from-gray-300 to-gray-400', icon: Medal, ring: 'ring-gray-200' },
    { bg: 'from-orange-400 to-amber-600', icon: Award, ring: 'ring-orange-200' },
  ];

  const top3 = ranks.slice(0, 3);

  return (
    <div className="flex -space-x-1.5">
      {top3.map((rank, idx) => {
        const medal = medals[idx];
        const Icon = medal.icon;
        return (
          <motion.div
            key={rank.userId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${medal.bg} ring-2 ${medal.ring} flex items-center justify-center shadow-sm`}
          >
            <Icon size={10} className="text-white" strokeWidth={2.5} />
          </motion.div>
        );
      })}
    </div>
  );
};

interface SessionCardProps {
  session: ExtendedChatSession;
  isPinned?: boolean;
  onOpen: () => void;
  onPin: () => void;
  onMute: () => void;
  onDelete: () => void;
  swipeOffset: number;
  onSwipeChange: (offset: number) => void;
  findUser: (id: string) => User | undefined;
}

function SessionCard({
  session,
  isPinned,
  onOpen,
  onPin,
  onMute,
  onDelete,
  swipeOffset,
  onSwipeChange,
  findUser,
}: SessionCardProps) {
  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef(0);
  const isDragging = useRef(false);
  const ACTION_WIDTH = -280;

  const displayName = session.type === 'group' && session.groupInfo
    ? session.groupInfo.name
    : session._custom?.otherUser?.name || '未知用户';

  const avatar = session.type === 'group' && session.groupInfo
    ? session.groupInfo.avatar
    : session._custom?.otherUser?.avatar || '';

  const isMuted = session._custom?.isMuted;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX - swipeOffset;
    currentXRef.current = swipeOffset;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null || !isDragging.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    const clamped = Math.max(ACTION_WIDTH, Math.min(0, diff));
    onSwipeChange(clamped);
  };

  const handleTouchEnd = () => {
    if (startXRef.current === null) return;
    isDragging.current = false;
    if (swipeOffset < ACTION_WIDTH / 2) {
      onSwipeChange(ACTION_WIDTH);
    } else {
      onSwipeChange(0);
    }
    startXRef.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          onClick={onMute}
          className="w-16 flex flex-col items-center justify-center bg-primary-500 text-white gap-1"
        >
          {isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span className="text-[10px]">{isMuted ? '取消' : '免扰'}</span>
        </button>
        <button
          onClick={onPin}
          className="w-16 flex flex-col items-center justify-center bg-amber-500 text-white gap-1"
        >
          <Pin size={18} />
          <span className="text-[10px]">{isPinned ? '取消' : '置顶'}</span>
        </button>
        <button
          onClick={onDelete}
          className="w-16 flex flex-col items-center justify-center bg-danger-500 text-white gap-1"
        >
          <Trash2 size={18} />
          <span className="text-[10px]">删除</span>
        </button>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: ACTION_WIDTH, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        animate={{ x: swipeOffset }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onOpen}
        className={cn(
          'relative bg-white px-4 py-3.5 flex items-center gap-3',
          'active:bg-gray-50 transition-colors cursor-pointer',
          isPinned && 'bg-primary-50/40',
          swipeOffset < 0 && 'shadow-[-4px_0_20px_rgba(0,0,0,0.1)]'
        )}
      >
        <div className="relative flex-shrink-0">
          <img
            src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt={displayName}
            className={cn(
              'w-12 h-12 rounded-2xl object-cover',
              session.type === 'group' ? 'rounded-xl' : ''
            )}
          />
          {session.unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm"
            >
              {session.unreadCount > 99 ? '99+' : session.unreadCount}
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {session.type === 'group' && session.groupInfo?.isYellowPage && (
                <Badge variant="warning" size="sm" dot>
                  黄页群
                </Badge>
              )}
              <span className="text-sm font-semibold text-ink-700 truncate">
                {displayName}
              </span>
              {session.type === 'group' &&
                session.groupInfo?.memberReputationRank &&
                session.groupInfo.memberReputationRank.length > 0 && (
                  <ReputationRankBadges ranks={session.groupInfo.memberReputationRank} />
                )}
            </div>
            <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
              {formatTime(session.updatedAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] text-gray-500 truncate flex-1 min-w-0">
              {session.lastMessage.readBy.includes(session.lastMessage.senderId) &&
                session.lastMessage.senderId !== 'system' && (
                <CheckCheck size={12} className="inline mr-1 text-primary-500" />
              )}
              {getMessageSummary(session.lastMessage)}
            </p>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isMuted && <VolumeX size={13} className="text-gray-300" />}
              {isPinned && <Pin size={13} className="text-amber-500 fill-amber-500" />}
            </div>
          </div>
        </div>

        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </motion.div>
    </div>
  );
}

export default function MessageList() {
  const navigate = useNavigate();
  const {
    sessions,
    searchSessions,
    togglePinSession,
    toggleMuteSession,
    deleteSession,
    getTotalUnreadCount,
  } = useMessageStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [swipeStates, setSwipeStates] = useState<SwipeActionsState>({});

  const totalUnread = getTotalUnreadCount();

  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (searchKeyword.trim()) {
      result = searchSessions(searchKeyword.trim());
    }

    switch (activeTab) {
      case 'quote':
        result = result.filter(
          (s) =>
            s.lastMessage.type === 'quote' ||
            s._custom?.messages.some((m) => m.type === 'quote')
        );
        break;
      case 'order':
        result = result.filter(
          (s) =>
            s.lastMessage.type === 'order_card' ||
            s._custom?.messages.some((m) => m.type === 'order_card')
        );
        break;
      case 'system':
        return [];
      default:
        break;
    }

    return result.sort((a, b) => {
      const aPinned = a._custom?.isPinned ? 1 : 0;
      const bPinned = b._custom?.isPinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sessions, activeTab, searchKeyword, searchSessions]);

  const pinnedSessions = filteredSessions.filter((s) => s._custom?.isPinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s._custom?.isPinned);

  const handleSwipeChange = (sessionId: string, offset: number) => {
    setSwipeStates((prev) => ({ ...prev, [sessionId]: offset }));
  };

  const findUser = (id: string): User | undefined => {
    return sessions.find(
      (s) => s._custom?.otherUser?.id === id
    )?._custom?.otherUser;
  };

  const renderSystemSection = () => (
    <div className="px-4 py-3">
      <div className="grid grid-cols-2 gap-3">
        {SYSTEM_CATEGORIES.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/message/system/${cat.id}`)}
            className="relative p-4 rounded-2xl bg-white shadow-card border border-gray-50 cursor-pointer overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-[0.08]`}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm`}
                >
                  <cat.icon size={18} className="text-white" />
                </div>
                {cat.unread > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {cat.unread}
                  </motion.div>
                )}
              </div>
              <h4 className="text-sm font-semibold text-ink-700 mb-1">{cat.title}</h4>
              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                {cat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderYellowPageGroups = () => {
    const yellowPageGroups = sessions.filter(
      (s) => s.type === 'group' && s.groupInfo?.isYellowPage
    );
    if (yellowPageGroups.length === 0) return null;

    return (
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="warning" size="sm" dot>
              黄页群推荐
            </Badge>
            <span className="text-[11px] text-gray-400">高信誉商家聚集地</span>
          </div>
          <button className="text-[11px] text-primary-600 font-medium flex items-center gap-0.5">
            查看更多 <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {yellowPageGroups.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isPinned={session._custom?.isPinned}
              onOpen={() => navigate(`/message/chat/${session.id}`)}
              onPin={() => togglePinSession(session.id)}
              onMute={() => toggleMuteSession(session.id)}
              onDelete={() => deleteSession(session.id)}
              swipeOffset={swipeStates[session.id] || 0}
              onSwipeChange={(offset) => handleSwipeChange(session.id, offset)}
              findUser={findUser}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink-800">消息</h1>
              {totalUnread > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="min-w-[20px] h-5 px-1.5 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center"
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </motion.div>
              )}
            </div>
            <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings size={20} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索会话、商家、配件..."
              className="w-full h-11 pl-11 pr-10 rounded-2xl bg-gray-50 border border-transparent text-sm text-ink-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-500/10 transition-all"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-1 p-1 rounded-2xl bg-gray-100/80">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'system' ? (
          <motion.div
            key="system"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pb-24"
          >
            {renderSystemSection()}
          </motion.div>
        ) : (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pb-24"
          >
            {activeTab === 'all' && !searchKeyword && renderYellowPageGroups()}

            {pinnedSessions.length > 0 && (
              <div className="px-4 py-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Pin size={12} className="text-amber-500 fill-amber-500" />
                  <span className="text-[11px] font-medium text-gray-500">
                    置顶会话 ({pinnedSessions.length})
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-card">
                  {pinnedSessions.map((session, idx) => (
                    <div key={session.id} className={idx > 0 ? 'border-t border-gray-50' : ''}>
                      <SessionCard
                        session={session}
                        isPinned
                        onOpen={() => navigate(`/message/chat/${session.id}`)}
                        onPin={() => togglePinSession(session.id)}
                        onMute={() => toggleMuteSession(session.id)}
                        onDelete={() => deleteSession(session.id)}
                        swipeOffset={swipeStates[session.id] || 0}
                        onSwipeChange={(offset) => handleSwipeChange(session.id, offset)}
                        findUser={findUser}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unpinnedSessions.length > 0 && (
              <div className="px-4 py-2">
                {pinnedSessions.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-[11px] font-medium text-gray-500">
                      全部会话 ({unpinnedSessions.length})
                    </span>
                  </div>
                )}
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-card">
                  {unpinnedSessions.map((session, idx) => (
                    <div key={session.id} className={idx > 0 ? 'border-t border-gray-50' : ''}>
                      <SessionCard
                        session={session}
                        isPinned={false}
                        onOpen={() => navigate(`/message/chat/${session.id}`)}
                        onPin={() => togglePinSession(session.id)}
                        onMute={() => toggleMuteSession(session.id)}
                        onDelete={() => deleteSession(session.id)}
                        swipeOffset={swipeStates[session.id] || 0}
                        onSwipeChange={(offset) => handleSwipeChange(session.id, offset)}
                        findUser={findUser}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-8">
                <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                  <MessageCircle size={40} className="text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-ink-600 mb-1">
                  {searchKeyword ? '未找到相关会话' : '暂无消息'}
                </h3>
                <p className="text-sm text-gray-400 text-center">
                  {searchKeyword
                    ? '试试其他关键词搜索吧'
                    : '去发布求购或浏览现货，开启第一笔交易'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
