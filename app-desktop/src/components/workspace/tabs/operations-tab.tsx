import {
  CheckCircle2,
  Copy,
  Database,
  Flame,
  HardDrive,
  RefreshCw,
  Sliders,
  Table as TableIcon,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { TableItem } from "@/types/workspace";

interface OperationsTabProps {
  availableTables?: TableItem[];
  currentSelectedDatabase: string;
  newDbCollation: string;
  onChangeCollation: () => void;
  onCopyDatabase?: (targetDbName: string, includeData: boolean) => void;
  onCopyTable?: (
    sourceTable: string,
    targetTable: string,
    includeData: boolean
  ) => void;
  onDropDatabase: (dbName: string) => void;
  onDropTable?: (tableName: string) => void;
  onEmptyTable?: (tableName: string) => void;
  onMaintainTable?: (
    tableName: string,
    action: "OPTIMIZE" | "CHECK" | "ANALYZE" | "REPAIR" | "CHECKSUM"
  ) => void;
  onRenameDatabase?: (newDbName: string) => void;
  onRenameTable?: (oldName: string, newName: string) => void;
  onUpdateTableOptions?: (
    tableName: string,
    options: {
      autoIncrement?: number;
      collation?: string;
      engine?: string;
    }
  ) => void;
  selectedTable?: string;
  setNewDbCollation: (val: string) => void;
}

export function OperationsTab({
  availableTables = [],
  currentSelectedDatabase,
  newDbCollation,
  onChangeCollation,
  onCopyDatabase,
  onCopyTable,
  onDropDatabase,
  onDropTable,
  onEmptyTable,
  onMaintainTable,
  onRenameDatabase,
  onRenameTable,
  onUpdateTableOptions,
  selectedTable = "",
  setNewDbCollation,
}: OperationsTabProps) {
  // Database Operations State
  const [renameDbInput, setRenameDbInput] = useState("");
  const [copyDbInput, setCopyDbInput] = useState("");
  const [copyDbWithData, setCopyDbWithData] = useState(true);

  // Table Operations State
  const [activeTable, setActiveTable] = useState(
    selectedTable || (availableTables[0]?.name ?? "")
  );
  const [renameTableInput, setRenameTableInput] = useState("");
  const [copyTableInput, setCopyTableInput] = useState("");
  const [copyTableWithData, setCopyTableWithData] = useState(true);
  const [tableEngineInput, setTableEngineInput] = useState("InnoDB");
  const [tableCollationInput, setTableCollationInput] =
    useState("utf8mb4_general_ci");
  const [tableAutoIncInput, setTableAutoIncInput] = useState<number | "">("");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="text-primary" size={20} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Operasi Basis Data & Tabel (
                <span className="font-mono text-primary">
                  {currentSelectedDatabase || "Pilih database"}
                </span>
                )
              </h2>
              <p className="text-muted-foreground text-xs">
                Ubah nama, salin skema, pemeliharaan tabel, serta pengaturan
                lanjutan phpMyAdmin.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Operasi Basis Data */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="text-emerald-500" size={16} />
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Operasi Basis Data: `{currentSelectedDatabase}`
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Ubah Collation */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <h4 className="font-semibold text-foreground text-xs">
                Penyortiran Karakter (Collation)
              </h4>
              <p className="text-[11px] text-muted-foreground/70">
                Ubah collation default untuk tabel baru di basis data ini.
              </p>
              <div className="flex items-center gap-2">
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
                    <SelectItem value="utf8_general_ci">
                      utf8_general_ci
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                  onClick={onChangeCollation}
                  size="sm"
                >
                  Simpan
                </Button>
              </div>
            </div>

            {/* Ganti Nama Basis Data */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <h4 className="font-semibold text-foreground text-xs">
                Ganti Nama Basis Data ke:
              </h4>
              <p className="text-[11px] text-muted-foreground/70">
                Membuat database baru, memindahkan seluruh tabel, lalu menghapus
                database lama.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 font-mono text-xs"
                  onChange={(e) => setRenameDbInput(e.target.value)}
                  placeholder="nama_db_baru..."
                  value={renameDbInput}
                />
                <Button
                  className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                  disabled={!renameDbInput.trim()}
                  onClick={() => {
                    if (renameDbInput.trim() && onRenameDatabase) {
                      onRenameDatabase(renameDbInput.trim());
                      setRenameDbInput("");
                    }
                  }}
                  size="sm"
                >
                  Ganti Nama
                </Button>
              </div>
            </div>

            {/* Salin Basis Data */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4 md:col-span-2">
              <h4 className="font-semibold text-foreground text-xs">
                Salin Basis Data (Copy Database)
              </h4>
              <p className="text-[11px] text-muted-foreground/70">
                Duplikasi seluruh skema atau beserta data ke nama basis data
                baru.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  className="h-8 w-64 font-mono text-xs"
                  onChange={(e) => setCopyDbInput(e.target.value)}
                  placeholder="nama_db_salinan..."
                  value={copyDbInput}
                />
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <input
                      checked={copyDbWithData}
                      name="copyDbOpt"
                      onChange={() => setCopyDbWithData(true)}
                      type="radio"
                    />
                    <span>Struktur & Data</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <input
                      checked={!copyDbWithData}
                      name="copyDbOpt"
                      onChange={() => setCopyDbWithData(false)}
                      type="radio"
                    />
                    <span>Hanya Struktur</span>
                  </label>
                </div>
                <Button
                  className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                  disabled={!copyDbInput.trim()}
                  onClick={() => {
                    if (copyDbInput.trim() && onCopyDatabase) {
                      onCopyDatabase(copyDbInput.trim(), copyDbWithData);
                      setCopyDbInput("");
                    }
                  }}
                  size="sm"
                >
                  <Copy className="mr-1.5" size={13} />
                  Salin Database
                </Button>
              </div>
            </div>
          </div>

          {/* Zona Bahaya Basis Data */}
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h4 className="font-semibold text-destructive text-xs">
              Zona Bahaya: Hapus Basis Data (DROP DATABASE)
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Menghapus basis data `{currentSelectedDatabase}` akan
              menghancurkan seluruh tabel dan data di dalamnya secara permanen.
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

        {/* SECTION 2: Operasi Tabel */}
        {availableTables.length > 0 && (
          <div className="space-y-4 border-border border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="text-primary" size={16} />
                <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                  Operasi Tabel:
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  Pilih Tabel:
                </span>
                <Select onValueChange={setActiveTable} value={activeTable}>
                  <SelectTrigger className="h-7 w-48 border-border font-mono text-xs">
                    <SelectValue placeholder="Pilih Tabel..." />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs">
                    {availableTables.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeTable && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Pindahkan / Ganti Nama Tabel */}
                  <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                    <h4 className="font-semibold text-foreground text-xs">
                      Ganti Nama Tabel `{activeTable}`
                    </h4>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        className="h-8 font-mono text-xs"
                        onChange={(e) => setRenameTableInput(e.target.value)}
                        placeholder="nama_tabel_baru..."
                        value={renameTableInput}
                      />
                      <Button
                        className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                        disabled={!renameTableInput.trim()}
                        onClick={() => {
                          if (renameTableInput.trim() && onRenameTable) {
                            onRenameTable(activeTable, renameTableInput.trim());
                            setRenameTableInput("");
                          }
                        }}
                        size="sm"
                      >
                        Ubah
                      </Button>
                    </div>
                  </div>

                  {/* Salin Tabel */}
                  <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                    <h4 className="font-semibold text-foreground text-xs">
                      Salin Tabel `{activeTable}` ke:
                    </h4>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        className="h-8 font-mono text-xs"
                        onChange={(e) => setCopyTableInput(e.target.value)}
                        placeholder="tabel_salinan..."
                        value={copyTableInput}
                      />
                      <Button
                        className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                        disabled={!copyTableInput.trim()}
                        onClick={() => {
                          if (copyTableInput.trim() && onCopyTable) {
                            onCopyTable(
                              activeTable,
                              copyTableInput.trim(),
                              copyTableWithData
                            );
                            setCopyTableInput("");
                          }
                        }}
                        size="sm"
                      >
                        <Copy className="mr-1.5" size={13} />
                        Salin
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <label className="flex items-center gap-1.5">
                        <input
                          checked={copyTableWithData}
                          name="copyTblOpt"
                          onChange={() => setCopyTableWithData(true)}
                          type="radio"
                        />
                        <span>Struktur & Data</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          checked={!copyTableWithData}
                          name="copyTblOpt"
                          onChange={() => setCopyTableWithData(false)}
                          type="radio"
                        />
                        <span>Hanya Struktur</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pemeliharaan Tabel (Maintenance) */}
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="text-emerald-500" size={14} />
                    <h4 className="font-semibold text-foreground text-xs">
                      Pemeliharaan Tabel `{activeTable}` (Table Maintenance)
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Jalankan analisis, optimasi fragmentasi indeks, perbaikan,
                    atau verifikasi checksum tabel.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      className="h-7 text-xs"
                      onClick={() =>
                        onMaintainTable?.(activeTable, "OPTIMIZE")
                      }
                      size="sm"
                      variant="outline"
                    >
                      <Flame className="mr-1.5 text-amber-500" size={12} />
                      Optimalkan Tabel (OPTIMIZE)
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={() => onMaintainTable?.(activeTable, "CHECK")}
                      size="sm"
                      variant="outline"
                    >
                      <CheckCircle2
                        className="mr-1.5 text-emerald-500"
                        size={12}
                      />
                      Periksa Tabel (CHECK)
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={() =>
                        onMaintainTable?.(activeTable, "ANALYZE")
                      }
                      size="sm"
                      variant="outline"
                    >
                      Analisis Tabel (ANALYZE)
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={() => onMaintainTable?.(activeTable, "REPAIR")}
                      size="sm"
                      variant="outline"
                    >
                      Perbaiki Tabel (REPAIR)
                    </Button>
                    <Button
                      className="h-7 text-xs"
                      onClick={() =>
                        onMaintainTable?.(activeTable, "CHECKSUM")
                      }
                      size="sm"
                      variant="outline"
                    >
                      Checksum Tabel (CHECKSUM)
                    </Button>
                  </div>
                </div>

                {/* Opsi Tabel Lanjutan: Mesin Penyimpanan & Collation */}
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="text-primary" size={14} />
                    <h4 className="font-semibold text-foreground text-xs">
                      Opsi Tabel `{activeTable}`
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Storage Engine:
                      </Label>
                      <Select
                        onValueChange={setTableEngineInput}
                        value={tableEngineInput}
                      >
                        <SelectTrigger className="h-8 font-mono text-xs">
                          <SelectValue placeholder="Storage Engine" />
                        </SelectTrigger>
                        <SelectContent className="font-mono text-xs">
                          <SelectItem value="InnoDB">InnoDB</SelectItem>
                          <SelectItem value="MyISAM">MyISAM</SelectItem>
                          <SelectItem value="MEMORY">MEMORY</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Collation Tabel:
                      </Label>
                      <Select
                        onValueChange={setTableCollationInput}
                        value={tableCollationInput}
                      >
                        <SelectTrigger className="h-8 font-mono text-xs">
                          <SelectValue placeholder="Collation" />
                        </SelectTrigger>
                        <SelectContent className="font-mono text-xs">
                          <SelectItem value="utf8mb4_general_ci">
                            utf8mb4_general_ci
                          </SelectItem>
                          <SelectItem value="utf8mb4_unicode_ci">
                            utf8mb4_unicode_ci
                          </SelectItem>
                          <SelectItem value="utf8_general_ci">
                            utf8_general_ci
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        AUTO_INCREMENT berikutnya:
                      </Label>
                      <Input
                        className="h-8 font-mono text-xs"
                        onChange={(e) =>
                          setTableAutoIncInput(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="Contoh: 100"
                        type="number"
                        value={tableAutoIncInput}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      className="h-7 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
                      onClick={() => {
                        onUpdateTableOptions?.(activeTable, {
                          autoIncrement:
                            typeof tableAutoIncInput === "number"
                              ? tableAutoIncInput
                              : undefined,
                          collation: tableCollationInput,
                          engine: tableEngineInput,
                        });
                      }}
                      size="sm"
                    >
                      Terapkan Opsi Tabel
                    </Button>
                  </div>
                </div>

                {/* Zona Bahaya Tabel */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div>
                    <h5 className="font-semibold text-destructive text-xs">
                      Tindakan Destruktif Tabel `{activeTable}`
                    </h5>
                    <p className="text-[10px] text-muted-foreground">
                      Kosongkan seluruh baris data atau hapus tabel sepenuhnya.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="h-7 font-semibold text-xs"
                      onClick={() => onEmptyTable?.(activeTable)}
                      size="sm"
                      variant="outline"
                    >
                      Kosongkan Tabel (TRUNCATE)
                    </Button>
                    <Button
                      className="h-7 font-semibold text-xs"
                      onClick={() => onDropTable?.(activeTable)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="mr-1.5" size={12} />
                      Hapus Tabel (DROP)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
