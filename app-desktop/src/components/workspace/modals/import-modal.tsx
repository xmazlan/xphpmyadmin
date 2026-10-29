import { FileCode2, UploadCloud, X, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tailwind";

export interface ImportModalProps {
  onPickImportFile?: (isModal: boolean) => any;
  onSelectDatabase?: (db: string) => any;
  onProcessChosenFile?: (file: any) => any;
  availableTables?: any[];
  importTargetTable?: string;
  setImportTargetTable?: (val: string) => void;
  currentSelectedDatabase: string;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  importSqlContent: string;
  importTab: "file" | "paste";
  isImporting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onExecuteImport: () => void;
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFileDialog?: () => void;
  selectedImportFile: { fileName: string; filePath?: string; fileSize: number } | null;
  setCurrentSelectedDatabase?: (val: string) => void;
  setImportSqlContent: (val: string) => void;
  setImportTab: (val: "file" | "paste") => void;
  setSelectedImportFile: (val: any) => void;
}

export function ImportModal({
  currentSelectedDatabase,
  fileInputRef,
  importSqlContent,
  importTab,
  isImporting,
  isOpen,
  onClose,
  onExecuteImport,
  onFileSelect,
  onOpenFileDialog,
  onPickImportFile,
  selectedImportFile,
  setImportSqlContent,
  setImportTab,
  setSelectedImportFile,
}: ImportModalProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  const handleOpenPicker = () => {
    if (onPickImportFile) {
      onPickImportFile(true);
    } else if (onOpenFileDialog) {
      onOpenFileDialog();
    }
  };

  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-border border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <UploadCloud size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-xs">
                {t("import.title", "Impor Skrip / Data SQL")}
              </h3>
              <p className="font-mono text-[11px] text-primary">
                Target Database: `{currentSelectedDatabase}`
              </p>
            </div>
          </div>
          <button
            className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {/* Segmented Control Metode Impor */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-1">
            <button
              className={cn(
                "flex-1 rounded py-1 font-semibold text-xs transition-all cursor-pointer",
                importTab === "file"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setImportTab("file")}
              type="button"
            >
              Unggah Berkas (.sql / .txt)
            </button>
            <button
              className={cn(
                "flex-1 rounded py-1 font-semibold text-xs transition-all cursor-pointer",
                importTab === "paste"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setImportTab("paste")}
              type="button"
            >
              Tempel Teks SQL Manual
            </button>
          </div>

          {importTab === "file" ? (
            <div className="space-y-3">
              <input
                accept=".sql,.txt"
                className="hidden"
                onChange={onFileSelect}
                ref={fileInputRef as any}
                type="file"
              />

              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-border border-dashed p-6 text-center transition-all hover:border-white/30 hover:bg-muted/30"
                onClick={handleOpenPicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpenPicker();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileCode2 size={20} />
                </div>
                <p className="mt-2 font-semibold text-foreground text-xs">
                  Klik untuk Memilih Berkas SQL dari Komputer
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  Mendukung format SQL Dump standard (MySQL / MariaDB).
                </p>
              </div>

              {selectedImportFile && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <FileCode2 className="text-emerald-500" size={14} />
                    <span className="font-semibold text-foreground">
                      {selectedImportFile.fileName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      ({(selectedImportFile.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => setSelectedImportFile(null)}
                    size="sm"
                    variant="ghost"
                  >
                    {t("common.cancel", "Batal")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                {t("import.pastePrompt", "Ketik atau Tempel Perintah SQL:")}
              </Label>
              <textarea
                className="h-44 w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-foreground text-xs focus:border-white/30 focus:outline-none"
                onChange={(e) => setImportSqlContent(e.target.value)}
                placeholder="-- Tempel skrip SQL di sini (misal: CREATE TABLE, INSERT INTO)..."
                value={importSqlContent}
              />
            </div>
          )}
        </div>

        {/* Footer Modal dengan Tombol Batal */}
        <div className="flex items-center justify-between border-border border-t bg-muted/40 px-4 py-3">
          <Button
            className="h-7 border-border text-muted-foreground text-xs hover:bg-muted hover:text-foreground cursor-pointer"
            onClick={onClose}
            size="sm"
            variant="outline"
          >
            {t("common.cancel", "Batal")}
          </Button>
          <Button
            className="h-7 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90 cursor-pointer"
            disabled={
              isImporting ||
              (importTab === "file" && !selectedImportFile) ||
              (importTab === "paste" && !importSqlContent.trim())
            }
            onClick={onExecuteImport}
            size="sm"
          >
            <Zap className="mr-1.5 fill-current" size={12} />
            {isImporting ? t("common.importing", "Mengimpor Data...") : t("import.execute", "Jalankan Proses Impor")}
          </Button>
        </div>
      </div>
    </div>
  );
}
