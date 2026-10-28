# 10 — Panduan Kode & Implementasi Fitur (Developer Playbook)

Dokumen ini menyediakan spesifikasi kode TypeScript, skema validasi Zod, antarmuka IPC, serta arsitektur komponen React 19 siap pakai untuk mengimplementasikan fungsionalitas **xphpMyAdmin Desktop**.

---

## 1. Definisi Tipe Data & Skema Zod (`src/types/connection.ts`)

```typescript
import { z } from "zod";

// Skema Validasi TLS
export const tlsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  verify: z.literal(true).default(true), // Wajib selalu true
  ca: z.string().nullable().optional(),
  cert: z.string().nullable().optional(),
  key: z.string().nullable().optional(),
});
export type TLSConfig = z.infer<typeof tlsConfigSchema>;

// Skema Validasi SSH
export const sshConfigSchema = z.object({
  host: z.string().min(1).max(253),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1).max(128),
  key: z.string().min(1).max(4096), // Absolute local file path
});
export type SSHConfig = z.infer<typeof sshConfigSchema>;

// Skema Validasi Profil Utama
export const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  host: z.string().min(1).max(253),
  port: z.number().int().min(1).max(65535).default(3306),
  username: z.string().min(1).max(128),
  database: z.string().max(64).nullable().optional(),
  environment: z.enum(["Local", "Staging", "Production", "Other"]).default("Other"),
  method: z.enum(["direct", "ssh"]).default("direct"),
  ssh: sshConfigSchema.nullable().optional(),
  tls: tlsConfigSchema.default({ enabled: true, verify: true }),
  favorite: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
  last_used_at: z.string().nullable(),
  connection_revision: z.number().int().min(1),
  has_saved_password: z.boolean(),
});
export type Profile = z.infer<typeof profileSchema>;

// Input Mutasi Password
export const passwordActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("keep") }),
  z.object({ action: z.literal("replace"), password: z.string().max(65536) }),
  z.object({ action: z.literal("remove") }),
]);
export type PasswordAction = z.infer<typeof passwordActionSchema>;

// Tahapan Diagnostik
export interface DiagnosticStage {
  stage:
    | "local_validation"
    | "ssh_trust"
    | "ssh_authentication_forwarding"
    | "mysql_tls_authentication_initial_database";
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration_ms: number;
  message?: string;
}

// Respon Tes Koneksi
export interface ConnectionTestResult {
  ok: boolean;
  tls_active?: boolean;
  database_selected?: boolean;
  diagnostics: DiagnosticStage[];
  error?: {
    category: string;
    message: string;
  };
}
```

---

## 2. Definisi Handler IPC / oRPC (`src/ipc/connections/router.ts`)

```typescript
import { os } from "@orpc/server";
import { z } from "zod";
import { profileSchema, passwordActionSchema } from "@/types/connection";

export const connectionRouter = {
  // 1. Ambil daftar semua profil koneksi
  list: os
    .input(
      z.object({
        search: z.string().optional().default(""),
        favoritesOnly: z.boolean().optional().default(false),
        sort: z.enum(["recent", "name"]).optional().default("recent"),
      })
    )
    .handler(async ({ input }) => {
      // Panggil ProfileRepository.list(input.search, input.favoritesOnly, input.sort)
      return { profiles: [] };
    }),

  // 2. Simpan profil baru
  create: os
    .input(
      z.object({
        profile: profileSchema.omit({
          id: true,
          created_at: true,
          updated_at: true,
          last_used_at: true,
          connection_revision: true,
          has_saved_password: true,
        }),
        passwordAction: passwordActionSchema.optional(),
      })
    )
    .handler(async ({ input }) => {
      // Panggil ProfilePasswords.create(input.profile, input.passwordAction)
      return { ok: true, id: "new-uuid" };
    }),

  // 3. Perbarui profil
  update: os
    .input(
      z.object({
        id: z.string().uuid(),
        patch: profileSchema.partial(),
        passwordAction: passwordActionSchema.optional(),
      })
    )
    .handler(async ({ input }) => {
      // Panggil ProfilePasswords.update(input.id, input.patch, input.passwordAction)
      return { ok: true };
    }),

  // 4. Toggle favorit
  toggleFavorite: os
    .input(z.object({ id: z.string().uuid(), favorite: z.boolean() }))
    .handler(async ({ input }) => {
      return { ok: true };
    }),

  // 5. Hapus profil
  delete: os
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input }) => {
      return { ok: true };
    }),

  // 6. Jalankan Tes Koneksi
  test: os
    .input(
      z.object({
        draft: profileSchema.omit({
          id: true,
          created_at: true,
          updated_at: true,
          last_used_at: true,
          connection_revision: true,
          has_saved_password: true,
        }),
        credential: z.discriminatedUnion("source", [
          z.object({ source: z.literal("input"), password: z.string() }),
          z.object({ source: z.literal("saved"), profileId: z.string().uuid(), revision: z.number() }),
          z.object({ source: z.literal("session"), contextToken: z.string() }),
        ]),
      })
    )
    .handler(async ({ input }) => {
      // Jalankan 4-Stage Diagnostics
      return {
        ok: true,
        diagnostics: [],
      };
    }),

  // 7. Hubungkan & Buat Konteks Tab
  connect: os
    .input(
      z.object({
        profileId: z.string().uuid(),
        revision: z.number(),
        passwordInput: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      // Menghasilkan token kapabilitas acak 256-bit
      return {
        ok: true,
        contextToken: "256-bit-random-hex",
        target: { ...targetIdentity },
      };
    }),
};
```

