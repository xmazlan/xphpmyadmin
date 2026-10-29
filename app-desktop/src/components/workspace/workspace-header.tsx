import { Cloud, LogOut, RefreshCw, Search, Sparkles, User, X } from "lucide-react";
import type React from "react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import ToggleTheme from "@/components/toggle-theme";
import type { CloudSyncConfig } from "@/types/cloud-sync";
import { cn } from "@/utils/tailwind";
import type { ActiveTabItem } from "./types";

interface WorkspaceHeaderProps {
  activeTabId: string;
  activeTabs: ActiveTabItem[];
  isSidebarCollapsed: boolean;
  isSyncing?: boolean;
  onCloseTab: (tabId: string, e: React.MouseEvent) => void;
  onLogout?: () => void;
  onManualSync?: () => void;
  onOpenCloudSync?: () => void;
  onSearchChange: (query: string) => void;
  onSelectTab: (tabId: string) => void;
  onToggleSidebar: () => void;
  pendingSyncCount?: number;
  searchQuery: string;
  userConfig?: CloudSyncConfig;
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
  isSyncing = false,
  onCloseTab,
  onLogout,
  onManualSync,
  onOpenCloudSync,
  onSearchChange,
  onSelectTab,
  onToggleSidebar,
  pendingSyncCount = 0,
  searchQuery,
  userConfig,
}: WorkspaceHeaderProps) {
  const userPlan = userConfig?.subscriptionTier || "free";
  const userEmail = userConfig?.userEmail;
  const userName = userConfig?.userName || userEmail?.split("@")[0] || "User";
  const userProvider = userConfig?.userProvider;

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

      {/* Right side: Omni-search + Cloud Sync + User Profile + Theme */}
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

        {/* Cloud Sync Button & Manual Trigger */}
        {onOpenCloudSync && (
          <div className="flex items-center gap-1">
            <button
              className="relative flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              onClick={onOpenCloudSync}
              title={
                isSyncing
                  ? "Sedang menyinkronkan aktivitas ke cloud..."
                  : pendingSyncCount > 0
                    ? userPlan !== "free"
                      ? `${pendingSyncCount} aktivitas dalam proses sinkronisasi otomatis.`
                      : `${pendingSyncCount} aktivitas belum disinkronkan (Perlu langganan). Klik untuk kelola Cloud Sync.`
                    : "Cloud Sync & Jurnal Audit"
              }
              type="button"
            >
              {isSyncing ? (
                <RefreshCw size={13} className="animate-spin text-teal-400" />
              ) : (
                <Cloud
                  size={14}
                  className={
                    pendingSyncCount > 0
                      ? userPlan !== "free"
                        ? "text-teal-400"
                        : "text-amber-400"
                      : "text-muted-foreground"
                  }
                />
              )}
              {!isSyncing && pendingSyncCount > 0 && userPlan === "free" && (
                <span className="-top-1 -right-1 absolute flex size-3.5 items-center justify-center rounded-full bg-amber-500 font-bold font-mono text-[9px] text-black shadow-xs">
                  {pendingSyncCount > 9 ? "9+" : pendingSyncCount}
                </span>
              )}
            </button>

            {userPlan !== "free" && onManualSync && (
              <button
                className="hidden sm:flex size-7 items-center justify-center rounded-md border border-teal-500/30 text-teal-400 transition-colors hover:bg-teal-500/10 cursor-pointer disabled:opacity-50"
                disabled={isSyncing}
                onClick={(e) => {
                  e.stopPropagation();
                  onManualSync();
                }}
                title="Sinkronkan Manual ke Cloud Sekarang"
                type="button"
              >
                <RefreshCw size={12} className={cn(isSyncing && "animate-spin")} />
              </button>
            )}
          </div>
        )}

        {/* User Profile Badge (if authenticated) */}
        {userEmail && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 py-0.5 pr-1.5 pl-2 text-xs">
            <span className="flex size-4 items-center justify-center">
              {userProvider === "google" ? (
                <SiGoogle size={11} color="#EA4335" />
              ) : userProvider === "github" ? (
                <SiGithub size={11} />
              ) : (
                <User size={12} className="text-primary" />
              )}
            </span>
            <span className="max-w-[80px] truncate font-medium text-foreground text-xs sm:max-w-[110px]">
              {userName}
            </span>
            <span
              className={cn(
                "cursor-pointer rounded px-1.5 py-0.2 font-bold font-mono text-[9px] uppercase transition-transform hover:scale-105",
                userPlan === "business"
                  ? "bg-purple-500/20 text-purple-400"
                  : userPlan === "team"
                  ? "bg-blue-500/20 text-blue-400"
                  : userPlan === "pro"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={onOpenCloudSync}
              title="Klik untuk Kelola / Upgrade Paket"
            >
              {userPlan}
            </span>

            {onLogout && (
              <button
                className="ml-1 flex size-5 items-center justify-center rounded text-muted-foreground/80 hover:bg-destructive/10 hover:text-destructive"
                onClick={onLogout}
                title="Keluar dari Akun (Logout)"
                type="button"
              >
                <LogOut size={11} />
              </button>
            )}
          </div>
        )}

        <ToggleTheme />
      </div>
    </header>
  );
}
