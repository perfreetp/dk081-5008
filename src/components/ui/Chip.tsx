import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipVariant = "default" | "primary" | "outline" | "ghost" | "warning" | "success" | "danger" | "info";
type ChipSize = "sm" | "md";

interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  closable?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onSelect?: () => void;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<ChipVariant, { normal: string; selected: string }> = {
  default: {
    normal: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    selected: "bg-primary-100 text-primary-700 border border-primary-300",
  },
  primary: {
    normal: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    selected: "bg-primary-600 text-white shadow-sm shadow-primary-600/20",
  },
  outline: {
    normal: "bg-white text-gray-700 border border-gray-300 hover:border-primary-400",
    selected: "bg-primary-50 text-primary-700 border border-primary-500",
  },
  ghost: {
    normal: "bg-transparent text-gray-600 hover:bg-gray-100",
    selected: "bg-primary-50 text-primary-700",
  },
  warning: {
    normal: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
    selected: "bg-amber-500 text-white shadow-sm shadow-amber-500/20",
  },
  success: {
    normal: "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200",
    selected: "bg-green-500 text-white shadow-sm shadow-green-500/20",
  },
  danger: {
    normal: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    selected: "bg-red-500 text-white shadow-sm shadow-red-500/20",
  },
  info: {
    normal: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
    selected: "bg-blue-500 text-white shadow-sm shadow-blue-500/20",
  },
};

const sizeStyles: Record<ChipSize, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
};

export default function Chip({
  children,
  variant = "default",
  size = "md",
  selected = false,
  closable = false,
  disabled = false,
  icon,
  onSelect,
  onClose,
  className,
}: ChipProps) {
  const isInteractive = !!onSelect;

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  const content = (
    <>
      {selected && !icon && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-shrink-0"
        >
          <Check size={14} strokeWidth={2.5} />
        </motion.span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {closable && (
        <motion.button
          onClick={handleClose}
          className="ml-0.5 flex-shrink-0 opacity-70 hover:opacity-100"
          whileHover={{ scale: 1.1 }}
          aria-label="移除"
        >
          <X size={14} strokeWidth={2.5} />
        </motion.button>
      )}
    </>
  );

  const baseClass = cn(
    "inline-flex items-center gap-1 font-medium rounded-full",
    "whitespace-nowrap transition-all duration-200",
    disabled ? "opacity-50 cursor-not-allowed" : isInteractive ? "cursor-pointer" : "cursor-default",
    selected ? variantStyles[variant].selected : variantStyles[variant].normal,
    sizeStyles[size],
    className
  );

  if (isInteractive) {
    return (
      <motion.button
        onClick={handleClick}
        whileTap={!disabled ? { scale: 0.96 } : undefined}
        disabled={disabled}
        className={baseClass}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={baseClass}
    >
      {content}
    </motion.span>
  );
}
