import React from "react";
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <FileDown size={18} className="text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Ekspor Basis Data ({currentSelectedDatabase || "Pilih db"})
              </h2>
              <p className="text-xs text-muted-foreground">
                Cadangkan skema dan data tabel ke format SQL dump standar.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div>
            <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block mb-2">
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
                  key={item.id}
                  type="button"
                  onClick={() => setExportMode(item.id)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                    exportMode === item.id
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-white/20"
                  )}
                >
                  <span className="font-semibold text-xs text-foreground">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-foreground">
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
                <Label className="text-xs text-foreground">
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
                readOnly
                rows={6}
                className="w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-[11px] text-emerald-500 focus:outline-none"
                value={exportPreviewSql}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting}
              className="h-8 border-border text-foreground hover:bg-muted"
              onClick={() => onExecuteExport(false)}
            >
              <Copy size={13} className="mr-1.5" />
              Salin ke Clipboard
            </Button>
            <Button
              size="sm"
              disabled={isExporting}
              className="h-8 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
              onClick={() => onExecuteExport(true)}
            >
              <Download size={13} className="mr-1.5" />
              {isExporting ? "Mengekspor..." : "Simpan Berkas .sql"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
