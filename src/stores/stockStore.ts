import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StockItem, User, CarPlatform, SortType } from '../types';
import { spotGoods, users } from '../mock/data';

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

const parseBrand = (brand: string): CarPlatform => {
  const brandMap: Record<string, string> = {
    '宝马BMW': '宝马',
    '大众VAG': '大众',
    '丰田Toyota': '丰田',
    '奔驰Benz': '奔驰',
    '米其林Michelin': '米其林',
    '通用GM': '通用',
    '特斯拉Tesla': '特斯拉',
    '长城GWM': '长城',
    '奥迪Audi': '奥迪',
    '本田Honda': '本田',
    '蔚来NIO': '蔚来',
    '马自达Mazda': '马自达',
    '比亚迪BYD': '比亚迪',
    '雷克萨斯Lexus': '雷克萨斯',
    '沃尔沃Volvo': '沃尔沃',
  };
  return {
    brand: brandMap[brand] || brand,
    series: brandMap[brand] || brand,
    year: '',
    model: brand,
  };
};

const mapCondition = (condition: string): 'new' | 'used' | 'refurbished' => {
  if (condition === 'new') return 'new';
  if (condition === 'like-new' || condition === 'used') return 'used';
  return 'refurbished';
};

const transformStockItems = (): StockItem[] => {
  return spotGoods.map((goods) => {
    const supplier = findUser(goods.userId);
    return {
      id: goods.id,
      supplierId: goods.userId,
      supplier,
      carPlatform: parseBrand(goods.brand),
      partName: goods.title,
      partNumber: goods.partNumber,
      conditionType: mapCondition(goods.condition),
      stockQty: goods.quantity,
      unitPrice: goods.price,
      shippingFee: goods.location.includes('广州') || goods.location.includes('佛山') ? 30 : 60,
      sourceCity: goods.location,
      canShipToday: Math.random() > 0.3,
      images: goods.images,
      tags: [
        ...(goods.isHot ? ['热销'] : []),
        ...(goods.negotiable ? ['可议价'] : []),
        goods.category,
      ],
      createdAt: goods.createdAt,
    };
  });
};

export interface StockFilter {
  keyword?: string;
  category?: string;
  brand?: string;
  conditionType?: ('new' | 'used' | 'refurbished')[];
  priceMin?: number;
  priceMax?: number;
  stockQtyMin?: number;
  canShipTodayOnly?: boolean;
  verifiedOnly?: boolean;
  tags?: string[];
}

interface StockStoreState {
  stockItems: StockItem[];
  selectedStockItem: StockItem | null;
  filters: StockFilter;
  sortType: SortType;
  isLoading: boolean;
  error: string | null;

  fetchStockItems: () => Promise<void>;
  getStockItemById: (id: string) => StockItem | undefined;
  getStockItemsBySupplier: (supplierId: string) => StockItem[];
  getFilteredStockItems: () => StockItem[];
  getSortedStockItems: (items: StockItem[]) => StockItem[];

