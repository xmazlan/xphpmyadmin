import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type React from "react";
import { Activity, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth/auth-gate";
import { CloudSyncModal } from "@/components/workspace/modals/cloud-sync-modal";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { inDevelopment } from "@/constants";
import {
  CloudSyncProvider,
  useCloudSync,
} from "@/context/cloud-sync-context";
import {
  ConnectionProvider,
  useConnection,
} from "@/context/connection-context";
import BaseLayout from "@/layouts/base-layout";

function AppShell() {
  const navigate = useNavigate();
  const {
    activeTabId,
    activeTabs,
    closeTab,
    isSidebarCollapsed,
    profiles,
    searchQuery,
    setActiveTabId,
    setIsSidebarCollapsed,
    setSearchQuery,
  } = useConnection();
  const {
    config,
    isAuthenticated,
    isSyncing,
    journal,
    logout,
    setCachedProfiles,
    syncNow,
  } = useCloudSync();

  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isLocalBypassed, setIsLocalBypassed] = useState(false);

  useEffect(() => {
    if (profiles?.length) {
      setCachedProfiles(profiles);
    }
  }, [profiles, setCachedProfiles]);

  const pendingCount = useMemo(() => {
    return journal.filter((item) => item.syncStatus === "pending").length;
  }, [journal]);

  // Otomatis sinkronkan antrean ke cloud backend untuk pengguna berlangganan (non-free)
  useEffect(() => {
    const isSubscribed = config.subscriptionTier !== "free";
    const autoSyncActive = config.autoSync ?? isSubscribed;

    if (
      isAuthenticated &&
      isSubscribed &&
      autoSyncActive &&
      pendingCount > 0 &&
      !isSyncing
    ) {
      const timer = setTimeout(() => {
        syncNow(profiles).catch((err) => {
          console.warn("Background auto-sync failed:", err);
        });
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [
    isAuthenticated,
    config.subscriptionTier,
    config.autoSync,
    pendingCount,
    isSyncing,
    profiles,
    syncNow,
  ]);

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    if (tabId === "tab-home") {
      navigate({ to: "/" });
      return;
    }
    const tab = activeTabs.find((t) => t.id === tabId);
    if (tab?.profileId) {
      navigate({
        params: { profileId: tab.profileId },
        to: "/workspace/$profileId",
      });
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(tabId);
    if (activeTabId === tabId) {
      setActiveTabId("tab-home");
      navigate({ to: "/" });
    }
  };

  const handleLogout = () => {
    logout();
    setIsLocalBypassed(false);
    navigate({ to: "/" });
  };

  // Intercept when not authenticated
  if (!isAuthenticated && !isLocalBypassed) {
    return <AuthGate onBypassLocal={() => setIsLocalBypassed(true)} />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background font-sans text-foreground">
      <WorkspaceHeader
        activeTabId={activeTabId}
        activeTabs={activeTabs}
        isSidebarCollapsed={isSidebarCollapsed}
        isSyncing={isSyncing}
        onCloseTab={handleCloseTab}
        onLogout={handleLogout}
        onManualSync={() => {
          syncNow(profiles).then((res) => {
            if (res.success) {
              toast.success("Sinkronisasi manual berhasil!", {
                description:
                  res.message ||
                  `${res.syncedItems} item disinkronkan ke cloud database.`,
              });
            } else if (res.error) {
              toast.error("Gagal sinkronisasi manual", {
                description: res.error,
              });
            }
          });
        }}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onSearchChange={setSearchQuery}
        onSelectTab={handleSelectTab}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        pendingSyncCount={pendingCount}
        searchQuery={searchQuery}
        userConfig={config}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />
    </div>
  );
}

function Root() {
  return (
    <ConnectionProvider>
      <CloudSyncProvider>
        <BaseLayout>
          <AppShell />
          <Activity mode={inDevelopment ? "visible" : "hidden"}>
            <TanStackRouterDevtools />
          </Activity>
        </BaseLayout>
      </CloudSyncProvider>
    </ConnectionProvider>
  );
}

export const Route = createRootRoute({
  component: Root,
});
