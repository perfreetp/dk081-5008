import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  block?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-primary-600 text-white",
    "hover:bg-primary-700 active:bg-primary-800",
    "shadow-sm shadow-primary-600/20",
    "disabled:bg-primary-300 disabled:shadow-none"
  ),
  secondary: cn(
    "bg-gray-100 text-gray-800",
    "hover:bg-gray-200 active:bg-gray-300",
    "border border-gray-200",
    "disabled:bg-gray-50 disabled:text-gray-400"
  ),
  ghost: cn(
    "bg-transparent text-gray-700",
    "hover:bg-gray-100 active:bg-gray-200",
    "disabled:text-gray-300"
  ),
  icon: cn(
    "bg-white text-gray-700 border border-gray-200",
    "hover:bg-gray-50 active:bg-gray-100",
    "shadow-sm"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-base rounded-xl",
  lg: "h-13 px-6 text-lg rounded-xl",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "w-8 h-8 !p-0 rounded-lg",
  md: "w-11 h-11 !p-0 rounded-xl",
  lg: "w-13 h-13 !p-0 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  block = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isIcon = variant === "icon";

  return (
    <motion.button
      whileTap={{ scale: loading || disabled ? 1 : 0.97 }}
      disabled={loading || disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variantStyles[variant],
        isIcon ? iconSizeStyles[size] : sizeStyles[size],
        block && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 -ml-1 mr-1"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && leftIcon}
      {!isIcon && <span>{children}</span>}
      {isIcon && children}
      {!loading && rightIcon}
    </motion.button>
  );
}
