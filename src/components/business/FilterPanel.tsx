import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Calendar, Layers, MapPin, Sparkles, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import { StockFilter } from "@/stores/stockStore";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: StockFilter;
  onApply: (filters: StockFilter) => void;
  onReset: () => void;
}

const brands = [
  "宝马", "奔驰", "奥迪", "大众", "丰田", "本田", "特斯拉", "比亚迪",
  "保时捷", "雷克萨斯", "沃尔沃", "长城", "马自达", "蔚来", "通用", "米其林",
];

const years = [
  "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016及以前",
];

const categories = [
  "外观覆盖件", "照明系统", "制动系统", "悬挂系统", "转向系统",
  "发动机系统", "变速箱系统", "进排气系统", "燃油系统", "空调系统",
  "电子电器", "轮胎轮毂", "车身附件", "新能源系统",
];

const cities = [
  { name: "全市", range: 0 },
  { name: "50km内", range: 50 },
  { name: "100km内", range: 100 },
  { name: "200km内", range: 200 },
  { name: "500km内", range: 500 },
  { name: "全国", range: -1 },
];

const conditions = [
  { value: "new", label: "全新件", color: "success" },
  { value: "used", label: "拆车件", color: "info" },
  { value: "refurbished", label: "再制造", color: "warning" },
];

const priceRanges = [
  { label: "全部", min: undefined, max: undefined },
  { label: "500以下", min: undefined, max: 500 },
  { label: "500-1000", min: 500, max: 1000 },
  { label: "1000-3000", min: 1000, max: 3000 },
  { label: "3000-5000", min: 3000, max: 5000 },
  { label: "5000以上", min: 5000, max: undefined },
];

type FilterSection = "brand" | "year" | "category" | "city" | "condition";

const sections: { key: FilterSection; label: string; icon: React.ReactNode }[] = [
  { key: "brand", label: "品牌车型", icon: <Car size={18} /> },
  { key: "year", label: "年款", icon: <Calendar size={18} /> },
  { key: "category", label: "配件分类", icon: <Layers size={18} /> },
  { key: "city", label: "城市范围", icon: <MapPin size={18} /> },
  { key: "condition", label: "成色", icon: <Sparkles size={18} /> },
];

