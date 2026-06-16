import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UrgentPost, Quote, RelayItem, User, CarPlatform } from '../types';
import { urgentOrders, users } from '../mock/data';

const findUser = (userId: string): User => {
  const user = users.find((u) => u.id === userId) || users[0];
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

const parseCarModel = (carModel: string): CarPlatform => {
  const parts = carModel.split(' ');
  return {
    brand: parts[0] || '',
    series: parts.slice(0, 2).join(' ') || '',
    year: parts.find((p) => /\d{4}/.test(p)) || '',
    model: parts.slice(1).join(' ') || '',
  };
};

const normalizeCategory = (cat: string): string => {
  const map: Record<string, string> = {
    '照明系统': '照明系统', '照明': '照明系统', '灯光': '照明系统',
    '外观覆盖': '外观覆盖', '外观覆盖件': '外观覆盖', '外观件': '外观覆盖', '外饰件': '外观覆盖', '覆盖件': '外观覆盖',
    '机械传动': '机械传动', '机械': '机械传动', '变速箱': '机械传动',
    '电子电器': '电子电器', '电子': '电子电器', '电器': '电子电器', '电路': '电子电器',
    '底盘悬挂': '底盘悬挂', '底盘': '底盘悬挂', '悬挂': '底盘悬挂',
    '发动机件': '发动机件', '发动机': '发动机件', '动力': '发动机件',
  };
  return map[cat] || map[cat.replace(/件$/, '')] || cat || '';
};

const classifyByPartName = (partName: string): string => {
  const keywords: Record<string, string[]> = {
    '照明系统': ['大灯', '尾灯', '雾灯', '日行灯', '转向灯', '灯泡', '灯罩'],
    '外观覆盖': ['保险杠', '叶子板', '翼子板', '机盖', '引擎盖', '车门', '尾盖', '尾门', '中网', '格栅', '后视镜', '倒车镜', '饰板', '饰条', '包围'],
    '机械传动': ['变速箱', '离合器', '传动轴', '差速器', '分动箱'],
    '电子电器': ['电脑板', 'ECU', '传感器', '开关', '线束', '保险丝', '继电器', '中控', '音响', '显示屏'],
    '底盘悬挂': ['减震', '避震', '摆臂', '悬挂', '弹簧', '羊角', '轴承', '拉杆', '球头', '刹车', '制动'],
    '发动机件': ['发动机', '缸盖', '缸体', '活塞', '曲轴', '涡轮', '增压器', '水泵', '油泵', '油底壳', '正时'],
  };
  for (const [cat, keys] of Object.entries(keywords)) {
    if (keys.some(k => partName.includes(k))) return cat;
  }
  return '';
};

const categoryMap: Record<string, string> = {
  '照明系统': 'lighting',
  '外观覆盖件': 'appearance',
  '外观覆盖': 'appearance',
  '机械传动': 'mechanical',
  '变速箱系统': 'mechanical',
  '转向系统': 'mechanical',
  '电子电器': 'electronics',
  '底盘悬挂': 'chassis',
  '悬挂系统': 'chassis',
  '制动系统': 'chassis',
  '轮胎轮毂': 'chassis',
  '发动机件': 'engine',
  '发动机系统': 'engine',
  '进排气系统': 'engine',
  '燃油系统': 'engine',
  '新能源系统': 'engine',
  '空调系统': 'electronics',
  '车身附件': 'appearance',
};

const transformUrgentOrders = (): UrgentPost[] => {
  return urgentOrders.map((order) => {
    const publisher = findUser(order.userId);
    let category = normalizeCategory(order.category);
    if (!category) {
      category = classifyByPartName(order.title);
    }
    return {
      id: order.id,
      publisherId: order.userId,
      publisher,
      carPlatform: parseCarModel(order.carModel),
      partName: order.title,
      partNumber: order.originalPartNumber,
      quantity: order.quantity,
      description: order.description,
      images: order.images,
      category,
      createdAt: order.createdAt,
      expiresAt: order.deadline,
      status:
        order.status === 'open'
          ? 'active'
          : order.status === 'quoting'
            ? 'quoted'
            : order.status === 'accepted'
              ? 'locked'
              : order.status === 'completed'
                ? 'completed'
                : 'expired',
      relayList: order.chainBids.map((bid) => {
        const supplier = findUser(bid.userId);
        return {
          id: bid.id,
          urgentPostId: bid.urgentId,
          supplierId: bid.userId,
          supplier,
          quantity: 1,
          unitPrice: bid.bidPrice,
          status: 'intention' as const,
          remark: '接龙报价',
          createdAt: bid.createdAt,
        };
      }),
      quotes: order.quotes.map((q) => {
        const supplier = findUser(q.userId);
        return {
          id: q.id,
          urgentPostId: q.urgentId,
          supplierId: q.userId,
          supplier,
          price: q.price,
          shippingFee: 50,
          totalPrice: q.price + 50,
          canShipToday: Math.random() > 0.5,
          sourceCity: supplier.city,
          distanceKm: Math.floor(Math.random() * 2000),
          conditionType: 'used' as const,
          warrantyDays: 90,
          remark: q.message,
          createdAt: q.createdAt,
        };
      }),
    };
  });
};

interface UrgentStoreState {
  urgentPosts: UrgentPost[];
  selectedUrgentPost: UrgentPost | null;
  isLoading: boolean;
  error: string | null;

  fetchUrgentPosts: () => Promise<void>;
  getUrgentPostById: (id: string) => UrgentPost | undefined;
  getUrgentPostsByPublisher: (publisherId: string) => UrgentPost[];
  getUrgentPostsByStatus: (status: UrgentPost['status']) => UrgentPost[];

  createUrgentPost: (data: Omit<UrgentPost, 'id' | 'publisherId' | 'publisher' | 'createdAt' | 'status' | 'relayList' | 'quotes'> & { publisherId: string; category?: string }) => UrgentPost;
  updateUrgentPost: (id: string, data: Partial<UrgentPost>) => void;
  deleteUrgentPost: (id: string) => void;
  setUrgentPostStatus: (id: string, status: UrgentPost['status']) => void;

  createQuote: (urgentPostId: string, data: Omit<Quote, 'id' | 'urgentPostId' | 'supplier' | 'createdAt'> & { supplierId: string }) => Quote | null;
  updateQuote: (quoteId: string, data: Partial<Quote>) => void;
  deleteQuote: (urgentPostId: string, quoteId: string) => void;
  acceptQuote: (urgentPostId: string, quoteId: string) => void;

  createRelayItem: (urgentPostId: string, data: Omit<RelayItem, 'id' | 'urgentPostId' | 'supplier' | 'createdAt' | 'status'> & { supplierId: string }) => RelayItem | null;
  updateRelayItem: (relayId: string, data: Partial<RelayItem>) => void;
  deleteRelayItem: (urgentPostId: string, relayId: string) => void;
  setRelayItemStatus: (relayId: string, status: RelayItem['status']) => void;

  setSelectedUrgentPost: (post: UrgentPost | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  resetStore: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialData = transformUrgentOrders();

export const useUrgentStore = create<UrgentStoreState>()(
  persist(
    (set, get) => ({
      urgentPosts: initialData,
      selectedUrgentPost: null,
      isLoading: false,
      error: null,

      fetchUrgentPosts: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取急件列表失败',
          });
        }
      },

      getUrgentPostById: (id) => {
        return get().urgentPosts.find((post) => post.id === id);
      },

      getUrgentPostsByPublisher: (publisherId) => {
        return get().urgentPosts.filter((post) => post.publisherId === publisherId);
      },

      getUrgentPostsByStatus: (status) => {
        return get().urgentPosts.filter((post) => post.status === status);
      },

      createUrgentPost: (data) => {
        const publisher = findUser(data.publisherId);
        let category = data.category || '';
        if (!category) {
          category = classifyByPartName(data.partName);
        }
        category = normalizeCategory(category);
        const newPost: UrgentPost = {
          id: 'up_' + generateId(),
          publisherId: data.publisherId,
          publisher,
          carPlatform: data.carPlatform,
          partName: data.partName,
          partNumber: data.partNumber,
          quantity: data.quantity,
          description: data.description,
          images: data.images,
          category,
          createdAt: new Date().toISOString(),
          expiresAt: data.expiresAt,
          status: 'active',
          relayList: [],
          quotes: [],
        };
        set((state) => ({
          urgentPosts: [newPost, ...state.urgentPosts],
        }));
        return newPost;
      },

      updateUrgentPost: (id, data) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) =>
            post.id === id ? { ...post, ...data } : post
          ),
        }));
      },

      deleteUrgentPost: (id) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.filter((post) => post.id !== id),
          selectedUrgentPost: state.selectedUrgentPost?.id === id ? null : state.selectedUrgentPost,
        }));
      },

      setUrgentPostStatus: (id, status) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) =>
            post.id === id ? { ...post, status } : post
          ),
        }));
      },

      createQuote: (urgentPostId, data) => {
        const supplier = findUser(data.supplierId);
        const newQuote: Quote = {
          id: 'q_' + generateId(),
          urgentPostId,
          supplierId: data.supplierId,
          supplier,
          price: data.price,
          shippingFee: data.shippingFee,
          totalPrice: data.totalPrice,
          canShipToday: data.canShipToday,
          sourceCity: data.sourceCity,
          distanceKm: data.distanceKm,
          conditionType: data.conditionType,
          warrantyDays: data.warrantyDays,
          remark: data.remark,
          createdAt: new Date().toISOString(),
        };
        let created = false;
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => {
            if (post.id === urgentPostId) {
              created = true;
              return {
                ...post,
                quotes: [...post.quotes, newQuote],
                status: post.status === 'active' ? 'quoted' : post.status,
              };
            }
            return post;
          }),
        }));
        return created ? newQuote : null;
      },

      updateQuote: (quoteId, data) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => ({
            ...post,
            quotes: post.quotes.map((q) => (q.id === quoteId ? { ...q, ...data } : q)),
          })),
        }));
      },

      deleteQuote: (urgentPostId, quoteId) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => {
            if (post.id === urgentPostId) {
              return {
                ...post,
                quotes: post.quotes.filter((q) => q.id !== quoteId),
              };
            }
            return post;
          }),
        }));
      },

      acceptQuote: (urgentPostId, quoteId) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => {
            if (post.id === urgentPostId) {
              return {
                ...post,
                status: 'locked',
                quotes: post.quotes.map((q) => ({
                  ...q,
                })),
              };
            }
            return post;
          }),
        }));
      },

      createRelayItem: (urgentPostId, data) => {
        const supplier = findUser(data.supplierId);
        const newRelay: RelayItem = {
          id: 'rl_' + generateId(),
          urgentPostId,
          supplierId: data.supplierId,
          supplier,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          status: 'intention',
          remark: data.remark,
          createdAt: new Date().toISOString(),
        };
        let created = false;
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => {
            if (post.id === urgentPostId) {
              created = true;
              return {
                ...post,
                relayList: [...post.relayList, newRelay],
              };
            }
            return post;
          }),
        }));
        return created ? newRelay : null;
      },

      updateRelayItem: (relayId, data) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => ({
            ...post,
            relayList: post.relayList.map((r) => (r.id === relayId ? { ...r, ...data } : r)),
          })),
        }));
      },

      deleteRelayItem: (urgentPostId, relayId) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => {
            if (post.id === urgentPostId) {
              return {
                ...post,
                relayList: post.relayList.filter((r) => r.id !== relayId),
              };
            }
            return post;
          }),
        }));
      },

      setRelayItemStatus: (relayId, status) => {
        set((state) => ({
          urgentPosts: state.urgentPosts.map((post) => ({
            ...post,
            relayList: post.relayList.map((r) =>
              r.id === relayId ? { ...r, status } : r
            ),
          })),
        }));
      },

      setSelectedUrgentPost: (post) => {
        set({ selectedUrgentPost: post });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      resetStore: () => {
        set({
          urgentPosts: initialData,
          selectedUrgentPost: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'urgent-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        urgentPosts: state.urgentPosts,
      }),
    }
  )
);

export default useUrgentStore;
