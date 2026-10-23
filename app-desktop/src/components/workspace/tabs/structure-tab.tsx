import React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tailwind";
import type { TableItem } from "@/types/workspace";

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
  onSwitchTab: (tabId: "import") => void;
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Header Bar Struktur */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TableIcon size={16} className="text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground truncate">
                Struktur Basis Data:{" "}
                <span className="font-mono text-emerald-500">
                  {currentSelectedDatabase || "Belum dipilih"}
                </span>
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
              >
                {filteredDisplayTables.length} Tabel
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hidden sm:inline-flex"
              >
                {totalDatabaseRows.toLocaleString()} Baris Total
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-40 sm:w-56">
            <Search
              size={12}
              className="absolute left-2.5 top-2 text-muted-foreground/70"
            />
            <Input
              className="h-7 text-xs pl-8 pr-2 border-border bg-muted/40 text-foreground placeholder:text-muted-foreground/70"
              placeholder="Saring tabel..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="h-7 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
            onClick={() => {
              const elem = document.getElementById("create-table-card");
              if (elem) elem.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Plus size={12} />
            <span className="hidden sm:inline">Buat Tabel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onRefreshTables}
            title="Segarkan daftar tabel"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      {/* Body: Tabel List Structure ala phpMyAdmin */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {filteredDisplayTables.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-3">
            <TableIcon size={32} className="mx-auto text-muted-foreground/70" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-xs">
                Belum ada tabel pada basis data `{currentSelectedDatabase}`
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Anda dapat membuat tabel baru menggunakan formulir di bawah atau mengimpor skrip berkas .sql.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-primary hover:bg-primary/10 text-xs"
              onClick={() => onSwitchTab("import")}
            >
              <FileUp size={12} className="mr-1.5" />
              Impor Berkas SQL
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-border bg-background text-primary cursor-pointer"
                      checked={
                        selectedTableCheckboxes.length ===
                        filteredDisplayTables.length &&
                        filteredDisplayTables.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTableCheckboxes(
                            filteredDisplayTables.map((t) => t.name)
                          );
                        } else {
                          setSelectedTableCheckboxes([]);
                        }
                      }}
                    />
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Tabel</th>
                  <th className="py-2.5 px-3 font-semibold text-center">
                    Aksi (phpMyAdmin)
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    Baris
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Mesin</th>
                  <th className="py-2.5 px-3 font-semibold">
                    Penyortiran (Collation)
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    Ukuran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {filteredDisplayTables.map((tbl) => {
                  const isChecked = selectedTableCheckboxes.includes(tbl.name);
                  return (
                    <tr
                      key={tbl.name}
                      className={cn(
                        "hover:bg-muted transition-colors",
                        isChecked && "bg-primary text-primary-foreground/5"
                      )}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-border bg-background text-primary cursor-pointer"
                          checked={isChecked}
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
                        />
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => onBrowseTable(tbl.name)}
                          className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer"
                          title="Klik untuk menjelajahi data tabel"
                        >
                          <TableIcon
                            size={13}
                            className="text-primary shrink-0"
                          />
                          <span>{tbl.name}</span>
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-[10px] text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => onBrowseTable(tbl.name)}
                            title="Jelajahi Data (SELECT * FROM)"
                          >
                            <Play size={10} className="mr-1 fill-current" />
                            Jelajahi
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                            onClick={() => onViewTableStructure(tbl.name)}
                            title="Struktur Kolom & Indeks (DESCRIBE)"
                          >
                            <Columns size={10} className="mr-1" />
                            Struktur
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-[10px] text-amber-500 hover:bg-amber-500/10"
                            onClick={() => onOpenInsertModal(tbl.name)}
                            title="Sisipkan Baris Baru (INSERT INTO)"
                          >
                            <Plus size={10} className="mr-1" />
                            Sisipkan
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                            onClick={() => onEmptyTable(tbl.name)}
                            title="Kosongkan Tabel (TRUNCATE)"
                          >
                            <Trash2 size={10} className="mr-1" />
                            Kosongkan
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1 text-[10px] text-destructive hover:bg-destructive/10"
                            onClick={() => onDropTable(tbl.name)}
                            title="Hapus Tabel (DROP TABLE)"
                          >
                            <X size={10} />
                          </Button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {tbl.rows.toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 border-border text-muted-foreground font-mono"
                        >
                          {tbl.engine || "InnoDB"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-muted-foreground">
                        {tbl.collation || "utf8mb4_general_ci"}
                      </td>
                      <td className="py-2 px-3 text-right text-foreground font-medium">
                        {tbl.size}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary Footer */}
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-semibold text-foreground text-[11px]">
                  <td className="py-2.5 px-3 text-center">
                    <CheckSquare size={12} className="mx-auto text-primary" />
                  </td>
                  <td className="py-2.5 px-3">
                    {filteredDisplayTables.length} Tabel Total
                  </td>
                  <td className="py-2.5 px-3 text-center text-muted-foreground">
                    —
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-500">
                    {totalDatabaseRows.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    InnoDB / MariaDB
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    utf8mb4
                  </td>
                  <td className="py-2.5 px-3 text-right text-primary">
                    {filteredDisplayTables.length > 0 ? "Tersedia" : "-"}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* With Selected Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[11px]">
                  Dengan yang terpilih ({selectedTableCheckboxes.length}):
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="h-7 text-xs bg-card border border-border text-foreground rounded px-2 font-mono focus:outline-none focus:border-primary"
                >
                  <option value="empty">Kosongkan (TRUNCATE)</option>
                  <option value="drop">Hapus Tabel (DROP)</option>
                  <option value="optimize">Optimalkan (OPTIMIZE)</option>
                  <option value="check">Periksa (CHECK)</option>
                </select>
                <Button
                  size="sm"
                  disabled={selectedTableCheckboxes.length === 0}
                  className="h-7 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
                  onClick={onExecuteBulkAction}
                >
                  Jalankan
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTableCheckboxes(
                      filteredDisplayTables.map((t) => t.name)
                    )
                  }
                  className="text-[11px] text-primary hover:underline"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground/70">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedTableCheckboxes([])}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  Kosongkan Pilihan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Buat Tabel Baru di Basis Data Ini */}
        <div
          id="create-table-card"
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Plus size={14} className="text-emerald-500" />
            <h3 className="font-semibold text-foreground text-xs">
              Buat Tabel Baru pada Basis Data `{currentSelectedDatabase}`
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] text-muted-foreground">
                Nama Tabel:
              </Label>
              <Input
                className="h-7.5 border-border bg-muted/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/70"
                placeholder="e.g. pelanggan, transaksi, log_kegiatan"
                value={newTableNameInput}
                onChange={(e) => setNewTableNameInput(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Jumlah Kolom:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  className="h-7.5 border-border bg-muted/40 text-xs font-mono text-foreground w-20"
                  value={newTableColumnsInput}
                  onChange={(e) =>
                    setNewTableColumnsInput(Number(e.target.value) || 4)
                  }
                />
                <Button
                  size="sm"
                  disabled={isCreatingTable || !newTableNameInput.trim()}
                  className="h-7.5 flex-1 bg-emerald-600 text-foreground font-semibold text-xs hover:bg-emerald-500"
                  onClick={onCreateTable}
                >
                  <Plus size={12} className="mr-1" />
                  {isCreatingTable ? "Membuat..." : "Buat Tabel"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
