import {
  CheckSquare,
  Columns,
  FileUp,
  Play,
  Plus,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface StructureTabProps {
  bulkAction: string;
  currentSelectedDatabase: string;
  filteredDisplayTables: TableItem[];
  isCreatingTable: boolean;
  newTableColumnsInput: number;
  newTableNameInput: string;
  onBrowseTable: (tableName: string) => void;
  onCreateTable: () => void;
  onDropTable: (tableName: string) => void;
  onEmptyTable: (tableName: string) => void;
  onExecuteBulkAction: () => void;
  onOpenInsertModal: (tableName: string) => void;
  onRefreshTables: () => void;
  onSearchTable?: (tableName: string) => void;
  onSwitchTab: (tabId: "import" | "export") => void;
  onViewTableStructure: (tableName: string) => void;
  selectedTableCheckboxes: string[];
  setBulkAction: (val: string) => void;
  setNewTableColumnsInput: (val: number) => void;
  setNewTableNameInput: (val: string) => void;
  setSelectedTableCheckboxes: React.Dispatch<React.SetStateAction<string[]>>;
  setTableSearch: (val: string) => void;
  tableSearch: string;
  totalDatabaseRows: number;
}

export function StructureTab({
  bulkAction,
  currentSelectedDatabase,
  filteredDisplayTables,
  isCreatingTable,
  newTableColumnsInput,
  newTableNameInput,
  onBrowseTable,
  onCreateTable,
  onDropTable,
  onEmptyTable,
  onExecuteBulkAction,
  onOpenInsertModal,
  onRefreshTables,
  onSearchTable,
  onSwitchTab,
  onViewTableStructure,
  selectedTableCheckboxes,
  setBulkAction,
  setNewTableColumnsInput,
  setNewTableNameInput,
  setSelectedTableCheckboxes,
  setTableSearch,
  tableSearch,
  totalDatabaseRows,
}: StructureTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* Header Bar Struktur */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-border border-b bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <TableIcon className="shrink-0 text-primary" size={16} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-semibold text-foreground text-xs">
                Struktur Basis Data:{" "}
                <span className="font-mono text-emerald-500">
                  {currentSelectedDatabase || "Belum dipilih"}
                </span>
              </h2>
              <Badge
                className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
                variant="outline"
              >
                {filteredDisplayTables.length} Tabel
              </Badge>
              <Badge
                className="hidden border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-500 sm:inline-flex"
                variant="outline"
              >
                {totalDatabaseRows.toLocaleString()} Baris Total
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative w-40 sm:w-56">
            <Search
              className="absolute top-2 left-2.5 text-muted-foreground/70"
              size={12}
            />
            <Input
              className="h-7 border-border bg-muted/40 pr-2 pl-8 text-foreground text-xs placeholder:text-muted-foreground/70"
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Saring tabel..."
              value={tableSearch}
            />
          </div>
          <Button
            className="flex h-7 items-center gap-1.5 bg-primary font-semibold text-primary-foreground text-xs shadow-sm hover:bg-primary/90"
            onClick={() => {
              const elem = document.getElementById("create-table-card");
              if (elem) {
                elem.scrollIntoView({ behavior: "smooth" });
              }
            }}
            size="sm"
          >
            <Plus size={12} />
            <span className="hidden sm:inline">Buat Tabel Baru</span>
          </Button>
          <Button
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onRefreshTables}
            size="sm"
            title="Segarkan Daftar Tabel"
            variant="outline"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      {/* Konten Utama Tabel */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {filteredDisplayTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <TableIcon size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-foreground text-sm">
              Belum Ada Tabel di Basis Data `{currentSelectedDatabase}`
            </h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-xs leading-relaxed">
              Buat tabel pertama Anda menggunakan formulir di bawah atau pulihkan
              skema dari berkas cadangan melalui menu Impor.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                onClick={() => {
                  const elem = document.getElementById("create-table-card");
                  if (elem) elem.scrollIntoView({ behavior: "smooth" });
                }}
                size="sm"
              >
                <Plus className="mr-1.5" size={13} />
                Buat Tabel Baru
              </Button>
              <Button
                className="h-8 border-border text-foreground hover:bg-muted"
                onClick={() => onSwitchTab("import")}
                size="sm"
                variant="outline"
              >
                <FileUp className="mr-1.5" size={13} />
                Impor Skrip SQL
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-border border-b bg-muted/40 text-muted-foreground">
                  <th className="w-8 px-3 py-2.5 text-center">
                    <input
                      checked={
                        filteredDisplayTables.length > 0 &&
                        selectedTableCheckboxes.length ===
                          filteredDisplayTables.length
                      }
                      className="cursor-pointer rounded border-border bg-background text-primary"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTableCheckboxes(
                            filteredDisplayTables.map((t) => t.name)
                          );
                        } else {
                          setSelectedTableCheckboxes([]);
                        }
                      }}
                      type="checkbox"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Nama Tabel</th>
                  <th className="px-3 py-2.5 text-center font-semibold">
                    Aksi
                  </th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Jumlah Baris
                  </th>
                  <th className="px-3 py-2.5 font-semibold">Mesin</th>
                  <th className="px-3 py-2.5 font-semibold">Collation</th>
                  <th className="px-3 py-2.5 text-right font-semibold">
                    Ukuran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {filteredDisplayTables.map((tbl) => {
                  const isChecked = selectedTableCheckboxes.includes(tbl.name);
                  return (
                    <tr
                      className={cn(
                        "transition-colors hover:bg-muted",
                        isChecked && "bg-primary text-primary-foreground/5"
                      )}
                      key={tbl.name}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          checked={isChecked}
                          className="cursor-pointer rounded border-border bg-background text-primary"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTableCheckboxes((prev) => [
                                ...prev,
                                tbl.name,
                              ]);
                            } else {
                              setSelectedTableCheckboxes((prev) =>
                                prev.filter((n) => n !== tbl.name)
                              );
                            }
                          }}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">
                        <button
                          className="flex cursor-pointer items-center gap-1.5 text-left font-semibold text-foreground hover:text-primary hover:underline"
                          onClick={() => onBrowseTable(tbl.name)}
                          title="Klik untuk menjelajahi data tabel"
                          type="button"
                        >
                          <TableIcon
                            className="shrink-0 text-primary"
                            size={13}
                          />
                          <span>{tbl.name}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            className="h-6 px-1.5 text-[10px] text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => onBrowseTable(tbl.name)}
                            size="sm"
                            title="Jelajahi Data (SELECT * FROM)"
                            variant="ghost"
                          >
                            <Play className="mr-1 fill-current" size={10} />
                            Jelajahi
                          </Button>
                          <Button
                            className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                            onClick={() => onViewTableStructure(tbl.name)}
                            size="sm"
                            title="Struktur Kolom & Indeks (DESCRIBE)"
                            variant="ghost"
                          >
                            <Columns className="mr-1" size={10} />
                            Struktur
                          </Button>
                          <Button
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={() => onSearchTable?.(tbl.name)}
                            size="sm"
                            title="Cari di Tabel Ini"
                            variant="ghost"
                          >
                            <Search className="mr-1" size={10} />
                            Cari
                          </Button>
                          <Button
                            className="h-6 px-1.5 text-[10px] text-amber-500 hover:bg-amber-500/10"
                            onClick={() => onOpenInsertModal(tbl.name)}
                            size="sm"
                            title="Sisipkan Baris Baru (INSERT INTO)"
                            variant="ghost"
                          >
                            <Plus className="mr-1" size={10} />
                            Sisipkan
                          </Button>
                          <Button
                            className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                            onClick={() => onEmptyTable(tbl.name)}
                            size="sm"
                            title="Kosongkan Tabel (TRUNCATE)"
                            variant="ghost"
                          >
                            <Trash2 className="mr-1" size={10} />
                            Kosongkan
                          </Button>
                          <Button
                            className="h-6 px-1 text-[10px] text-destructive hover:bg-destructive/10"
                            onClick={() => onDropTable(tbl.name)}
                            size="sm"
                            title="Hapus Tabel (DROP TABLE)"
                            variant="ghost"
                          >
                            <X size={10} />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {tbl.rows.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className="border-border px-1.5 py-0 font-mono text-[9px] text-muted-foreground"
                          variant="outline"
                        >
                          {tbl.engine || "InnoDB"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">
                        {tbl.collation || "utf8mb4_general_ci"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-foreground">
                        {tbl.size}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary Footer */}
              <tfoot>
                <tr className="border-border border-t-2 bg-muted/40 font-semibold text-[11px] text-foreground">
                  <td className="px-3 py-2.5 text-center">
                    <CheckSquare className="mx-auto text-primary" size={12} />
                  </td>
                  <td className="px-3 py-2.5">
                    {filteredDisplayTables.length} Tabel Total
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                    —
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-500">
                    {totalDatabaseRows.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    InnoDB / MariaDB
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">utf8mb4</td>
                  <td className="px-3 py-2.5 text-right text-primary">
                    {filteredDisplayTables.length > 0 ? "Tersedia" : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* With Selected Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-border border-t bg-muted p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Dengan yang terpilih ({selectedTableCheckboxes.length}):
                </span>
                <select
                  className="h-7 rounded border border-border bg-card px-2 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                  onChange={(e) => setBulkAction(e.target.value)}
                  value={bulkAction}
                >
                  <option value="empty">Kosongkan (TRUNCATE)</option>
                  <option value="drop">Hapus Tabel (DROP)</option>
                  <option value="optimize">Optimalkan (OPTIMIZE)</option>
                  <option value="check">Periksa (CHECK)</option>
                  <option value="analyze">Analisis (ANALYZE)</option>
                  <option value="repair">Perbaiki (REPAIR)</option>
                  <option value="checksum">Checksum (CHECKSUM)</option>
                  <option value="export">Ekspor Terpilih (EXPORT)</option>
                </select>
                <Button
                  className="h-7 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                  disabled={selectedTableCheckboxes.length === 0}
                  onClick={onExecuteBulkAction}
                  size="sm"
                >
                  Jalankan
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-[11px] text-primary hover:underline"
                  onClick={() =>
                    setSelectedTableCheckboxes(
                      filteredDisplayTables.map((t) => t.name)
                    )
                  }
                  type="button"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground/70">•</span>
                <button
                  className="text-[11px] text-muted-foreground hover:underline"
                  onClick={() => setSelectedTableCheckboxes([])}
                  type="button"
                >
                  Kosongkan Pilihan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Buat Tabel Baru di Basis Data Ini */}
        <div
          className="space-y-3 rounded-lg border border-border bg-card p-4"
          id="create-table-card"
        >
          <div className="flex items-center gap-2">
            <Plus className="text-emerald-500" size={14} />
            <h3 className="font-semibold text-foreground text-xs">
              Buat Tabel Baru pada Basis Data `{currentSelectedDatabase}`
            </h3>
          </div>

          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] text-muted-foreground">
                Nama Tabel Baru:
              </Label>
              <Input
                className="h-8 border-border bg-background font-mono text-foreground text-xs focus-visible:border-white/30 focus-visible:ring-0"
                onChange={(e) => setNewTableNameInput(e.target.value)}
                placeholder="misal: users, orders, logs..."
                value={newTableNameInput}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Jumlah Kolom Standar:
              </Label>
              <Input
                className="h-8 border-border bg-background font-mono text-foreground text-xs focus-visible:border-white/30 focus-visible:ring-0"
                max={50}
                min={1}
                onChange={(e) =>
                  setNewTableColumnsInput(Number(e.target.value) || 1)
                }
                type="number"
                value={newTableColumnsInput}
              />
            </div>
            <div>
              <Button
                className="h-8 w-full bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                disabled={!newTableNameInput.trim() || isCreatingTable}
                onClick={onCreateTable}
                size="sm"
              >
                <Plus className="mr-1.5" size={13} />
                {isCreatingTable ? "Membuat..." : "Buat Tabel"}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Secara default, tabel baru akan diinisialisasi dengan primary key `id`
            AUTO_INCREMENT dan timestamp `created_at`.
          </p>
        </div>
      </div>
    </div>
  );
}
