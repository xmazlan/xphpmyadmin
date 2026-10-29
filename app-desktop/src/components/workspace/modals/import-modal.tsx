import { FileCode2, FileUp, Table as TableIcon, X, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ImportFileInfo, TableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface ImportModalProps {
  availableTables?: TableItem[];
  currentSelectedDatabase: string;
  importSqlContent: string;
  importTab: "file" | "paste";
  importTargetTable?: string;
  isImporting: boolean;
  isOpen: boolean;
  onClose: () => void;
  onExecuteImport: () => void;
  onPickImportFile: (isModal: boolean) => void;
  onProcessChosenFile: (file: File) => void;
  selectedImportFile: ImportFileInfo | null;
  setImportSqlContent: (val: string) => void;
  setImportTab: (val: "file" | "paste") => void;
  setImportTargetTable?: (val: string) => void;
  setSelectedImportFile: (val: ImportFileInfo | null) => void;
}

export function ImportModal({
  availableTables = [],
  currentSelectedDatabase,
  importSqlContent,
  importTab,
  importTargetTable = "",
  isImporting,
  isOpen,
  onClose,
  onExecuteImport,
  onPickImportFile,
  onProcessChosenFile,
  selectedImportFile,
  setImportSqlContent,
  setImportTab,
  setImportTargetTable,
  setSelectedImportFile,
}: ImportModalProps) {
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  if (!isOpen) {
    return null;
  }

  const isCsvOrJson =
    selectedImportFile?.fileName?.toLowerCase().endsWith(".csv") ||
    selectedImportFile?.fileName?.toLowerCase().endsWith(".json");

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
                Impor Berkas / Data ke Database
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
            Pilih Berkas (.sql, .csv, .json)
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
          {isCsvOrJson && availableTables.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TableIcon className="text-primary" size={13} />
                <span>Tabel Target (CSV/JSON):</span>
              </div>
              <select
                className="rounded border border-border bg-card px-2.5 py-1 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                onChange={(e) => setImportTargetTable?.(e.target.value)}
                value={importTargetTable}
              >
                <option value="">[Otomatis berdasarkan nama berkas]</option>
                {availableTables.map((tbl) => (
                  <option key={tbl.name} value={tbl.name}>
                    {tbl.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {importTab === "file" ? (
            <div className="space-y-3">
              <input
                accept=".sql,.csv,.json,.xml,text/plain"
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
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(20,184,166,0.25)]"
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
                    "mb-2",
                    selectedImportFile
                      ? "text-emerald-500"
                      : "text-muted-foreground/70"
                  )}
                  size={28}
                />
                <p className="font-semibold text-foreground text-xs">
                  {selectedImportFile
                    ? selectedImportFile.fileName
                    : "Tarik berkas .sql, .csv, atau .json ke sini, atau klik untuk memilih"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {selectedImportFile
                    ? `Ukuran: ${(selectedImportFile.fileSize / 1024).toFixed(1)} KB • Klik untuk mengganti berkas`
                    : "Mendukung SQL Dump, format CSV tabel, dan JSON terstruktur"}
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
                    className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                    onClick={() => setSelectedImportFile(null)}
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
                className="h-44 w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-foreground text-xs focus:border-white/30 focus:outline-none"
                onChange={(e) => setImportSqlContent(e.target.value)}
                placeholder="-- Tempel skrip SQL di sini (misal: CREATE TABLE, INSERT INTO)..."
                value={importSqlContent}
              />
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-end border-border border-t bg-muted/40 px-4 py-3">
          <Button
            className="h-7 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
            disabled={
              isImporting ||
              (importTab === "file" && !selectedImportFile) ||
              (importTab === "paste" && !importSqlContent.trim())
            }
            onClick={onExecuteImport}
            size="sm"
          >
            <Zap className="mr-1.5 fill-current" size={12} />
            {isImporting ? "Mengimpor Data..." : "Jalankan Proses Impor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
