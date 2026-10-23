import React from "react";
import { Database, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateDatabaseModalProps {
  isCreatingDb: boolean;
  isOpen: boolean;
  newDbCollation: string;
  newDbName: string;
  onClose: () => void;
  onCreateDatabase: () => void;
  serverHost?: string;
  serverPort?: number;
  setNewDbCollation: (val: string) => void;
  setNewDbName: (val: string) => void;
}

export function CreateDatabaseModal({
  isCreatingDb,
  isOpen,
  newDbCollation,
  newDbName,
  onClose,
  onCreateDatabase,
  serverHost,
  serverPort,
  setNewDbCollation,
  setNewDbName,
}: CreateDatabaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <Database size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-xs">
                Buat Basis Data Baru
              </h3>
              <p className="font-mono text-[11px] text-muted-foreground">
                Server: {serverHost || "127.0.0.1"}:{serverPort || 3306}
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

        {/* Body Modal */}
        <div className="p-4 space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <Label className="text-foreground text-[11px]">
              Nama Basis Data (Database Name):
            </Label>
            <Input
              autoFocus
              className="h-8 border-border bg-background text-foreground font-mono text-xs focus-visible:ring-0 focus-visible:border-white/30"
              placeholder="e.g. ecommerce_production"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-[11px]">
              Collation / Set Karakter:
            </Label>
            <Select
              value={newDbCollation}
              onValueChange={setNewDbCollation}
            >
              <SelectTrigger className="h-8 border-border text-xs font-mono">
                <SelectValue placeholder="Pilih Collation" />
              </SelectTrigger>
              <SelectContent className="font-mono text-xs">
                <SelectItem value="utf8mb4_general_ci">
                  utf8mb4_general_ci (Direkomendasikan)
                </SelectItem>
                <SelectItem value="utf8mb4_unicode_ci">
                  utf8mb4_unicode_ci
                </SelectItem>
                <SelectItem value="utf8mb4_bin">
                  utf8mb4_bin
                </SelectItem>
                <SelectItem value="utf8_general_ci">
                  utf8_general_ci
                </SelectItem>
                <SelectItem value="latin1_swedish_ci">
                  latin1_swedish_ci
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded border border-primary/20 bg-primary text-primary-foreground/5 p-2.5 text-[10px] text-primary leading-relaxed">
            Basis data baru akan otomatis dibuat dengan perintah <code>CREATE DATABASE</code> pada server MariaDB/MySQL.
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
            disabled={isCreatingDb || !newDbName.trim()}
            className="h-7 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
            onClick={onCreateDatabase}
          >
            <Plus size={12} className="mr-1.5" />
            {isCreatingDb ? "Membuat..." : "Buat Basis Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