  createStockItem: (data: Omit<StockItem, 'id' | 'supplierId' | 'supplier' | 'createdAt'> & { supplierId: string }) => StockItem;
  updateStockItem: (id: string, data: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  updateStockQty: (id: string, delta: number) => void;

  setFilters: (filters: Partial<StockFilter>) => void;
  resetFilters: () => void;
  setSortType: (sortType: SortType) => void;

  setSelectedStockItem: (item: StockItem | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  resetStore: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialData = transformStockItems();

const defaultFilters: StockFilter = {
  keyword: '',
  category: '',
  brand: '',
  conditionType: [],
  priceMin: undefined,
  priceMax: undefined,
  stockQtyMin: 1,
  canShipTodayOnly: false,
  verifiedOnly: false,
  tags: [],
};

export const useStockStore = create<StockStoreState>()(
  persist(
    (set, get) => ({
      stockItems: initialData,
      selectedStockItem: null,
      filters: defaultFilters,
      sortType: 'reputation',
      isLoading: false,
      error: null,

      fetchStockItems: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取现货列表失败',
          });
        }
      },

      getStockItemById: (id) => {
        return get().stockItems.find((item) => item.id === id);
      },

      getStockItemsBySupplier: (supplierId) => {
        return get().stockItems.filter((item) => item.supplierId === supplierId);
      },

      getFilteredStockItems: () => {
        const { stockItems, filters, sortType } = get();
        let result = [...stockItems];

        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          result = result.filter(
            (item) =>
              item.partName.toLowerCase().includes(keyword) ||
              item.partNumber.toLowerCase().includes(keyword) ||
              item.tags.some((t) => t.toLowerCase().includes(keyword))
          );
        }

        if (filters.category) {
          result = result.filter((item) => item.tags.includes(filters.category!));
        }

        if (filters.brand) {
          result = result.filter((item) => item.carPlatform.brand === filters.brand);
        }

        if (filters.conditionType && filters.conditionType.length > 0) {
          result = result.filter((item) => filters.conditionType!.includes(item.conditionType));
        }

        if (filters.priceMin !== undefined) {
          result = result.filter((item) => item.unitPrice >= filters.priceMin!);
        }

        if (filters.priceMax !== undefined) {
          result = result.filter((item) => item.unitPrice <= filters.priceMax!);
        }

        if (filters.stockQtyMin !== undefined) {
          result = result.filter((item) => item.stockQty >= filters.stockQtyMin!);
        }

        if (filters.canShipTodayOnly) {
          result = result.filter((item) => item.canShipToday);
        }

        if (filters.verifiedOnly) {
          result = result.filter((item) => item.supplier.verified);
        }

        if (filters.tags && filters.tags.length > 0) {
          result = result.filter((item) => filters.tags!.every((t) => item.tags.includes(t)));
        }

        switch (sortType) {
          case 'price_asc':
            result.sort((a, b) => a.unitPrice - b.unitPrice);
            break;
          case 'price_desc':
            result.sort((a, b) => b.unitPrice - a.unitPrice);
            break;
          case 'distance':
            result.sort(() => Math.random() - 0.5);
            break;
          case 'speed':
            result.sort((a, b) => (b.canShipToday ? 1 : 0) - (a.canShipToday ? 1 : 0));
            break;
          case 'reputation':
          default:
            result.sort((a, b) => b.supplier.reputation.starRating - a.supplier.reputation.starRating);
            break;
        }

        return result;
      },

      getSortedStockItems: (items) => {
        const { sortType } = get();
        const result = [...items];
        switch (sortType) {
          case 'price_asc':
            result.sort((a, b) => a.unitPrice - b.unitPrice);
            break;
          case 'price_desc':
            result.sort((a, b) => b.unitPrice - a.unitPrice);
            break;
          case 'distance':
            result.sort(() => Math.random() - 0.5);
            break;
          case 'speed':
            result.sort((a, b) => (b.canShipToday ? 1 : 0) - (a.canShipToday ? 1 : 0));
            break;
          case 'reputation':
          default:
            result.sort((a, b) => b.supplier.reputation.starRating - a.supplier.reputation.starRating);
            break;
        }
        return result;
      },

      createStockItem: (data) => {
        const supplier = findUser(data.supplierId);
        const newItem: StockItem = {
          id: 'sp_' + generateId(),
          supplierId: data.supplierId,
          supplier,
          carPlatform: data.carPlatform,
          partName: data.partName,
          partNumber: data.partNumber,
          conditionType: data.conditionType,
          stockQty: data.stockQty,
          unitPrice: data.unitPrice,
          shippingFee: data.shippingFee,
          sourceCity: data.sourceCity,
          canShipToday: data.canShipToday,
          images: data.images,
          tags: data.tags,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          stockItems: [newItem, ...state.stockItems],
        }));
        return newItem;
      },

      updateStockItem: (id, data) => {
        set((state) => ({
          stockItems: state.stockItems.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        }));
      },

      deleteStockItem: (id) => {
        set((state) => ({
          stockItems: state.stockItems.filter((item) => item.id !== id),
          selectedStockItem: state.selectedStockItem?.id === id ? null : state.selectedStockItem,
        }));
      },

      updateStockQty: (id, delta) => {
        set((state) => ({
          stockItems: state.stockItems.map((item) =>
            item.id === id ? { ...item, stockQty: Math.max(0, item.stockQty + delta) } : item
          ),
        }));
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      setSortType: (sortType) => {
        set({ sortType });
      },

      setSelectedStockItem: (item) => {
        set({ selectedStockItem: item });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      resetStore: () => {
        set({
          stockItems: initialData,
          selectedStockItem: null,
          filters: defaultFilters,
          sortType: 'reputation',
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'stock-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        stockItems: state.stockItems,
        filters: state.filters,
        sortType: state.sortType,
      }),
    }
  )
);

export default useStockStore;
