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
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-150">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-border border-b bg-muted/40 px-4 py-3">
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
            className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="space-y-3.5 p-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-foreground">
              Nama Basis Data (Database Name):
            </Label>
            <Input
              autoFocus
              className="h-8 border-border bg-background font-mono text-foreground text-xs focus-visible:border-white/30 focus-visible:ring-0"
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="e.g. ecommerce_production"
              value={newDbName}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Collation / Set Karakter:
            </Label>
            <Select onValueChange={setNewDbCollation} value={newDbCollation}>
              <SelectTrigger className="h-8 border-border font-mono text-xs">
                <SelectValue placeholder="Pilih Collation" />
              </SelectTrigger>
              <SelectContent className="font-mono text-xs">
                <SelectItem value="utf8mb4_general_ci">
                  utf8mb4_general_ci (Direkomendasikan)
                </SelectItem>
                <SelectItem value="utf8mb4_unicode_ci">
                  utf8mb4_unicode_ci
                </SelectItem>
                <SelectItem value="utf8mb4_bin">utf8mb4_bin</SelectItem>
                <SelectItem value="utf8_general_ci">utf8_general_ci</SelectItem>
                <SelectItem value="latin1_swedish_ci">
                  latin1_swedish_ci
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded border border-primary/20 bg-primary p-2.5 text-[10px] text-primary text-primary-foreground/5 leading-relaxed">
            Basis data baru akan otomatis dibuat dengan perintah{" "}
            <code>CREATE DATABASE</code> pada server MariaDB/MySQL.
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
            disabled={isCreatingDb || !newDbName.trim()}
            onClick={onCreateDatabase}
            size="sm"
          >
            <Plus className="mr-1.5" size={12} />
            {isCreatingDb ? "Membuat..." : "Buat Basis Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
