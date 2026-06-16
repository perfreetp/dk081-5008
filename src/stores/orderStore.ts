import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GuaranteeOrder,
  OrderStatus,
  User,
  PartSnapshot,
  OrderTimelineItem,
  AdaptConfirm,
  DisputeRecord,
  CarPlatform,
  RelayItem,
  RelaySubOrderSnapshot,
} from '../types';
import { guaranteeOrders, users, urgentOrders, spotGoods } from '../mock/data';
import { useUrgentStore } from './urgentStore';
import { useAuthStore } from './authStore';

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

const parseCarModel = (title: string): CarPlatform => {
  const brandMatch = title.match(/^(宝马|奔驰|奥迪|大众|丰田|本田|别克|日产|特斯拉|保时捷|比亚迪|路虎|长城|沃尔沃|雷克萨斯|马自达|蔚来|米其林|通用)/);
  const brand = brandMatch ? brandMatch[1] : '其他';
  return {
    brand,
    series: brand,
    year: '',
    model: title,
  };
};

const mapStatus = (status: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    'pending-payment': 'pending_payment',
    'deposit-paid': 'deposited',
    shipped: 'shipped',
    delivered: 'delivered',
    completed: 'completed',
    dispute: 'disputing',
    refunded: 'cancelled',
  };
  return statusMap[status] || 'pending_payment';
};

const buildTimeline = (order: typeof guaranteeOrders[0]): OrderTimelineItem[] => {
  const timeline: OrderTimelineItem[] = [];
  const opBuyer = order.buyerId;
  const opSeller = order.sellerId;

  timeline.push({
    status: 'pending_payment',
    timestamp: order.createdAt,
    operatorId: opBuyer,
    remark: '订单创建成功，等待支付定金',
  });

  if (order.paidAt) {
    timeline.push({
      status: 'deposited',
      timestamp: order.paidAt,
      operatorId: opBuyer,
      remark: `定金支付成功 ¥${order.deposit}，平台已锁定货物`,
    });
  }

  if (order.shippedAt) {
    timeline.push({
      status: 'shipped',
      timestamp: order.shippedAt,
      operatorId: opSeller,
      remark: `${order.logisticsCompany || '物流'}已发货，单号：${order.trackingNo || '未知'}`,
      images: [],
    });
  }

  if (order.deliveredAt) {
    timeline.push({
      status: 'delivered',
      timestamp: order.deliveredAt,
      operatorId: opBuyer,
      remark: '货物已签收，请尽快验货适配',
    });
  }

  if (order.status === 'completed' && order.completedAt) {
    timeline.push({
      status: 'adapt_confirmed',
      timestamp: order.completedAt,
      operatorId: opBuyer,
      remark: '适配确认通过，等待尾款结算',
    });
    timeline.push({
      status: 'completed',
      timestamp: order.completedAt,
      operatorId: opBuyer,
      remark: `订单已完成，尾款 ¥${order.totalAmount - order.deposit - order.shippingFee} 已结算给卖家`,
    });
  }

  if (order.status === 'dispute') {
    timeline.push({
      status: 'disputing',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      operatorId: opBuyer,
      remark: `已发起争议：${order.disputeReason || '原因待补充'}`,
    });
  }

  return timeline;
};

const buildPartSnapshot = (order: typeof guaranteeOrders[0]): PartSnapshot => {
  const sourceUrgent = urgentOrders.find((u) => u.id === order.urgentId);
  const sourceSpot = spotGoods.find((s) => s.id === order.spotId);

  if (sourceUrgent) {
    return {
      partName: sourceUrgent.title,
      partNumber: sourceUrgent.originalPartNumber,
      carPlatform: parseCarModel(sourceUrgent.carModel),
      quantity: sourceUrgent.quantity,
      unitPrice: order.totalAmount / sourceUrgent.quantity,
      conditionType: 'used',
      images: sourceUrgent.images,
    };
  }

  if (sourceSpot) {
    const mapCondition = (condition: string): 'new' | 'used' | 'refurbished' => {
      if (condition === 'new') return 'new';
      if (condition === 'like-new' || condition === 'used') return 'used';
      return 'refurbished';
    };
    return {
      partName: sourceSpot.title,
      partNumber: sourceSpot.partNumber,
      carPlatform: parseCarModel(sourceSpot.brand),
      quantity: 1,
      unitPrice: sourceSpot.price,
      conditionType: mapCondition(sourceSpot.condition),
      images: sourceSpot.images,
    };
  }

  return {
    partName: order.title,
    partNumber: undefined,
    carPlatform: parseCarModel(order.title),
    quantity: 1,
    unitPrice: order.totalAmount,
    conditionType: 'used',
    images: order.images,
  };
};

