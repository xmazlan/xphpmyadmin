import React from "react";
import { Activity, Clock, Code2, RefreshCw, Server, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/tailwind";
import type { Profile } from "@/types/connection";
import type { ServerStatusData } from "@/types/workspace";

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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Status & Kinerja Server
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            {activeConnectedProfile?.host}:{activeConnectedProfile?.port}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoadingStatus}
          className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
          onClick={onLoadServerStatus}
        >
          <RefreshCw
            size={12}
            className={cn("mr-1.5", isLoadingStatus && "animate-spin")}
          />
          <span>Segarkan Metrik</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border bg-card p-3.5 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock size={12} className="text-emerald-500" />
              Waktu Aktif (Uptime)
            </p>
            <p className="font-mono text-base font-bold text-foreground">
              {serverStatusData?.uptimeSeconds
                ? `${Math.floor(serverStatusData.uptimeSeconds / 3600)}j ${Math.floor((serverStatusData.uptimeSeconds % 3600) / 60)}m ${serverStatusData.uptimeSeconds % 60}d`
                : "Memuat..."}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {serverStatusData?.uptimeSeconds?.toLocaleString() || 0}{" "}
              detik server berjalan
            </p>
          </Card>

          <Card className="border-border bg-card p-3.5 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap size={12} className="text-primary" />
              Total Koneksi
            </p>
            <p className="font-mono text-base font-bold text-foreground">
              {serverStatusData?.connections?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Koneksi klien tercatat sejak startup
            </p>
          </Card>

          <Card className="border-border bg-card p-3.5 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Code2 size={12} className="text-amber-500" />
              Total Permintaan (Queries)
            </p>
            <p className="font-mono text-base font-bold text-foreground">
              {serverStatusData?.questions?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Query dieksekusi oleh server
            </p>
          </Card>

          <Card className="border-border bg-card p-3.5 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Server size={12} className="text-destructive" />
              Threads Aktif
            </p>
            <p className="font-mono text-base font-bold text-foreground">
              {serverStatusData?.threadsConnected || 0}{" "}
              <span className="text-xs font-normal text-muted-foreground">
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
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span>Daftar Proses Server (SHOW FULL PROCESSLIST)</span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-border text-muted-foreground"
              >
                {serverStatusData?.processes?.length || 0} proses
              </Badge>
            </h3>
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Pengguna</th>
                  <th className="py-2 px-3">Host</th>
                  <th className="py-2 px-3">Basis Data</th>
                  <th className="py-2 px-3">Perintah</th>
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Info Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-foreground">
                {serverStatusData?.processes?.map((proc) => (
                  <tr
                    key={proc.id}
                    className="hover:bg-muted transition-colors"
                  >
                    <td className="py-2 px-3 text-primary">{proc.id}</td>
                    <td className="py-2 px-3 text-foreground font-medium">
                      {proc.user}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{proc.host}</td>
                    <td className="py-2 px-3 text-emerald-500">{proc.db}</td>
                    <td className="py-2 px-3">{proc.command}</td>
                    <td className="py-2 px-3">{proc.time}s</td>
                    <td className="py-2 px-3 text-amber-500">
                      {proc.state || "-"}
                    </td>
                    <td
                      className="py-2 px-3 text-foreground truncate max-w-xs"
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
                        colSpan={8}
                        className="py-6 text-center text-xs text-muted-foreground/70 italic"
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
