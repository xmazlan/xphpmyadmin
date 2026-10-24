import { RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserAccountItem } from "@/types/workspace";
import { cn } from "@/utils/tailwind";

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between border-border border-b bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Users className="text-primary" size={15} />
          <h2 className="font-semibold text-foreground text-xs">
            Akun Pengguna Server Database
          </h2>
          <Badge
            className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
            variant="outline"
          >
            {userAccountsData.length} Pengguna
          </Badge>
        </div>
        <Button
          className="h-7 border-border bg-muted/40 text-muted-foreground hover:text-foreground"
          disabled={isLoadingUsers}
          onClick={onLoadUserAccounts}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={cn("mr-1.5", isLoadingUsers && "animate-spin")}
            size={12}
          />
          <span>Segarkan Pengguna</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="sticky top-0 border-border border-b bg-muted/40 text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Nama Pengguna</th>
              <th className="px-4 py-2.5 font-semibold">Nama Host</th>
              <th className="px-4 py-2.5 font-semibold">Plugin Autentikasi</th>
              <th className="px-4 py-2.5 font-semibold">Status Akun</th>
              <th className="px-4 py-2.5 font-semibold">Masa Berlaku Sandi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {userAccountsData.map((u, i) => (
              <tr
                className="transition-colors hover:bg-muted"
                key={`${u.user}-${u.host}-${i}`}
              >
                <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-foreground">
                  <Users className="text-primary" size={13} />
                  <span>{u.user || "(anonymous)"}</span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.host}</td>
                <td className="px-4 py-2.5 text-emerald-500">{u.plugin}</td>
                <td className="px-4 py-2.5">
                  {u.accountLocked ? (
                    <Badge
                      className="border-destructive/30 bg-destructive/10 text-[9px] text-destructive"
                      variant="outline"
                    >
                      Terkunci
                    </Badge>
                  ) : (
                    <Badge
                      className="border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-500"
                      variant="outline"
                    >
                      Aktif
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {u.passwordExpired ? "Kedaluwarsa" : "Normal"}
                </td>
              </tr>
            ))}
            {userAccountsData.length === 0 && (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground/70 text-xs italic"
                  colSpan={5}
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