const transformOrders = (): GuaranteeOrder[] => {
  return guaranteeOrders.map((order) => {
    const buyer = findUser(order.buyerId);
    const supplier = findUser(order.sellerId);
    const partInfo = buildPartSnapshot(order);
    const status = mapStatus(order.status);
    const timeline = buildTimeline(order);

    let adaptConfirm: AdaptConfirm | undefined;
    let dispute: DisputeRecord | undefined;

    if (order.status === 'completed') {
      adaptConfirm = {
        confirmed: true,
        result: 'fit',
        images: [],
        remark: '适配正常，安装无误',
        confirmedAt: order.completedAt || new Date().toISOString(),
      };
    }

    if (order.status === 'dispute' && order.disputeReason) {
      dispute = {
        id: 'dp_' + order.id,
        orderId: order.id,
        applicantId: order.buyerId,
        reason: order.disputeReason,
        evidenceImages: order.images,
        frozenAmount: order.totalAmount,
        status: 'mediating',
        arbitratorRemark: '平台专员正在核实双方证据，请耐心等待',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    return {
      id: order.id,
      orderNo: order.orderNo,
      buyerId: order.buyerId,
      buyer,
      supplierId: order.sellerId,
      supplier,
      sourceType: order.urgentId ? 'urgent' : 'stock',
      sourceId: order.urgentId || order.spotId || '',
      partInfo,
      totalAmount: order.totalAmount,
      depositAmount: order.deposit,
      finalAmount: order.totalAmount,
      shippingFee: order.shippingFee,
      status,
      timeline,
      relayOrderIds: undefined,
      isRelayParent: false,
      adaptConfirm,
      dispute,
      createdAt: order.createdAt,
    };
  });
};

interface OrderStoreState {
  orders: GuaranteeOrder[];
  selectedOrder: GuaranteeOrder | null;
  isLoading: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  getOrderById: (id: string) => GuaranteeOrder | undefined;
  getOrdersByBuyer: (buyerId: string) => GuaranteeOrder[];
  getOrdersBySupplier: (supplierId: string) => GuaranteeOrder[];
  getOrdersByStatus: (status: OrderStatus) => GuaranteeOrder[];
  getOrdersByStatusGroup: (
    group: 'all' | 'pending' | 'processing' | 'completed' | 'dispute'
  ) => GuaranteeOrder[];

  createOrder: (
    data: Omit<
      GuaranteeOrder,
      | 'id'
      | 'orderNo'
      | 'buyer'
      | 'supplier'
      | 'status'
      | 'timeline'
      | 'createdAt'
    > & { buyerId: string; supplierId: string; sourceQuoteId?: string }
  ) => GuaranteeOrder;
  updateOrder: (id: string, data: Partial<GuaranteeOrder>) => void;
  cancelOrder: (id: string, remark?: string) => void;

  payDeposit: (id: string) => void;
  lockStock: (id: string) => void;
  shipOrder: (id: string, logisticsCompany: string, trackingNo: string, images?: string[]) => void;
  confirmDelivery: (id: string) => void;
  confirmAdaptation: (
    id: string,
    result: AdaptConfirm['result'],
    images: string[],
    remark: string
  ) => void;
  completeOrder: (id: string) => void;

  initiateDispute: (
    id: string,
    applicantId: string,
    reason: string,
    evidenceImages: string[]
  ) => DisputeRecord | null;
  updateDispute: (orderId: string, data: Partial<DisputeRecord>) => void;
  resolveDispute: (
    orderId: string,
    resolution: DisputeRecord['status'],
    arbitratorRemark: string,
    buyerAmount?: number,
    supplierAmount?: number
  ) => void;

  addTimelineItem: (orderId: string, item: Omit<OrderTimelineItem, 'timestamp'>) => void;

  createRelayParentOrder: (urgentPostId: string, confirmedRelayItemIds: string[]) => GuaranteeOrder;

  setSelectedOrder: (order: GuaranteeOrder | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  resetStore: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);
const generateOrderNo = () => {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  return 'QB' + dateStr + Math.random().toString().slice(2, 8).toUpperCase();
};

const initialData = transformOrders();

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set, get) => ({
      orders: initialData,
      selectedOrder: null,
      isLoading: false,
      error: null,

      fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取订单列表失败',
          });
        }
      },

      getOrderById: (id) => {
        return get().orders.find((o) => o.id === id);
      },

      getOrdersByBuyer: (buyerId) => {
        return get()
          .orders.filter((o) => o.buyerId === buyerId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getOrdersBySupplier: (supplierId) => {
        return get()
          .orders.filter((o) => o.supplierId === supplierId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getOrdersByStatus: (status) => {
        return get()
          .orders.filter((o) => o.status === status)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getOrdersByStatusGroup: (group) => {
        const all = get()
          .orders.slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        switch (group) {
          case 'pending':
            return all.filter((o) =>
              ['pending_payment', 'deposited', 'preparing'].includes(o.status)
            );
          case 'processing':
            return all.filter((o) => ['shipped', 'delivered', 'adapt_confirmed'].includes(o.status));
          case 'completed':
            return all.filter((o) => o.status === 'completed');
          case 'dispute':
            return all.filter((o) => o.status === 'disputing' || o.dispute);
          case 'all':
          default:
            return all;
        }
      },

      createOrder: (data) => {
        const buyer = findUser(data.buyerId);
        const supplier = findUser(data.supplierId);

        const partInfo: PartSnapshot = {
          ...data.partInfo,
        };

        const newOrder: GuaranteeOrder = {
          id: 'go_' + generateId(),
          orderNo: generateOrderNo(),
          buyerId: data.buyerId,
          buyer,
          supplierId: data.supplierId,
          supplier,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          sourceQuoteId: data.sourceQuoteId,
          partInfo,
          totalAmount: data.totalAmount,
          depositAmount: data.depositAmount,
          finalAmount: data.finalAmount,
          shippingFee: data.shippingFee,
          status: 'pending_payment',
          timeline: [
            {
              status: 'pending_payment',
              timestamp: new Date().toISOString(),
              operatorId: data.buyerId,
              remark: '订单创建成功，请尽快支付定金',
            },
          ],
          relayOrderIds: data.relayOrderIds,
          isRelayParent: data.isRelayParent ?? false,
          adaptConfirm: undefined,
          dispute: undefined,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
        return newOrder;
      },

      updateOrder: (id, data) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        }));
      },

      cancelOrder: (id, remark) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: 'cancelled',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'cancelled',
                    timestamp: new Date().toISOString(),
                    operatorId: o.buyerId,
                    remark: remark || '订单已取消',
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      payDeposit: (id) => {
        const order = get().getOrderById(id);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: 'deposited',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'deposited',
                    timestamp: new Date().toISOString(),
                    operatorId: o.buyerId,
                    remark: `定金支付成功 ¥${o.depositAmount}，平台已锁定货物`,
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      lockStock: (id) => {
        const order = get().getOrderById(id);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: 'preparing',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'preparing',
                    timestamp: new Date().toISOString(),
                    operatorId: o.supplierId,
                    remark: '卖家已确认备货，正在锁货打包',
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      shipOrder: (id, logisticsCompany, trackingNo, images) => {
        const order = get().getOrderById(id);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: 'shipped',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'shipped',
                    timestamp: new Date().toISOString(),
                    operatorId: o.supplierId,
                    remark: `${logisticsCompany}已发货，单号：${trackingNo}`,
                    images,
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      confirmDelivery: (id) => {
        const order = get().getOrderById(id);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: 'delivered',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'delivered',
                    timestamp: new Date().toISOString(),
                    operatorId: o.buyerId,
                    remark: '货物已签收，请尽快验货适配',
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      confirmAdaptation: (id, result, images, remark) => {
        const order = get().getOrderById(id);
        if (!order) return;
        const adaptConfirm: AdaptConfirm = {
          confirmed: true,
          result,
          images,
          remark,
          confirmedAt: new Date().toISOString(),
        };
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: result === 'fit' ? 'adapt_confirmed' : o.status,
                adaptConfirm,
                timeline: [
                  ...o.timeline,
                  {
                    status: 'adapt_confirmed',
                    timestamp: new Date().toISOString(),
                    operatorId: o.buyerId,
                    remark: `适配确认：${
                      result === 'fit' ? '完美适配' : result === 'wrong' ? '无法适配' : result === 'partial' ? '部分适配' : '待确认'
                    }，${remark}`,
                    images,
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      completeOrder: (id) => {
        const order = get().getOrderById(id);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              const finalPay = o.totalAmount - o.depositAmount - o.shippingFee;
              return {
                ...o,
                status: 'completed',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    operatorId: o.buyerId,
                    remark: `订单已完成，尾款 ¥${Math.max(0, finalPay)} 已结算给卖家`,
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      initiateDispute: (id, applicantId, reason, evidenceImages) => {
        const order = get().getOrderById(id);
        if (!order) return null;
        const dispute: DisputeRecord = {
          id: 'dp_' + generateId(),
          orderId: id,
          applicantId,
          reason,
          evidenceImages,
          frozenAmount: order.totalAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === id) {
              return {
                ...o,
                status: 'disputing',
                dispute,
                timeline: [
                  ...o.timeline,
                  {
                    status: 'disputing',
                    timestamp: new Date().toISOString(),
                    operatorId: applicantId,
                    remark: `已发起争议申请：${reason}`,
                    images: evidenceImages,
                  },
                ],
              };
            }
            return o;
          }),
        }));
        return dispute;
      },

      updateDispute: (orderId, data) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === orderId && o.dispute) {
              return {
                ...o,
                dispute: { ...o.dispute, ...data },
              };
            }
            return o;
          }),
        }));
      },

      resolveDispute: (orderId, resolution, arbitratorRemark, buyerAmount, supplierAmount) => {
        const order = get().getOrderById(orderId);
        if (!order || !order.dispute) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === orderId && o.dispute) {
              const finalStatus: OrderStatus =
                resolution === 'resolved_buyer' || resolution === 'resolved_split' ? 'cancelled' : 'completed';
              return {
                ...o,
                status: finalStatus,
                dispute: {
                  ...o.dispute,
                  status: resolution,
                  arbitratorRemark,
                  resolutionAmount:
                    buyerAmount !== undefined && supplierAmount !== undefined
                      ? { buyer: buyerAmount, supplier: supplierAmount }
                      : undefined,
                  resolvedAt: new Date().toISOString(),
                },
                timeline: [
                  ...o.timeline,
                  {
                    status: finalStatus,
                    timestamp: new Date().toISOString(),
                    operatorId: 'system',
                    remark: `平台仲裁完成：${arbitratorRemark}`,
                  },
                ],
              };
            }
            return o;
          }),
        }));
      },

      addTimelineItem: (orderId, item) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                timeline: [
                  ...o.timeline,
                  { ...item, timestamp: new Date().toISOString() },
                ],
              };
            }
            return o;
          }),
        }));
      },

      createRelayParentOrder: (urgentPostId, confirmedRelayItemIds) => {
        const urgentStore = useUrgentStore.getState();
        const authStore = useAuthStore.getState();
        const post = urgentStore.getUrgentPostById(urgentPostId);
        if (!post) throw new Error('急件不存在');

        const confirmedItems = post.relayList.filter((r) =>
          confirmedRelayItemIds.includes(r.id)
        );
        if (confirmedItems.length === 0) throw new Error('未选择任何接龙项');

        const currentUser = authStore.user;
        if (!currentUser) throw new Error('用户未登录');

        const subOrders: GuaranteeOrder[] = [];
        const subOrderIds: string[] = [];
        const relaySubOrderSnapshots: RelaySubOrderSnapshot[] = [];
        let totalAmount = 0;
        let totalQty = 0;

        confirmedItems.forEach((item: RelayItem) => {
          const amount = item.unitPrice * item.quantity;
          const depositAmount = Math.round(amount * 0.3);
          const shippingFee = 50;

          const subOrder: GuaranteeOrder = {
            id: 'go_' + generateId(),
            orderNo: generateOrderNo(),
            buyerId: currentUser.id,
            buyer: currentUser,
            supplierId: item.supplierId,
            supplier: item.supplier,
            sourceType: 'relay',
            sourceId: urgentPostId,
            partInfo: {
              partName: post.partName,
              partNumber: post.partNumber,
              carPlatform: post.carPlatform,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              conditionType: 'used',
              images: post.images,
            },
            totalAmount: amount + shippingFee,
            depositAmount,
            finalAmount: amount + shippingFee,
            shippingFee,
            status: 'pending_payment',
            timeline: [
              {
                status: 'pending_payment',
                timestamp: new Date().toISOString(),
                operatorId: currentUser.id,
                remark: '接龙子订单创建成功，等待支付定金',
              },
            ],
            relayOrderIds: undefined,
            isRelayParent: false,
            adaptConfirm: undefined,
            dispute: undefined,
            createdAt: new Date().toISOString(),
          };

          subOrders.push(subOrder);
          subOrderIds.push(subOrder.id);
          totalAmount += subOrder.totalAmount;
          totalQty += item.quantity;

          relaySubOrderSnapshots.push({
            subOrderId: subOrder.id,
            supplierId: item.supplierId,
            supplierName: item.supplier.name,
            supplierAvatar: item.supplier.avatar,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount,
            status: 'pending_payment',
          });
        });

        const parentDepositAmount = Math.round(totalAmount * 0.3);
        const parentOrder: GuaranteeOrder = {
          id: 'go_' + generateId(),
          orderNo: generateOrderNo(),
          buyerId: currentUser.id,
          buyer: currentUser,
          supplierId: currentUser.id,
          supplier: currentUser,
          sourceType: 'relay',
          sourceId: urgentPostId,
          partInfo: {
            partName: post.partName,
            partNumber: post.partNumber,
            carPlatform: post.carPlatform,
            quantity: totalQty,
            unitPrice: totalAmount / totalQty,
            conditionType: 'used',
            images: post.images,
          },
          totalAmount,
          depositAmount: parentDepositAmount,
          finalAmount: totalAmount,
          shippingFee: 0,
          status: 'pending_payment',
          timeline: [
            {
              status: 'pending_payment',
              timestamp: new Date().toISOString(),
              operatorId: currentUser.id,
              remark: `接龙担保订单创建成功，共${confirmedItems.length}家供应商，等待支付定金`,
            },
          ],
          relayOrderIds: subOrderIds,
          relaySubOrders: subOrderIds,
          isRelayParent: true,
          relaySummary: {
            totalSuppliers: confirmedItems.length,
            totalQty,
            totalAmount,
          },
          relaySubOrderSnapshots,
          adaptConfirm: undefined,
          dispute: undefined,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [parentOrder, ...subOrders, ...state.orders],
        }));

        confirmedItems.forEach((item) => {
          urgentStore.setRelayItemStatus(item.id, 'confirmed');
        });

        return parentOrder;
      },

      setSelectedOrder: (order) => {
        set({ selectedOrder: order });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      resetStore: () => {
        set({
          orders: initialData,
          selectedOrder: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        orders: state.orders,
      }),
    }
  )
);

export default useOrderStore;
