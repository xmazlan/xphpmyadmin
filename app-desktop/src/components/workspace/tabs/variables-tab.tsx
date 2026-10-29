import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ServerVariableItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-primary" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Variabel Sistem Server (SHOW GLOBAL VARIABLES)
          </h2>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {serverVariablesData.length} Variabel
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search
              className="absolute top-2 left-2.5 text-muted-foreground/70"
              size={12}
            />
            <Input
              className="h-7 border-border bg-muted/40 pr-2 pl-8 text-foreground text-xs placeholder:text-muted-foreground/70"
              onChange={(e) => setVariablesSearch(e.target.value)}
              placeholder="Cari variabel..."
              value={variablesSearch}
            />
          </div>
          <Button
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            disabled={isLoadingVariables}
            onClick={onLoadVariables}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("mr-1.5", isLoadingVariables && "animate-spin")}
              size={12}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[500px] border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
              <th className="w-1/3 px-4 py-2 font-semibold">Nama Variabel</th>
              <th className="px-4 py-2 font-semibold">Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredVariables.map((v) => (
              <tr className="transition-colors hover:bg-muted" key={v.name}>
                <td className="px-4 py-2 font-medium text-foreground">
                  {v.name}
                </td>
                <td className="select-all break-all px-4 py-2 text-emerald-500">
                  {v.value}
                </td>
              </tr>
            ))}
            {filteredVariables.length === 0 && (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground/70 text-xs italic"
                  colSpan={2}
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
