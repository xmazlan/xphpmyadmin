import {
  ChevronDown,
  ChevronUp,
  Code2,
  Play,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueryResultData } from "@/types/workspace";

interface SqlTabProps {
  currentSelectedDatabase: string;
  isExecutingQuery: boolean;
  isLoadingTables: boolean;
  isSqlConsoleExpanded: boolean;
  onExecuteQuery: () => void;
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
  onExecuteQuery,
  queryResults,
  selectedTable,
  setIsSqlConsoleExpanded,
  setSqlQuery,
  sqlQuery,
}: SqlTabProps) {
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
            <Button
              className="flex h-6.5 items-center gap-1 bg-emerald-600 px-2.5 font-semibold text-foreground text-xs hover:bg-emerald-500"
              disabled={isExecutingQuery}
              onClick={onExecuteQuery}
              size="sm"
            >
              <Play className="fill-black" size={11} />
              <span>{isExecutingQuery ? "Menjalankan..." : "Run Query"}</span>
              <kbd className="ml-1 hidden rounded bg-black/15 px-1 py-0.2 font-mono text-[9px] sm:inline">
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
                className="h-16 w-full resize-none rounded-md border border-border bg-background p-2.5 font-mono text-primary text-xs focus:border-white/30 focus:outline-none sm:h-20"
                onChange={(e) => setSqlQuery(e.target.value)}
                value={sqlQuery}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
              <span className="mr-2 truncate">
                {queryResults?.ok
                  ? `Status: 200 OK • Menampilkan hasil dari tabel \`${selectedTable || currentSelectedDatabase}\``
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

      {/* Interactive Real Data Table Grid */}
      <div className="flex-1 overflow-auto bg-background">
        {queryResults && queryResults.columns.length > 0 ? (
          <table className="w-full border-collapse text-left font-mono text-xs">
            <thead>
              <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
                {queryResults.columns.map((col) => (
                  <th
                    className="whitespace-nowrap px-3 py-2 font-medium"
                    key={col}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {queryResults.rows.map((row, rIdx) => (
                <tr className="transition-colors hover:bg-muted" key={rIdx}>
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
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {queryResults?.rowCount || 0} baris
          </span>
          <Button
            className="h-5.5 border-border bg-transparent px-2 text-[10px] text-muted-foreground hover:bg-muted"
            size="sm"
            variant="outline"
          >
            Limit 25
          </Button>
        </div>
      </div>
    </div>
  );
}
