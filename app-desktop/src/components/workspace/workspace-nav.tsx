import {
  Activity,
  Code2,
  Columns,
  Database,
  FileDown,
  FileUp,
  Layers,
  PanelLeft,
  Search,
  Server,
  Sliders,
  SlidersHorizontal,
  Table as TableIcon,
  Users,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/connection";
import { cn } from "@/utils/tailwind";
import type { WorkspaceTabId } from "./types";

interface WorkspaceNavProps {
  activeConnectedProfile: Profile | null;
  availableDatabasesCount: number;
  currentSelectedDatabase: string;
  currentWorkspaceTab: WorkspaceTabId;
  isWorkspaceSidebarOpen: boolean;
  onOpenWorkspaceSidebar: () => void;
  onSwitchWorkspaceTab: (tabId: WorkspaceTabId) => void;
  selectedTable: string;
}

export function WorkspaceNav({
  activeConnectedProfile,
  availableDatabasesCount,
  currentSelectedDatabase,
  currentWorkspaceTab,
  isWorkspaceSidebarOpen,
  onOpenWorkspaceSidebar,
  onSwitchWorkspaceTab,
  selectedTable,
}: WorkspaceNavProps) {
  const tabs = [
    { icon: Database, id: "databases" as WorkspaceTabId, label: "Databases" },
    {
      icon: TableIcon,
      id: "structure" as WorkspaceTabId,
      label: currentSelectedDatabase
        ? `Structure (${currentSelectedDatabase})`
        : "Structure",
    },
    { icon: Code2, id: "sql" as WorkspaceTabId, label: "SQL" },
    { icon: Search, id: "search" as WorkspaceTabId, label: "Search" },
    { icon: Sliders, id: "operations" as WorkspaceTabId, label: "Operations" },
    { icon: FileDown, id: "export" as WorkspaceTabId, label: "Export" },
    { icon: FileUp, id: "import" as WorkspaceTabId, label: "Import" },
    { icon: Workflow, id: "routines" as WorkspaceTabId, label: "Routines" },
    { icon: Activity, id: "status" as WorkspaceTabId, label: "Status" },
    { icon: Users, id: "users" as WorkspaceTabId, label: "User accounts" },
    {
      icon: SlidersHorizontal,
      id: "variables" as WorkspaceTabId,
      label: "Variables",
    },
    { icon: Columns, id: "charsets" as WorkspaceTabId, label: "Charsets" },
    { icon: Server, id: "engines" as WorkspaceTabId, label: "Engines" },
    { icon: Layers, id: "plugins" as WorkspaceTabId, label: "Plugins" },
  ];

  return (
    <>
      {/* Top Breadcrumb Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-border border-b bg-card px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs sm:gap-2">
          {!isWorkspaceSidebarOpen && (
            <Button
              className="flex h-7 shrink-0 items-center gap-1.5 border-border bg-muted/40 px-2 text-primary hover:bg-muted hover:text-foreground"
              onClick={onOpenWorkspaceSidebar}
              size="sm"
              title="Tampilkan Explorer Basis Data"
              variant="outline"
            >
              <PanelLeft size={13} />
              <span className="hidden sm:inline">Explorer</span>
              {availableDatabasesCount > 0 && (
                <span className="font-mono text-[10px] text-emerald-500">
                  ({availableDatabasesCount})
                </span>
              )}
            </Button>
          )}
          <span className="max-w-[100px] truncate font-semibold text-foreground sm:max-w-[160px] md:max-w-[220px]">
            {activeConnectedProfile?.name}
          </span>
          <span className="shrink-0 text-muted-foreground/70">/</span>
          <span className="max-w-[100px] truncate font-medium font-mono text-emerald-500 sm:max-w-[160px]">
            {currentSelectedDatabase}
          </span>
          {selectedTable && (
            <>
              <span className="shrink-0 text-muted-foreground/70">/</span>
              <span className="max-w-[100px] truncate font-mono text-primary sm:max-w-[160px]">
                {selectedTable}
              </span>
            </>
          )}
          <Badge
            className="ml-1 hidden shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-500 lg:inline-flex"
            variant="outline"
          >
            Socket TCP 3306
          </Badge>
        </div>
      </div>

      {/* phpMyAdmin Tab Navigation */}
      <div className="no-scrollbar flex shrink-0 select-none items-center gap-0.5 overflow-x-auto border-border border-b bg-card px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentWorkspaceTab === tab.id;
          return (
            <button
              className={cn(
                "flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3 font-medium text-xs transition-colors",
                isActive
                  ? "border-primary bg-accent/40 font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
              )}
              key={tab.id}
              onClick={() => onSwitchWorkspaceTab(tab.id)}
              type="button"
            >
              <Icon
                className={cn(
                  "shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                size={13}
              />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
