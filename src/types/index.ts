export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'supplier' | 'buyer' | 'groupOwner' | 'dismantler';
  company: string;
  city: string;
  verified: boolean;
  certificationBadges: string[];
  reputation: Reputation;
  createdAt: string;
}

export interface Reputation {
  totalDeals: number;
  pigeonRate: number;
  wrongShipRate: number;
  positiveRate: number;
  starRating: number;
  quickTags: string[];
}

export interface UrgentPost {
  id: string;
  publisherId: string;
  publisher: User;
  carPlatform: CarPlatform;
  partName: string;
  partNumber?: string;
  quantity: number;
  description: string;
  images: string[];
  category: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'quoted' | 'locked' | 'completed' | 'expired';
  relayList: RelayItem[];
  quotes: Quote[];
  acceptedQuoteId?: string;
}

export interface Quote {
  id: string;
  urgentPostId: string;
  supplierId: string;
  supplier: User;
  price: number;
  shippingFee: number;
  totalPrice: number;
  canShipToday: boolean;
  sourceCity: string;
  distanceKm: number;
  conditionType: 'new' | 'used' | 'refurbished';
  warrantyDays: number;
  remark: string;
  createdAt: string;
}

export interface RelayItem {
  id: string;
  urgentPostId: string;
  supplierId: string;
  supplier: User;
  quantity: number;
  unitPrice: number;
  status: 'intention' | 'confirmed' | 'shipped' | 'received';
  remark: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  supplierId: string;
  supplier: User;
  carPlatform: CarPlatform;
  partName: string;
  partNumber: string;
  conditionType: 'new' | 'used' | 'refurbished';
  stockQty: number;
  unitPrice: number;
  shippingFee: number;
  sourceCity: string;
  canShipToday: boolean;
  images: string[];
  tags: string[];
  createdAt: string;
}

export interface CarPlatform {
  brand: string;
  series: string;
  year: string;
  model: string;
  platformCode?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'deposited'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'adapt_confirmed'
  | 'completed'
  | 'disputing'
  | 'cancelled';

export interface RelaySubOrderSnapshot {
  subOrderId: string;
  supplierId: string;
  supplierName: string;
  supplierAvatar: string;
  supplierCity: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  shippingFee: number;
  totalAmount: number;
  depositAmount: number;
  status: OrderStatus;
}

export interface GuaranteeOrder {
  id: string;
  orderNo: string;
  buyerId: string;
  buyer: User;
  supplierId: string;
  supplier: User;
  sourceType: 'urgent' | 'stock' | 'relay';
  sourceId: string;
  sourceQuoteId?: string;
  partInfo: PartSnapshot;
  totalAmount: number;
  depositAmount: number;
  finalAmount: number;
  shippingFee: number;
  status: OrderStatus;
  timeline: OrderTimelineItem[];
  relayOrderIds?: string[];
  isRelayParent?: boolean;
  relaySubOrders?: string[];
  relaySummary?: { totalSuppliers: number; totalQty: number; totalAmount: number };
  relaySubOrderSnapshots?: RelaySubOrderSnapshot[];
  adaptConfirm?: AdaptConfirm;
  dispute?: DisputeRecord;
  createdAt: string;
}

export interface PartSnapshot {
  partName: string;
  partNumber?: string;
  carPlatform: CarPlatform;
  quantity: number;
  unitPrice: number;
  conditionType: 'new' | 'used' | 'refurbished';
  images: string[];
  quoteSnapshot?: Quote;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  timestamp: string;
  operatorId: string;
  remark: string;
  images?: string[];
}

export interface AdaptConfirm {
  confirmed: boolean;
  result: 'fit' | 'wrong' | 'partial' | 'pending';
  images: string[];
  remark: string;
  confirmedAt: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  applicantId: string;
  reason: string;
  evidenceImages: string[];
  frozenAmount: number;
  status: 'pending' | 'mediating' | 'resolved_buyer' | 'resolved_supplier' | 'resolved_split';
  arbitratorRemark?: string;
  resolutionAmount?: { buyer: number; supplier: number };
  createdAt: string;
  resolvedAt?: string;
}

export interface ChatSession {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  lastMessage: ChatMessage;
  unreadCount: number;
  groupInfo?: GroupInfo;
  updatedAt: string;
}

export interface GroupInfo {
  name: string;
  avatar: string;
  ownerId: string;
  memberCount: number;
  isYellowPage: boolean;
  memberReputationRank?: GroupMemberRank[];
}

export interface GroupMemberRank {
  userId: string;
  reputationScore: number;
  dealCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  type: 'text' | 'image' | 'voice' | 'quote' | 'part_card' | 'order_card' | 'system';
  content: string;
  payload?: QuotePayload | PartCardPayload | OrderCardPayload;
  timestamp: string;
  readBy: string[];
}

export interface QuotePayload {
  urgentPostId: string;
  price: number;
  shippingFee: number;
  canShipToday: boolean;
}

export interface PartCardPayload {
  stockId: string;
  partName: string;
  price: number;
  supplierName: string;
}

export interface OrderCardPayload {
  orderId: string;
  orderNo: string;
  status: OrderStatus;
  amount: number;
}

export type SortType = 'price_asc' | 'price_desc' | 'distance' | 'reputation' | 'speed';

export type AfterSalesAlertType = 'pending_inspection' | 'near_timeout' | 'in_dispute';

export interface AfterSalesAlert {
  id: string;
  orderId: string;
  type: AfterSalesAlertType;
  title: string;
  description: string;
  deadlineAt?: string;
  createdAt: string;
}
