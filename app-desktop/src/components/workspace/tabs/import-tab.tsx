import { Database, FileCode2, FileUp, Table as TableIcon, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ImportFileInfo, TableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface ImportTabProps {
  availableDatabases: string[];
  availableTables?: TableItem[];
  currentSelectedDatabase: string;
  importSqlContent: string;
  importTab: "file" | "paste";
  importTargetTable?: string;
  isImporting: boolean;
  onExecuteImport: () => void;
  onPickImportFile: (isModal: boolean) => void;
  onProcessChosenFile: (file: File) => void;
  onSelectDatabase: (dbName: string) => void;
  selectedImportFile: ImportFileInfo | null;
  setCurrentSelectedDatabase: (val: string) => void;
  setImportSqlContent: (val: string) => void;
  setImportTab: (val: "file" | "paste") => void;
  setImportTargetTable?: (val: string) => void;
  setSelectedImportFile: (val: ImportFileInfo | null) => void;
}

export function ImportTab({
  availableDatabases,
  availableTables = [],
  currentSelectedDatabase,
  importSqlContent,
  importTab,
  importTargetTable = "",
  isImporting,
  onExecuteImport,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImport, setIsDraggingImport] = useState(false);

  const isCsvOrJson =
    selectedImportFile?.fileName?.toLowerCase().endsWith(".csv") ||
    selectedImportFile?.fileName?.toLowerCase().endsWith(".json");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <FileUp className="text-primary" size={18} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Impor Data ke Database (
                <span className="font-mono text-primary">
                  {currentSelectedDatabase || "Pilih database"}
                </span>
                )
              </h2>
              <p className="text-muted-foreground text-xs">
                Pulihkan atau masukkan data dari berkas SQL, CSV, atau JSON
                langsung ke basis data.
              </p>
            </div>
          </div>
          <Badge
            className="border-primary/30 bg-primary/10 text-[10px] text-primary"
            variant="outline"
          >
            Mendukung .sql, .csv, .json
          </Badge>
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
              Pilih Berkas (.sql, .csv, .json)
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
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(20,184,166,0.25)]"
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
                placeholder="-- Tempel query SQL di sini (misal: CREATE TABLE, INSERT INTO)..."
                value={importSqlContent}
              />
            </div>
          )}

          <div className="flex items-center justify-end border-border border-t pt-3">
            <Button
              className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
              disabled={
                isImporting ||
                (importTab === "file" && !selectedImportFile) ||
                (importTab === "paste" && !importSqlContent.trim())
              }
              onClick={onExecuteImport}
              size="sm"
            >
              <Zap className="mr-1.5 fill-current" size={13} />
              {isImporting ? "Mengimpor Data..." : "Jalankan Proses Impor"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
