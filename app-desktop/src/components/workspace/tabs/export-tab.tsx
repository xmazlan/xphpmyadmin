import { Copy, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/tailwind";

interface ExportTabProps {
  currentSelectedDatabase: string;
  exportAddDropTable: boolean;
  exportDisableFk: boolean;
  exportMode: "full" | "structure" | "data";
  exportPreviewSql: string;
  isExporting: boolean;
  onExecuteExport: (saveToFile: boolean) => void;
  setExportAddDropTable: (val: boolean) => void;
  setExportDisableFk: (val: boolean) => void;
  setExportMode: (val: "full" | "structure" | "data") => void;
}

export function ExportTab({
  currentSelectedDatabase,
  exportAddDropTable,
  exportDisableFk,
  exportMode,
  exportPreviewSql,
  isExporting,
  onExecuteExport,
  setExportAddDropTable,
  setExportDisableFk,
  setExportMode,
}: ExportTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <FileDown className="text-emerald-500" size={18} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Ekspor Basis Data ({currentSelectedDatabase || "Pilih db"})
              </h2>
              <p className="text-muted-foreground text-xs">
                Cadangkan skema dan data tabel ke format SQL dump standar.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div>
            <Label className="mb-2 block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              Pilih Format Ekspor
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

          {exportPreviewSql && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                Pratinjau SQL Hasil Ekspor:
              </Label>
              <textarea
                className="w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-[11px] text-emerald-500 focus:outline-none"
                readOnly
                rows={6}
                value={exportPreviewSql}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-border border-t pt-2">
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
              {isExporting ? "Mengekspor..." : "Simpan Berkas .sql"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
