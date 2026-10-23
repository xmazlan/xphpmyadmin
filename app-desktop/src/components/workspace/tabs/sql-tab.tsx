import React from "react";
import { ChevronDown, ChevronUp, Code2, Play, Table as TableIcon } from "lucide-react";
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      {/* SQL Query Console */}
      <div className="border-b border-border bg-card p-2.5 sm:p-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold truncate">
            <Code2 size={13} className="text-primary shrink-0" />
            <span className="truncate">
              SQL Query Runner (`{currentSelectedDatabase}`)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              className="h-6.5 bg-emerald-600 text-foreground font-semibold text-xs hover:bg-emerald-500 flex items-center gap-1 px-2.5"
              disabled={isExecutingQuery}
              onClick={onExecuteQuery}
              size="sm"
            >
              <Play size={11} className="fill-black" />
              <span>
                {isExecutingQuery ? "Menjalankan..." : "Run Query"}
              </span>
              <kbd className="ml-1 px-1 py-0.2 text-[9px] font-mono bg-black/15 rounded hidden sm:inline">
                ⌘↵
              </kbd>
            </Button>
            <button
              type="button"
              className="rounded p-1 text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
              onClick={() =>
                setIsSqlConsoleExpanded(!isSqlConsoleExpanded)
              }
              title={
                isSqlConsoleExpanded
                  ? "Ciutkan Editor SQL"
                  : "Perluas Editor SQL"
              }
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
                className="w-full h-16 sm:h-20 p-2.5 rounded-md border border-border bg-background text-xs font-mono text-primary focus:outline-none focus:border-white/30 resize-none"
                onChange={(e) => setSqlQuery(e.target.value)}
                value={sqlQuery}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
              <span className="truncate mr-2">
                {queryResults?.ok
                  ? `Status: 200 OK • Menampilkan hasil dari tabel \`${selectedTable || currentSelectedDatabase}\``
                  : queryResults?.error
                    ? `Error: ${queryResults.error}`
                    : "Siap mengeksekusi query SQL."}
              </span>
              <span className="font-mono shrink-0">
                Eksekusi: {queryResults?.executionTimeMs ?? 0}ms
              </span>
            </div>
          </>
        )}
      </div>

      {/* Interactive Real Data Table Grid */}
      <div className="flex-1 overflow-auto bg-background">
        {queryResults && queryResults.columns.length > 0 ? (
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
                {queryResults.columns.map((col) => (
                  <th
                    key={col}
                    className="py-2 px-3 font-medium whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {queryResults.rows.map((row, rIdx) => (
                <tr
                  className="hover:bg-muted transition-colors"
                  key={rIdx}
                >
                  {queryResults.columns.map((col) => {
                    const val = row[col];
                    return (
                      <td
                        key={col}
                        className="py-2 px-3 whitespace-nowrap font-mono text-[11px]"
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
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground/70">
            <TableIcon size={32} className="mb-2 opacity-40" />
            <p className="text-xs">
              {isLoadingTables
                ? "Memuat data dari MariaDB..."
                : "Pilih tabel di sebelah kiri atau ketik query SQL lalu klik Run Query."}
            </p>
          </div>
        )}
      </div>

      {/* Footer Table Toolbar */}
      <div className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-card px-3 text-[11px] text-muted-foreground/70">
        <div className="flex items-center gap-2 sm:gap-3 truncate">
          <span className="text-emerald-500 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline truncate">
            Database:{" "}
            <strong className="text-foreground font-mono">
              {currentSelectedDatabase}
            </strong>
          </span>
          {selectedTable && (
            <>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline truncate">
                Tabel:{" "}
                <strong className="text-foreground font-mono">
                  {selectedTable}
                </strong>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] text-muted-foreground">
            {queryResults?.rowCount || 0} baris
          </span>
          <Button
            className="h-5.5 px-2 text-[10px] border-border bg-transparent text-muted-foreground hover:bg-muted"
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
