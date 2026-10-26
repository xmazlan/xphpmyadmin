import { Search, Sparkles, X } from "lucide-react";
import type React from "react";
import ToggleTheme from "@/components/toggle-theme";
import { cn } from "@/utils/tailwind";
import type { ActiveTabItem } from "./types";

interface WorkspaceHeaderProps {
  activeTabId: string;
  activeTabs: ActiveTabItem[];
  isSidebarCollapsed: boolean;
  onCloseTab: (tabId: string, e: React.MouseEvent) => void;
  onSearchChange: (query: string) => void;
  onSelectTab: (tabId: string) => void;
  onToggleSidebar: () => void;
  searchQuery: string;
}

const ENV_COLORS: Record<string, string> = {
  Local: "text-emerald-500",
  Other: "text-muted-foreground",
  Production: "text-destructive",
  Staging: "text-amber-500",
};

export function WorkspaceHeader({
  activeTabId,
  activeTabs,
  isSidebarCollapsed,
  onCloseTab,
  onSearchChange,
  onSelectTab,
  onToggleSidebar,
  searchQuery,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 select-none items-center justify-between gap-2 border-border border-b bg-card px-3">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {/* Sidebar Toggle */}
        <button
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          type="button"
        >
          <Sparkles size={14} />
        </button>

        {/* Dynamic Tabs */}
        {activeTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 font-medium text-xs transition-all",
                isActive
                  ? "border border-border bg-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              type="button"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  isActive
                    ? ENV_COLORS[tab.env] || "text-primary"
                    : "bg-muted-foreground/40"
                )}
                style={{ backgroundColor: "currentColor" }}
              />
              <span className="max-w-[100px] truncate">{tab.name}</span>
              {tab.id !== "tab-home" && (
                <span
                  className="ml-0.5 cursor-pointer rounded p-0.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                  onClick={(e) => onCloseTab(tab.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onCloseTab(tab.id, e as any);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title="Tutup Tab"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right side: Omni-search + Theme */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative hidden w-36 sm:w-48 md:block">
          <Search
            className="absolute top-2 left-2.5 text-muted-foreground/70"
            size={12}
          />
          <input
            className="h-7 w-full rounded-md border border-border bg-muted/40 pr-2 pl-8 text-foreground text-xs placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari host atau database..."
            type="text"
            value={searchQuery}
          />
        </div>
        <ToggleTheme />
      </div>
    </header>
  );
}
