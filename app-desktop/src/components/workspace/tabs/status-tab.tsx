import { Activity, Clock, Code2, RefreshCw, Server, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/connection";
import type { ServerStatusData } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

interface StatusTabProps {
  activeConnectedProfile: Profile | null;
  isLoadingStatus: boolean;
  onLoadServerStatus: () => void;
  serverStatusData: ServerStatusData | null;
}

export function StatusTab({
  activeConnectedProfile,
  isLoadingStatus,
  onLoadServerStatus,
  serverStatusData,
}: StatusTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Activity className="text-primary" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Status & Kinerja Server
          </h2>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {activeConnectedProfile?.host}:{activeConnectedProfile?.port}
          </Badge>
        </div>
        <Button
          className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
          disabled={isLoadingStatus}
          onClick={onLoadServerStatus}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={cn("mr-1.5", isLoadingStatus && "animate-spin")}
            size={12}
          />
          <span>Segarkan Metrik</span>
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="space-y-1 border-border bg-card p-3.5">
            <p className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground">
              <Clock className="text-emerald-500" size={12} />
              Waktu Aktif (Uptime)
            </p>
            <p className="font-bold font-mono text-base text-foreground">
              {serverStatusData?.uptimeSeconds
                ? `${Math.floor(serverStatusData.uptimeSeconds / 3600)}j ${Math.floor((serverStatusData.uptimeSeconds % 3600) / 60)}m ${serverStatusData.uptimeSeconds % 60}d`
                : "Memuat..."}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {serverStatusData?.uptimeSeconds?.toLocaleString() || 0} detik
              server berjalan
            </p>
          </Card>

          <Card className="space-y-1 border-border bg-card p-3.5">
            <p className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground">
              <Zap className="text-primary" size={12} />
              Total Koneksi
            </p>
            <p className="font-bold font-mono text-base text-foreground">
              {serverStatusData?.connections?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Koneksi klien tercatat sejak startup
            </p>
          </Card>

          <Card className="space-y-1 border-border bg-card p-3.5">
            <p className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground">
              <Code2 className="text-amber-500" size={12} />
              Total Permintaan (Queries)
            </p>
            <p className="font-bold font-mono text-base text-foreground">
              {serverStatusData?.questions?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Query dieksekusi oleh server
            </p>
          </Card>

          <Card className="space-y-1 border-border bg-card p-3.5">
            <p className="flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground">
              <Server className="text-destructive" size={12} />
              Threads Aktif
            </p>
            <p className="font-bold font-mono text-base text-foreground">
              {serverStatusData?.threadsConnected || 0}{" "}
              <span className="font-normal text-muted-foreground text-xs">
                ({serverStatusData?.threadsRunning || 0} running)
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Utas pemrosesan saat ini
            </p>
          </Card>
        </div>

        {/* Processlist Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground text-xs">
              <span>Daftar Proses Server (SHOW FULL PROCESSLIST)</span>
              <Badge
                className="border-border font-mono text-[10px] text-muted-foreground"
                variant="outline"
              >
                {serverStatusData?.processes?.length || 0} proses
              </Badge>
            </h3>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-border border-b bg-muted/40 text-muted-foreground">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Pengguna</th>
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2">Basis Data</th>
                  <th className="px-3 py-2">Perintah</th>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Info Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {serverStatusData?.processes?.map((proc) => (
                  <tr
                    className="transition-colors hover:bg-muted"
                    key={proc.id}
                  >
                    <td className="px-3 py-2 text-primary">{proc.id}</td>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {proc.user}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {proc.host}
                    </td>
                    <td className="px-3 py-2 text-emerald-500">{proc.db}</td>
                    <td className="px-3 py-2">{proc.command}</td>
                    <td className="px-3 py-2">{proc.time}s</td>
                    <td className="px-3 py-2 text-amber-500">
                      {proc.state || "-"}
                    </td>
                    <td
                      className="max-w-xs truncate px-3 py-2 text-foreground"
                      title={proc.info}
                    >
                      {proc.info || "-"}
                    </td>
                  </tr>
                ))}
                {(!serverStatusData?.processes ||
                  serverStatusData.processes.length === 0) && (
                  <tr>
                    <td
                      className="py-6 text-center text-muted-foreground/70 text-xs italic"
                      colSpan={8}
                    >
                      {isLoadingStatus
                        ? "Memuat proses server..."
                        : "Tidak ada proses aktif."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
