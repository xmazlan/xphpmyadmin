import { Check, Copy, Download, FileDown, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/tailwind";

import type { TableItem } from "@/types/workspace";

interface ExportTabProps {
  exportMethod?: "quick" | "custom" | string;
  exportSelectedTables?: string[];
  setExportMethod?: (val: any) => void;
  setExportSelectedTables?: (val: any) => void;
  availableTables?: (string | TableItem)[];
  currentSelectedDatabase: string;
  exportAddDropTable: boolean;
  exportDisableFk: boolean;
  exportFormat?: "sql" | "csv" | "json" | "xml";
  exportMode: "full" | "structure" | "data";
  exportPreviewSql: string;
  isExporting: boolean;
  onExecuteExport: (saveToFile: boolean) => void;
  selectedTables?: string[];
  setExportAddDropTable: (val: boolean) => void;
  setExportDisableFk: (val: boolean) => void;
  setExportFormat?: (val: "sql" | "csv" | "json" | "xml") => void;
  setExportMode: (val: "full" | "structure" | "data") => void;
  setSelectedTables?: (tables: string[]) => void;
}

export function ExportTab({
  availableTables: rawAvailableTables = [],
  currentSelectedDatabase,
  exportAddDropTable,
  exportDisableFk,
  exportFormat = "sql",
  exportMethod,
  exportMode,
  exportPreviewSql,
  exportSelectedTables,
  isExporting,
  onExecuteExport,
  selectedTables: propSelectedTables,
  setExportAddDropTable,
  setExportDisableFk,
  setExportFormat,
  setExportMethod,
  setExportMode,
  setExportSelectedTables,
  setSelectedTables: propSetSelectedTables,
}: ExportTabProps) {
  const setSelectedTables = propSetSelectedTables || setExportSelectedTables || (() => {});
  const selectedTables = propSelectedTables || exportSelectedTables || [];
  const availableTables = (rawAvailableTables || []).map((t) => (typeof t === "string" ? t : t.name));
  const formats = [
    { ext: ".sql", id: "sql" as const, name: "SQL Dump" },
    { ext: ".csv", id: "csv" as const, name: "CSV" },
    { ext: ".json", id: "json" as const, name: "JSON" },
    { ext: ".xml", id: "xml" as const, name: "XML" },
  ];

  const handleToggleTable = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter((t) => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  const handleSelectAllTables = () => {
    setSelectedTables([...availableTables]);
  };

  const handleDeselectAllTables = () => {
    setSelectedTables([]);
  };

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6 text-xs">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Banner Info Ekspor */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shrink-0">
              <FileDown size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Ekspor Basis Data
              </h3>
              <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
                Buat salinan cadangan dari basis data{" "}
                <span className="font-mono font-semibold text-emerald-500">
                  `{currentSelectedDatabase}`
                </span>{" "}
                dalam format SQL dump atau format pertukaran data lainnya.
              </p>
            </div>
          </div>
        </div>

        {/* Pilihan Format Berkas */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <Label className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            1. Pilih Format Berkas Ekspor
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {formats.map((f) => (
              <button
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all cursor-pointer",
                  exportFormat === f.id
                    ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
                key={f.id}
                onClick={() => setExportFormat?.(f.id)}
                type="button"
              >
                <span className="font-semibold text-foreground text-xs">
                  {f.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {f.ext}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pemilihan Tabel yang Diekspor */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <Label className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              Pilih Tabel yang Diekspor
            </Label>
            <div className="flex items-center gap-2">
              <Button
                className="h-6 text-[10px]"
                onClick={handleSelectAllTables}
                size="sm"
                variant="ghost"
              >
                Pilih Semua
              </Button>
              <Button
                className="h-6 text-[10px]"
                onClick={handleDeselectAllTables}
                size="sm"
                variant="ghost"
              >
                Batalkan Semua
              </Button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
            {availableTables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {availableTables.map((tbl) => {
                  const isSelected = selectedTables.includes(tbl);
                  return (
                    <button
                      className={cn(
                        "flex items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "bg-emerald-500/15 font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      key={tbl}
                      onClick={() => handleToggleTable(tbl)}
                      type="button"
                    >
                      <span className="font-mono text-[11px] truncate">
                        {tbl}
                      </span>
                      {isSelected && <Check size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="p-3 text-center text-muted-foreground text-xs">
                Tidak ada tabel yang ditemukan di basis data ini.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {selectedTables.length} dari {availableTables.length} tabel dipilih
            </span>
          </div>
        </div>

        {/* Pilihan Cakupan Ekspor (Khusus SQL) */}
        {exportFormat === "sql" && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <Label className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              3. Cakupan Konten Ekspor (SQL)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  desc: "Mengekspor struktur tabel beserta seluruh data baris.",
                  id: "full" as const,
                  title: "Struktur & Data",
                },
                {
                  desc: "Hanya membuat DDL skema CREATE TABLE tanpa baris data.",
                  id: "structure" as const,
                  title: "Hanya Struktur",
                },
                {
                  desc: "Hanya mengekspor statement query INSERT INTO data.",
                  id: "data" as const,
                  title: "Hanya Data",
                },
              ].map((item) => (
                <button
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer",
                    exportMode === item.id
                      ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                  key={item.id}
                  onClick={() => setExportMode(item.id)}
                  type="button"
                >
                  <span className="font-semibold text-foreground text-xs">
                    {item.title}
                  </span>
                  <span className="mt-1 text-[10px] text-muted-foreground/70 leading-relaxed">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Opsi Tambahan SQL */}
        {exportFormat === "sql" && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <Label className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              4. Opsi Penulisan SQL
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Sertakan DROP TABLE IF EXISTS
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Menambahkan statement untuk menghapus tabel lama sebelum
                    membuat ulang.
                  </p>
                </div>
                <Switch
                  checked={exportAddDropTable}
                  onCheckedChange={setExportAddDropTable}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Nonaktifkan Pemeriksaan Foreign Key Sementara
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Membungkus ekspor dengan SET FOREIGN_KEY_CHECKS = 0 untuk
                    mencegah error constraint saat restore.
                  </p>
                </div>
                <Switch
                  checked={exportDisableFk}
                  onCheckedChange={setExportDisableFk}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pratinjau Output Jika Ada */}
        {exportPreviewSql && (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                Pratinjau Hasil Ekspor ({exportFormat.toUpperCase()}):
              </Label>
              <Badge className="font-mono text-[10px]" variant="outline">
                {exportPreviewSql.split("\n").length} Baris
              </Badge>
            </div>
            <textarea
              className="w-full resize-none rounded-md border border-border bg-background p-3 font-mono text-[11px] text-emerald-500 focus:outline-none"
              readOnly
              rows={5}
              value={exportPreviewSql}
            />
          </div>
        )}

        {/* Footer Tombol Aksi dengan Tombol Batal/Atur Ulang */}
        <div className="flex items-center justify-between gap-2 border-border border-t pt-3">
          <Button
            className="h-8 border-border text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
            disabled={isExporting}
            onClick={() => {
              setSelectedTables([...availableTables]);
              setExportFormat?.("sql");
              setExportMode("full");
            }}
            size="sm"
            variant="outline"
          >
            Atur Ulang / Batal
          </Button>
          <div className="flex items-center gap-2">
            <Button
              className="h-8 border-border text-foreground hover:bg-muted"
              disabled={isExporting}
              onClick={() => onExecuteExport(false)}
              size="sm"
              variant="outline"
            >
              <Copy className="mr-1.5" size={13} />
              Salin ke Clipboard
            </Button>
            <Button
              className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
              disabled={isExporting}
              onClick={() => onExecuteExport(true)}
              size="sm"
            >
              <Download className="mr-1.5" size={13} />
              {isExporting
                ? "Mengekspor..."
                : `Simpan Berkas .${exportFormat || "sql"}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
