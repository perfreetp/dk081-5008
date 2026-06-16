import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Truck, Package, Star } from "lucide-react";
import { StockItem } from "@/types";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StockCardProps {
  item: StockItem;
  includeShipping?: boolean;
  onClick?: () => void;
  layoutId?: string;
}

const conditionLabel: Record<string, { label: string; variant: "success" | "info" | "warning" }> = {
  new: { label: "全新", variant: "success" },
  used: { label: "拆车件", variant: "info" },
  refurbished: { label: "再制造", variant: "warning" },
};

export default function StockCard({
  item,
  includeShipping = false,
  onClick,
  layoutId,
}: StockCardProps) {
  const totalPrice = item.unitPrice + (includeShipping ? item.shippingFee : 0);
  const condition = conditionLabel[item.conditionType] || conditionLabel.used;
  const distance = Math.floor(Math.random() * 500) + 10;

  return (
    <motion.div layout layoutId={layoutId}>
      <Card
        variant="elevated"
        padding="none"
        clickable
        hoverable
        onClick={onClick}
        className="w-full"
      >
        <div className="relative">
          <div className="aspect-[4/3] w-full overflow-hidden bg-ink-50">
            <img
              src={item.images[0]}
              alt={item.partName}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </div>

          <div className="absolute left-2 top-2 flex flex-col gap-1.5">
            {item.canShipToday && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                <Badge variant="success" size="sm" icon={<Truck size={10} />}>
                  当天发
                </Badge>
              </motion.div>
            )}
            <Badge variant={condition.variant} size="sm">
              {condition.label}
            </Badge>
          </div>

          {item.supplier.verified && (
            <div className="absolute right-2 top-2">
              <Badge variant="reputation-high" size="sm" dot>
                认证
              </Badge>
            </div>
          )}

          <div className="absolute bottom-2 left-2">
            <Badge variant="default" size="sm" icon={<MapPin size={10} />}>
              {item.sourceCity} · {distance}km
            </Badge>
          </div>
        </div>

        <div className="p-3">
          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold text-ink-700">
            {item.partName}
          </h3>

          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs text-ink-400">
              {item.carPlatform.brand} {item.carPlatform.series}
            </span>
            <span className="text-xs text-ink-300">|</span>
            <span className="text-xs text-ink-400">{item.partNumber}</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-600"
              >
                {tag}
              </motion.span>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {includeShipping ? (
              <motion.div
                key="with-shipping"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-accent-600">
                        ¥{totalPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-ink-400">含运费</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-400">
                      <span>货值 ¥{item.unitPrice.toLocaleString()}</span>
                      <span className="text-success-600">运费 ¥{item.shippingFee}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package size={12} className="text-ink-400" />
                    <span className="text-xs text-ink-500">{item.stockQty}件</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="without-shipping"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-accent-600">
                        ¥{item.unitPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-ink-400">/件</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package size={12} className="text-ink-400" />
                    <span className="text-xs text-ink-500">{item.stockQty}件</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={item.supplier.avatar}
                  alt={item.supplier.name}
                  className="h-7 w-7 rounded-full border-2 border-white bg-ink-100 object-cover"
                />
                {item.supplier.reputation.starRating >= 4.8 && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500">
                    <Star size={8} className="text-white fill-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="max-w-[100px] truncate text-xs font-medium text-ink-600">
                  {item.supplier.company}
                </span>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-semibold text-amber-600">
                    {item.supplier.reputation.starRating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-ink-400">
                    · {item.supplier.reputation.totalDeals}笔
                  </span>
                </div>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium",
                item.stockQty >= 5
                  ? "bg-success-50 text-success-700"
                  : item.stockQty >= 2
                  ? "bg-warning-50 text-warning-700"
                  : "bg-danger-50 text-danger-700"
              )}
            >
              {item.stockQty >= 5 ? "库存充足" : item.stockQty >= 2 ? "库存紧张" : "仅剩1件"}
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
