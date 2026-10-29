import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code2,
  Copy,
  Download,
  Play,
  Search,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QueryResultData } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface SqlTabProps {
  currentSelectedDatabase: string;
  isExecutingQuery: boolean;
  isLoadingTables: boolean;
  isSqlConsoleExpanded: boolean;
  onDeleteRow?: (row: any) => void;
  onExecuteQuery: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  queryResults: QueryResultData | null;
  selectedTable: string;
  setIsSqlConsoleExpanded: (val: boolean) => void;
  setSqlQuery: (val: string) => void;
  sqlQuery: string;
}

export function SqlTab({
  currentSelectedDatabase,
  isExecutingQuery,
  isLoadingTables,
  isSqlConsoleExpanded,
  onDeleteRow,
  onExecuteQuery,
  onNextPage,
  onPrevPage,
  queryResults,
  selectedTable,
  setIsSqlConsoleExpanded,
  setSqlQuery,
  sqlQuery,
}: SqlTabProps) {
  const [filterText, setFilterText] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const processedRows = useMemo(() => {
    if (!queryResults?.rows) return [];
    let list = [...queryResults.rows];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    if (sortCol) {
      list.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const res = valA > valB ? 1 : -1;
        return sortDir === "asc" ? res : -res;
      });
    }

    return list;
  }, [queryResults?.rows, filterText, sortCol, sortDir]);

  const handleExportCurrentView = (format: "csv" | "json") => {
    if (!queryResults || processedRows.length === 0) return;
    if (format === "json") {
      const str = JSON.stringify(processedRows, null, 2);
      navigator.clipboard.writeText(str);
      toast.success(
        `${processedRows.length} baris disalin ke clipboard sebagai JSON!`
      );
    } else {
      const cols = queryResults.columns;
      const header = cols.join(",");
      const lines = processedRows.map((r) =>
        cols
          .map((c) => {
            const val = r[c];
            if (val === null || val === undefined) return "";
            const s = String(val);
            return s.includes(",") || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      );
      const csvStr = [header, ...lines].join("\n");
      navigator.clipboard.writeText(csvStr);
      toast.success(
        `${processedRows.length} baris disalin ke clipboard sebagai CSV!`
      );
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* SQL Query Console */}
      <div className="shrink-0 space-y-2 border-border border-b bg-card p-2.5 sm:p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate font-semibold text-muted-foreground">
            <Code2 className="shrink-0 text-primary" size={13} />
            <span className="truncate">
              SQL Query Runner (`{currentSelectedDatabase}`)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {sqlQuery.trim() && (
              <Button
                className="h-6.5 border-border text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
                disabled={isExecutingQuery}
                onClick={() => setSqlQuery("")}
                size="sm"
                variant="outline"
              >
                Batal
              </Button>
            )}
            <Button
              className="flex h-6.5 items-center gap-1 bg-emerald-600 px-2.5 font-semibold text-white text-xs hover:bg-emerald-500"
              disabled={isExecutingQuery}
              onClick={onExecuteQuery}
              size="sm"
            >
              <Play className="fill-white" size={11} />
              <span>{isExecutingQuery ? "Menjalankan..." : "Run Query"}</span>
              <kbd className="ml-1 hidden rounded bg-white/20 px-1 py-0.2 font-mono text-[9px] text-white sm:inline">
                ⌘↵
              </kbd>
            </Button>
            <button
              className="rounded p-1 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setIsSqlConsoleExpanded(!isSqlConsoleExpanded)}
              title={
                isSqlConsoleExpanded
                  ? "Ciutkan Editor SQL"
                  : "Perluas Editor SQL"
              }
              type="button"
            >
              {isSqlConsoleExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>
        </div>

        {isSqlConsoleExpanded && (
          <>
            <div className="relative">
              <textarea
                className="h-16 w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-foreground text-xs focus:border-white/30 focus:outline-none sm:h-20"
                onChange={(e) => setSqlQuery(e.target.value)}
                value={sqlQuery}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
              <span className="mr-2 truncate">
                {queryResults?.ok
                  ? `Status: 200 OK • Menampilkan hasil dari \`${selectedTable || currentSelectedDatabase}\``
                  : queryResults?.error
                    ? `Error: ${queryResults.error}`
                    : "Siap mengeksekusi query SQL."}
              </span>
              <span className="shrink-0 font-mono">
                Eksekusi: {queryResults?.executionTimeMs ?? 0}ms
              </span>
            </div>
          </>
        )}
      </div>

      {/* Grid Subheader (Filter & Quick Export Toolbar) */}
      {queryResults && queryResults.columns.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-border border-b bg-muted/40 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="relative w-44 sm:w-56">
              <Search
                className="absolute top-2 left-2 text-muted-foreground/70"
                size={11}
              />
              <Input
                className="h-6.5 border-border bg-background pr-2 pl-7 text-[11px]"
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Saring baris hasil..."
                value={filterText}
              />
            </div>
            <Badge
              className="font-mono text-[9px] text-muted-foreground"
              variant="outline"
            >
              {processedRows.length} Baris
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              className="h-6 px-2 text-[10px]"
              onClick={() => handleExportCurrentView("csv")}
              size="sm"
              variant="outline"
            >
              <Download className="mr-1" size={10} />
              Salin CSV
            </Button>
            <Button
              className="h-6 px-2 text-[10px]"
              onClick={() => handleExportCurrentView("json")}
              size="sm"
              variant="outline"
            >
              <Copy className="mr-1" size={10} />
              Salin JSON
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Real Data Table Grid */}
      <div className="flex-1 overflow-auto bg-background">
        {queryResults && queryResults.columns.length > 0 ? (
          <table className="w-full min-w-[500px] border-collapse text-left font-mono text-xs">
            <thead>
              <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
                <th className="w-8 px-2 py-2 text-center">#</th>
                {queryResults.columns.map((col) => (
                  <th
                    className="cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium hover:text-foreground"
                    key={col}
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col}</span>
                      {sortCol === col ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="text-emerald-500" size={10} />
                        ) : (
                          <ArrowDown className="text-emerald-500" size={10} />
                        )
                      ) : (
                        <ArrowUpDown
                          className="opacity-40 hover:opacity-100"
                          size={10}
                        />
                      )}
                    </div>
                  </th>
                ))}
                {onDeleteRow && (
                  <th className="w-12 px-2 py-2 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {processedRows.map((row, rIdx) => (
                <tr className="transition-colors hover:bg-muted" key={rIdx}>
                  <td className="px-2 py-2 text-center text-[10px] text-muted-foreground/60">
                    {rIdx + 1}
                  </td>
                  {queryResults.columns.map((col) => {
                    const val = row[col];
                    return (
                      <td
                        className="whitespace-nowrap px-3 py-2 font-mono text-[11px]"
                        key={col}
                      >
                        {val === null || val === undefined ? (
                          <span className="text-muted-foreground/70 italic">
                            NULL
                          </span>
                        ) : typeof val === "object" ? (
                          JSON.stringify(val)
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                  {onDeleteRow && (
                    <td className="px-2 py-2 text-center">
                      <button
                        className="text-muted-foreground/60 transition-colors hover:text-destructive"
                        onClick={() => onDeleteRow(row)}
                        title="Hapus baris ini"
                        type="button"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground/70">
            <TableIcon className="mb-2 opacity-40" size={32} />
            <p className="text-xs">
              {isLoadingTables
                ? "Memuat data dari MariaDB..."
                : "Pilih tabel di sebelah kiri atau ketik query SQL lalu klik Run Query."}
            </p>
          </div>
        )}
      </div>

      {/* Footer Table Toolbar */}
      <div className="flex h-8 shrink-0 items-center justify-between border-border border-t bg-card px-3 text-[11px] text-muted-foreground/70">
        <div className="flex items-center gap-2 truncate sm:gap-3">
          <span className="flex items-center gap-1 font-mono text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden truncate sm:inline">
            Database:{" "}
            <strong className="font-mono text-foreground">
              {currentSelectedDatabase}
            </strong>
          </span>
          {selectedTable && (
            <>
              <span className="hidden md:inline">•</span>
              <span className="hidden truncate md:inline">
                Tabel:{" "}
                <strong className="font-mono text-foreground">
                  {selectedTable}
                </strong>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {queryResults && (
            <span className="font-mono">
              Total {queryResults.rowCount} baris
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
