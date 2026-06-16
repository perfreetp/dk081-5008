import { cn } from "@/lib/utils";

interface SafeAreaProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

export default function SafeArea({
  children,
  className,
  top = true,
  bottom = true,
  left = true,
  right = true,
}: SafeAreaProps) {
  return (
    <div
      className={cn(
        "w-full min-h-screen",
        top && "pt-[env(safe-area-inset-top)]",
        bottom && "pb-[env(safe-area-inset-bottom)]",
        left && "pl-[env(safe-area-inset-left)]",
        right && "pr-[env(safe-area-inset-right)]",
        className
      )}
    >
      {children}
    </div>
  );
}
