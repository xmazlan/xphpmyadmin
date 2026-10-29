import { Columns, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ServerCharsetItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface CharsetsTabProps {
  charsetsSearch: string;
  filteredCharsets: ServerCharsetItem[];
  isLoadingCharsets: boolean;
  onLoadCharsets: () => void;
  serverCharsetsData: ServerCharsetItem[];
  setCharsetsSearch: (val: string) => void;
}

export function CharsetsTab({
  charsetsSearch,
  filteredCharsets,
  isLoadingCharsets,
  onLoadCharsets,
  serverCharsetsData,
  setCharsetsSearch,
}: CharsetsTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Columns className="text-primary" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Set Karakter & Collation (SHOW CHARACTER SET)
          </h2>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {serverCharsetsData.length} Set Karakter
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
              onChange={(e) => setCharsetsSearch(e.target.value)}
              placeholder="Cari charset..."
              value={charsetsSearch}
            />
          </div>
          <Button
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            disabled={isLoadingCharsets}
            onClick={onLoadCharsets}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("mr-1.5", isLoadingCharsets && "animate-spin")}
              size={12}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[550px] border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Charset</th>
              <th className="px-4 py-2.5 font-semibold">Deskripsi</th>
              <th className="px-4 py-2.5 font-semibold">Default Collation</th>
              <th className="px-4 py-2.5 text-right font-semibold">Maxlen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredCharsets.map((c) => (
              <tr className="transition-colors hover:bg-muted" key={c.charset}>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {c.charset}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {c.description}
                </td>
                <td className="px-4 py-2.5 text-emerald-500">
                  {c.defaultCollation}
                </td>
                <td className="px-4 py-2.5 text-right">{c.maxlen}</td>
              </tr>
            ))}
            {filteredCharsets.length === 0 && (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground/70 text-xs italic"
                  colSpan={4}
                >
                  {isLoadingCharsets
                    ? "Memuat set karakter..."
                    : "Charset tidak ditemukan."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
