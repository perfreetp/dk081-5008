import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: CardVariant;
  hoverable?: boolean;
  clickable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white",
  elevated: "bg-white shadow-md",
  outlined: "bg-white border border-gray-200",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export default function Card({
  variant = "default",
  hoverable = false,
  clickable = false,
  padding = "md",
  className,
  children,
  onClick,
  ...props
}: CardProps) {
  const isInteractive = clickable || !!onClick;

  return (
    <motion.div
      whileHover={
        hoverable || isInteractive
          ? {
              y: -2,
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -5px rgba(0, 0, 0, 0.04)",
            }
          : undefined
      }
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "rounded-2xl overflow-hidden",
        variantStyles[variant],
        hoverable && "transition-shadow duration-200",
        isInteractive && "cursor-pointer",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex-1", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mt-4 pt-3 border-t border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-gray-100 my-3", className)} />;
}
