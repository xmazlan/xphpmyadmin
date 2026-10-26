import { Database, FileCode2, FileUp, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ImportFileInfo } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface ImportTabProps {
  availableDatabases: string[];
  currentSelectedDatabase: string;
  importSqlContent: string;
  importTab: "file" | "paste";
  isImporting: boolean;
  onExecuteImport: () => void;
  onPickImportFile: (isModal: boolean) => void;
  onProcessChosenFile: (file: File) => void;
  onSelectDatabase: (dbName: string) => void;
  selectedImportFile: ImportFileInfo | null;
  setCurrentSelectedDatabase: (val: string) => void;
  setImportSqlContent: (val: string) => void;
  setImportTab: (val: "file" | "paste") => void;
  setSelectedImportFile: (val: ImportFileInfo | null) => void;
}

export function ImportTab({
  availableDatabases,
  currentSelectedDatabase,
  importSqlContent,
  importTab,
  isImporting,
  onExecuteImport,
  onPickImportFile,
  onProcessChosenFile,
  onSelectDatabase,
  selectedImportFile,
  setCurrentSelectedDatabase,
  setImportSqlContent,
  setImportTab,
  setSelectedImportFile,
}: ImportTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6">
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
                "flex-1 rounded py-1.5 font-medium text-xs transition-all",
                importTab === "file"
                  ? "bg-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setImportTab("file")}
              type="button"
            >
              Pilih Berkas .sql
            </button>
            <button
              className={cn(
                "flex-1 rounded py-1.5 font-medium text-xs transition-all",
                importTab === "paste"
                  ? "bg-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setImportTab("paste")}
              type="button"
            >
              Tempel Script SQL
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
                  setCurrentSelectedDatabase(e.target.value);
                  onSelectDatabase(e.target.value);
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
                ref={fileInputRef}
                type="file"
              />

              <div
                className={cn(
                  "flex cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all",
                  isDraggingImport
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(87,193,255,0.2)]"
                    : "border-border bg-muted/40 hover:border-primary/50 hover:bg-muted"
                )}
                onClick={() => onPickImportFile(false)}
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
                  size={32}
                />
                <p className="font-medium text-foreground text-xs">
                  {isDraggingImport
                    ? "Lepaskan berkas .sql di sini..."
                    : "Pilih berkas dump database (.sql)"}
                </p>
                <p className="mt-1 mb-3 text-[11px] text-muted-foreground/70">
                  Klik di mana saja pada kotak ini atau seret berkas SQL dari
                  komputer Anda.
                </p>
                <Button
                  className="pointer-events-auto bg-primary font-semibold text-primary-foreground text-xs shadow-sm hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickImportFile(false);
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
                Perintah SQL untuk Dieksekusi:
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

          <div className="flex items-center justify-end border-border border-t pt-2">
            <Button
              className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
              disabled={isImporting}
              onClick={onExecuteImport}
              size="sm"
            >
              <Zap className="mr-1.5 fill-black" size={13} />
              {isImporting ? "Mengeksekusi SQL..." : "Jalankan Impor SQL"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
