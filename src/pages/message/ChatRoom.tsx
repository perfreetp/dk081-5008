import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Mic,
  Smile,
  AtSign,
  Zap,
  Plus,
  X,
  ShieldCheck,
  Star,
  Users,
  Phone,
  MoreVertical,
  FileText,
  Package,
  Crown,
  Award,
  Medal,
  Clock,
  Truck,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBubble from '@/components/business/ChatBubble';
import QuickQuoteBar, { QuickQuoteData } from '@/components/business/QuickQuoteBar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { formatPrice, formatWarrantyDays, formatTimeShort } from '@/utils/format';
import {
  useMessageStore,
  ExtendedChatSession,
} from '@/stores/messageStore';
import {
  ChatMessage,
  User,
  QuotePayload,
  PartCardPayload,
  OrderCardPayload,
} from '@/types';
import { currentUser, users } from '@/mock/data';

type RelayStatus = 'intention' | 'confirmed' | 'shipped' | 'received';

interface RelayState {
  status: RelayStatus;
  participants: Array<{ userId: string; userName: string; qty: number }>;
  totalQty: number;
}

const QUOTE_TEMPLATES = [
  {
    id: 't1',
    name: '常用拆车件报价',
    conditionType: 'used' as const,
    warrantyDays: 90,
    shippingFee: 25,
    canShipToday: true,
    remark: '拆车件，品质保证，顺丰包邮',
  },
  {
    id: 't2',
    name: '原厂全新件报价',
    conditionType: 'new' as const,
    warrantyDays: 365,
    shippingFee: 0,
    canShipToday: false,
    remark: '原厂全新件，支持4S验货，质保一年',
  },
  {
    id: 't3',
    name: '再制造件报价',
    conditionType: 'refurbished' as const,
    warrantyDays: 180,
    shippingFee: 15,
    canShipToday: true,
    remark: '专业再制造，媲美新品，性价比高',
  },
];

const EMOJI_LIST = ['😀', '😂', '😍', '🤔', '👍', '👏', '🎉', '🔥', '💯', '🙏', '😊', '😎', '😅', '😭', '🥳', '💪', '✅', '❌', '⭐', '❤️'];

const RELAY_STATUS_LABELS: Record<RelayStatus, { label: string; variant: 'info' | 'primary' | 'warning' | 'success' }> = {
  intention: { label: '接龙意向', variant: 'info' },
  confirmed: { label: '已确认', variant: 'primary' },
  shipped: { label: '已发货', variant: 'warning' },
  received: { label: '已完成', variant: 'success' },
};

