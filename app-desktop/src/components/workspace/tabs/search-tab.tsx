import {
  CheckSquare,
  FileSearch,
  Play,
  Search,
  Square,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DatabaseSearchResult, TableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface SearchTabProps {
  availableTables: TableItem[];
  currentSelectedDatabase: string;
  isSearching: boolean;
  onBrowseTableMatches: (
    tableName: string,
    query: string,
    searchType: "like" | "exact" | "regexp"
  ) => void;
  onDeleteTableMatches?: (
    tableName: string,
    query: string,
    searchType: "like" | "exact" | "regexp"
  ) => void;
  onExecuteSearch: (
    query: string,
    searchType: "like" | "exact" | "regexp",
    targetTables: string[]
  ) => void;
  searchResults: DatabaseSearchResult[];
}

export function SearchTab({
  availableTables,
  currentSelectedDatabase,
  isSearching,
  onBrowseTableMatches,
  onDeleteTableMatches,
  onExecuteSearch,
  searchResults,
}: SearchTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"like" | "exact" | "regexp">(
    "like"
  );
  const [selectedTables, setSelectedTables] = useState<string[]>(
    availableTables.map((t) => t.name)
  );
  const [hasSearched, setHasSearched] = useState(false);

  const handleToggleTable = (tblName: string) => {
    if (selectedTables.includes(tblName)) {
      setSelectedTables(selectedTables.filter((t) => t !== tblName));
    } else {
      setSelectedTables([...selectedTables, tblName]);
    }
  };

  const handleRunSearch = () => {
    if (!searchQuery.trim() || selectedTables.length === 0) return;
    setHasSearched(true);
    onExecuteSearch(searchQuery.trim(), searchType, selectedTables);
  };

  const totalMatches = searchResults.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2.5">
            <Search className="text-primary" size={20} />
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                Pencarian Data Basis Data (
                <span className="font-mono text-emerald-500">
                  {currentSelectedDatabase || "Pilih database"}
                </span>
                )
              </h2>
              <p className="text-muted-foreground text-xs">
                Cari kata kunci di semua kolom teks pada seluruh tabel atau tabel
                terpilih.
              </p>
            </div>
          </div>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {availableTables.length} Tabel Tersedia
          </Badge>
        </div>

        {/* Form Pencarian */}
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label className="text-foreground text-xs">
              Kata Kunci / Nilai yang Dicari:
            </Label>
            <div className="relative">
              <Search
                className="absolute top-2.5 left-3 text-muted-foreground/70"
                size={14}
              />
              <Input
                className="h-9 border-border bg-background pl-9 font-mono text-foreground text-xs focus-visible:border-white/30 focus-visible:ring-0"
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunSearch();
                }}
                placeholder="Masukkan teks, email, angka, atau kata kunci..."
                value={searchQuery}
              />
            </div>
          </div>

          {/* Jenis Pencarian */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">
              Pilihan Pola Pencarian:
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  desc: "Mencocokkan substring di mana saja (%kata%)",
                  id: "like" as const,
                  title: "Mengandung Kata (LIKE)",
                },
                {
                  desc: "Mencocokkan nilai persis seluruh kolom (= 'kata')",
                  id: "exact" as const,
                  title: "Kalimat Persis (=)",
                },
                {
                  desc: "Ekspresi reguler pencocokan pola tingkat lanjut",
                  id: "regexp" as const,
                  title: "Reguler Ekspresi (REGEXP)",
                },
              ].map((opt) => (
                <button
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-2.5 text-left transition-all",
                    searchType === opt.id
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-white/20"
                  )}
                  key={opt.id}
                  onClick={() => setSearchType(opt.id)}
                  type="button"
                >
                  <span className="font-semibold text-foreground text-xs">
                    {opt.title}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pemilihan Tabel */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs">
                Cari di Tabel: ({selectedTables.length} terpilih)
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  className="text-primary hover:underline"
                  onClick={() =>
                    setSelectedTables(availableTables.map((t) => t.name))
                  }
                  type="button"
                >
                  Pilih Semua
                </button>
                <span className="text-muted-foreground/70">•</span>
                <button
                  className="text-muted-foreground hover:underline"
                  onClick={() => setSelectedTables([])}
                  type="button"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background p-2">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {availableTables.map((t) => {
                  const isChecked = selectedTables.includes(t.name);
                  return (
                    <button
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1 text-left font-mono text-xs transition-colors",
                        isChecked
                          ? "bg-accent/50 text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      key={t.name}
                      onClick={() => handleToggleTable(t.name)}
                      type="button"
                    >
                      {isChecked ? (
                        <CheckSquare
                          className="shrink-0 text-primary"
                          size={13}
                        />
                      ) : (
                        <Square
                          className="shrink-0 text-muted-foreground/50"
                          size={13}
                        />
                      )}
                      <span className="truncate">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end border-border border-t pt-3">
            <Button
              className="h-8 bg-primary font-semibold text-primary-foreground text-xs hover:bg-primary/90"
              disabled={
                isSearching || !searchQuery.trim() || selectedTables.length === 0
              }
              onClick={handleRunSearch}
              size="sm"
            >
              <Search className="mr-1.5" size={13} />
              {isSearching ? "Mencari Data..." : "Mulai Pencarian"}
            </Button>
          </div>
        </div>

        {/* Hasil Pencarian */}
        {hasSearched && (
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between border-border border-b pb-2.5">
              <div className="flex items-center gap-2">
                <FileSearch className="text-emerald-500" size={16} />
                <h3 className="font-semibold text-foreground text-xs">
                  Hasil Pencarian untuk `{searchQuery}`
                </h3>
              </div>
              <Badge
                className={cn(
                  "font-mono text-[10px]",
                  totalMatches > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-border text-muted-foreground"
                )}
                variant="outline"
              >
                {totalMatches} Baris Cocok Ditemukan
              </Badge>
            </div>

            {searchResults.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-xs italic">
                {isSearching
                  ? "Sedang memindai tabel..."
                  : "Tidak ditemukan baris yang cocok pada tabel yang diperiksa."}
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-border border-b bg-muted/40 text-muted-foreground">
                      <th className="px-3 py-2 font-semibold">Tabel</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Kecocokan
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-foreground">
                    {searchResults.map((res) => (
                      <tr
                        className="transition-colors hover:bg-muted"
                        key={res.table}
                      >
                        <td className="flex items-center gap-2 px-3 py-2 font-semibold text-foreground">
                          <TableIcon className="text-primary" size={13} />
                          <span>{res.table}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          <span
                            className={
                              res.count > 0
                                ? "text-emerald-500"
                                : "text-muted-foreground"
                            }
                          >
                            {res.count} baris
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {res.count > 0 ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                className="h-6 px-2 text-[11px] text-emerald-500 hover:bg-emerald-500/10"
                                onClick={() =>
                                  onBrowseTableMatches(
                                    res.table,
                                    searchQuery,
                                    searchType
                                  )
                                }
                                size="sm"
                                variant="ghost"
                              >
                                <Play className="mr-1 fill-current" size={10} />
                                Jelajahi
                              </Button>
                              {onDeleteTableMatches && (
                                <Button
                                  className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                                  onClick={() =>
                                    onDeleteTableMatches(
                                      res.table,
                                      searchQuery,
                                      searchType
                                    )
                                  }
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Trash2 className="mr-1" size={10} />
                                  Hapus Hasil
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
