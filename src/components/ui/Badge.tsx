import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "urgent"
  | "reputation-high"
  | "reputation-mid"
  | "reputation-low";

type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-primary-50 text-primary-700 border border-primary-200",
  success: "bg-green-50 text-green-700 border border-green-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  urgent: "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm shadow-red-500/30",
  "reputation-high": "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm shadow-amber-500/30",
  "reputation-mid": "bg-blue-50 text-blue-700 border border-blue-200",
  "reputation-low": "bg-gray-50 text-gray-600 border border-gray-200",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-5 px-1.5 text-[10px] rounded-md",
  md: "h-6 px-2.5 text-xs rounded-lg",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  dot = false,
  className,
}: BadgeProps) {
  const dotColorMap: Record<BadgeVariant, string> = {
    default: "bg-gray-500",
    primary: "bg-primary-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    urgent: "bg-white",
    "reputation-high": "bg-white",
    "reputation-mid": "bg-blue-500",
    "reputation-low": "bg-gray-400",
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        "leading-none whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            dotColorMap[variant]
          )}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.span>
  );
}