export default function FilterPanel({
  open,
  onClose,
  filters,
  onApply,
  onReset,
}: FilterPanelProps) {
  const [activeSection, setActiveSection] = useState<FilterSection>("brand");
  const [localFilters, setLocalFilters] = useState<StockFilter>(filters);

  const toggleBrand = (brand: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      brand: prev.brand === brand ? undefined : brand,
    }));
  };

  const toggleYear = (year: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      tags: prev.tags?.includes(`year:${year}`)
        ? prev.tags.filter((t) => t !== `year:${year}`)
        : [...(prev.tags || []), `year:${year}`],
    }));
  };

  const toggleCategory = (category: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const setCityRange = (range: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => !t.startsWith("city:")) || [],
      ...(range >= 0 ? { tags: [...(prev.tags || []), `city:${range}`] } : {}),
    }));
  };

  const toggleCondition = (value: "new" | "used" | "refurbished") => {
    setLocalFilters((prev) => {
      const current = prev.conditionType || [];
      const exists = current.includes(value);
      return {
        ...prev,
        conditionType: exists ? current.filter((c) => c !== value) : [...current, value],
      };
    });
  };

  const setPriceRange = (min?: number, max?: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      priceMin: min,
      priceMax: max,
    }));
  };

  const toggleShipToday = () => {
    setLocalFilters((prev) => ({
      ...prev,
      canShipTodayOnly: !prev.canShipTodayOnly,
    }));
  };

  const toggleVerified = () => {
    setLocalFilters((prev) => ({
      ...prev,
      verifiedOnly: !prev.verifiedOnly,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: StockFilter = {
      keyword: "",
      category: "",
      brand: "",
      conditionType: [],
      priceMin: undefined,
      priceMax: undefined,
      stockQtyMin: 1,
      canShipTodayOnly: false,
      verifiedOnly: false,
      tags: [],
    };
    setLocalFilters(defaultFilters);
    onReset();
  };

  const activeFilterCount = [
    localFilters.brand ? 1 : 0,
    localFilters.category ? 1 : 0,
    (localFilters.conditionType?.length || 0) > 0 ? 1 : 0,
    (localFilters.tags?.filter((t) => t.startsWith("year:")).length || 0) > 0 ? 1 : 0,
    localFilters.canShipTodayOnly ? 1 : 0,
    localFilters.verifiedOnly ? 1 : 0,
    localFilters.priceMin !== undefined || localFilters.priceMax !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const selectedCityRange = localFilters.tags?.find((t) => t.startsWith("city:"));
  const selectedCityRangeValue = selectedCityRange ? parseInt(selectedCityRange.split(":")[1]) : 0;
  const selectedYearTags = localFilters.tags?.filter((t) => t.startsWith("year:")) || [];
  const selectedPriceRange = priceRanges.find(
    (r) => r.min === localFilters.priceMin && r.max === localFilters.priceMax
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                  <SlidersHorizontal size={18} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink-700">筛选条件</h2>
                  <p className="text-xs text-ink-400">
                    已选 <span className="font-semibold text-accent-600">{activeFilterCount}</span> 项条件
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
              >
                <X size={18} className="text-ink-500" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-28 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-ink-50/50 py-2">
                {sections.map((section) => {
                  const isActive = activeSection === section.key;
                  let hasSelection = false;
                  if (section.key === "brand") hasSelection = !!localFilters.brand;
                  if (section.key === "year") hasSelection = selectedYearTags.length > 0;
                  if (section.key === "category") hasSelection = !!localFilters.category;
                  if (section.key === "city") hasSelection = !!selectedCityRange || selectedCityRangeValue === 0;
                  if (section.key === "condition") hasSelection = (localFilters.conditionType?.length || 0) > 0;

                  return (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={cn(
                        "relative w-full px-3 py-3 text-left transition-all",
                        isActive
                          ? "bg-white font-semibold text-primary-600"
                          : "text-ink-500 hover:bg-white/50"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="filterSectionIndicator"
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-600"
                        />
                      )}
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={isActive ? "text-primary-600" : "text-ink-400"}>
                          {section.icon}
                        </span>
                        <span className="text-xs leading-tight">{section.label}</span>
                      </div>
                      {hasSelection && !isActive && (
                        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-500" />
                      )}
                    </button>
                  );
                })}

                <div className="mt-4 px-3 pb-4">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <h3 className="mb-2 text-xs font-semibold text-ink-600">快捷筛选</h3>
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-xs text-ink-600">当天可发货</span>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleShipToday}
                          className={cn(
                            "relative h-5 w-9 rounded-full transition-colors",
                            localFilters.canShipTodayOnly ? "bg-primary-600" : "bg-gray-300"
                          )}
                        >
                          <motion.div
                            animate={{ x: localFilters.canShipTodayOnly ? 18 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                          />
                        </motion.div>
                      </label>
                      <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-xs text-ink-600">仅认证商家</span>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleVerified}
                          className={cn(
                            "relative h-5 w-9 rounded-full transition-colors",
                            localFilters.verifiedOnly ? "bg-primary-600" : "bg-gray-300"
                          )}
                        >
                          <motion.div
                            animate={{ x: localFilters.verifiedOnly ? 18 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                          />
                        </motion.div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  {activeSection === "brand" && (
                    <motion.div
                      key="brand"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-ink-700">选择品牌</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {brands.map((brand) => (
                          <Chip
                            key={brand}
                            variant="outline"
                            size="md"
                            selected={localFilters.brand === brand}
                            onSelect={() => toggleBrand(brand)}
                          >
                            {brand}
                          </Chip>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "year" && (
                    <motion.div
                      key="year"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-ink-700">选择年款（可多选）</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {years.map((year) => (
                          <Chip
                            key={year}
                            variant="outline"
                            size="md"
                            selected={selectedYearTags.includes(`year:${year}`)}
                            onSelect={() => toggleYear(year)}
                          >
                            {year}
                          </Chip>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "category" && (
                    <motion.div
                      key="category"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-ink-700">配件分类</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <Chip
                            key={cat}
                            variant="outline"
                            size="md"
                            selected={localFilters.category === cat}
                            onSelect={() => toggleCategory(cat)}
                          >
                            {cat}
                          </Chip>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h3 className="mb-3 text-sm font-semibold text-ink-700">价格区间</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {priceRanges.map((range) => (
                            <Chip
                              key={range.label}
                              variant="outline"
                              size="md"
                              selected={selectedPriceRange?.label === range.label}
                              onSelect={() => setPriceRange(range.min, range.max)}
                            >
                              {range.label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "city" && (
                    <motion.div
                      key="city"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-ink-700">配送范围</h3>
                      <div className="space-y-2">
                        {cities.map((city) => {
                          const isSelected =
                            (city.range === 0 && !selectedCityRange) ||
                            selectedCityRangeValue === city.range;
                          return (
                            <motion.button
                              key={city.name}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCityRange(city.range)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
                                isSelected
                                  ? "border-primary-500 bg-primary-50"
                                  : "border-gray-100 bg-white hover:border-gray-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <MapPin
                                  size={18}
                                  className={isSelected ? "text-primary-600" : "text-ink-400"}
                                />
                                <span
                                  className={cn(
                                    "font-medium",
                                    isSelected ? "text-primary-700" : "text-ink-600"
                                  )}
                                >
                                  {city.name}
                                </span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600"
                                >
                                  <Check size={14} className="text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "condition" && (
                    <motion.div
                      key="condition"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-ink-700">成色选择（可多选）</h3>
                      <div className="space-y-3">
                        {conditions.map((cond) => {
                          const isSelected = localFilters.conditionType?.includes(
                            cond.value as "new" | "used" | "refurbished"
                          );
                          const colorClasses = {
                            success: {
                              bg: "bg-success-50",
                              border: "border-success-300",
                              text: "text-success-700",
                              active: "border-success-500 bg-success-50",
                            },
                            info: {
                              bg: "bg-blue-50",
                              border: "border-blue-300",
                              text: "text-blue-700",
                              active: "border-blue-500 bg-blue-50",
                            },
                            warning: {
                              bg: "bg-warning-50",
                              border: "border-warning-300",
                              text: "text-warning-700",
                              active: "border-warning-500 bg-warning-50",
                            },
                          } as const;
                          const c = colorClasses[cond.color as keyof typeof colorClasses];

                          return (
                            <motion.button
                              key={cond.value}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => toggleCondition(cond.value as "new" | "used" | "refurbished")}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all",
                                isSelected ? c.active : "border-gray-100 bg-white hover:border-gray-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-lg border",
                                    c.bg,
                                    c.border
                                  )}
                                >
                                  <Sparkles size={20} className={c.text} />
                                </div>
                                <div className="text-left">
                                  <div
                                    className={cn(
                                      "font-semibold",
                                      isSelected ? c.text : "text-ink-700"
                                    )}
                                  >
                                    {cond.label}
                                  </div>
                                  <div className="text-xs text-ink-400">
                                    {cond.value === "new" && "原厂全新件，品质保障"}
                                    {cond.value === "used" && "原车拆解，成色良好"}
                                    {cond.value === "refurbished" && "专业修复，性能恢复"}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600"
                                >
                                  <Check size={14} className="text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
              <Button
                variant="ghost"
                size="md"
                leftIcon={<RotateCcw size={16} />}
                onClick={handleReset}
              >
                重置
              </Button>
              <Button
                variant="primary"
                size="md"
                block
                onClick={handleApply}
                rightIcon={
                  activeFilterCount > 0 ? (
                    <motion.span
                      key={activeFilterCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs"
                    >
                      {activeFilterCount}
                    </motion.span>
                  ) : null
                }
              >
                应用筛选
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
