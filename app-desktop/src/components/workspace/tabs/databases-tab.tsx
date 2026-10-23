import React from "react";
import { Database, Plus, RefreshCw, Search, Table as TableIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tailwind";

interface DatabasesTabProps {
  availableDatabases: string[];
  currentSelectedDatabase: string;
  databaseSearch: string;
  filteredDatabases: string[];
  onDropDatabase: (dbName: string) => void;
  onOpenDatabase: (dbName: string) => void;
  onOpenExportModal: (dbName: string) => void;
  onRefreshDatabases: () => void;
  onStartCreateDb: () => void;
  setDatabaseSearch: (val: string) => void;
}

export function DatabasesTab({
  availableDatabases,
  currentSelectedDatabase,
  databaseSearch,
  filteredDatabases,
  onDropDatabase,
  onOpenDatabase,
  onOpenExportModal,
  onRefreshDatabases,
  onStartCreateDb,
  setDatabaseSearch,
}: DatabasesTabProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-emerald-500" />
          <h2 className="text-xs font-semibold text-foreground">
            Manajemen Basis Data (Databases)
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
          >
            {availableDatabases.length} Basis Data
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search
              size={12}
              className="absolute left-2.5 top-2 text-muted-foreground/70"
            />
            <Input
              className="h-7 text-xs pl-8 pr-2 border-border bg-muted/40 text-foreground placeholder:text-muted-foreground/70"
              placeholder="Saring basis data..."
              value={databaseSearch}
              onChange={(e) => setDatabaseSearch(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="h-7 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 flex items-center gap-1.5"
            onClick={onStartCreateDb}
          >
            <Plus size={12} />
            <span>Buat DB Baru</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onRefreshDatabases}
            title="Segarkan daftar database"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
              <th className="py-2.5 px-4 font-semibold">Nama Basis Data</th>
              <th className="py-2.5 px-4 font-semibold">Tipe Sistem</th>
              <th className="py-2.5 px-4 font-semibold text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredDatabases.map((db) => {
              const isCurrent = currentSelectedDatabase === db;
              const isSystem = [
                "information_schema",
                "performance_schema",
                "sys",
                "mysql",
              ].includes(db.toLowerCase());
              return (
                <tr
                  key={db}
                  onClick={() => onOpenDatabase(db)}
                  className={cn(
                    "hover:bg-muted transition-colors cursor-pointer group",
                    isCurrent && "bg-muted"
                  )}
                >
                  <td className="py-2.5 px-4 font-medium flex items-center gap-2 text-foreground">
                    <Database
                      size={14}
                      className={
                        isCurrent
                          ? "text-emerald-500"
                          : "text-muted-foreground/70 group-hover:text-primary"
                      }
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDatabase(db);
                      }}
                      className="font-semibold text-foreground group-hover:text-primary group-hover:underline text-left cursor-pointer"
                    >
                      {db}
                    </button>
                    {isCurrent && (
                      <Badge className="text-[9px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                        Aktif
                      </Badge>
                    )}
                    {isSystem && (
                      <span className="text-[10px] text-muted-foreground/70 font-sans">
                        (Sistem)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {isSystem
                      ? "Katalog Sistem (Read-Only)"
                      : "Basis Data Pengguna"}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 px-2.5 text-[10px] bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center gap-1 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDatabase(db);
                        }}
                        title={`Buka struktur seluruh tabel pada ${db}`}
                      >
                        <TableIcon size={11} />
                        <span>Lihat Semua Tabel</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] border-border text-emerald-500 hover:bg-emerald-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenExportModal(db);
                        }}
                      >
                        Ekspor
                      </Button>
                      {!isSystem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDropDatabase(db);
                          }}
                          title="Hapus Database"
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
