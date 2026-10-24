import {
  Database,
  Plus,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Database className="text-emerald-500" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Manajemen Basis Data (Databases)
          </h2>
          <Badge
            className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-500"
            variant="outline"
          >
            {availableDatabases.length} Basis Data
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search
              className="absolute top-2 left-2.5 text-muted-foreground/70"
              size={12}
            />
            <Input
              className="h-7 border-border bg-muted/40 pr-2 pl-8 text-foreground text-xs placeholder:text-muted-foreground/70"
              onChange={(e) => setDatabaseSearch(e.target.value)}
              placeholder="Saring basis data..."
              value={databaseSearch}
            />
          </div>
          <Button
            className="flex h-7 items-center gap-1.5 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
            onClick={onStartCreateDb}
            size="sm"
          >
            <Plus size={12} />
            <span>Buat DB Baru</span>
          </Button>
          <Button
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onRefreshDatabases}
            size="sm"
            title="Segarkan daftar database"
            variant="outline"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Nama Basis Data</th>
              <th className="px-4 py-2.5 font-semibold">Tipe Sistem</th>
              <th className="px-4 py-2.5 text-right font-semibold">Tindakan</th>
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
                  className={cn(
                    "group cursor-pointer transition-colors hover:bg-muted",
                    isCurrent && "bg-muted"
                  )}
                  key={db}
                  onClick={() => onOpenDatabase(db)}
                >
                  <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-foreground">
                    <Database
                      className={
                        isCurrent
                          ? "text-emerald-500"
                          : "text-muted-foreground/70 group-hover:text-primary"
                      }
                      size={14}
                    />
                    <button
                      className="cursor-pointer text-left font-semibold text-foreground group-hover:text-primary group-hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDatabase(db);
                      }}
                      type="button"
                    >
                      {db}
                    </button>
                    {isCurrent && (
                      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-500">
                        Aktif
                      </Badge>
                    )}
                    {isSystem && (
                      <span className="font-sans text-[10px] text-muted-foreground/70">
                        (Sistem)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {isSystem
                      ? "Katalog Sistem (Read-Only)"
                      : "Basis Data Pengguna"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        className="flex h-6 items-center gap-1 bg-primary px-2.5 font-semibold text-[10px] text-primary-foreground shadow-sm hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDatabase(db);
                        }}
                        size="sm"
                        title={`Buka struktur seluruh tabel pada ${db}`}
                      >
                        <TableIcon size={11} />
                        <span>Lihat Semua Tabel</span>
                      </Button>
                      <Button
                        className="h-6 border-border px-2 text-[10px] text-emerald-500 hover:bg-emerald-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenExportModal(db);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Ekspor
                      </Button>
                      {!isSystem && (
                        <Button
                          className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDropDatabase(db);
                          }}
                          size="sm"
                          title="Hapus Database"
                          variant="ghost"
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
