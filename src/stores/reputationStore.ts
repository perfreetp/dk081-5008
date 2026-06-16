import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Reputation } from '../types';
import { users } from '../mock/data';

export interface ReputationEvaluation {
  id: string;
  evaluatorId: string;
  evaluator: User;
  targetUserId: string;
  orderId?: string;
  rating: number;
  tags: string[];
  content: string;
  images: string[];
  createdAt: string;
}

export interface PeerProfile {
  userId: string;
  user: User;
  quickTags: string[];
  dealCount: number;
  lastDealAt?: string;
  note?: string;
  isBlocked: boolean;
  addedAt: string;
}

export interface QuickListEntry {
  id: string;
  userId: string;
  user: User;
  category: 'supplier' | 'buyer' | 'dismantler' | 'logistics' | string;
  tags: string[];
  remark: string;
  addedAt: string;
}

const transformUser = (u: typeof users[0]): User => {
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    role: 'supplier',
    company: u.shopName,
    city: u.address.split('市')[0] + '市',
    verified: u.creditScore > 900,
    certificationBadges: u.creditScore > 950 ? ['金牌商家', '诚信认证'] : ['诚信认证'],
    reputation: {
      totalDeals: u.totalTrades,
      pigeonRate: 0.02,
      wrongShipRate: 0.01,
      positiveRate: Math.min(0.99, u.creditScore / 1000),
      starRating: Math.round((u.creditScore / 200) * 10) / 10,
      quickTags: u.creditScore > 950 ? ['发货快', '货靠谱', '价格公道'] : ['服务好'],
    },
    createdAt: u.createdAt,
  };
};

const transformedUsers = users.map(transformUser);

