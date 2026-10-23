import React from "react";
import { RefreshCw, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";
import type { ServerEngineItem } from "@/types/workspace";

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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Server size={15} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Mesin Penyimpanan Basis Data (SHOW ENGINES)
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            {serverEnginesData.length} Mesin
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoadingEngines}
          className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
          onClick={onLoadEngines}
        >
          <RefreshCw
            size={12}
            className={cn("mr-1.5", isLoadingEngines && "animate-spin")}
          />
          <span>Segarkan</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
              <th className="py-2.5 px-4 font-semibold">Nama Mesin</th>
              <th className="py-2.5 px-4 font-semibold">Dukungan</th>
              <th className="py-2.5 px-4 font-semibold">Keterangan</th>
              <th className="py-2.5 px-4 font-semibold text-center">
                Transaksi
              </th>
              <th className="py-2.5 px-4 font-semibold text-center">XA</th>
              <th className="py-2.5 px-4 font-semibold text-center">
                Savepoints
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {serverEnginesData.map((e) => (
              <tr
                key={e.engine}
                className="hover:bg-muted transition-colors"
              >
                <td className="py-2.5 px-4 text-foreground font-medium">
                  {e.engine}
                </td>
                <td className="py-2.5 px-4">
                  {e.support === "DEFAULT" ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px]">
                      DEFAULT
                    </Badge>
                  ) : e.support === "YES" ? (
                    <Badge className="bg-primary text-primary-foreground/15 text-primary border-primary/30 text-[9px]">
                      YES
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground/70 text-[9px]"
                    >
                      NO
                    </Badge>
                  )}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">{e.comment}</td>
                <td className="py-2.5 px-4 text-center">{e.transactions}</td>
                <td className="py-2.5 px-4 text-center">{e.xa}</td>
                <td className="py-2.5 px-4 text-center">{e.savepoints}</td>
              </tr>
            ))}
            {serverEnginesData.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-xs text-muted-foreground/70 italic"
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
