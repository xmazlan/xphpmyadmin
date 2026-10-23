import React, { useRef, useState } from "react";
import { FileCode2, FileUp, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tailwind";
import type { ImportFileInfo } from "@/types/workspace";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
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
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-border bg-muted/40 px-4 pt-1">
          <button
            type="button"
            onClick={() => setImportTab("file")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-all",
              importTab === "file"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground/70 hover:text-foreground"
            )}
          >
            Pilih Berkas .sql
          </button>
          <button
            type="button"
            onClick={() => setImportTab("paste")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-all",
              importTab === "paste"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground/70 hover:text-foreground"
            )}
          >
            Tempel Script SQL
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
          {importTab === "file" ? (
            <div className="space-y-3">
              <input
                type="file"
                ref={modalFileInputRef}
                accept=".sql,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onProcessChosenFile(e.target.files[0]);
                  }
                  e.target.value = "";
                }}
              />

              <div
                onClick={() => onPickImportFile(true)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImport(true);
                }}
                onDragLeave={() => setIsDraggingImport(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImport(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onProcessChosenFile(e.dataTransfer.files[0]);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none",
                  isDraggingImport
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(87,193,255,0.2)]"
                    : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted"
                )}
              >
                <FileUp
                  size={28}
                  className={cn(
                    "mb-2 transition-transform",
                    isDraggingImport ? "text-foreground scale-110" : "text-primary"
                  )}
                />
                <p className="font-medium text-foreground text-xs">
                  {isDraggingImport
                    ? "Lepaskan berkas .sql di sini..."
                    : "Pilih berkas dump database .sql"}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 mb-3">
                  Klik di mana saja pada kotak ini atau seret berkas SQL dari komputer Anda.
                </p>
                <Button
                  size="sm"
                  type="button"
                  className="bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickImportFile(true);
                  }}
                >
                  Jelajahi Berkas (.sql)
                </Button>
              </div>

              {selectedImportFile && (
                <div className="rounded-lg border border-primary/30 bg-primary text-primary-foreground/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode2 size={16} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-foreground truncate">
                        {selectedImportFile.fileName}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {(selectedImportFile.fileSize / 1024).toFixed(1)} KB • {selectedImportFile.filePath}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedImportFile(null);
                      setImportSqlContent("");
                    }}
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
                rows={8}
                className="w-full resize-none rounded-md border border-border bg-background p-3 font-mono text-xs text-primary focus:outline-none focus:border-white/30"
                placeholder="CREATE TABLE `contoh` (...);&#10;INSERT INTO `contoh` VALUES (...);"
                value={importSqlContent}
                onChange={(e) => setImportSqlContent(e.target.value)}
              />
            </div>
          )}

          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] text-amber-500 leading-relaxed">
            <strong>Catatan Penting:</strong> Seluruh perintah SQL dalam berkas ini akan dieksekusi langsung pada server database. Pastikan isi script berasal dari sumber tepercaya.
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-border text-muted-foreground hover:bg-muted"
            onClick={onClose}
          >
            Batal
          </Button>

          <Button
            size="sm"
            disabled={isImporting}
            className="h-7 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
            onClick={onExecuteImport}
          >
            <Zap size={12} className="mr-1.5 fill-black" />
            {isImporting ? "Mengeksekusi SQL..." : "Jalankan Impor SQL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