const generatePeerProfiles = (): PeerProfile[] => {
  return transformedUsers.slice(1).map((user, index) => ({
    userId: user.id,
    user,
    quickTags: user.reputation.quickTags,
    dealCount: Math.floor(Math.random() * 50) + 1,
    lastDealAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    note: index === 0 ? '长期合作伙伴，货源稳定' : index === 1 ? '价格有优势，发货速度快' : undefined,
    isBlocked: false,
    addedAt: new Date(Date.now() - (index + 10) * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateQuickList = (): QuickListEntry[] => {
  return transformedUsers.slice(1, 5).map((user, index) => ({
    id: 'ql_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    user,
    category: ['supplier', 'supplier', 'dismantler', 'supplier'][index] || 'supplier',
    tags: [
      index === 0 ? '原厂件' : index === 1 ? '拆车件' : index === 2 ? '性价比高' : '发货快',
      'VIP客户',
    ],
    remark: index === 0 ? '德系原厂件专家' : index === 1 ? '日系拆车件大全' : index === 2 ? '专业拆解厂' : '轮胎批发',
    addedAt: new Date(Date.now() - (index + 5) * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateEvaluations = (): ReputationEvaluation[] => {
  const evaluatorPool = transformedUsers;
  return transformedUsers.slice(1, 4).flatMap((targetUser, ti) =>
    Array.from({ length: 3 }, (_, ei) => {
      const evaluator = evaluatorPool[(ti + ei + 2) % evaluatorPool.length];
      return {
        id: 'ev_' + Math.random().toString(36).substring(2, 10),
        evaluatorId: evaluator.id,
        evaluator,
        targetUserId: targetUser.id,
        orderId: 'go00' + (ti * 3 + ei + 1),
        rating: [5, 5, 4, 5, 4, 5, 5, 4, 5][ti * 3 + ei] || 5,
        tags:
          ei === 0
            ? ['发货迅速', '包装完好']
            : ei === 1
              ? ['配件质量好', '沟通顺畅']
              : ['价格合理', '售后服务好'],
        content:
          ei === 0
            ? '卖家发货速度很快，配件包装很好，没有损坏，安装后一切正常，非常满意！'
            : ei === 1
              ? '拆车件质量超出预期，成色很好，卖家沟通也很耐心，下次还会合作。'
              : '价格公道，比4S店便宜很多，质保也有保障，推荐给大家。',
        images: [],
        createdAt: new Date(Date.now() - (ti * 3 + ei + 1) * 24 * 60 * 60 * 1000).toISOString(),
      };
    })
  );
};

interface ReputationStoreState {
  users: User[];
  peerProfiles: PeerProfile[];
  quickList: QuickListEntry[];
  evaluations: ReputationEvaluation[];
  selectedUser: User | null;
  selectedPeerProfile: PeerProfile | null;
  isLoading: boolean;
  error: string | null;

  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  searchUsers: (keyword: string) => User[];
  getUserReputation: (userId: string) => Reputation | undefined;

  fetchPeerProfiles: () => Promise<void>;
  getPeerProfileByUserId: (userId: string) => PeerProfile | undefined;
  addPeerProfile: (userId: string, data?: Partial<PeerProfile>) => PeerProfile | null;
  updatePeerProfile: (userId: string, data: Partial<PeerProfile>) => void;
  removePeerProfile: (userId: string) => void;
  toggleBlockPeer: (userId: string) => void;
  setPeerNote: (userId: string, note: string) => void;

  fetchQuickList: () => Promise<void>;
  getQuickListByCategory: (category: string) => QuickListEntry[];
  addQuickListEntry: (data: Omit<QuickListEntry, 'id' | 'addedAt' | 'user'> & { userId: string }) => QuickListEntry | null;
  updateQuickListEntry: (id: string, data: Partial<QuickListEntry>) => void;
  removeQuickListEntry: (id: string) => void;

  fetchEvaluations: () => Promise<void>;
  getEvaluationsByUser: (userId: string) => ReputationEvaluation[];
  addEvaluation: (data: Omit<ReputationEvaluation, 'id' | 'evaluator' | 'createdAt'> & { evaluatorId: string }) => ReputationEvaluation | null;
  deleteEvaluation: (evaluationId: string) => void;
  getAverageRating: (userId: string) => number;

  setSelectedUser: (user: User | null) => void;
  setSelectedPeerProfile: (profile: PeerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  resetStore: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialPeerProfiles = generatePeerProfiles();
const initialQuickList = generateQuickList();
const initialEvaluations = generateEvaluations();

export const useReputationStore = create<ReputationStoreState>()(
  persist(
    (set, get) => ({
      users: transformedUsers,
      peerProfiles: initialPeerProfiles,
      quickList: initialQuickList,
      evaluations: initialEvaluations,
      selectedUser: null,
      selectedPeerProfile: null,
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取用户列表失败',
          });
        }
      },

      getUserById: (id) => {
        return get().users.find((u) => u.id === id);
      },

      searchUsers: (keyword) => {
        const kw = keyword.toLowerCase();
        return get().users.filter(
          (u) =>
            u.name.toLowerCase().includes(kw) ||
            u.company.toLowerCase().includes(kw) ||
            u.city.toLowerCase().includes(kw)
        );
      },

      getUserReputation: (userId) => {
        return get().getUserById(userId)?.reputation;
      },

      fetchPeerProfiles: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取同行档案失败',
          });
        }
      },

      getPeerProfileByUserId: (userId) => {
        return get().peerProfiles.find((p) => p.userId === userId);
      },

      addPeerProfile: (userId, data) => {
        const user = get().getUserById(userId);
        if (!user) return null;
        const existing = get().getPeerProfileByUserId(userId);
        if (existing) return existing;
        const newProfile: PeerProfile = {
          userId,
          user,
          quickTags: user.reputation.quickTags,
          dealCount: 0,
          lastDealAt: undefined,
          note: data?.note,
          isBlocked: false,
          addedAt: new Date().toISOString(),
          ...data,
        };
        set((state) => ({
          peerProfiles: [newProfile, ...state.peerProfiles],
        }));
        return newProfile;
      },

      updatePeerProfile: (userId, data) => {
        set((state) => ({
          peerProfiles: state.peerProfiles.map((p) =>
            p.userId === userId ? { ...p, ...data } : p
          ),
        }));
      },

      removePeerProfile: (userId) => {
        set((state) => ({
          peerProfiles: state.peerProfiles.filter((p) => p.userId !== userId),
          selectedPeerProfile:
            state.selectedPeerProfile?.userId === userId ? null : state.selectedPeerProfile,
        }));
      },

      toggleBlockPeer: (userId) => {
        set((state) => ({
          peerProfiles: state.peerProfiles.map((p) =>
            p.userId === userId ? { ...p, isBlocked: !p.isBlocked } : p
          ),
        }));
      },

      setPeerNote: (userId, note) => {
        get().updatePeerProfile(userId, { note });
      },

      fetchQuickList: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取快捷名单失败',
          });
        }
      },

      getQuickListByCategory: (category) => {
        return get().quickList.filter((q) => q.category === category);
      },

      addQuickListEntry: (data) => {
        const user = get().getUserById(data.userId);
        if (!user) return null;
        const newEntry: QuickListEntry = {
          id: 'ql_' + generateId(),
          userId: data.userId,
          user,
          category: data.category,
          tags: data.tags,
          remark: data.remark,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({
          quickList: [newEntry, ...state.quickList],
        }));
        return newEntry;
      },

      updateQuickListEntry: (id, data) => {
        set((state) => ({
          quickList: state.quickList.map((q) => (q.id === id ? { ...q, ...data } : q)),
        }));
      },

      removeQuickListEntry: (id) => {
        set((state) => ({
          quickList: state.quickList.filter((q) => q.id !== id),
        }));
      },

      fetchEvaluations: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取评价列表失败',
          });
        }
      },

      getEvaluationsByUser: (userId) => {
        return get().evaluations
          .filter((e) => e.targetUserId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      addEvaluation: (data) => {
        const evaluator = get().getUserById(data.evaluatorId);
        if (!evaluator) return null;
        const newEval: ReputationEvaluation = {
          id: 'ev_' + generateId(),
          evaluatorId: data.evaluatorId,
          evaluator,
          targetUserId: data.targetUserId,
          orderId: data.orderId,
          rating: data.rating,
          tags: data.tags,
          content: data.content,
          images: data.images,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          evaluations: [newEval, ...state.evaluations],
        }));
        return newEval;
      },

      deleteEvaluation: (evaluationId) => {
        set((state) => ({
          evaluations: state.evaluations.filter((e) => e.id !== evaluationId),
        }));
      },

      getAverageRating: (userId) => {
        const userEvals = get().evaluations.filter((e) => e.targetUserId === userId);
        if (userEvals.length === 0) return 5;
        const sum = userEvals.reduce((acc, e) => acc + e.rating, 0);
        return Math.round((sum / userEvals.length) * 10) / 10;
      },

      setSelectedUser: (user) => {
        set({ selectedUser: user });
      },

      setSelectedPeerProfile: (profile) => {
        set({ selectedPeerProfile: profile });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      resetStore: () => {
        set({
          users: transformedUsers,
          peerProfiles: initialPeerProfiles,
          quickList: initialQuickList,
          evaluations: initialEvaluations,
          selectedUser: null,
          selectedPeerProfile: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'reputation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        peerProfiles: state.peerProfiles,
        quickList: state.quickList,
        evaluations: state.evaluations,
      }),
    }
  )
);

export default useReputationStore;
