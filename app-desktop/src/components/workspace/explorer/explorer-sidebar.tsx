import {
  Database,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Table as TableIcon,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/types/connection";
import { cn } from "@/utils/tailwind";
import type { TableItem } from "../types";

interface ExplorerSidebarProps {
  activeConnectedProfile: Profile | null;
  availableDatabases: string[];
  currentSelectedDatabase: string;
  databaseSearch: string;
  filteredDatabases: string[];
  filteredDisplayTables: TableItem[];
  isLoadingTables: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateDbModal: () => void;
  onOpenDatabase: (db: string) => void;
  onOpenSettings?: () => void;
  onRefreshDatabases: () => void;
  onSelectTable: (tbl: string) => void;
  onSwitchToHub: () => void;
  selectedTable: string;
  setDatabaseSearch: (val: string) => void;
  setTableSearch: (val: string) => void;
  tableSearch: string;
}

export function ExplorerSidebar({
  activeConnectedProfile,
  availableDatabases,
  currentSelectedDatabase,
  databaseSearch,
  filteredDatabases,
  filteredDisplayTables,
  isLoadingTables,
  isOpen,
  onClose,
  onOpenCreateDbModal,
  onOpenDatabase,
  onOpenSettings,
  onRefreshDatabases,
  onSelectTable,
  onSwitchToHub,
  selectedTable,
  setDatabaseSearch,
  setTableSearch,
  tableSearch,
}: ExplorerSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="flex w-64 shrink-0 select-none flex-col border-border border-r bg-card transition-all duration-200 sm:w-72">
      {/* Server Header */}
      <div className="flex items-center justify-between border-border border-b bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border bg-primary/10 text-primary">
            <Server size={12} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[11px] text-foreground">
              {activeConnectedProfile?.name || "MariaDB Server"}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {activeConnectedProfile?.host}:{activeConnectedProfile?.port}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="cursor-pointer rounded p-1 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-primary"
            onClick={onRefreshDatabases}
            title="Muat Ulang Database"
            type="button"
          >
            <RefreshCw size={11} />
          </button>
          <button
            className="cursor-pointer rounded p-1 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            onClick={onClose}
            title="Tutup Explorer"
            type="button"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Database List Header */}
      <div className="flex items-center justify-between border-border border-b bg-card px-3 py-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          <Database className="text-emerald-500" size={12} />
          <span>Databases ({availableDatabases.length})</span>
        </div>
        <button
          className="cursor-pointer rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-primary"
          onClick={onOpenCreateDbModal}
          title="Buat Database Baru"
          type="button"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Database Search */}
      <div className="border-border border-b p-2">
        <div className="relative flex items-center">
          <Search
            className="absolute left-2 text-muted-foreground/70"
            size={11}
          />
          <Input
            className="h-6.5 rounded border-border bg-muted/40 pr-2 pl-7 text-[11px] text-foreground placeholder:text-muted-foreground/70"
            onChange={(e) => setDatabaseSearch(e.target.value)}
            placeholder={`Cari database (${availableDatabases.length})...`}
            value={databaseSearch}
          />
        </div>
      </div>

      {/* Database List */}
      <div className="h-44 shrink-0 space-y-0.5 overflow-y-auto border-border border-b p-1.5">
        {filteredDatabases.map((db) => {
          const isDbSelected = currentSelectedDatabase === db;
          return (
            <button
              className={cn(
                "group flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                isDbSelected
                  ? "border border-emerald-500/50 bg-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              key={db}
              onClick={() => onOpenDatabase(db)}
              type="button"
            >
              <div className="flex items-center gap-2 truncate">
                <Database
                  className={cn(
                    "shrink-0 transition-colors",
                    isDbSelected
                      ? "text-emerald-500"
                      : "text-muted-foreground/70 group-hover:text-muted-foreground"
                  )}
                  size={12}
                />
                <span className="truncate font-mono text-[11px]">{db}</span>
              </div>
              {isDbSelected && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
        {filteredDatabases.length === 0 && (
          <div className="p-3 text-center text-[11px] text-muted-foreground/70 italic">
            Database tidak ditemukan
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="flex items-center justify-between border-border border-b bg-card px-3 py-1.5">
        <div className="flex items-center gap-1.5 truncate font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
          <TableIcon className="text-primary" size={12} />
          <span className="truncate">
            Tabel:{" "}
            <span className="font-mono text-emerald-500 lowercase">
              {currentSelectedDatabase || "Pilih db"}
            </span>
          </span>
        </div>
        <span className="rounded-full border border-border bg-muted px-1.5 py-0.2 font-mono text-[9px] text-muted-foreground">
          {filteredDisplayTables.length}
        </span>
      </div>

      {/* Table Search */}
      <div className="border-border border-b p-2">
        <div className="relative flex items-center">
          <Search
            className="absolute left-2 text-muted-foreground/70"
            size={11}
          />
          <Input
            className="h-6.5 rounded border-border bg-muted/40 pr-2 pl-7 text-[11px] text-foreground placeholder:text-muted-foreground/70"
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder={`Cari tabel di ${currentSelectedDatabase || "database"}...`}
            value={tableSearch}
          />
        </div>
      </div>

      {/* Table List */}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {isLoadingTables ? (
          <div className="flex items-center justify-center gap-2 p-6 text-primary text-xs">
            <RefreshCw className="animate-spin" size={13} />
            <span>Memuat tabel...</span>
          </div>
        ) : (
          <>
            {filteredDisplayTables.map((tbl) => {
              const isTblSelected = selectedTable === tbl.name;
              return (
                <button
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                    isTblSelected
                      ? "border border-border bg-accent font-semibold text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                  key={tbl.name}
                  onClick={() => onSelectTable(tbl.name)}
                  type="button"
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon
                      className={
                        isTblSelected
                          ? "text-primary"
                          : "text-muted-foreground/70"
                      }
                      size={13}
                    />
                    <span className="truncate font-mono text-[11px]">
                      {tbl.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    {tbl.rows.toLocaleString()}
                  </span>
                </button>
              );
            })}
            {filteredDisplayTables.length === 0 && (
              <div className="p-4 text-center text-muted-foreground/70 text-xs italic">
                Belum ada tabel pada database ini.
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-border border-t bg-muted/40 p-2 text-[11px]">
        <div className="flex items-center gap-1.5 truncate">
          {onOpenSettings && (
            <button
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors shrink-0"
              onClick={onOpenSettings}
              title="Pengaturan Aplikasi"
              type="button"
            >
              <Settings size={12} />
            </button>
          )}
          <span className="flex max-w-[130px] items-center gap-1.5 truncate font-mono text-[10px] text-emerald-500">
            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
            <span className="truncate">
              {currentSelectedDatabase || "Live MariaDB"}
            </span>
          </span>
        </div>
        <button
          className="shrink-0 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground hover:underline"
          onClick={onSwitchToHub}
          type="button"
        >
          Ganti Host
        </button>
      </div>
    </aside>
  );
}
