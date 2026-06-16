import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Star,
  MapPin,
  Truck,
  Shield,
  Check,
  X,
  Phone,
  MessageSquare,
  Package,
  Calendar,
  FileCheck,
  AlertTriangle,
  Loader2,
  Lock,
  Sparkles,
  Handshake,
} from "lucide-react";
import { useStockStore } from "@/stores/stockStore";
import { StockItem } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

const conditionLabel: Record<string, { label: string; variant: "success" | "info" | "warning" }> = {
  new: { label: "全新", variant: "success" },
  used: { label: "拆车件", variant: "info" },
  refurbished: { label: "再制造", variant: "warning" },
};

export default function StockDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStockItemById } = useStockStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [guaranteeStep, setGuaranteeStep] = useState<"confirm" | "locking" | "success">("confirm");
  const [lockingProgress, setLockingProgress] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const item: StockItem | undefined = id ? getStockItemById(id) : undefined;

  useEffect(() => {
    if (guaranteeStep === "locking") {
      setLockingProgress(0);
      const interval = setInterval(() => {
        setLockingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setGuaranteeStep("success"), 300);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [guaranteeStep]);

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50">
        <Package size={48} className="mb-4 text-ink-300" />
        <p className="mb-4 text-ink-500">未找到该商品</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          返回上一页
        </Button>
      </div>
    );
  }

  const condition = conditionLabel[item.conditionType] || conditionLabel.used;
  const depositAmount = Math.round((item.unitPrice + item.shippingFee) * quantity * 0.3);
  const totalAmount = (item.unitPrice + item.shippingFee) * quantity;
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(item.supplier.reputation.starRating));

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
  };

  const handleInitiateGuarantee = () => {
    setGuaranteeStep("confirm");
    setShowGuaranteeModal(true);
  };

  const handleConfirmDeposit = () => {
    setGuaranteeStep("locking");
  };

  const handleCloseModal = () => {
    setShowGuaranteeModal(false);
    setTimeout(() => {
      setGuaranteeStep("confirm");
      setLockingProgress(0);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-ink-50 pb-28">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ChevronLeft size={22} className="text-ink-700" />
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFavorited(!isFavorited)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            >
              <motion.div animate={{ scale: isFavorited ? [1, 1.2, 1] : 1 }}>
                <Heart
                  size={20}
                  className={isFavorited ? "fill-accent-500 text-accent-500" : "text-ink-500"}
                />
              </motion.div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            >
              <Share2 size={20} className="text-ink-500" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="relative bg-white">
        <div className="relative aspect-square w-full overflow-hidden bg-ink-100">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={item.images[currentImageIndex]}
              alt={item.partName}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>

          {item.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                <ChevronRight size={20} className="text-white" />
              </button>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {item.images.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                animate={{
                  width: idx === currentImageIndex ? 24 : 8,
                  backgroundColor: idx === currentImageIndex ? "rgba(255,107,53,1)" : "rgba(255,255,255,0.6)",
                }}
                transition={{ duration: 0.25 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {item.images.map((img, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentImageIndex(idx)}
              className={cn(
                "flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                idx === currentImageIndex ? "border-accent-500" : "border-transparent opacity-60"
              )}
            >
              <img src={img} alt="" className="h-14 w-14 object-cover" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-2 bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={condition.variant}>{condition.label}</Badge>
              {item.canShipToday && (
                <Badge variant="success" icon={<Truck size={10} />}>
                  当天发
                </Badge>
              )}
              {item.tags.includes("热销") && (
                <Badge variant="urgent" dot>
                  热销
                </Badge>
              )}
              {item.tags.includes("可议价") && <Badge variant="info">可议价</Badge>}
            </div>
            <h1 className="text-lg font-bold leading-snug text-ink-800">{item.partName}</h1>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-accent-600">¥{item.unitPrice.toLocaleString()}</span>
          <span className="text-sm text-ink-400">/件</span>
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-success-50 px-2 py-1">
            <Truck size={12} className="text-success-600" />
            <span className="text-xs font-medium text-success-700">运费 ¥{item.shippingFee}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <MapPin size={12} />
          <span>发货地：{item.sourceCity}</span>
          <span className="text-ink-300">|</span>
          <Package size={12} />
          <span>库存 {item.stockQty} 件</span>
        </div>
      </div>

      <Card variant="default" className="mx-4 mt-3 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-700">
          <FileCheck size={16} className="text-primary-600" />
          件源信息
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-400">适配品牌</span>
            <span className="font-medium text-ink-700">{item.carPlatform.brand}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-400">车系车型</span>
            <span className="font-medium text-ink-700">{item.carPlatform.model}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-400">OE号</span>
            <span className="font-mono font-medium text-primary-700">{item.partNumber}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-400">配件分类</span>
            <span className="font-medium text-ink-700">{item.tags[item.tags.length - 1] || "-"}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Chip key={tag} size="sm" variant="ghost">
              {tag}
            </Chip>
          ))}
        </div>
      </Card>

      <Card variant="default" className="mx-4 mt-3 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-700">
          <Shield size={16} className="text-amber-500" />
          商家信誉
        </h3>
        <div className="flex items-start gap-3">
          <div className="relative">
            <img
              src={item.supplier.avatar}
              alt={item.supplier.name}
              className="h-14 w-14 rounded-2xl border-2 border-amber-100 object-cover"
            />
            {item.supplier.verified && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-sm">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-ink-700">{item.supplier.company}</h4>
              {item.supplier.verified && (
                <Badge variant="reputation-high" size="sm" dot>
                  金牌商家
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1">
              {stars.map((filled, i) => (
                <Star
                  key={i}
                  size={12}
                  className={filled ? "fill-amber-500 text-amber-500" : "text-ink-200"}
                />
              ))}
              <span className="ml-1 text-xs font-bold text-amber-600">
                {item.supplier.reputation.starRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <motion.div
            whileHover={{ y: -2 }}
            className="flex flex-col items-center rounded-xl bg-gradient-to-br from-success-50 to-success-100/50 p-3"
          >
            <div className="mb-1 text-xl font-black text-success-600">
              {Math.round((1 - item.supplier.reputation.pigeonRate) * 100)}%
            </div>
            <div className="text-[10px] text-success-700">履约率</div>
            <div className="mt-0.5 text-[10px] text-success-600/70">
              放鸽子率 {(item.supplier.reputation.pigeonRate * 100).toFixed(1)}%
            </div>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            className="flex flex-col items-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-3"
          >
            <div className="mb-1 text-xl font-black text-primary-600">
              {item.supplier.reputation.totalDeals}
            </div>
            <div className="text-[10px] text-primary-700">成交笔数</div>
            <div className="mt-0.5 text-[10px] text-primary-600/70">累计交易</div>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            className="flex flex-col items-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-3"
          >
            <div className="mb-1 text-xl font-black text-amber-600">
              {Math.round(item.supplier.reputation.positiveRate * 100)}%
            </div>
            <div className="text-[10px] text-amber-700">好评率</div>
            <div className="mt-0.5 text-[10px] text-amber-600/70">买家评价</div>
          </motion.div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.supplier.reputation.quickTags.map((tag) => (
            <Chip key={tag} size="sm" variant="primary">
              <Sparkles size={10} />
              {tag}
            </Chip>
          ))}
        </div>
      </Card>

      <Card variant="default" className="mx-4 mt-3 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-700">
          <Package size={16} className="text-primary-600" />
          库存状态
        </h3>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1",
                item.stockQty >= 5
                  ? "bg-success-50 text-success-700"
                  : item.stockQty >= 2
                  ? "bg-warning-50 text-warning-700"
                  : "bg-danger-50 text-danger-700"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  item.stockQty >= 5
                    ? "bg-success-500 animate-pulse"
                    : item.stockQty >= 2
                    ? "bg-warning-500 animate-pulse"
                    : "bg-danger-500 animate-pulse"
                )}
              />
              <span className="text-xs font-semibold">
                {item.stockQty >= 5
                  ? "库存充足"
                  : item.stockQty >= 2
                  ? "库存紧张"
                  : "仅剩1件，欲购从速"}
              </span>
            </div>
          </div>
          <span className="text-sm font-bold text-ink-700">x {item.stockQty} 件</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((item.stockQty / 20) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              item.stockQty >= 5
                ? "bg-gradient-to-r from-success-400 to-success-500"
                : item.stockQty >= 2
                ? "bg-gradient-to-r from-warning-400 to-warning-500"
                : "bg-gradient-to-r from-danger-400 to-danger-500"
            )}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            上架于 {new Date(item.createdAt).toLocaleDateString("zh-CN")}
          </span>
          <span className="flex items-center gap-1">
            <Truck size={11} />
            {item.canShipToday ? "当日17点前下单可发货" : "48小时内发货"}
          </span>
        </div>
      </Card>

      <Card variant="default" className="mx-4 mt-3 mb-4 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-700">
          <Shield size={16} className="text-primary-600" />
          平台担保交易
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-xl bg-primary-50/50 p-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
              <Lock size={14} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-700">保证金锁定机制</p>
              <p className="mt-0.5 text-[11px] text-primary-600/80">
                支付30%保证金，卖家备货，买家验收无误后放款
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-success-50/50 p-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-success-100">
              <AlertTriangle size={14} className="text-success-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-success-700">7天适配期保障</p>
              <p className="mt-0.5 text-[11px] text-success-600/80">
                安装不合适可申请退换，平台仲裁保障权益
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50/50 p-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Handshake size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700">错发必赔承诺</p>
              <p className="mt-0.5 text-[11px] text-amber-600/80">
                卖家发错货承担往返运费并赔付订单金额5%
              </p>
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showGuaranteeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
              onClick={handleCloseModal}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-ink-200" />

              {guaranteeStep === "confirm" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-ink-800">发起担保交易</h2>
                      <p className="mt-1 text-xs text-ink-500">平台将锁定保证金保障交易安全</p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100"
                    >
                      <X size={18} className="text-ink-500" />
                    </button>
                  </div>

                  <div className="mb-4 rounded-2xl bg-ink-50 p-4">
                    <div className="flex gap-3">
                      <img
                        src={item.images[0]}
                        alt=""
                        className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold text-ink-700">
                          {item.partName}
                        </h3>
                        <p className="mt-1 text-xs text-ink-400">{item.partNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium text-ink-600">购买数量</label>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-600"
                      >
                        -
                      </motion.button>
                      <span className="w-12 text-center text-lg font-bold text-ink-800">
                        {quantity}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity((q) => Math.min(item.stockQty, q + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-600"
                      >
                        +
                      </motion.button>
                      <span className="ml-auto text-xs text-ink-400">最多 {item.stockQty} 件</span>
                    </div>
                  </div>

                  <div className="mb-5 space-y-2 rounded-2xl border border-primary-100 bg-primary-50/30 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-500">货值 ({quantity}件)</span>
                      <span className="font-medium text-ink-700">
                        ¥{(item.unitPrice * quantity).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-500">运费</span>
                      <span className="font-medium text-success-600">¥{item.shippingFee}</span>
                    </div>
                    <div className="h-px bg-primary-100" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-500">订单总额</span>
                      <span className="text-lg font-bold text-ink-800">
                        ¥{totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Lock size={12} />
                        需锁定保证金 (30%)
                      </span>
                      <span className="text-lg font-black text-accent-600">
                        ¥{depositAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button variant="primary" size="lg" block onClick={handleConfirmDeposit}>
                    支付保证金 ¥{depositAmount.toLocaleString()}
                  </Button>

                  <p className="mt-3 text-center text-[11px] text-ink-400">
                    点击即表示同意《平台担保交易服务协议》
                  </p>
                </motion.div>
              )}

              {guaranteeStep === "locking" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 pb-12 text-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0"
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600" />
                      </motion.div>
                      <div className="flex h-12 w-12 items-center justify-center">
                        <Lock size={22} className="text-primary-600" />
                      </div>
                    </div>
                  </motion.div>

                  <h2 className="mb-2 text-lg font-bold text-ink-800">正在锁定保证金...</h2>
                  <p className="mb-6 text-sm text-ink-500">
                    正在为您锁定 ¥{depositAmount.toLocaleString()} 保证金，请稍候
                  </p>

                  <div className="mx-auto mb-3 max-w-xs h-2 overflow-hidden rounded-full bg-ink-100">
                    <motion.div
                      animate={{ width: `${lockingProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                    />
                  </div>
                  <p className="text-xs font-mono text-ink-400">{lockingProgress}%</p>

                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Check size={12} className="text-success-500" />
                      卖家身份已核验
                    </span>
                    <span className="flex items-center gap-1">
                      <Check size={12} className="text-success-500" />
                      库存已锁定
                    </span>
                  </div>
                </motion.div>
              )}

              {guaranteeStep === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="p-8 pb-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-success-400 to-success-500 shadow-lg shadow-success-500/30"
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
                    >
                      <Check size={44} className="text-white" strokeWidth={3.5} />
                    </motion.div>
                  </motion.div>

                  <h2 className="mb-2 text-xl font-bold text-ink-800">保证金锁定成功</h2>
                  <p className="mb-6 text-sm text-ink-500">
                    担保订单已创建，请等待卖家确认备货
                  </p>

                  <div className="mb-6 rounded-2xl bg-success-50 p-4 text-left">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-success-700">锁定保证金</span>
                      <span className="text-sm font-bold text-success-700">
                        ¥{depositAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-ink-500">订单总额</span>
                      <span className="text-sm font-medium text-ink-700">
                        ¥{totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-success-100 my-2" />
                    <div className="flex items-center gap-2 text-[11px] text-success-600">
                      <Shield size={12} />
                      <span>
                        卖家需在 {item.canShipToday ? "24小时" : "48小时"} 内确认并发货
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" block onClick={handleCloseModal}>
                      返回详情
                    </Button>
                    <Button variant="primary" size="lg" block>
                      查看订单
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(15,39,72,0.06)]">
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-ink-500 hover:text-ink-700"
          >
            <Phone size={18} />
            <span className="mt-0.5 text-[10px]">电话</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-ink-500 hover:text-ink-700"
          >
            <MessageSquare size={18} />
            <span className="mt-0.5 text-[10px]">聊天</span>
          </motion.button>
          <div className="mx-1 h-8 w-px bg-gray-200" />
          <Button variant="secondary" size="md" block>
            <span className="text-sm text-ink-500">单独购买</span>
          </Button>
          <Button variant="primary" size="md" block onClick={handleInitiateGuarantee}>
            <Shield size={16} />
            担保购买
          </Button>
        </div>
      </div>
    </div>
  );
}
