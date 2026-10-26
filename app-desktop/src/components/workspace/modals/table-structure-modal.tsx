import { Columns, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";

interface TableStructureModalProps {
  currentSelectedDatabase: string;
  isLoadingTableStructure: boolean;
  isOpen: boolean;
  onClose: () => void;
  selectedTableForStructure: string | null;
  tableStructureColumns: any[];
  tableStructureIndexes: any[];
}

export function TableStructureModal({
  currentSelectedDatabase,
  isLoadingTableStructure,
  isOpen,
  onClose,
  selectedTableForStructure,
  tableStructureColumns,
  tableStructureIndexes,
}: TableStructureModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-150">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header Modal */}
        <div className="flex shrink-0 items-center justify-between border-border border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Columns className="text-primary" size={16} />
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                Struktur Kolom & Indeks Tabel:{" "}
                <span className="font-mono text-primary">
                  `{selectedTableForStructure}`
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground/70">
                Basis Data: {currentSelectedDatabase} •{" "}
                {tableStructureColumns.length} Kolom Ditemukan
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
        <div className="flex-1 space-y-4 overflow-y-auto p-4 font-mono text-xs">
          {isLoadingTableStructure ? (
            <div className="flex items-center justify-center gap-2 p-12 text-primary">
              <RefreshCw className="animate-spin" size={16} />
              <span>Memuat definisi kolom tabel...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <h4 className="font-sans font-semibold text-foreground text-xs">
                  Definisi Kolom (SHOW FULL COLUMNS)
                </h4>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-border border-b bg-muted text-muted-foreground">
                        <th className="p-2">Nama Kolom</th>
                        <th className="p-2">Tipe Data</th>
                        <th className="p-2">Collation</th>
                        <th className="p-2">Boleh Null?</th>
                        <th className="p-2">Kunci</th>
                        <th className="p-2">Nilai Standar</th>
                        <th className="p-2">Ekstra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-foreground">
                      {tableStructureColumns.map((col) => (
                        <tr className="hover:bg-muted" key={col.Field}>
                          <td className="p-2 font-semibold text-primary">
                            {col.Field}
                          </td>
                          <td className="p-2 font-mono text-foreground">
                            {col.Type}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {col.Collation || "-"}
                          </td>
                          <td className="p-2">
                            <Badge
                              className={cn(
                                "px-1 py-0 text-[9px]",
                                col.Null === "YES"
                                  ? "border-emerald-500/30 text-emerald-500"
                                  : "border-destructive/30 text-destructive"
                              )}
                              variant="outline"
                            >
                              {col.Null}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {col.Key ? (
                              <Badge className="border-amber-500/30 bg-amber-500/15 px-1.5 py-0 text-[9px] text-amber-500">
                                {col.Key}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {col.Default === null ? "NULL" : col.Default || "-"}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {col.Extra || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {tableStructureIndexes.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-sans font-semibold text-foreground text-xs">
                    Daftar Indeks (SHOW INDEX)
                  </h4>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full border-collapse text-left text-[11px]">
                      <thead>
                        <tr className="border-border border-b bg-muted text-muted-foreground">
                          <th className="p-2">Nama Kunci</th>
                          <th className="p-2">Kolom</th>
                          <th className="p-2">Unik?</th>
                          <th className="p-2">Tipe Indeks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 text-foreground">
                        {tableStructureIndexes.map((idxItem, i) => (
                          <tr className="hover:bg-muted" key={i}>
                            <td className="p-2 font-semibold text-foreground">
                              {idxItem.Key_name}
                            </td>
                            <td className="p-2 text-primary">
                              {idxItem.Column_name}
                            </td>
                            <td className="p-2">
                              {idxItem.Non_unique === 0 ? "YES (Unique)" : "NO"}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {idxItem.Index_type || "BTREE"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-end border-border border-t bg-muted/40 px-4 py-2.5">
          <Button
            className="h-7 border-border text-foreground text-xs hover:bg-muted"
            onClick={onClose}
            size="sm"
            variant="outline"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
