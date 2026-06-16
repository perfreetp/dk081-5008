import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Mic,
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  TrendingUp,
  Package,
} from "lucide-react";
import { useStockStore, StockFilter } from "@/stores/stockStore";
import { SortType, StockItem } from "@/types";
import StockCard from "@/components/business/StockCard";
import FilterPanel from "@/components/business/FilterPanel";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const quickFilters = [
  { key: "all", label: "全部", icon: <Package size={14} /> },
  { key: "hot", label: "热销", icon: <TrendingUp size={14} /> },
  { key: "today", label: "当天发", icon: <Zap size={14} /> },
  { key: "new", label: "全新", icon: <Star size={14} /> },
  { key: "used", label: "拆车件", icon: <Package size={14} /> },
];

type SortTab = "reputation" | "price_asc" | "price_desc" | "distance" | "speed";

const sortTabs: { key: SortTab; label: string; icon: React.ReactNode }[] = [
  { key: "reputation", label: "信誉", icon: <Star size={14} /> },
  { key: "price_asc", label: "价格↑", icon: <ArrowUpDown size={14} /> },
  { key: "price_desc", label: "价格↓", icon: <ArrowUpDown size={14} /> },
  { key: "distance", label: "距离", icon: <MapPin size={14} /> },
  { key: "speed", label: "发货快", icon: <Zap size={14} /> },
];

export default function StockList() {
  const navigate = useNavigate();
  const {
    stockItems,
    filters,
    sortType,
    isLoading,
    fetchStockItems,
    setFilters,
    setSortType,
    resetFilters,
    getFilteredStockItems,
  } = useStockStore();

  const [searchValue, setSearchValue] = useState(filters.keyword || "");
  const [includeShipping, setIncludeShipping] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [sortTab, setSortTab] = useState<SortTab>(sortType as SortTab);

  useEffect(() => {
    fetchStockItems();
  }, [fetchStockItems]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.brand ? 1 : 0,
      filters.category ? 1 : 0,
      (filters.conditionType?.length || 0) > 0 ? 1 : 0,
      filters.canShipTodayOnly ? 1 : 0,
      filters.verifiedOnly ? 1 : 0,
      filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
  }, [filters]);

  const displayItems = useMemo(() => {
    let items = getFilteredStockItems();

    if (activeQuickFilter === "hot") {
      items = items.filter((item) => item.tags.includes("热销"));
    } else if (activeQuickFilter === "today") {
      items = items.filter((item) => item.canShipToday);
    } else if (activeQuickFilter === "new") {
      items = items.filter((item) => item.conditionType === "new");
    } else if (activeQuickFilter === "used") {
      items = items.filter((item) => item.conditionType === "used");
    }

    return items;
  }, [getFilteredStockItems, activeQuickFilter]);

  const handleSearch = () => {
    setFilters({ keyword: searchValue });
  };

  const handleSortChange = (key: SortTab) => {
    setSortTab(key);
    setSortType(key as SortType);
  };

  const handleApplyFilters = (newFilters: StockFilter) => {
    setFilters(newFilters);
  };

  const handleCardClick = (item: StockItem) => {
    navigate(`/stock/${item.id}`);
  };

  const scrollContainerRef = (el: HTMLDivElement | null) => {
    if (!el) return;
  };

  const scrollQuickFilters = (direction: "left" | "right") => {
    const el = document.getElementById("quick-filter-scroll");
    if (el) {
      el.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 pb-24">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-white to-white/95 backdrop-blur-md">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-primary-400 focus-within:shadow-md focus-within:shadow-primary-500/10 transition-all"
            >
              <Search size={18} className="text-ink-400 flex-shrink-0" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索配件名称、OE号、品牌..."
                className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600"
              >
                <Mic size={16} />
              </motion.button>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterOpen(true)}
              className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <SlidersHorizontal size={20} className="text-ink-600" />
              {activeFilterCount > 0 && (
                <motion.span
                  key={activeFilterCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="relative px-2 pb-3">
          <button
            onClick={() => scrollQuickFilters("left")}
            className="absolute left-0 top-1/2 z-10 flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg bg-gradient-to-r from-white via-white to-transparent"
          >
            <ChevronLeft size={16} className="text-ink-400" />
          </button>
          <div
            id="quick-filter-scroll"
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {quickFilters.map((filter, idx) => (
              <motion.div
                key={filter.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex-shrink-0"
              >
                <Chip
                  variant={activeQuickFilter === filter.key ? "primary" : "default"}
                  size="md"
                  selected={activeQuickFilter === filter.key}
                  icon={filter.icon}
                  onSelect={() => setActiveQuickFilter(filter.key)}
                >
                  {filter.label}
                </Chip>
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => scrollQuickFilters("right")}
            className="absolute right-0 top-1/2 z-10 flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded-l-lg bg-gradient-to-l from-white via-white to-transparent"
          >
            <ChevronRight size={16} className="text-ink-400" />
          </button>
        </div>

        <div className="border-t border-gray-100 bg-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="relative flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {sortTabs.map((tab) => {
                const isActive = sortTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleSortChange(tab.key)}
                    className="relative flex-shrink-0 px-3 py-2"
                  >
                    <span
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium transition-colors",
                        isActive ? "text-primary-600" : "text-ink-500 hover:text-ink-700"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="sortTabIndicator"
                        className="absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="relative flex rounded-xl border border-gray-200 bg-gray-50 p-0.5"
              >
                <button
                  onClick={() => setIncludeShipping(false)}
                  className={cn(
                    "relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    !includeShipping ? "text-primary-700" : "text-ink-500"
                  )}
                >
                  不含运
                </button>
                <button
                  onClick={() => setIncludeShipping(true)}
                  className={cn(
                    "relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    includeShipping ? "text-primary-700" : "text-ink-500"
                  )}
                >
                  含运费
                </button>
                <AnimatePresence initial={false}>
                  <motion.div
                    layoutId="shippingToggleBg"
                    className="absolute top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-lg bg-white shadow-sm"
                    animate={{ x: includeShipping ? "calc(100% + 0px)" : "0px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-ink-50/80 px-4 py-2">
          <span className="text-xs text-ink-500">
            共 <span className="font-semibold text-ink-700">{displayItems.length}</span> 件现货
          </span>
          <div className="flex items-center gap-1 text-xs text-ink-500">
            <MapPin size={12} />
            <span>上海 · 已定位</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden rounded-2xl bg-white shadow-card"
              >
                <div className="aspect-[4/3] animate-shimmer bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 animate-shimmer rounded bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]" />
                  <div className="h-3 w-1/2 animate-shimmer rounded bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]" />
                  <div className="h-5 w-1/3 animate-shimmer rounded bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
              <Package size={40} className="text-ink-300" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-ink-600">暂无符合条件的现货</h3>
            <p className="mb-4 text-sm text-ink-400">试试调整筛选条件或清除筛选</p>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              清除所有筛选
            </Button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    layout: { type: "spring", stiffness: 400, damping: 30 },
                    opacity: { duration: 0.2 },
                    delay: idx % 4 * 0.03,
                  }}
                >
                  <StockCard
                    item={item}
                    includeShipping={includeShipping}
                    layoutId={`card-${item.id}`}
                    onClick={() => handleCardClick(item)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={resetFilters}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2"
      >
        <div className="flex items-center gap-1 rounded-full bg-white shadow-xl shadow-ink-700/10 border border-gray-100 px-2 py-1.5">
          <div className="flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5">
            <Package size={14} className="text-primary-600" />
            <span className="text-xs font-semibold text-primary-700">现货</span>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors">
            <Zap size={14} />
            <span>急件</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