export default function ChatRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    getSessionById,
    getMessagesBySession,
    sendMessage,
    markSessionRead,
    fetchMessages,
  } = useMessageStore();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [showQuickQuote, setShowQuickQuote] = useState(false);
  const [showQuoteTemplate, setShowQuoteTemplate] = useState(false);
  const [showRelayPanel, setShowRelayPanel] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [relayState, setRelayState] = useState<RelayState | null>(null);
  const [quoteInitialData, setQuoteInitialData] = useState<Partial<QuickQuoteData> | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mentionSearchRef = useRef('');

  const session = sessionId ? getSessionById(sessionId) : undefined;
  const messages = sessionId ? getMessagesBySession(sessionId) : [];

  const otherUser = session?._custom?.otherUser;
  const isGroup = session?.type === 'group';
  const groupInfo = session?.groupInfo;

  const chatTargetName = isGroup
    ? groupInfo?.name || '群聊'
    : otherUser?.name || '未知用户';

  const chatTargetAvatar = isGroup
    ? groupInfo?.avatar || ''
    : otherUser?.avatar || '';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId);
      markSessionRead(sessionId);
    }
    return () => {};
  }, [sessionId, fetchMessages, markSessionRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockRelay: RelayState = {
        status: 'confirmed',
        participants: [
          { userId: 'u002', userName: '李明', qty: 5 },
          { userId: 'u003', userName: '王芳', qty: 3 },
          { userId: 'u004', userName: '陈强', qty: 8 },
        ],
        totalQty: 16,
      };
      setRelayState(mockRelay);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const groupMembers = useMemo(() => {
    if (!isGroup) return [];
    return users.slice(0, 6).map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
    }));
  }, [isGroup]);

  const findUser = useCallback(
    (userId: string): User | undefined => {
      if (userId === currentUser.id) {
        return {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          role: 'supplier',
          company: currentUser.shopName,
          city: currentUser.address.split('市')[0] + '市',
          verified: currentUser.creditScore > 900,
          certificationBadges: currentUser.creditScore > 950 ? ['金牌商家', '诚信认证'] : ['诚信认证'],
          reputation: {
            totalDeals: currentUser.totalTrades,
            pigeonRate: 0.02,
            wrongShipRate: 0.01,
            positiveRate: Math.min(0.99, currentUser.creditScore / 1000),
            starRating: Math.round((currentUser.creditScore / 200) * 10) / 10,
            quickTags: currentUser.creditScore > 950 ? ['发货快', '货靠谱', '价格公道'] : ['服务好'],
          },
          createdAt: currentUser.createdAt,
        };
      }
      const mockUser = users.find((u) => u.id === userId);
      if (mockUser) {
        return {
          id: mockUser.id,
          name: mockUser.name,
          avatar: mockUser.avatar,
          role: 'supplier',
          company: mockUser.shopName,
          city: mockUser.address.split('市')[0] + '市',
          verified: mockUser.creditScore > 900,
          certificationBadges: mockUser.creditScore > 950 ? ['金牌商家', '诚信认证'] : ['诚信认证'],
          reputation: {
            totalDeals: mockUser.totalTrades,
            pigeonRate: 0.02,
            wrongShipRate: 0.01,
            positiveRate: Math.min(0.99, mockUser.creditScore / 1000),
            starRating: Math.round((mockUser.creditScore / 200) * 10) / 10,
            quickTags: mockUser.creditScore > 950 ? ['发货快', '货靠谱', '价格公道'] : ['服务好'],
          },
          createdAt: mockUser.createdAt,
        };
      }
      return undefined;
    },
    []
  );

  const handleSendText = () => {
    if (!inputText.trim() || !sessionId) return;
    sendMessage(sessionId, currentUser.id, 'text', inputText.trim());
    setInputText('');
    inputRef.current?.focus();
  };

  const handleSendQuote = (data: QuickQuoteData) => {
    if (!sessionId) return;
    const payload: QuotePayload = {
      urgentPostId: 'urg_' + Date.now(),
      price: data.price,
      shippingFee: data.shippingFee,
      canShipToday: data.canShipToday,
    };
    sendMessage(
      sessionId,
      currentUser.id,
      'quote',
      `${data.carModel || '配件'}报价: ${formatPrice(data.price + data.shippingFee)}`,
      payload
    );
    setShowQuickQuote(false);
    scrollToBottom();
  };

  const handleSendPartCard = () => {
    if (!sessionId) return;
    const payload: PartCardPayload = {
      stockId: 'stk_' + Date.now(),
      partName: '宝马5系 G38 前大灯总成 左侧',
      price: 4800,
      supplierName: '诚信汽配旗舰店',
    };
    sendMessage(
      sessionId,
      currentUser.id,
      'part_card',
      '推荐配件: ' + payload.partName,
      payload
    );
    setShowMoreMenu(false);
    scrollToBottom();
  };

  const handleSendImage = () => {
    if (!sessionId) return;
    const sampleImages = [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
    ];
    sendMessage(
      sessionId,
      currentUser.id,
      'image',
      sampleImages[Math.floor(Math.random() * sampleImages.length)]
    );
    setShowMoreMenu(false);
    scrollToBottom();
  };

  const handleSendVoice = () => {
    if (!sessionId) return;
    const duration = Math.floor(Math.random() * 20) + 3;
    sendMessage(sessionId, currentUser.id, 'voice', String(duration));
    scrollToBottom();
  };

  const insertEmoji = (emoji: string) => {
    const textarea = inputRef.current;
    if (!textarea) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = inputText.slice(0, start) + emoji + inputText.slice(end);
    setInputText(newValue);
    setShowEmojiPicker(false);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const insertMention = (userName: string) => {
    const textarea = inputRef.current;
    if (!textarea) {
      setInputText((prev) => prev + `@${userName} `);
      return;
    }
    const atIndex = inputText.lastIndexOf('@', textarea.selectionStart);
    if (atIndex !== -1) {
      const newValue =
        inputText.slice(0, atIndex) + `@${userName} ` + inputText.slice(textarea.selectionStart);
      setInputText(newValue);
    }
    setShowMentionList(false);
    mentionSearchRef.current = '';
    setTimeout(() => textarea.focus(), 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([\u4e00-\u9fa5a-zA-Z0-9_]*)$/);

    if (atMatch && isGroup) {
      mentionSearchRef.current = atMatch[1];
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const applyQuoteTemplate = (templateId: string) => {
    const template = QUOTE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setQuoteInitialData({
        conditionType: template.conditionType,
        warrantyDays: template.warrantyDays,
        shippingFee: template.shippingFee,
        canShipToday: template.canShipToday,
        remark: template.remark,
      });
      setShowQuoteTemplate(false);
      setShowQuickQuote(true);
    }
  };

  const filteredMentionUsers = useMemo(() => {
    const search = mentionSearchRef.current.toLowerCase();
    return groupMembers.filter((m) =>
      search ? m.name.toLowerCase().includes(search) : true
    );
  }, [groupMembers]);

  const renderHeader = () => (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={22} />
          </motion.button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <img
                src={chatTargetAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={chatTargetName}
                className={cn(
                  'w-10 h-10 object-cover',
                  isGroup ? 'rounded-xl' : 'rounded-full'
                )}
              />
              {!isGroup && otherUser?.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
                  <ShieldCheck size={9} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-base font-semibold text-ink-800 truncate">
                  {chatTargetName}
                </h2>
                {!isGroup && otherUser?.reputation?.starRating >= 4.5 && (
                  <Badge variant="reputation-high" size="sm" dot>
                    金牌
                  </Badge>
                )}
                {isGroup && groupInfo?.isYellowPage && (
                  <Badge variant="warning" size="sm" dot>
                    黄页群
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {!isGroup && otherUser && (
                  <>
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[11px] text-amber-600 font-medium">
                        {otherUser.reputation?.starRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      · {otherUser.reputation?.totalDeals}笔成交
                    </span>
                    <span className="text-[11px] text-success-600 font-medium">
                      · {((otherUser.reputation?.positiveRate || 0) * 100).toFixed(0)}%好评
                    </span>
                  </>
                )}
                {isGroup && groupInfo && (
                  <>
                    <Users size={11} className="text-gray-400" />
                    <span className="text-[11px] text-gray-500">
                      {groupInfo.memberCount}人
                    </span>
                    {groupInfo.memberReputationRank && groupInfo.memberReputationRank.length > 0 && (
                      <div className="flex -space-x-1 ml-1">
                        {groupInfo.memberReputationRank.slice(0, 3).map((rank, idx) => {
                          const icons = [Crown, Medal, Award];
                          const bgs = [
                            'from-amber-400 to-yellow-500',
                            'from-gray-300 to-gray-400',
                            'from-orange-400 to-amber-600',
                          ];
                          const Icon = icons[idx];
                          return (
                            <div
                              key={rank.userId}
                              className={`w-4 h-4 rounded-full bg-gradient-to-br ${bgs[idx]} flex items-center justify-center ring-1 ring-white`}
                            >
                              <Icon size={8} className="text-white" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
            <Phone size={20} />
          </button>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors relative"
          >
            <MoreVertical size={20} />
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-12 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  {[
                    { icon: Package, label: '发送配件卡片', onClick: handleSendPartCard },
                    { icon: ImageIcon, label: '发送图片', onClick: handleSendImage },
                    { icon: FileText, label: '查看订单', onClick: () => {} },
                    { icon: Users, label: '发起接龙', onClick: () => { setShowRelayPanel(true); setShowMoreMenu(false); } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm text-ink-700 hover:bg-gray-50 transition-colors"
                    >
                      <item.icon size={16} className="text-gray-400" />
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRelayStatus = () => {
    if (!relayState || !isGroup) return null;
    const statusInfo = RELAY_STATUS_LABELS[relayState.status];

    return (
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        className="mx-4 my-2"
      >
        <Card variant="outlined" padding="none" className="overflow-hidden">
          <div
            className="px-4 py-3 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-gray-100 flex items-center justify-between"
            onClick={() => setShowRelayPanel(true)}
          >
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant} size="md">
                {statusInfo.label}
              </Badge>
              <span className="text-sm font-semibold text-ink-700">
                配件拼单接龙 · 已有{relayState.participants.length}人参与
              </span>
            </div>
            <div className="text-sm font-bold text-accent-600">
              共{relayState.totalQty}件
            </div>
          </div>
          <div className="px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            {relayState.participants.map((p, idx) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 bg-gray-50 rounded-lg"
              >
                <img
                  src={users.find((u) => u.id === p.userId)?.avatar}
                  alt={p.userName}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-xs text-ink-600 truncate max-w-[60px]">
                  {p.userName}
                </span>
                <span className="text-xs font-semibold text-accent-600">
                  ×{p.qty}
                </span>
              </motion.div>
            ))}
            <button
              onClick={() => setShowRelayPanel(true)}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center"
            >
              <Plus size={12} />
            </button>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg, idx) => {
        const isOwn = msg.senderId === currentUser.id;
        const sender = msg.senderId === 'system' ? undefined : findUser(msg.senderId);

        return (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={isOwn}
            sender={sender}
            index={idx}
            onGuarantee={(p) => console.log('担保下单', p)}
            onViewOrder={(p) => console.log('查看订单', p)}
            onViewQuote={(p) => console.log('查看报价', p)}
            onImageClick={(url) => console.log('图片', url)}
            onMentionClick={(name) => console.log('@', name)}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderInputBar = () => (
    <div className="sticky bottom-0 z-20 bg-white border-t border-gray-100">
      {renderRelayStatus()}

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-50 px-4 py-3"
          >
            <div className="grid grid-cols-10 gap-2">
              {EMOJI_LIST.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 1.3 }}
                  onClick={() => insertEmoji(emoji)}
                  className="w-full aspect-square text-2xl flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMentionList && filteredMentionUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="border-t border-gray-50 px-2 py-2 max-h-48 overflow-y-auto"
          >
            {filteredMentionUsers.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                onClick={() => insertMention(user.name)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-ink-700 font-medium">{user.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-3">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowMentionList(false);
              }}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                showEmojiPicker
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <Smile size={22} />
            </motion.button>

            {isGroup && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setInputText((prev) => prev + '@');
                  inputRef.current?.focus();
                  setShowMentionList(true);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <AtSign size={22} />
              </motion.button>
            )}
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder="输入消息... (Enter发送)"
              rows={1}
              className="w-full min-h-[44px] max-h-[120px] px-4 py-2.5 rounded-2xl bg-gray-50 border border-transparent text-[15px] text-ink-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-500/10 transition-all resize-none leading-relaxed"
              style={{
                height: 'auto',
              }}
            />
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {!inputText.trim() ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendVoice}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Mic size={22} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSendImage}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon size={22} />
                </motion.button>
              </>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSendText}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary-500/30 hover:shadow-md hover:shadow-primary-500/40 transition-shadow"
              >
                <Send size={20} />
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowQuickQuote(!showQuickQuote);
              setQuoteInitialData(undefined);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
              showQuickQuote
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-sm shadow-accent-500/30'
                : 'bg-accent-50 text-accent-600 hover:bg-accent-100'
            )}
          >
            <Zap size={16} />
            快速报价
          </motion.button>

          <div className="text-[11px] text-gray-400">
            {formatTimeShort(new Date().toISOString())}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQuickQuote && (
          <QuickQuoteBar
            defaultExpanded
            initialData={quoteInitialData}
            onSendQuote={handleSendQuote}
            onOpenTemplate={() => setShowQuoteTemplate(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const renderQuoteTemplateModal = () => (
    <AnimatePresence>
      {showQuoteTemplate && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowQuoteTemplate(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[70vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-ink-800">报价模板</h3>
              <button
                onClick={() => setShowQuoteTemplate(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[55vh]">
              {QUOTE_TEMPLATES.map((tpl, idx) => (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyQuoteTemplate(tpl.id)}
                >
                  <Card variant="outlined" padding="md" clickable className="hover:border-primary-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                          <FileText size={18} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-ink-700">{tpl.name}</h4>
                          <div className="text-[11px] text-gray-400">一键应用预设参数</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-400 mb-0.5">成色</div>
                        <div className="text-xs font-semibold text-ink-700">
                          {tpl.conditionType === 'new' ? '全新件' : tpl.conditionType === 'used' ? '拆车件' : '再制造'}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-400 mb-0.5">质保</div>
                        <div className="text-xs font-semibold text-ink-700">
                          {formatWarrantyDays(tpl.warrantyDays)}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-400 mb-0.5">运费</div>
                        <div className="text-xs font-semibold text-ink-700">
                          {tpl.shippingFee === 0 ? '包邮' : formatPrice(tpl.shippingFee)}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50">
                        <div className="text-[10px] text-gray-400 mb-0.5">发货</div>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          {tpl.canShipToday ? (
                            <>
                              <Truck size={11} className="text-success-500" />
                              <span className="text-success-600">当天发货</span>
                            </>
                          ) : (
                            <>
                              <Clock size={11} className="text-gray-500" />
                              <span className="text-ink-600">1-2天</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-primary-50/50">
                      <p className="text-[11px] text-primary-700 leading-relaxed">
                        "{tpl.remark}"
                      </p>
                    </div>

                    <Button variant="primary" size="sm" block className="mt-3">
                      使用此模板
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderRelayPanelModal = () => (
    <AnimatePresence>
      {showRelayPanel && relayState && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowRelayPanel(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Badge variant={RELAY_STATUS_LABELS[relayState.status].variant} size="md">
                  {RELAY_STATUS_LABELS[relayState.status].label}
                </Badge>
                <h3 className="text-lg font-bold text-ink-800">配件拼单接龙</h3>
              </div>
              <button
                onClick={() => setShowRelayPanel(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[65vh]">
              <Card variant="elevated" padding="md" className="mb-4">
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200"
                    alt="配件"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-ink-700 mb-1 line-clamp-2">
                      宝马5系 G38 前大灯总成 左侧 LED随动
                    </h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-accent-600">¥4,500</span>
                      <span className="text-xs text-gray-400">/件</span>
                      <span className="text-[11px] text-success-600 font-medium ml-auto bg-success-50 px-2 py-0.5 rounded-full">
                        满20件享9折
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {relayState.participants.length}
                    </div>
                    <div className="text-[11px] text-gray-500">参与人数</div>
                  </div>
                  <div className="text-center border-x border-white/50">
                    <div className="text-2xl font-bold text-accent-600">
                      {relayState.totalQty}
                    </div>
                    <div className="text-[11px] text-gray-500">累计件数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      20
                    </div>
                    <div className="text-[11px] text-gray-500">目标件数</div>
                  </div>
                </div>
              </Card>

              <div className="mb-4">
                <h5 className="text-sm font-semibold text-ink-700 mb-2.5">参与名单</h5>
                <div className="space-y-2">
                  {relayState.participants.map((p, idx) => {
                    const user = users.find((u) => u.id === p.userId);
                    const iconComponents = [Crown, Medal, Award];
                    const RankIcon = iconComponents[idx];
                    return (
                      <motion.div
                        key={p.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={user?.avatar}
                              alt={p.userName}
                              className="w-10 h-10 rounded-full"
                            />
                            {idx < 3 && RankIcon && (
                              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br ${
                                idx === 0 ? 'from-amber-400 to-yellow-500' :
                                idx === 1 ? 'from-gray-300 to-gray-400' :
                                'from-orange-400 to-amber-600'
                              } flex items-center justify-center ring-2 ring-white shadow-sm`}>
                                <RankIcon size={10} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-ink-700">{p.userName}</div>
                            <div className="text-[11px] text-gray-400">
                              {user?.shopName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">数量</span>
                          <span className="text-base font-bold text-accent-600">{p.qty}</span>
                          <span className="text-xs text-gray-400">件</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg">
                  查看详情
                </Button>
                <Button variant="primary" size="lg" leftIcon={<Plus size={18} />}>
                  我要参与
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {renderHeader()}
      {renderMessages()}
      {renderInputBar()}
      {renderQuoteTemplateModal()}
      {renderRelayPanelModal()}
    </div>
  );
}
