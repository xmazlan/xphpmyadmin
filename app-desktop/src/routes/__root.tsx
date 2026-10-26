import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type React from "react";
import { Activity } from "react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { inDevelopment } from "@/constants";
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
        onSearchChange={setSearchQuery}
        onSelectTab={handleSelectTab}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        searchQuery={searchQuery}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

function Root() {
  return (
    <ConnectionProvider>
      <BaseLayout>
        <AppShell />
        <Activity mode={inDevelopment ? "visible" : "hidden"}>
          <TanStackRouterDevtools />
        </Activity>
      </BaseLayout>
    </ConnectionProvider>
  );
}

export const Route = createRootRoute({
  component: Root,
});
