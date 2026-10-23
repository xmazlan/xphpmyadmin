import React, { useRef, useState } from "react";
import { Database, FileCode2, FileUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/tailwind";
import type { ImportFileInfo } from "@/types/workspace";

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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <FileUp size={18} className="text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Impor Script SQL ke Database (`{currentSelectedDatabase}`)
              </h2>
              <p className="text-xs text-muted-foreground">
                Pulihkan atau jalankan skrip SQL langsung ke basis data aktif.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          {/* Tab Pilihan Impor */}
          <div className="flex border-b border-border bg-muted/40 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setImportTab("file")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded transition-all",
                importTab === "file"
                  ? "bg-accent text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pilih Berkas .sql
            </button>
            <button
              type="button"
              onClick={() => setImportTab("paste")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded transition-all",
                importTab === "paste"
                  ? "bg-accent text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tempel Script SQL
            </button>
          </div>

          {/* Pemilihan Target Database */}
          {availableDatabases.length > 0 && (
            <div className="flex items-center justify-between bg-muted border border-border rounded-md px-3 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database size={13} className="text-emerald-500" />
                <span>Basis Data Target:</span>
              </div>
              <select
                value={currentSelectedDatabase}
                onChange={(e) => {
                  setCurrentSelectedDatabase(e.target.value);
                  onSelectDatabase(e.target.value);
                }}
                className="bg-card border border-border text-foreground text-xs rounded px-2.5 py-1 font-mono focus:outline-none focus:border-primary"
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
                type="file"
                ref={fileInputRef}
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
                onClick={() => onPickImportFile(false)}
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
                  size={32}
                  className={cn(
                    "mb-2 transition-transform",
                    isDraggingImport ? "text-foreground scale-110" : "text-primary"
                  )}
                />
                <p className="font-medium text-foreground text-xs">
                  {isDraggingImport
                    ? "Lepaskan berkas .sql di sini..."
                    : "Pilih berkas dump database (.sql)"}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 mb-3">
                  Klik di mana saja pada kotak ini atau seret berkas SQL dari komputer Anda.
                </p>
                <Button
                  size="sm"
                  type="button"
                  className="bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 pointer-events-auto shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickImportFile(false);
                  }}
                >
                  Jelajahi Berkas (.sql)
                </Button>
              </div>

              {selectedImportFile && (
                <div className="rounded-lg border border-primary/30 bg-primary text-primary-foreground/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode2
                      size={16}
                      className="text-primary shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-foreground truncate">
                        {selectedImportFile.fileName}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {(selectedImportFile.fileSize / 1024).toFixed(1)}{" "}
                        KB • {selectedImportFile.filePath}
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
                Perintah SQL untuk Dieksekusi:
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

          <div className="flex items-center justify-end pt-2 border-t border-border">
            <Button
              size="sm"
              disabled={isImporting}
              className="h-8 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
              onClick={onExecuteImport}
            >
              <Zap size={13} className="mr-1.5 fill-black" />
              {isImporting ? "Mengeksekusi SQL..." : "Jalankan Impor SQL"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
