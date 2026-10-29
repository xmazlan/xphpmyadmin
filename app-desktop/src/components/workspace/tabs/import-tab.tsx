import { Database, FileCode2, FileUp, Table as TableIcon, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ImportFileInfo, TableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

export interface ImportTabProps {
  availableDatabases?: string[];
  availableTables?: TableItem[];
  currentSelectedDatabase: string;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  importSqlContent: string;
  importTab: "file" | "paste";
  importTargetTable?: string;
  isImporting: boolean;
  onExecuteImport: () => void;
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFileDialog?: () => void;
  onPickImportFile?: (isModal: boolean) => void;
  onProcessChosenFile?: (file: File) => void;
  onSelectDatabase?: (dbName: string) => void;
  selectedImportFile: ImportFileInfo | null;
  setCurrentSelectedDatabase?: (val: string) => void;
  setImportSqlContent: (val: string) => void;
  setImportTab: (val: "file" | "paste") => void;
  setImportTargetTable?: (val: string) => void;
  setSelectedImportFile: (val: ImportFileInfo | null) => void;
}

export function ImportTab({
  availableDatabases = [],
  availableTables = [],
  currentSelectedDatabase,
  fileInputRef: externalFileInputRef,
  importSqlContent,
  importTab,
  importTargetTable = "",
  isImporting,
  onExecuteImport,
  onFileSelect,
  onOpenFileDialog,
  onPickImportFile,
  onProcessChosenFile,
  onSelectDatabase,
  selectedImportFile,
  setCurrentSelectedDatabase,
  setImportSqlContent,
  setImportTab,
  setImportTargetTable,
  setSelectedImportFile,
}: ImportTabProps) {
  const { t } = useTranslation();
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = (externalFileInputRef || internalFileInputRef) as React.RefObject<HTMLInputElement>;
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  const isCsvOrJson =
    selectedImportFile?.fileName?.toLowerCase().endsWith(".csv") ||
    selectedImportFile?.fileName?.toLowerCase().endsWith(".json");

  const handleOpenPicker = () => {
    if (onPickImportFile) {
      onPickImportFile(false);
    } else if (onOpenFileDialog) {
      onOpenFileDialog();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <FileUp className="text-primary" size={18} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Impor Script SQL ke Database (`{currentSelectedDatabase}`)
              </h2>
              <p className="text-muted-foreground text-xs">
                Pulihkan atau jalankan skrip SQL langsung ke basis data aktif.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          {/* Tab Pilihan Impor */}
          <div className="flex rounded-md border-border border-b bg-muted/40 p-1">
            <button
              className={cn(
                "flex-1 rounded py-1.5 font-medium text-xs transition-all cursor-pointer",
                importTab === "file"
                  ? "bg-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setImportTab("file")}
              type="button"
            >
              Pilih Berkas (.sql, .csv, .json)
            </button>
            <button
              className={cn(
                "flex-1 rounded py-1.5 font-medium text-xs transition-all cursor-pointer",
                importTab === "paste"
                  ? "bg-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setImportTab("paste")}
              type="button"
            >
              Tempel Script SQL Mentah
            </button>
          </div>

          {/* Pemilihan Target Database */}
          {availableDatabases.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="text-emerald-500" size={13} />
                <span>Basis Data Target:</span>
              </div>
              <select
                className="rounded border border-border bg-card px-2.5 py-1 font-mono text-foreground text-xs focus:border-primary focus:outline-none"
                onChange={(e) => {
                  setCurrentSelectedDatabase?.(e.target.value);
                  onSelectDatabase?.(e.target.value);
                }}
                value={currentSelectedDatabase}
              >
                {availableDatabases.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Tabel jika berkas CSV / JSON */}
          {isCsvOrJson && availableTables.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TableIcon className="text-primary" size={13} />
                <span>Tabel Target (untuk CSV/JSON):</span>
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
                  if (onFileSelect) {
                    onFileSelect(e);
                  } else if (e.target.files && e.target.files.length > 0) {
                    onProcessChosenFile?.(e.target.files[0]);
                  }
                  e.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />

              <div
                className={cn(
                  "flex cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all",
                  isDraggingImport
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(20,184,166,0.25)]"
                    : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted"
                )}
                onClick={handleOpenPicker}
                onDragLeave={() => setIsDraggingImport(false)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImport(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImport(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onProcessChosenFile?.(e.dataTransfer.files[0]);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpenPicker();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <FileUp
                  className="mb-2 text-muted-foreground/70"
                  size={28}
                />
                <p className="font-semibold text-foreground text-xs">
                  {selectedImportFile
                    ? selectedImportFile.fileName
                    : "Tarik berkas .sql, .csv, atau .json ke sini, atau klik untuk memilih"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {selectedImportFile
                    ? `Ukuran berkas: ${(selectedImportFile.fileSize / 1024).toFixed(1)} KB • Klik untuk mengganti`
                    : "Mendukung SQL Dump, format CSV (tabel baris), dan JSON terstruktur"}
                </p>
              </div>

              {selectedImportFile && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <FileCode2 className="text-emerald-500" size={16} />
                    <div>
                      <span className="font-semibold text-foreground">
                        {selectedImportFile.fileName}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground/70">
                        ({(selectedImportFile.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
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
                Ketik atau Tempel Perintah SQL:
              </Label>
              <textarea
                className="h-44 w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-foreground text-xs focus:border-white/30 focus:outline-none"
                onChange={(e) => setImportSqlContent(e.target.value)}
                placeholder="-- Tempel query SQL di sini (misal: CREATE TABLE, INSERT INTO)..."
                value={importSqlContent}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-border border-t pt-3">
            {selectedImportFile || importSqlContent.trim() ? (
              <Button
                className="h-8 border-border text-muted-foreground text-xs hover:bg-muted hover:text-foreground cursor-pointer"
                disabled={isImporting}
                onClick={() => {
                  setSelectedImportFile(null);
                  setImportSqlContent("");
                }}
                size="sm"
                variant="outline"
              >
                {t("import.reset", "Batal / Bersihkan")}
              </Button>
            ) : (
              <div />
            )}
            <Button
              className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90 cursor-pointer"
              disabled={
                isImporting ||
                (importTab === "file" && !selectedImportFile) ||
                (importTab === "paste" && !importSqlContent.trim())
              }
              onClick={onExecuteImport}
              size="sm"
            >
              <Zap className="mr-1.5 fill-current" size={13} />
              {isImporting ? t("common.importing", "Mengimpor Data...") : t("import.execute", "Jalankan Proses Impor")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