---

## 3. Komponen Antarmuka Termius Midnight Navy

### A. Bilah Pencarian Universal (`OmniSearchBar.tsx`)
```tsx
import { Search, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OmniSearchBar({ onQuickConnect, onSearchChange }: any) {
  return (
    <div className="relative flex items-center w-full max-w-xl">
      <Search className="absolute left-3.5 text-slate-500" size={15} />
      <Input
        placeholder="Cari host atau ketik user@hostname:port... (Ctrl+K)"
        className="pl-9 pr-24 bg-[#0e1220] border-[#232c4a] text-slate-200 placeholder:text-slate-500 rounded-lg text-xs h-9 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Button
        size="sm"
        className="absolute right-1 h-7 px-3 bg-[#2979ff] hover:bg-[#1e60d0] text-white text-xs rounded-md flex items-center gap-1"
        onClick={onQuickConnect}
      >
        <Zap size={12} />
        Hubungkan
      </Button>
    </div>
  );
}
```

### B. Kartu Koneksi Server (`ConnectionCard.tsx`)
```tsx
import { Star, ShieldAlert, Terminal, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/tailwind";
import { Profile } from "@/types/connection";

interface Props {
  profile: Profile;
  isActive: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onConnect: () => void;
}

export function ConnectionCard({ profile, isActive, onSelect, onToggleFavorite, onConnect }: Props) {
  const isProd = profile.environment === "Production";

  return (
    <Card
      onClick={onSelect}
      className={cn(
        "relative p-4 rounded-xl bg-[#161c30] border-[#232c4a] transition-all cursor-pointer group hover:bg-[#1c243e]",
        isActive && "border-[#2979ff] shadow-[0_0_16px_rgba(41,121,255,0.45)]",
        isProd && !isActive && "border-red-900/40 hover:border-red-700/60"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0e1220] border border-[#232c4a] flex items-center justify-center text-indigo-400">
            <Server size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {profile.name}
            </h4>
            <p className="text-xs text-slate-400">
              {profile.host}:{profile.port}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="text-slate-500 hover:text-amber-400 transition-colors"
        >
          <Star size={16} className={cn(profile.favorite && "fill-amber-400 text-amber-400")} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#232c4a]/60 text-xs">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5",
              isProd && "border-red-500/50 text-red-400 bg-red-950/30",
              profile.environment === "Staging" && "border-amber-500/50 text-amber-400 bg-amber-950/30",
              profile.environment === "Local" && "border-emerald-500/50 text-emerald-400 bg-emerald-950/30"
            )}
          >
            {profile.environment}
          </Badge>
          <span className="text-slate-500 text-[11px]">
            {profile.method === "ssh" ? "SSH Tunnel" : "Direct"}
          </span>
        </div>

        <span className="text-slate-500 text-[10px]">
          {profile.last_used_at ? "Terakhir digunakan baru saja" : "Belum pernah digunakan"}
        </span>
      </div>
    </Card>
  );
}
```

---

## 4. Perintah Kompilasi & Menjalankan Aplikasi

```bash
# Pindah ke direktori app-desktop
cd app-desktop

# Jalankan server pengembangan lokal (Vite + Electron)
yarn start

# Menjalankan pengujian unit & integrasi
yarn test

# Memeriksa kepatuhan kode dan linting
yarn check
```
