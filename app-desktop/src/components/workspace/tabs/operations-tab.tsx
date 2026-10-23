import React from "react";
import { Sliders, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OperationsTabProps {
  currentSelectedDatabase: string;
  newDbCollation: string;
  onChangeCollation: () => void;
  onDropDatabase: (dbName: string) => void;
  setNewDbCollation: (val: string) => void;
}

export function OperationsTab({
  currentSelectedDatabase,
  newDbCollation,
  onChangeCollation,
  onDropDatabase,
  setNewDbCollation,
}: OperationsTabProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Operasi Basis Data (`{currentSelectedDatabase}`)
              </h2>
              <p className="text-xs text-muted-foreground">
                Konfigurasi, pemeliharaan, serta manajemen basis data aktif.
              </p>
            </div>
          </div>
        </div>

        {/* Operasi 1: Ubah Collation */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-xs">
            Penyortiran Karakter (Collation)
          </h3>
          <div className="flex items-center gap-3">
            <Select
              value={newDbCollation}
              onValueChange={setNewDbCollation}
            >
              <SelectTrigger className="h-8 border-border text-xs font-mono flex-1">
                <SelectValue placeholder="Pilih Collation" />
              </SelectTrigger>
              <SelectContent className="font-mono text-xs">
                <SelectItem value="utf8mb4_general_ci">
                  utf8mb4_general_ci
                </SelectItem>
                <SelectItem value="utf8mb4_unicode_ci">
                  utf8mb4_unicode_ci
                </SelectItem>
                <SelectItem value="utf8mb4_bin">utf8mb4_bin</SelectItem>
                <SelectItem value="utf8_general_ci">
                  utf8_general_ci
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
              onClick={onChangeCollation}
            >
              Simpan Collation
            </Button>
          </div>
        </div>

        {/* Operasi 2: Hapus Basis Data */}
        <div className="rounded-lg border border-destructive/30 bg-destructive text-destructive-foreground/5 p-4 space-y-2">
          <h3 className="font-semibold text-destructive text-xs">
            Zona Bahaya: Hapus Basis Data (DROP DATABASE)
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Menghapus basis data `{currentSelectedDatabase}` akan menghancurkan seluruh tabel dan data di dalamnya secara permanen.
          </p>
          <div className="pt-2">
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs font-semibold"
              onClick={() => onDropDatabase(currentSelectedDatabase)}
            >
              <Trash2 size={13} className="mr-1.5" />
              Hapus Basis Data `{currentSelectedDatabase}`
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
