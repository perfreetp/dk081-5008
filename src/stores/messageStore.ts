import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ChatSession,
  ChatMessage,
  User,
  GroupInfo,
  QuotePayload,
  PartCardPayload,
  OrderCardPayload,
} from '../types';
import { chatSessions, users, currentUser } from '../mock/data';

const findUser = (userId: string): User => {
  const user = users.find((u) => u.id === userId) || currentUser;
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    role: 'supplier',
    company: user.shopName,
    city: user.address.split('市')[0] + '市',
    verified: user.creditScore > 900,
    certificationBadges: user.creditScore > 950 ? ['金牌商家', '诚信认证'] : ['诚信认证'],
    reputation: {
      totalDeals: user.totalTrades,
      pigeonRate: 0.02,
      wrongShipRate: 0.01,
      positiveRate: Math.min(0.99, user.creditScore / 1000),
      starRating: Math.round((user.creditScore / 200) * 10) / 10,
      quickTags: user.creditScore > 950 ? ['发货快', '货靠谱', '价格公道'] : ['服务好'],
    },
    createdAt: user.createdAt,
  };
};

const getCurrentUserId = () => currentUser.id;

const transformMessages = (
  sessionId: string,
  messages: typeof chatSessions[0]['messages']
): ChatMessage[] => {
  return messages.map((msg) => ({
    id: msg.id,
    sessionId,
    senderId: msg.senderId,
    type: msg.type as ChatMessage['type'],
    content: msg.content,
    payload: undefined,
    timestamp: msg.createdAt,
    readBy: msg.isRead ? [msg.senderId] : [],
  }));
};

const transformSessions = (): ChatSession[] => {
  const currentId = getCurrentUserId();
  return chatSessions.map((session) => {
    const otherUserId = session.user1Id === currentId ? session.user2Id : session.user1Id;
    const otherUser = findUser(otherUserId);
    const messages = transformMessages(session.id, session.messages);
    const lastMsg = messages[messages.length - 1];
    return {
      id: session.id,
      type: 'private',
      participants: [session.user1Id, session.user2Id],
      lastMessage: lastMsg || {
        id: 'sys_' + session.id,
        sessionId: session.id,
        senderId: 'system',
        type: 'system',
        content: session.lastMessage,
        timestamp: session.lastMessageTime,
        readBy: [],
      },
      unreadCount: session.unreadCount,
      groupInfo: undefined,
      updatedAt: session.lastMessageTime,
      _custom: {
        otherUser,
        isMuted: session.isMuted,
        isPinned: session.isPinned,
        messages,
      },
    } as ChatSession & {
      _custom: {
        otherUser: User;
        isMuted: boolean;
        isPinned: boolean;
        messages: ChatMessage[];
      };
    };
  });
};

export interface ExtendedChatSession extends ChatSession {
  _custom?: {
    otherUser: User;
    isMuted: boolean;
    isPinned: boolean;
    messages: ChatMessage[];
  };
  groupInfo?: GroupInfo;
}

export const isExtendedSession = (s: ChatSession): s is ExtendedChatSession => {
  return '_custom' in s;
};

interface MessageStoreState {
  sessions: ExtendedChatSession[];
  messagesMap: Record<string, ChatMessage[]>;
  selectedSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  getSessionById: (id: string) => ExtendedChatSession | undefined;
  getSessionByParticipants: (userIds: string[]) => ExtendedChatSession | undefined;
  getPinnedSessions: () => ExtendedChatSession[];
  getUnpinnedSessions: () => ExtendedChatSession[];
  getTotalUnreadCount: () => number;

