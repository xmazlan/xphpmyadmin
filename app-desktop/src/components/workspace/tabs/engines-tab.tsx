import { RefreshCw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServerEngineItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface EnginesTabProps {
  isLoadingEngines: boolean;
  onLoadEngines: () => void;
  serverEnginesData: ServerEngineItem[];
}

export function EnginesTab({
  isLoadingEngines,
  onLoadEngines,
  serverEnginesData,
}: EnginesTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Server className="text-primary" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Mesin Penyimpanan Basis Data (SHOW ENGINES)
          </h2>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {serverEnginesData.length} Mesin
          </Badge>
        </div>
        <Button
          className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
          disabled={isLoadingEngines}
          onClick={onLoadEngines}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={cn("mr-1.5", isLoadingEngines && "animate-spin")}
            size={12}
          />
          <span>Segarkan</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[500px] border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Nama Mesin</th>
              <th className="px-4 py-2.5 font-semibold">Dukungan</th>
              <th className="px-4 py-2.5 font-semibold">Keterangan</th>
              <th className="px-4 py-2.5 text-center font-semibold">
                Transaksi
              </th>
              <th className="px-4 py-2.5 text-center font-semibold">XA</th>
              <th className="px-4 py-2.5 text-center font-semibold">
                Savepoints
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {serverEnginesData.map((e) => (
              <tr className="transition-colors hover:bg-muted" key={e.engine}>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {e.engine}
                </td>
                <td className="px-4 py-2.5">
                  {e.support === "DEFAULT" ? (
                    <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-500">
                      DEFAULT
                    </Badge>
                  ) : e.support === "YES" ? (
                    <Badge className="border-primary/30 bg-primary text-[9px] text-primary text-primary-foreground/15">
                      YES
                    </Badge>
                  ) : (
                    <Badge
                      className="border-border text-[9px] text-muted-foreground/70"
                      variant="outline"
                    >
                      NO
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {e.comment}
                </td>
                <td className="px-4 py-2.5 text-center">{e.transactions}</td>
                <td className="px-4 py-2.5 text-center">{e.xa}</td>
                <td className="px-4 py-2.5 text-center">{e.savepoints}</td>
              </tr>
            ))}
            {serverEnginesData.length === 0 && (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground/70 text-xs italic"
                  colSpan={6}
                >
                  {isLoadingEngines
                    ? "Memuat mesin penyimpanan..."
                    : "Tidak ada data mesin penyimpanan."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
