import React from "react";
import { Columns, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tailwind";
import type { ServerCharsetItem } from "@/types/workspace";

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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Columns size={15} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Set Karakter & Collation (SHOW CHARACTER SET)
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            {serverCharsetsData.length} Set Karakter
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
              placeholder="Cari charset..."
              value={charsetsSearch}
              onChange={(e) => setCharsetsSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoadingCharsets}
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onLoadCharsets}
          >
            <RefreshCw
              size={12}
              className={cn("mr-1.5", isLoadingCharsets && "animate-spin")}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
              <th className="py-2.5 px-4 font-semibold">Charset</th>
              <th className="py-2.5 px-4 font-semibold">Deskripsi</th>
              <th className="py-2.5 px-4 font-semibold">Default Collation</th>
              <th className="py-2.5 px-4 font-semibold text-right">Maxlen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredCharsets.map((c) => (
              <tr
                key={c.charset}
                className="hover:bg-muted transition-colors"
              >
                <td className="py-2.5 px-4 text-foreground font-medium">
                  {c.charset}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">{c.description}</td>
                <td className="py-2.5 px-4 text-emerald-500">
                  {c.defaultCollation}
                </td>
                <td className="py-2.5 px-4 text-right">{c.maxlen}</td>
              </tr>
            ))}
            {filteredCharsets.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-xs text-muted-foreground/70 italic"
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
