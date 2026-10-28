import { CheckSquare, Copy, Download, FileDown, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { TableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface ExportTabProps {
  availableTables?: TableItem[];
  currentSelectedDatabase: string;
  exportAddDropTable: boolean;
  exportDisableFk: boolean;
  exportFormat?: "sql" | "csv" | "json" | "xml";
  exportMethod?: "quick" | "custom";
  exportMode: "full" | "structure" | "data";
  exportPreviewSql: string;
  exportSelectedTables?: string[];
  isExporting: boolean;
  onExecuteExport: (saveToFile: boolean) => void;
  setExportAddDropTable: (val: boolean) => void;
  setExportDisableFk: (val: boolean) => void;
  setExportFormat?: (val: "sql" | "csv" | "json" | "xml") => void;
  setExportMethod?: (val: "quick" | "custom") => void;
  setExportMode: (val: "full" | "structure" | "data") => void;
  setExportSelectedTables?: (val: string[]) => void;
}

export function ExportTab({
  availableTables = [],
  currentSelectedDatabase,
  exportAddDropTable,
  exportDisableFk,
  exportFormat = "sql",
  exportMethod = "quick",
  exportMode,
  exportPreviewSql,
  exportSelectedTables = [],
  isExporting,
  onExecuteExport,
  setExportAddDropTable,
  setExportDisableFk,
  setExportFormat,
  setExportMethod,
  setExportMode,
  setExportSelectedTables,
}: ExportTabProps) {
  const formats = [
    {
      desc: "Format standar phpMyAdmin dump DDL & INSERT",
      ext: ".sql",
      id: "sql" as const,
      name: "SQL Dump",
    },
    {
      desc: "Nilai dipisahkan koma untuk Excel / Spreadsheet",
      ext: ".csv",
      id: "csv" as const,
      name: "CSV",
    },
    {
      desc: "Objek JSON terstruktur untuk web & API",
      ext: ".json",
      id: "json" as const,
      name: "JSON",
    },
    {
      desc: "Hierarki elemen dokumen XML terstruktur",
      ext: ".xml",
      id: "xml" as const,
      name: "XML",
    },
  ];

  const handleToggleTable = (tblName: string) => {
    if (!setExportSelectedTables) return;
    if (exportSelectedTables.includes(tblName)) {
      setExportSelectedTables(
        exportSelectedTables.filter((t) => t !== tblName)
      );
    } else {
      setExportSelectedTables([...exportSelectedTables, tblName]);
    }
  };

  const handleSelectAllTables = () => {
    if (!setExportSelectedTables) return;
    setExportSelectedTables(availableTables.map((t) => t.name));
  };

  const handleDeselectAllTables = () => {
    if (!setExportSelectedTables) return;
    setExportSelectedTables([]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <FileDown className="text-emerald-500" size={20} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Ekspor Basis Data (
                <span className="font-mono text-emerald-500">
                  {currentSelectedDatabase || "Pilih database"}
                </span>
                )
              </h2>
              <p className="text-muted-foreground text-xs">
                Cadangkan skema dan data basis data ke berbagai format standar
                phpMyAdmin.
              </p>
            </div>
          </div>
          <Badge
            className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-500"
            variant="outline"
          >
            {availableTables.length} Tabel Terdeteksi
          </Badge>
        </div>

        {/* Metode Ekspor (Cepat vs Kustom) */}
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <Label className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            Metode Ekspor
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                desc: "Tampilkan opsi standar, cadangkan seluruh tabel langsung.",
                id: "quick" as const,
                title: "Cepat (Quick)",
              },
              {
                desc: "Pilih tabel spesifik, pengaturan DROP TABLE, dan filter.",
                id: "custom" as const,
                title: "Kustom (Custom)",
              },
            ].map((m) => (
              <button
                className={cn(
                  "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                  exportMethod === m.id
                    ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-white/20"
                )}
                key={m.id}
                onClick={() => setExportMethod?.(m.id)}
                type="button"
              >
                <span className="font-semibold text-foreground text-xs">
                  {m.title}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground/70">
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pemilihan Format Berkas */}
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <Label className="block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            Format Berkas Hasil Ekspor
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {formats.map((f) => (
              <button
                className={cn(
                  "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                  exportFormat === f.id
                    ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-white/20"
                )}
                key={f.id}
                onClick={() => setExportFormat?.(f.id)}
                type="button"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-foreground text-xs">
                    {f.name}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-500">
                    {f.ext}
                  </span>
                </div>
                <span className="mt-1 line-clamp-2 text-[10px] text-muted-foreground/70">
                  {f.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pemilihan Tabel Kustom (Hanya jika Kustom) */}
        {exportMethod === "custom" && availableTables.length > 0 && (
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold text-foreground text-xs">
                  Pilih Tabel yang Diekspor
                </Label>
                <p className="text-[10px] text-muted-foreground/70">
                  {exportSelectedTables.length} dari {availableTables.length}{" "}
                  tabel terpilih.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  className="text-primary hover:underline"
                  onClick={handleSelectAllTables}
                  type="button"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground/70">•</span>
                <button
                  className="text-muted-foreground hover:underline"
                  onClick={handleDeselectAllTables}
                  type="button"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background p-2">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {availableTables.map((tbl) => {
                  const isChecked = exportSelectedTables.includes(tbl.name);
                  return (
                    <button
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-xs transition-colors",
                        isChecked
                          ? "bg-accent/50 text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      key={tbl.name}
                      onClick={() => handleToggleTable(tbl.name)}
                      type="button"
                    >
                      {isChecked ? (
                        <CheckSquare
                          className="shrink-0 text-emerald-500"
                          size={14}
                        />
                      ) : (
                        <Square
                          className="shrink-0 text-muted-foreground/50"
                          size={14}
                        />
                      )}
                      <span className="truncate">{tbl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pilihan Cakupan Data / Struktur (Hanya untuk SQL) */}
        {exportFormat === "sql" && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div>
              <Label className="mb-2 block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                Cakupan Konten SQL
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    desc: "Skema tabel & seluruh baris data",
                    id: "full" as const,
                    title: "Struktur & Data",
                  },
                  {
                    desc: "Hanya DDL CREATE TABLE",
                    id: "structure" as const,
                    title: "Hanya Struktur",
                  },
                  {
                    desc: "Hanya query INSERT data",
                    id: "data" as const,
                    title: "Hanya Data",
                  },
                ].map((item) => (
                  <button
                    className={cn(
                      "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                      exportMode === item.id
                        ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-white/20"
                    )}
                    key={item.id}
                    onClick={() => setExportMode(item.id)}
                    type="button"
                  >
                    <span className="font-semibold text-foreground text-xs">
                      {item.title}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground text-xs">
                    Sertakan DROP TABLE IF EXISTS
                  </Label>
                  <p className="text-[10px] text-muted-foreground/70">
                    Menimpa tabel lama jika sudah ada pada target import.
                  </p>
                </div>
                <Switch
                  checked={exportAddDropTable}
                  onCheckedChange={setExportAddDropTable}
                />
              </div>
              <div className="h-[1px] bg-border" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground text-xs">
                    Nonaktifkan Foreign Key Checks Sementara
                  </Label>
                  <p className="text-[10px] text-muted-foreground/70">
                    Mencegah kegagalan constraint relasi tabel saat restorasi.
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

        {/* Pratinjau SQL / Format Hasil Ekspor */}
        {exportPreviewSql && (
          <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
            <Label className="text-[11px] text-muted-foreground">
              Pratinjau Hasil Ekspor ({exportFormat.toUpperCase()}):
            </Label>
            <textarea
              className="w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-[11px] text-emerald-500 focus:outline-none"
              readOnly
              rows={6}
              value={exportPreviewSql}
            />
          </div>
        )}

        {/* Footer Tombol Aksi */}
        <div className="flex items-center justify-end gap-2 border-border border-t pt-3">
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
  );
}
