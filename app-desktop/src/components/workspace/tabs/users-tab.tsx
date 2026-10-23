import React from "react";
import { RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";
import type { UserAccountItem } from "@/types/workspace";

interface UsersTabProps {
  isLoadingUsers: boolean;
  onLoadUserAccounts: () => void;
  userAccountsData: UserAccountItem[];
}

export function UsersTab({
  isLoadingUsers,
  onLoadUserAccounts,
  userAccountsData,
}: UsersTabProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground">
            Akun Pengguna Server Database
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            {userAccountsData.length} Pengguna
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoadingUsers}
          className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
          onClick={onLoadUserAccounts}
        >
          <RefreshCw
            size={12}
            className={cn("mr-1.5", isLoadingUsers && "animate-spin")}
          />
          <span>Segarkan Pengguna</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground sticky top-0">
              <th className="py-2.5 px-4 font-semibold">Nama Pengguna</th>
              <th className="py-2.5 px-4 font-semibold">Nama Host</th>
              <th className="py-2.5 px-4 font-semibold">Plugin Autentikasi</th>
              <th className="py-2.5 px-4 font-semibold">Status Akun</th>
              <th className="py-2.5 px-4 font-semibold">Masa Berlaku Sandi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {userAccountsData.map((u, i) => (
              <tr
                key={`${u.user}-${u.host}-${i}`}
                className="hover:bg-muted transition-colors"
              >
                <td className="py-2.5 px-4 text-foreground font-medium flex items-center gap-2">
                  <Users size={13} className="text-primary" />
                  <span>{u.user || "(anonymous)"}</span>
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">{u.host}</td>
                <td className="py-2.5 px-4 text-emerald-500">{u.plugin}</td>
                <td className="py-2.5 px-4">
                  {u.accountLocked ? (
                    <Badge
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 text-destructive text-[9px]"
                    >
                      Terkunci
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[9px]"
                    >
                      Aktif
                    </Badge>
                  )}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {u.passwordExpired ? "Kedaluwarsa" : "Normal"}
                </td>
              </tr>
            ))}
            {userAccountsData.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-xs text-muted-foreground/70 italic"
                >
                  {isLoadingUsers
                    ? "Memuat akun pengguna..."
                    : "Tidak ada data pengguna."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
