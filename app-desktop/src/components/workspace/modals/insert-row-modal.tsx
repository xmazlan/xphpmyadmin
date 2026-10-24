import { Check, Plus, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InsertRowModalProps {
  currentSelectedDatabase: string;
  insertColumnValues: Record<string, string>;
  isInsertingRow: boolean;
  isOpen: boolean;
  onClose: () => void;
  onExecuteInsertRow: () => void;
  selectedTableForInsert: string | null;
  setInsertColumnValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  tableStructureColumns: any[];
}

export function InsertRowModal({
  currentSelectedDatabase,
  insertColumnValues,
  isInsertingRow,
  isOpen,
  onClose,
  onExecuteInsertRow,
  selectedTableForInsert,
  setInsertColumnValues,
  tableStructureColumns,
}: InsertRowModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-150">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex shrink-0 items-center justify-between border-border border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
              <Plus size={14} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Sisipkan Baris Baru:{" "}
                <span className="font-mono text-emerald-500">
                  `{selectedTableForInsert}`
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground/70">
                Basis Data: {currentSelectedDatabase}
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
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
          {tableStructureColumns.map((col) => {
            const isAutoInc =
              col.Extra &&
              String(col.Extra).toLowerCase().includes("auto_increment");
            return (
              <div className="space-y-1" key={col.Field}>
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-[11px] text-foreground">
                    {col.Field}
                  </Label>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    {col.Type} {isAutoInc && "(Auto Increment)"}
                  </span>
                </div>
                <Input
                  className="h-8 border-border bg-background font-mono text-foreground text-xs focus-visible:border-white/30 focus-visible:ring-0"
                  disabled={isAutoInc}
                  onChange={(e) =>
                    setInsertColumnValues((prev) => ({
                      ...prev,
                      [col.Field]: e.target.value,
                    }))
                  }
                  placeholder={
                    isAutoInc
                      ? "[Otomatis dibuat oleh server]"
                      : `Masukkan nilai untuk ${col.Field}...`
                  }
                  value={insertColumnValues[col.Field] || ""}
                />
              </div>
            );
          })}
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
            className="h-7 bg-emerald-600 font-semibold text-foreground text-xs hover:bg-emerald-500"
            disabled={isInsertingRow}
            onClick={onExecuteInsertRow}
            size="sm"
          >
            <Check className="mr-1.5" size={12} />
            {isInsertingRow ? "Menyimpan..." : "Simpan Baris"}
          </Button>
        </div>
      </div>
    </div>
  );
}