  createSession: (participants: string[], type?: 'private' | 'group', groupInfo?: Partial<GroupInfo>) => ExtendedChatSession;
  createSessionByParticipants: (userIds: string[]) => ExtendedChatSession;
  updateSession: (sessionId: string, data: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => void;
  togglePinSession: (sessionId: string) => void;
  toggleMuteSession: (sessionId: string) => void;
  markSessionRead: (sessionId: string) => void;
  markAllSessionsRead: () => void;

  fetchMessages: (sessionId: string) => Promise<void>;
  getMessagesBySession: (sessionId: string) => ChatMessage[];
  getUnreadMessagesBySession: (sessionId: string, userId: string) => ChatMessage[];
  getLastMessage: (sessionId: string) => ChatMessage | undefined;

  sendMessage: (
    sessionId: string,
    senderId: string,
    type: ChatMessage['type'],
    content: string,
    payload?: QuotePayload | PartCardPayload | OrderCardPayload
  ) => ChatMessage | null;
  updateMessage: (messageId: string, data: Partial<ChatMessage>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  recallMessage: (sessionId: string, messageId: string, operatorId: string) => void;
  markMessageRead: (sessionId: string, messageId: string, userId: string) => void;

  searchMessages: (keyword: string) => Array<{ session: ExtendedChatSession; message: ChatMessage }>;
  searchSessions: (keyword: string) => ExtendedChatSession[];

  setSelectedSessionId: (sessionId: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  resetStore: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 13);

const buildInitialSessions = (): ExtendedChatSession[] => {
  return transformSessions() as ExtendedChatSession[];
};

const buildMessagesMap = (sessions: ExtendedChatSession[]): Record<string, ChatMessage[]> => {
  const map: Record<string, ChatMessage[]> = {};
  sessions.forEach((s) => {
    if (s._custom) {
      map[s.id] = s._custom.messages;
    }
  });
  return map;
};

const initialSessions = buildInitialSessions();
const initialMessagesMap = buildMessagesMap(initialSessions);

export const useMessageStore = create<MessageStoreState>()(
  persist(
    (set, get) => ({
      sessions: initialSessions,
      messagesMap: initialMessagesMap,
      selectedSessionId: null,
      isLoading: false,
      error: null,

      fetchSessions: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取会话列表失败',
          });
        }
      },

      getSessionById: (id) => {
        return get().sessions.find((s) => s.id === id);
      },

      getSessionByParticipants: (userIds) => {
        const sortedIds = [...userIds].sort();
        return get().sessions.find((s) => {
          const sortedParticipants = [...s.participants].sort();
          return (
            sortedIds.length === sortedParticipants.length &&
            sortedIds.every((id, i) => id === sortedParticipants[i])
          );
        });
      },

      getPinnedSessions: () => {
        return get()
          .sessions.filter((s) => s._custom?.isPinned)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getUnpinnedSessions: () => {
        return get()
          .sessions.filter((s) => !s._custom?.isPinned)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      getTotalUnreadCount: () => {
        return get().sessions.reduce((sum, s) => sum + s.unreadCount, 0);
      },

      createSession: (participants, type = 'private', groupInfo) => {
        const existing = get().getSessionByParticipants(participants);
        if (existing) return existing;

        const newId = 'cs_' + generateId();
        const now = new Date().toISOString();
        const otherUserId = participants.find((id) => id !== getCurrentUserId()) || participants[0];
        const otherUser = findUser(otherUserId);

        let finalGroupInfo: GroupInfo | undefined;
        if (type === 'group' && groupInfo) {
          finalGroupInfo = {
            name: groupInfo.name || '群聊',
            avatar: groupInfo.avatar || '',
            ownerId: groupInfo.ownerId || getCurrentUserId(),
            memberCount: groupInfo.memberCount || participants.length,
            isYellowPage: groupInfo.isYellowPage || false,
            memberReputationRank: groupInfo.memberReputationRank,
          };
        }

        const systemMessage: ChatMessage = {
          id: 'sys_' + newId,
          sessionId: newId,
          senderId: 'system',
          type: 'system',
          content: type === 'group' ? '群聊已创建' : '会话已创建，可以开始聊天了',
          timestamp: now,
          readBy: [],
        };

        const newSession: ExtendedChatSession = {
          id: newId,
          type,
          participants,
          lastMessage: systemMessage,
          unreadCount: 0,
          groupInfo: finalGroupInfo,
          updatedAt: now,
          _custom: {
            otherUser,
            isMuted: false,
            isPinned: false,
            messages: [systemMessage],
          },
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          messagesMap: {
            ...state.messagesMap,
            [newId]: [systemMessage],
          },
        }));

        return newSession;
      },

      createSessionByParticipants: (userIds) => {
        return get().createSession(userIds, 'private');
      },

      updateSession: (sessionId, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...data } : s
          ),
        }));
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const newMessagesMap = { ...state.messagesMap };
          delete newMessagesMap[sessionId];
          return {
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            messagesMap: newMessagesMap,
            selectedSessionId: state.selectedSessionId === sessionId ? null : state.selectedSessionId,
          };
        });
      },

      togglePinSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId && s._custom) {
              return {
                ...s,
                _custom: { ...s._custom, isPinned: !s._custom.isPinned },
              };
            }
            return s;
          }),
        }));
      },

      toggleMuteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId && s._custom) {
              return {
                ...s,
                _custom: { ...s._custom, isMuted: !s._custom.isMuted },
              };
            }
            return s;
          }),
        }));
      },

      markSessionRead: (sessionId) => {
        const currentId = getCurrentUserId();
        set((state) => {
          const session = state.sessions.find((s) => s.id === sessionId);
          if (!session) return state;

          const msgs = state.messagesMap[sessionId] || [];
          const updatedMsgs = msgs.map((m) => {
            if (m.senderId !== currentId && !m.readBy.includes(currentId)) {
              return { ...m, readBy: [...m.readBy, currentId] };
            }
            return m;
          });

          return {
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, unreadCount: 0 } : s
            ),
            messagesMap: {
              ...state.messagesMap,
              [sessionId]: updatedMsgs,
            },
          };
        });
      },

      markAllSessionsRead: () => {
        const currentId = getCurrentUserId();
        set((state) => {
          const newMessagesMap = { ...state.messagesMap };
          Object.keys(newMessagesMap).forEach((sid) => {
            newMessagesMap[sid] = newMessagesMap[sid].map((m) => {
              if (m.senderId !== currentId && !m.readBy.includes(currentId)) {
                return { ...m, readBy: [...m.readBy, currentId] };
              }
              return m;
            });
          });

          return {
            sessions: state.sessions.map((s) => ({ ...s, unreadCount: 0 })),
            messagesMap: newMessagesMap,
          };
        });
      },

      fetchMessages: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取消息失败',
          });
        }
      },

      getMessagesBySession: (sessionId) => {
        return get().messagesMap[sessionId] || [];
      },

      getUnreadMessagesBySession: (sessionId, userId) => {
        return get()
          .getMessagesBySession(sessionId)
          .filter((m) => m.senderId !== userId && !m.readBy.includes(userId));
      },

      getLastMessage: (sessionId) => {
        const msgs = get().getMessagesBySession(sessionId);
        return msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      },

      sendMessage: (sessionId, senderId, type, content, payload) => {
        const session = get().getSessionById(sessionId);
        if (!session) return null;

        const newMsg: ChatMessage = {
          id: 'm_' + generateId(),
          sessionId,
          senderId,
          type,
          content,
          payload,
          timestamp: new Date().toISOString(),
          readBy: [senderId],
        };

        set((state) => {
          const currentMsgs = state.messagesMap[sessionId] || [];
          const updatedMsgs = [...currentMsgs, newMsg];

          const updatedSessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              let unreadIncrement = 0;
              if (senderId !== getCurrentUserId()) {
                unreadIncrement = 1;
              }
              return {
                ...s,
                lastMessage: newMsg,
                unreadCount: s.unreadCount + unreadIncrement,
                updatedAt: newMsg.timestamp,
                _custom: s._custom
                  ? { ...s._custom, messages: updatedMsgs }
                  : s._custom,
              };
            }
            return s;
          });

          updatedSessions.sort((a, b) => {
            const aPinned = a._custom?.isPinned ? 1 : 0;
            const bPinned = b._custom?.isPinned ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });

          return {
            sessions: updatedSessions,
            messagesMap: {
              ...state.messagesMap,
              [sessionId]: updatedMsgs,
            },
          };
        });

        return newMsg;
      },

      updateMessage: (messageId, data) => {
        set((state) => {
          const newMessagesMap = { ...state.messagesMap };
          let sessionId = '';
          Object.keys(newMessagesMap).forEach((sid) => {
            const idx = newMessagesMap[sid].findIndex((m) => m.id === messageId);
            if (idx !== -1) {
              sessionId = sid;
              newMessagesMap[sid] = newMessagesMap[sid].map((m) =>
                m.id === messageId ? { ...m, ...data } : m
              );
            }
          });

          if (!sessionId) return state;

          const msgs = newMessagesMap[sessionId];
          const lastMsg = msgs[msgs.length - 1];
          const updatedSessions = state.sessions.map((s) =>
            s.id === sessionId && lastMsg ? { ...s, lastMessage: lastMsg } : s
          );

          return {
            sessions: updatedSessions,
            messagesMap: newMessagesMap,
          };
        });
      },

      deleteMessage: (sessionId, messageId) => {
        set((state) => {
          const currentMsgs = state.messagesMap[sessionId] || [];
          const updatedMsgs = currentMsgs.filter((m) => m.id !== messageId);
          const lastMsg = updatedMsgs[updatedMsgs.length - 1];

          return {
            sessions: state.sessions.map((s) =>
              s.id === sessionId && lastMsg
                ? {
                    ...s,
                    lastMessage: lastMsg,
                    _custom: s._custom
                      ? { ...s._custom, messages: updatedMsgs }
                      : s._custom,
                  }
                : s
            ),
            messagesMap: {
              ...state.messagesMap,
              [sessionId]: updatedMsgs,
            },
          };
        });
      },

      recallMessage: (sessionId, messageId, operatorId) => {
        const session = get().getSessionById(sessionId);
        if (!session) return;

        const msg = get().getMessagesBySession(sessionId).find((m) => m.id === messageId);
        if (!msg) return;

        const canRecall =
          msg.senderId === operatorId ||
          (session.groupInfo && session.groupInfo.ownerId === operatorId);

        if (!canRecall) return;

        get().updateMessage(messageId, {
          type: 'system',
          content: msg.senderId === operatorId ? '你撤回了一条消息' : `${findUser(msg.senderId).name}撤回了一条消息`,
          payload: undefined,
        });
      },

      markMessageRead: (sessionId, messageId, userId) => {
        set((state) => {
          const currentMsgs = state.messagesMap[sessionId] || [];
          const updatedMsgs = currentMsgs.map((m) => {
            if (m.id === messageId && !m.readBy.includes(userId)) {
              return { ...m, readBy: [...m.readBy, userId] };
            }
            return m;
          });
          return {
            messagesMap: {
              ...state.messagesMap,
              [sessionId]: updatedMsgs,
            },
          };
        });
      },

      searchMessages: (keyword) => {
        const kw = keyword.toLowerCase();
        const results: Array<{ session: ExtendedChatSession; message: ChatMessage }> = [];
        const { sessions, messagesMap } = get();

        Object.entries(messagesMap).forEach(([sid, msgs]) => {
          const session = sessions.find((s) => s.id === sid);
          if (!session) return;
          msgs.forEach((m) => {
            if (
              m.type === 'text' &&
              m.content.toLowerCase().includes(kw)
            ) {
              results.push({ session, message: m });
            }
          });
        });

        results.sort(
          (a, b) => new Date(b.message.timestamp).getTime() - new Date(a.message.timestamp).getTime()
        );
        return results;
      },

      searchSessions: (keyword) => {
        const kw = keyword.toLowerCase();
        return get().sessions.filter((s) => {
          if (s.type === 'group' && s.groupInfo) {
            return s.groupInfo.name.toLowerCase().includes(kw);
          }
          if (s._custom?.otherUser) {
            return (
              s._custom.otherUser.name.toLowerCase().includes(kw) ||
              s._custom.otherUser.company.toLowerCase().includes(kw)
            );
          }
          return false;
        });
      },

      setSelectedSessionId: (sessionId) => {
        if (sessionId) {
          get().markSessionRead(sessionId);
        }
        set({ selectedSessionId: sessionId });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      resetStore: () => {
        set({
          sessions: initialSessions,
          messagesMap: initialMessagesMap,
          selectedSessionId: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'message-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        messagesMap: state.messagesMap,
      }),
    }
  )
);

export default useMessageStore;
