import {
  Database,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  Terminal,
  Trash2,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/types/connection";
import { cn } from "@/utils/tailwind";

interface ConnectionGridProps {
  favoritesOnly: boolean;
  filteredProfiles: Profile[];
  isInspectorOpen: boolean;
  methodFilter?: "all" | "direct" | "ssh";
  onAddNewHost: () => void;
  onAddNewSshTunnel?: () => void;
  onDeleteHost: (p: Profile) => void;
  onMethodFilterChange?: (val: "all" | "direct" | "ssh") => void;
  onSelectHost: (p: Profile) => void;
  onSortByChange: (val: "recent" | "name") => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleFavoriteFilter: (val: boolean) => void;
  onToggleInspector: () => void;
  selectedId: string;
  sortBy: "recent" | "name";
}

export function ConnectionGrid({
  favoritesOnly,
  filteredProfiles,
  isInspectorOpen,
  methodFilter = "all",
  onAddNewHost,
  onAddNewSshTunnel,
  onDeleteHost,
  onMethodFilterChange,
  onSelectHost,
  onSortByChange,
  onToggleFavorite,
  onToggleFavoriteFilter,
  onToggleInspector,
  selectedId,
  sortBy,
}: ConnectionGridProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-border border-b bg-background px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-2 font-semibold text-primary-foreground text-xs hover:bg-primary/90 sm:px-2.5"
            onClick={onAddNewHost}
            size="sm"
          >
            <Plus size={13} />
            <span className="xs:inline hidden sm:inline">Tambah Koneksi</span>
            <span className="inline xs:hidden sm:hidden">Baru</span>
          </Button>

          {onAddNewSshTunnel && (
            <Button
              className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-600/15 px-2 font-semibold text-purple-200 text-xs hover:bg-purple-600/25 sm:px-2.5"
              onClick={onAddNewSshTunnel}
              size="sm"
              title="Buat koneksi baru dengan metode SSH Tunnel (VPS)"
              variant="outline"
            >
              <Terminal size={12} />
              <span className="xs:inline hidden sm:inline">+ SSH Tunnel</span>
              <span className="inline xs:hidden sm:hidden">SSH</span>
            </Button>
          )}

          <div className="mx-1 h-3.5 w-[1px] bg-border" />

          {/* Method Filter Tabs */}
          {onMethodFilterChange && (
            <div className="hidden items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5 md:flex">
              <button
                className={cn(
                  "cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                  methodFilter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onMethodFilterChange("all")}
                type="button"
              >
                Semua
              </button>
              <button
                className={cn(
                  "cursor-pointer rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                  methodFilter === "direct"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onMethodFilterChange("direct")}
                type="button"
              >
                Direct
              </button>
              <button
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-all",
                  methodFilter === "ssh"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-purple-400 hover:text-purple-300"
                )}
                onClick={() => onMethodFilterChange("ssh")}
                type="button"
              >
                <Terminal size={10} />
                <span>SSH Tunnel</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <input
              checked={favoritesOnly}
              className="rounded border-border bg-muted text-foreground focus:ring-0"
              id="fav-filter"
              onChange={(e) => onToggleFavoriteFilter(e.target.checked)}
              type="checkbox"
            />
            <label
              className="cursor-pointer select-none text-[11px]"
              htmlFor="fav-filter"
            >
              Favorit
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">
            Urutkan:
          </span>
          <Select
            onValueChange={(val: "recent" | "name") => onSortByChange(val)}
            value={sortBy}
          >
            <SelectTrigger className="h-7 w-28 border-border text-xs sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="recent">Terakhir</SelectItem>
              <SelectItem value="name">Nama</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className={cn(
              "flex h-7 items-center gap-1.5 border-border px-2 text-xs transition-colors",
              isInspectorOpen
                ? "border-border bg-accent text-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
            onClick={onToggleInspector}
            size="sm"
            title={
              isInspectorOpen
                ? "Tutup Inspector Host Details"
                : "Buka Inspector Host Details"
            }
            variant="outline"
          >
            <SlidersHorizontal size={12} />
            <span className="hidden md:inline">Detail Host</span>
          </Button>
        </div>
      </div>

      {/* Grid of Profile Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{filteredProfiles.length} koneksi ditemukan</span>
          <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">
            Tervalidasi siap terhubung ke MySQL & MariaDB
          </span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border border-dashed p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              {methodFilter === "ssh" ? <Terminal size={22} /> : <Database size={22} />}
            </div>
            <h4 className="mt-3 font-semibold text-foreground text-sm">
              {methodFilter === "ssh"
                ? "Belum ada koneksi SSH Tunnel"
                : "Tidak ada koneksi yang cocok"}
            </h4>
            <p className="mt-1 max-w-sm text-muted-foreground text-xs">
              {methodFilter === "ssh"
                ? "Buat profil koneksi baru dengan metode SSH Tunnel untuk menghubungkan database di VPS tanpa membuka port publik."
                : "Coba ubah kata kunci pencarian atau buat koneksi database baru."}
            </p>
            {methodFilter === "ssh" && onAddNewSshTunnel && (
              <Button
                className="mt-4 flex items-center gap-1.5 bg-purple-600 font-semibold text-white hover:bg-purple-700"
                onClick={onAddNewSshTunnel}
                size="sm"
              >
                <Terminal size={13} />
                + Buat SSH Tunnel Sekarang
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3 transition-all",
              isInspectorOpen
                ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            )}
          >
            {filteredProfiles.map((p) => {
              const isSelected = p.id === selectedId;
              const isProd = p.environment === "Production";
              const isSsh = p.method === "ssh";
              return (
                <Card
                  className={cn(
                    "group relative cursor-pointer rounded-lg border border-border bg-card p-3.5 transition-all hover:border-white/20 hover:bg-muted/40",
                    isSelected &&
                      "border-primary shadow-[0_0_12px_rgba(87,193,255,0.15)] ring-1 ring-primary",
                    isSsh && !isSelected && "border-purple-500/20 hover:border-purple-500/40"
                  )}
                  key={p.id}
                  onClick={() => onSelectHost(p)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-md border",
                          isProd
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : isSsh
                              ? "border-purple-500/40 bg-purple-500/10 text-purple-400"
                              : "border-border bg-muted text-primary"
                        )}
                      >
                        {isSsh ? <Terminal size={15} /> : <Database size={15} />}
                      </div>
                      <div>
                        <h4 className="flex items-center gap-1.5 font-semibold text-foreground text-xs tracking-tight transition-colors group-hover:text-primary">
                          {p.name}
                          {isProd && (
                            <ShieldAlert className="text-destructive" size={11} />
                          )}
                        </h4>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {p.host}:{p.port}
                        </p>
                        {isSsh && p.ssh?.host && (
                          <p className="font-mono text-[10px] text-purple-400/90">
                            via {p.ssh.username || "root"}@{p.ssh.host}:{p.ssh.port || 22}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        aria-label={`Hapus koneksi ${p.name}`}
                        className="cursor-pointer rounded p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHost(p);
                        }}
                        title="Hapus Koneksi"
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        aria-label={
                          p.favorite ? "Hapus dari Favorit" : "Tambah ke Favorit"
                        }
                        className="cursor-pointer p-1 text-muted-foreground/70 transition-colors hover:text-amber-500"
                        onClick={(e) => onToggleFavorite(p.id, e)}
                        type="button"
                      >
                        <Star
                          className={cn(
                            p.favorite && "fill-amber-500 text-amber-500"
                          )}
                          size={13}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-border border-t pt-2 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={cn(
                          "px-1.5 py-0 font-medium text-[9px] uppercase tracking-wide",
                          isProd &&
                            "border-destructive/30 bg-destructive/10 text-destructive",
                          p.environment === "Staging" &&
                            "border-amber-500/30 bg-amber-500/10 text-amber-500",
                          p.environment === "Local" &&
                            "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
                          p.environment === "Other" &&
                            "border-border text-muted-foreground"
                        )}
                        variant="outline"
                      >
                        {p.environment}
                      </Badge>
                      {isSsh ? (
                        <Badge
                          className="border-purple-500/40 bg-purple-500/10 px-1.5 py-0 font-medium text-[9px] text-purple-300"
                          variant="outline"
                        >
                          🔒 SSH Tunnel
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/70">Direct</span>
                      )}
                    </div>
                    <span className="text-muted-foreground/70">
                      {p.last_used_at ? "Aktif baru-baru ini" : "Belum dibuka"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
