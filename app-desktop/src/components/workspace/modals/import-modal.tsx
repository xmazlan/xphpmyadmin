import { FileCode2, FileUp, X, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ImportFileInfo } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface ImportModalProps {
  currentSelectedDatabase: string;
  importSqlContent: string;
  importTab: "file" | "paste";
  isImporting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onExecuteImport: () => void;
  onPickImportFile: (isModal: boolean) => void;
  onProcessChosenFile: (file: File) => void;
  selectedImportFile: ImportFileInfo | null;
  setImportSqlContent: (val: string) => void;
  setImportTab: (val: "file" | "paste") => void;
  setSelectedImportFile: (val: ImportFileInfo | null) => void;
}

export function ImportModal({
  currentSelectedDatabase,
  importSqlContent,
  importTab,
  isImporting,
  isOpen,
  onClose,
  onExecuteImport,
  onPickImportFile,
  onProcessChosenFile,
  selectedImportFile,
  setImportSqlContent,
  setImportTab,
  setSelectedImportFile,
}: ImportModalProps) {
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-border border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <FileUp size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-xs">
                Impor Script SQL ke Database
              </h3>
              <p className="font-mono text-[11px] text-primary">
                Target: `{currentSelectedDatabase || "MariaDB Server"}`
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

        {/* Tab Navigasi */}
        <div className="flex border-border border-b bg-muted/40 px-4 pt-1">
          <button
            className={cn(
              "border-b-2 px-3 py-2 font-medium text-xs transition-all",
              importTab === "file"
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground/70 hover:text-foreground"
            )}
            onClick={() => setImportTab("file")}
            type="button"
          >
            Pilih Berkas .sql
          </button>
          <button
            className={cn(
              "border-b-2 px-3 py-2 font-medium text-xs transition-all",
              importTab === "paste"
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground/70 hover:text-foreground"
            )}
            onClick={() => setImportTab("paste")}
            type="button"
          >
            Tempel Script SQL
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
          {importTab === "file" ? (
            <div className="space-y-3">
              <input
                accept=".sql,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onProcessChosenFile(e.target.files[0]);
                  }
                  e.target.value = "";
                }}
                ref={modalFileInputRef}
                type="file"
              />

              <div
                className={cn(
                  "flex cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all",
                  isDraggingImport
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(87,193,255,0.2)]"
                    : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted"
                )}
                onClick={() => onPickImportFile(true)}
                onDragLeave={() => setIsDraggingImport(false)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImport(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImport(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onProcessChosenFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <FileUp
                  className={cn(
                    "mb-2 transition-transform",
                    isDraggingImport
                      ? "scale-110 text-foreground"
                      : "text-primary"
                  )}
                  size={28}
                />
                <p className="font-medium text-foreground text-xs">
                  {isDraggingImport
                    ? "Lepaskan berkas .sql di sini..."
                    : "Pilih berkas dump database .sql"}
                </p>
                <p className="mt-1 mb-3 text-[11px] text-muted-foreground/70">
                  Klik di mana saja pada kotak ini atau seret berkas SQL dari
                  komputer Anda.
                </p>
                <Button
                  className="pointer-events-auto bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickImportFile(true);
                  }}
                  size="sm"
                  type="button"
                >
                  Jelajahi Berkas (.sql)
                </Button>
              </div>

              {selectedImportFile && (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary p-3 text-primary-foreground/5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileCode2 className="shrink-0 text-primary" size={16} />
                    <div className="min-w-0">
                      <p className="truncate font-medium font-mono text-foreground text-xs">
                        {selectedImportFile.fileName}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {(selectedImportFile.fileSize / 1024).toFixed(1)} KB •{" "}
                        {selectedImportFile.filePath}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedImportFile(null);
                      setImportSqlContent("");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Batal
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">
                Ketik atau Tempel Perintah SQL:
              </Label>
              <textarea
                className="w-full resize-none rounded-md border border-border bg-background p-3 font-mono text-primary text-xs focus:border-white/30 focus:outline-none"
                onChange={(e) => setImportSqlContent(e.target.value)}
                placeholder="CREATE TABLE `contoh` (...);&#10;INSERT INTO `contoh` VALUES (...);"
                rows={8}
                value={importSqlContent}
              />
            </div>
          )}

          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] text-amber-500 leading-relaxed">
            <strong>Catatan Penting:</strong> Seluruh perintah SQL dalam berkas
            ini akan dieksekusi langsung pada server database. Pastikan isi
            script berasal dari sumber tepercaya.
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between border-border border-t bg-muted/40 px-4 py-3">
          <Button
            className="h-7 border-border text-muted-foreground text-xs hover:bg-muted"
            onClick={onClose}
            size="sm"
            variant="outline"
          >
            Batal
          </Button>

          <Button
            className="h-7 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
            disabled={isImporting}
            onClick={onExecuteImport}
            size="sm"
          >
            <Zap className="mr-1.5 fill-black" size={12} />
            {isImporting ? "Mengeksekusi SQL..." : "Jalankan Impor SQL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
