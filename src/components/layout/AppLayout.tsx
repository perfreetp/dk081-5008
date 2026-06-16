import { useState } from "react";
import SafeArea from "./SafeArea";
import TopBar, { type TopBarProps } from "./TopBar";
import BottomNav, { type TabKey } from "./BottomNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  showTopBar?: boolean;
  showBottomNav?: boolean;
  topBarProps?: Partial<TopBarProps>;
  initialTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  className?: string;
  contentClassName?: string;
}

export default function AppLayout({
  children,
  showTopBar = true,
  showBottomNav = true,
  topBarProps,
  initialTab = "urgent",
  onTabChange,
  className,
  contentClassName,
}: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <SafeArea className={cn("bg-gray-50", className)}>
      <div className="flex flex-col min-h-screen max-w-md mx-auto">
        {showTopBar && <TopBar {...topBarProps} />}
        <main
          className={cn(
            "flex-1 w-full",
            showBottomNav ? "pb-20" : "pb-4",
            contentClassName
          )}
        >
          {children}
        </main>
        {showBottomNav && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </SafeArea>
  );
}
