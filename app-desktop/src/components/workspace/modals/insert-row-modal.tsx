import React from "react";
import { Check, Plus, X } from "lucide-react";
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
  setInsertColumnValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex w-full max-w-lg flex-col max-h-[85vh] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 shrink-0">
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
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {tableStructureColumns.map((col) => {
            const isAutoInc =
              col.Extra && String(col.Extra).toLowerCase().includes("auto_increment");
            return (
              <div key={col.Field} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground text-[11px] font-mono">
                    {col.Field}
                  </Label>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    {col.Type} {isAutoInc && "(Auto Increment)"}
                  </span>
                </div>
                <Input
                  disabled={isAutoInc}
                  placeholder={
                    isAutoInc
                      ? "[Otomatis dibuat oleh server]"
                      : `Masukkan nilai untuk ${col.Field}...`
                  }
                  value={insertColumnValues[col.Field] || ""}
                  onChange={(e) =>
                    setInsertColumnValues((prev) => ({
                      ...prev,
                      [col.Field]: e.target.value,
                    }))
                  }
                  className="h-8 border-border bg-background text-foreground font-mono text-xs focus-visible:ring-0 focus-visible:border-white/30"
                />
              </div>
            );
          })}
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
            disabled={isInsertingRow}
            className="h-7 bg-emerald-600 text-foreground font-semibold text-xs hover:bg-emerald-500"
            onClick={onExecuteInsertRow}
          >
            <Check size={12} className="mr-1.5" />
            {isInsertingRow ? "Menyimpan..." : "Simpan Baris"}
          </Button>
        </div>
      </div>
    </div>
  );
}
