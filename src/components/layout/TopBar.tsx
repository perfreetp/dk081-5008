import { motion } from "framer-motion";
import { ArrowLeft, Search, Filter, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  showNotification?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onNotification?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export default function TopBar({
  title,
  showBack = false,
  showSearch = false,
  showFilter = false,
  showNotification = false,
  onBack,
  onSearch,
  onFilter,
  onNotification,
  rightContent,
  className,
  sticky = true,
}: TopBarProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const IconButton = ({
    onClick,
    children,
    label,
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    label: string;
  }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "w-10 h-10 flex items-center justify-center",
        "rounded-full hover:bg-gray-100 active:bg-gray-200",
        "text-gray-700 transition-colors"
      )}
    >
      {children}
    </motion.button>
  );

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "w-full h-14 px-3",
        "flex items-center justify-between",
        "bg-white border-b border-gray-100",
        sticky && "sticky top-0 z-40",
        "pt-[env(safe-area-inset-top)]",
        className
      )}
    >
      <div className="flex items-center flex-shrink-0">
        {showBack && (
          <IconButton onClick={handleBack} label="返回">
            <ArrowLeft size={22} strokeWidth={2} />
          </IconButton>
        )}
        {title && (
          <motion.h1
            key={title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "text-lg font-semibold text-gray-900",
              !showBack && "ml-1"
            )}
          >
            {title}
          </motion.h1>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {showSearch && (
          <IconButton onClick={onSearch} label="搜索">
            <Search size={22} strokeWidth={2} />
          </IconButton>
        )}
        {showFilter && (
          <IconButton onClick={onFilter} label="筛选">
            <Filter size={22} strokeWidth={2} />
          </IconButton>
        )}
        {showNotification && (
          <IconButton onClick={onNotification} label="通知">
            <div className="relative">
              <Bell size={22} strokeWidth={2} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          </IconButton>
        )}
        {rightContent}
      </div>
    </motion.header>
  );
}
