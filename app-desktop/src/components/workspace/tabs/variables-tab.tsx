import React from "react";
import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tailwind";
import type { ServerVariableItem } from "@/types/workspace";

interface VariablesTabProps {
  filteredVariables: ServerVariableItem[];
  isLoadingVariables: boolean;
  onLoadVariables: () => void;
  serverVariablesData: ServerVariableItem[];
  setVariablesSearch: (val: string) => void;
  variablesSearch: string;
}

export function VariablesTab({
  filteredVariables,
  isLoadingVariables,
  onLoadVariables,
  serverVariablesData,
  setVariablesSearch,
  variablesSearch,
}: VariablesTabProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Variabel Sistem Server (SHOW GLOBAL VARIABLES)
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            {serverVariablesData.length} Variabel
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search
              size={12}
              className="absolute left-2.5 top-2 text-muted-foreground/70"
            />
            <Input
              className="h-7 text-xs pl-8 pr-2 border-border bg-muted/40 text-foreground placeholder:text-muted-foreground/70"
              placeholder="Cari variabel..."
              value={variablesSearch}
              onChange={(e) => setVariablesSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoadingVariables}
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onLoadVariables}
          >
            <RefreshCw
              size={12}
              className={cn("mr-1.5", isLoadingVariables && "animate-spin")}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
              <th className="py-2 px-4 font-semibold w-1/3">
                Nama Variabel
              </th>
              <th className="py-2 px-4 font-semibold">Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredVariables.map((v) => (
              <tr
                key={v.name}
                className="hover:bg-muted transition-colors"
              >
                <td className="py-2 px-4 text-foreground font-medium">
                  {v.name}
                </td>
                <td className="py-2 px-4 text-emerald-500 break-all select-all">
                  {v.value}
                </td>
              </tr>
            ))}
            {filteredVariables.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="py-8 text-center text-xs text-muted-foreground/70 italic"
                >
                  {isLoadingVariables
                    ? "Memuat variabel server..."
                    : "Variabel tidak ditemukan."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
