import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, currentUser } from '../mock/data';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (phone: string, password: string) => Promise<void>;
  loginWithCode: (phone: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  phone: string;
  password: string;
  name: string;
  shopName: string;
  address: string;
  code: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateToken = () => {
  return (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ userId: currentUser.id, exp: Date.now() + 86400000 })) +
    '.' +
    Math.random().toString(36).substring(2, 15)
  );
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (phone: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await delay(800);

          if (!phone || phone.length !== 11) {
            throw new Error('请输入正确的手机号');
          }
          if (!password || password.length < 6) {
            throw new Error('密码长度不能少于6位');
          }

          const mockPhone = currentUser.phone;
          const mockPassword = '123456';

          if (phone !== mockPhone || password !== mockPassword) {
            throw new Error('手机号或密码错误');
          }

          const token = generateToken();
          set({
            user: currentUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败',
          });
          throw error;
        }
      },

      loginWithCode: async (phone: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          await delay(600);

          if (!phone || phone.length !== 11) {
            throw new Error('请输入正确的手机号');
          }
          if (!code || code.length !== 6) {
            throw new Error('请输入6位验证码');
          }
          if (code !== '123456') {
            throw new Error('验证码错误');
          }

          const token = generateToken();
          set({
            user: currentUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败',
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          await delay(1000);

          if (!data.phone || data.phone.length !== 11) {
            throw new Error('请输入正确的手机号');
          }
          if (!data.password || data.password.length < 6) {
            throw new Error('密码长度不能少于6位');
          }
          if (!data.name || data.name.length < 2) {
            throw new Error('请输入真实姓名');
          }
          if (!data.shopName || data.shopName.length < 2) {
            throw new Error('请输入店铺名称');
          }
          if (!data.address) {
            throw new Error('请输入详细地址');
          }
          if (data.code !== '123456') {
            throw new Error('验证码错误');
          }

          const newUser: User = {
            ...currentUser,
            id: 'u' + Date.now(),
            phone: data.phone,
            name: data.name,
            role: 'supplier',
            company: data.shopName,
            city: data.address.split('市')[0] + '市',
            verified: false,
            certificationBadges: ['实名认证'],
            reputation: {
              totalDeals: 0,
              pigeonRate: 0.05,
              wrongShipRate: 0.03,
              positiveRate: 0.85,
              starRating: 4.0,
              quickTags: ['新入驻'],
            },
            shopName: data.shopName,
            address: data.address,
            creditScore: 800,
            totalTrades: 0,
            createdAt: new Date().toISOString().split('T')[0],
            isOnline: true,
          };

          const token = generateToken();
          set({
            user: newUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '注册失败',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;
        set({
          user: { ...user, ...data },
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshUser: async () => {
        set({ isLoading: true });
        try {
          await delay(500);
          const { user } = get();
          if (user) {
            const newCreditScore = Math.min(999, user.creditScore + Math.floor(Math.random() * 5));
            const newTotalTrades = user.totalTrades + Math.floor(Math.random() * 3);
            set({
              user: {
                ...user,
                creditScore: newCreditScore,
                totalTrades: newTotalTrades,
                verified: newCreditScore > 900,
                certificationBadges: newCreditScore >= 950
                  ? [...new Set([...user.certificationBadges, '金牌商家', '诚信认证'])]
                  : newCreditScore >= 900
                  ? [...new Set([...user.certificationBadges, '诚信认证'])]
                  : user.certificationBadges,
                reputation: {
                  ...user.reputation,
                  totalDeals: newTotalTrades,
                  pigeonRate: Math.max(0, 0.05 - (newCreditScore - 900) * 0.0005),
                  wrongShipRate: Math.max(0, 0.03 - (newCreditScore - 900) * 0.0003),
                  positiveRate: Math.min(0.99, 0.85 + (newCreditScore - 800) * 0.0014),
                  starRating: Math.round((newCreditScore / 200) * 10) / 10,
                  quickTags: newCreditScore >= 980
                    ? ['金牌商家', '发货快', '货靠谱', '价格公道']
                    : newCreditScore >= 950
                    ? ['诚信认证', '发货快', '服务好']
                    : newCreditScore >= 900
                    ? ['诚信认证', '服务好']
                    : ['新入驻'],
                },
              },
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
