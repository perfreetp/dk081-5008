import { motion } from "framer-motion";
import { Search, Package, Award, ClipboardList, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "urgent" | "spot" | "reputation" | "orders" | "messages";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  className?: string;
}

const tabs: TabItem[] = [
  { key: "urgent", label: "急找", icon: <Search size={22} strokeWidth={2} /> },
  { key: "spot", label: "现货", icon: <Package size={22} strokeWidth={2} /> },
  { key: "reputation", label: "信誉", icon: <Award size={22} strokeWidth={2} /> },
  { key: "orders", label: "订单", icon: <ClipboardList size={22} strokeWidth={2} /> },
  { key: "messages", label: "消息", icon: <MessageCircle size={22} strokeWidth={2} />, badge: 3 },
];

export default function BottomNav({ activeTab, onTabChange, className }: BottomNavProps) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className="relative flex flex-col items-center justify-center w-full h-full py-1 transition-colors"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  isActive ? "text-primary-600" : "text-gray-500"
                )}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.badge && tab.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1",
                        "flex items-center justify-center rounded-full",
                        "bg-red-500 text-white text-[10px] font-medium",
                        "border-2 border-white"
                      )}
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </motion.span>
                  )}
                </div>
                <motion.span
                  className={cn(
                    "mt-0.5 text-[11px] font-medium",
                    isActive ? "text-primary-600" : "text-gray-500"
                  )}
                  animate={{
                    opacity: isActive ? 1 : 0.8,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tab.label}
                </motion.span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-1 left-1/2 w-1 h-1 bg-primary-600 rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
