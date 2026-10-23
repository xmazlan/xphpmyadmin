import React from "react";
import { Layers, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tailwind";
import type { ServerPluginItem } from "@/types/workspace";

interface PluginsTabProps {
  filteredPlugins: ServerPluginItem[];
  isLoadingPlugins: boolean;
  onLoadPlugins: () => void;
  pluginsSearch: string;
  serverPluginsData: ServerPluginItem[];
  setPluginsSearch: (val: string) => void;
}

export function PluginsTab({
  filteredPlugins,
  isLoadingPlugins,
  onLoadPlugins,
  pluginsSearch,
  serverPluginsData,
  setPluginsSearch,
}: PluginsTabProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Plugin Server Database (SHOW PLUGINS)
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            {serverPluginsData.length} Plugin
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
              placeholder="Cari plugin..."
              value={pluginsSearch}
              onChange={(e) => setPluginsSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoadingPlugins}
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            onClick={onLoadPlugins}
          >
            <RefreshCw
              size={12}
              className={cn("mr-1.5", isLoadingPlugins && "animate-spin")}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
              <th className="py-2.5 px-4 font-semibold">Nama Plugin</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">Tipe</th>
              <th className="py-2.5 px-4 font-semibold">Berkas Library</th>
              <th className="py-2.5 px-4 font-semibold">Lisensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredPlugins.map((p) => (
              <tr
                key={p.name}
                className="hover:bg-muted transition-colors"
              >
                <td className="py-2.5 px-4 text-foreground font-medium">
                  {p.name}
                </td>
                <td className="py-2.5 px-4">
                  {p.status === "ACTIVE" ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px]">
                      ACTIVE
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground/70 text-[9px]"
                    >
                      {p.status}
                    </Badge>
                  )}
                </td>
                <td className="py-2.5 px-4 text-primary">{p.type}</td>
                <td className="py-2.5 px-4 text-muted-foreground">{p.library}</td>
                <td className="py-2.5 px-4 text-foreground">{p.license}</td>
              </tr>
            ))}
            {filteredPlugins.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-xs text-muted-foreground/70 italic"
                >
                  {isLoadingPlugins
                    ? "Memuat plugin server..."
                    : "Plugin tidak ditemukan."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
