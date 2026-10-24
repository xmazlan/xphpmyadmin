import { Copy, Download, FileDown, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/tailwind";

interface ExportModalProps {
  currentSelectedDatabase: string;
  exportAddDropTable: boolean;
  exportDisableFk: boolean;
  exportMode: "full" | "structure" | "data";
  exportPreviewSql: string;
  isExporting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onExecuteExport: (saveToFile: boolean) => void;
  setExportAddDropTable: (val: boolean) => void;
  setExportDisableFk: (val: boolean) => void;
  setExportMode: (val: "full" | "structure" | "data") => void;
}

export function ExportModal({
  currentSelectedDatabase,
  exportAddDropTable,
  exportDisableFk,
  exportMode,
  exportPreviewSql,
  isExporting,
  isOpen,
  onClose,
  onExecuteExport,
  setExportAddDropTable,
  setExportDisableFk,
  setExportMode,
}: ExportModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-border border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <FileDown size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-xs">
                Ekspor Basis Data
              </h3>
              <p className="font-mono text-[11px] text-emerald-500">
                `{currentSelectedDatabase}`
              </p>
            </div>
          </div>
          <button
            className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {/* Pilihan Cakupan Ekspor */}
          <div>
            <Label className="mb-2 block font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              Format Ekspor
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  desc: "Tabel & seluruh baris data",
                  id: "full" as const,
                  title: "Struktur & Data",
                },
                {
                  desc: "Skema DDL CREATE TABLE saja",
                  id: "structure" as const,
                  title: "Hanya Struktur",
                },
                {
                  desc: "Query INSERT data saja",
                  id: "data" as const,
                  title: "Hanya Data",
                },
              ].map((item) => (
                <button
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-2.5 text-left transition-all",
                    exportMode === item.id
                      ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-white/20"
                  )}
                  key={item.id}
                  onClick={() => setExportMode(item.id)}
                  type="button"
                >
                  <span className="font-semibold text-[11px] text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Opsi Tambahan */}
          <div className="space-y-2.5 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[11px] text-foreground">
                  Sertakan DROP TABLE IF EXISTS
                </Label>
                <p className="text-[10px] text-muted-foreground/70">
                  Menghapus tabel lama jika sudah ada sebelum membuat ulang.
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
                <Label className="text-[11px] text-foreground">
                  Nonaktifkan Foreign Key Checks Sementara
                </Label>
                <p className="text-[10px] text-muted-foreground/70">
                  Mencegah error foreign key constraint saat proses import.
                </p>
              </div>
              <Switch
                checked={exportDisableFk}
                onCheckedChange={setExportDisableFk}
              />
            </div>
          </div>

          {/* Pratinjau SQL jika sudah digenerate */}
          {exportPreviewSql && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">
                  Pratinjau SQL Hasil Ekspor:
                </Label>
                <Button
                  className="h-5 px-1.5 text-[10px] text-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(exportPreviewSql);
                    toast.success("SQL disalin ke clipboard!");
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="mr-1" size={10} />
                  Salin Ulang
                </Button>
              </div>
              <textarea
                className="h-28 w-full resize-none rounded-md border border-border bg-background p-2 font-mono text-[10px] text-emerald-500 focus:outline-none"
                readOnly
                value={exportPreviewSql}
              />
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between border-border border-t bg-muted/40 px-4 py-3">
          <Button
            className="h-7 border-border text-muted-foreground text-xs hover:bg-muted"
            onClick={onClose}
            size="sm"
            variant="outline"
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            <Button
              className="h-7 border-border text-foreground text-xs hover:bg-muted"
              disabled={isExporting}
              onClick={() => onExecuteExport(false)}
              size="sm"
              variant="outline"
            >
              <Copy className="mr-1.5" size={12} />
              Salin ke Clipboard
            </Button>

            <Button
              className="h-7 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
              disabled={isExporting}
              onClick={() => onExecuteExport(true)}
              size="sm"
            >
              <Download className="mr-1.5" size={12} />
              {isExporting ? "Mengekspor..." : "Simpan Berkas .sql"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
