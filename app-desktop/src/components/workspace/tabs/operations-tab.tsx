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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="text-primary" size={18} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Operasi Basis Data (`{currentSelectedDatabase}`)
              </h2>
              <p className="text-muted-foreground text-xs">
                Konfigurasi, pemeliharaan, serta manajemen basis data aktif.
              </p>
            </div>
          </div>
        </div>

        {/* Operasi 1: Ubah Collation */}
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground text-xs">
            Penyortiran Karakter (Collation)
          </h3>
          <div className="flex items-center gap-3">
            <Select onValueChange={setNewDbCollation} value={newDbCollation}>
              <SelectTrigger className="h-8 flex-1 border-border font-mono text-xs">
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
                <SelectItem value="utf8_general_ci">utf8_general_ci</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
              onClick={onChangeCollation}
              size="sm"
            >
              Simpan Collation
            </Button>
          </div>
        </div>

        {/* Operasi 2: Hapus Basis Data */}
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive p-4 text-destructive-foreground/5">
          <h3 className="font-semibold text-destructive text-xs">
            Zona Bahaya: Hapus Basis Data (DROP DATABASE)
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Menghapus basis data `{currentSelectedDatabase}` akan menghancurkan
            seluruh tabel dan data di dalamnya secara permanen.
          </p>
          <div className="pt-2">
            <Button
              className="h-8 font-semibold text-xs"
              onClick={() => onDropDatabase(currentSelectedDatabase)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="mr-1.5" size={13} />
              Hapus Basis Data `{currentSelectedDatabase}`
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
