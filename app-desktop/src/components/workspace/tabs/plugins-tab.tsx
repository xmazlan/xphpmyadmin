import { Layers, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ServerPluginItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="text-primary" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Plugin Server Database (SHOW PLUGINS)
          </h2>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {serverPluginsData.length} Plugin
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
              onChange={(e) => setPluginsSearch(e.target.value)}
              placeholder="Cari plugin..."
              value={pluginsSearch}
            />
          </div>
          <Button
            className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
            disabled={isLoadingPlugins}
            onClick={onLoadPlugins}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("mr-1.5", isLoadingPlugins && "animate-spin")}
              size={12}
            />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Nama Plugin</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Tipe</th>
              <th className="px-4 py-2.5 font-semibold">Berkas Library</th>
              <th className="px-4 py-2.5 font-semibold">Lisensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {filteredPlugins.map((p) => (
              <tr className="transition-colors hover:bg-muted" key={p.name}>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {p.name}
                </td>
                <td className="px-4 py-2.5">
                  {p.status === "ACTIVE" ? (
                    <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-500">
                      ACTIVE
                    </Badge>
                  ) : (
                    <Badge
                      className="border-border text-[9px] text-muted-foreground/70"
                      variant="outline"
                    >
                      {p.status}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-primary">{p.type}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {p.library}
                </td>
                <td className="px-4 py-2.5 text-foreground">{p.license}</td>
              </tr>
            ))}
            {filteredPlugins.length === 0 && (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground/70 text-xs italic"
                  colSpan={5}
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
