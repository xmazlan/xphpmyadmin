import {
  Clock,
  FileCode2,
  Key,
  Server,
  Settings,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import ToggleTheme from "@/components/toggle-theme";
import { cn } from "@/utils/tailwind";

interface ConnectionSidebarProps {
  activeSection?: string;
  isSidebarCollapsed: boolean;
  onSelectSection?: (id: string) => void;
}

const NAV_ITEMS = [
  { icon: Server, id: "hosts", label: "Koneksi (Hosts)" },
  { icon: Terminal, id: "tunnels", label: "SSH Tunnels" },
  { icon: Key, id: "keychain", label: "Keychain" },
  { icon: FileCode2, id: "snippets", label: "SQL Snippets" },
  { icon: ShieldCheck, id: "known", label: "Known Hosts" },
  { icon: Clock, id: "backup", label: "Backup & Logs" },
];

export function ConnectionSidebar({
  activeSection = "hosts",
  isSidebarCollapsed,
  onSelectSection,
}: ConnectionSidebarProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col justify-between border-border border-r bg-card py-2.5 transition-all duration-200",
        isSidebarCollapsed ? "w-12 items-center px-1" : "w-44 px-2"
      )}
    >
      <div className="flex w-full flex-col gap-1">
        {NAV_ITEMS.map((nav) => {
          const Icon = nav.icon;
          const isActive = activeSection === nav.id;
          return (
            <button
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left font-medium text-xs transition-colors",
                isActive
                  ? "border border-border bg-accent font-semibold text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              key={nav.id}
              onClick={() => onSelectSection?.(nav.id)}
              title={nav.label}
              type="button"
            >
              <Icon
                className={
                  isActive
                    ? nav.id === "tunnels"
                      ? "shrink-0 text-purple-400"
                      : "shrink-0 text-primary"
                    : "shrink-0 text-muted-foreground/70"
                }
                size={14}
              />
              {!isSidebarCollapsed && (
                <span className="truncate">{nav.label}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="w-full space-y-1 border-border border-t pt-2">
        {isSidebarCollapsed ? (
          <div className="flex justify-center py-1">
            <ToggleTheme />
          </div>
        ) : (
          <ToggleTheme showLabel />
        )}
        <button
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-muted-foreground text-xs hover:bg-muted/40 hover:text-foreground"
          onClick={() => onSelectSection?.("settings")}
          type="button"
        >
          <Settings className="shrink-0" size={14} />
          {!isSidebarCollapsed && <span>Pengaturan</span>}
        </button>
      </div>
    </aside>
  );
}
