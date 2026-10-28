import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type React from "react";
import { Activity, useMemo, useState } from "react";
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
    searchQuery,
    setActiveTabId,
    setIsSidebarCollapsed,
    setSearchQuery,
  } = useConnection();
  const { journal } = useCloudSync();

  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  const pendingCount = useMemo(() => {
    return journal.filter((item) => item.syncStatus === "pending").length;
  }, [journal]);

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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background font-sans text-foreground">
      <WorkspaceHeader
        activeTabId={activeTabId}
        activeTabs={activeTabs}
        isSidebarCollapsed={isSidebarCollapsed}
        onCloseTab={handleCloseTab}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onSearchChange={setSearchQuery}
        onSelectTab={handleSelectTab}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        pendingSyncCount={pendingCount}
        searchQuery={searchQuery}
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
