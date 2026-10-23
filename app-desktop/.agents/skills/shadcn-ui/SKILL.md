---
name: shadcn-ui
description: "Panduan arsitektur dan sistem komponen shadcn/ui di Apps (Electron + React 19 + Tailwind CSS v4). Mencakup 62+ komponen UI bawaan di @/components/ui/, konvensi import, utilitas cn(), preset styling Radix-Nova Midnight Navy (Termius Aesthetic), aturan penambahan komponen via shadcn CLI, serta best practice komposisi antarmuka untuk AI Agent."
---

# shadcn/ui — Panduan Arsitektur & Standar Komponen UI Apps

> **PERINGATAN WAJIB (MANDATORY POLICY FOR AI AGENTS)**:  
> Seluruh AI Agent yang mengembangkan antarmuka, halaman rute, modal, formulir, atau elemen interaktif di repositori `Apps` **WAJIB MEMATUHI** konvensi komponen **shadcn/ui** yang telah terpasang. Dilarang keras membuat elemen primitif mentah (ad-hoc raw buttons, raw unstyled modals, dsb.) secara berulang jika komponen resmi shadcn sudah tersedia di `src/components/ui/`.

---

## 1. Konfigurasi Sistem Desain & Arsitektur

Proyek `Apps` menggunakan konfigurasi shadcn/ui termodern yang terintegrasi dengan Tailwind CSS v4:

- **Style Preset**: `radix-nova` (Preset `b56mLC`)
- **Framework Core**: React 19 + Vite 8 + Electron 44
- **Tailwind Version**: Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss";`, `@import "shadcn/tailwind.css";`)
- **Icon Library**: `lucide-react`
- **Konfigurasi Utama**: [`components.json`](file:///components.json)
- **Path Aliases**:
  - Komponen UI: `@/components/ui/*` -> [`src/components/ui/`](file:///src/components/ui/)
  - Komponen Khusus: `@/components/*` -> [`src/components/`](file:///src/components/)
  - Utilitas Tailwind Class Merge: `@/utils/tailwind` (dan alias `@/lib/utils`)
  - Hook Kustom: `@/hooks/*` -> [`src/hooks/`](file:///src/hooks/)

---

## 2. Inventaris 62+ Komponen Resmi di `@/components/ui/`

Repositori ini telah dilengkapi dengan seluruh pustaka komponen shadcn/ui lengkap. **Gunakan langsung** komponen-komponen berikut:

| Kategori | Komponen Tersedia |
| :--- | :--- |
| **Aksi & Navigasi** | `Button`, `ButtonGroup`, `Toggle`, `ToggleGroup`, `Breadcrumb`, `NavigationMenu`, `Pagination`, `Kbd` |
| **Dialog & Overlay** | `Dialog`, `AlertDialog`, `Drawer`, `Sheet`, `Popover`, `HoverCard`, `Tooltip`, `ContextMenu`, `DropdownMenu`, `Menubar` |
| **Formulir & Input** | `Input`, `InputGroup`, `InputOtp`, `Textarea`, `Checkbox`, `RadioGroup`, `Select`, `NativeSelect`, `Switch`, `Slider`, `Calendar`, `Field`, `Label`, `Questionnaire` (form dinamis multi-tipe) |
| **Pencarian & Seleksi** | `Command`, `Combobox` (Pencarian cepat server SSH, filter host, omni-search) |
| **Layout & Kontainer** | `Card`, `Item`, `ScrollArea`, `Separator`, `Resizable` (`ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`), `Collapsible`, `Accordion`, `Tabs` |
| **Feedback & Status** | `Alert`, `Badge`, `Progress`, `Spinner`, `Skeleton`, `Empty`, `Sonner` (Toast notifikasi) |
| **Data & Tampilan** | `Table`, `Chart`, `Avatar`, `AspectRatio`, `Carousel`, `Bubble`, `Marker`, `Trace`, `Message`, `MessageScroller` |
| **Developer & Terminal** | `CodeBlock`, Highlighter code integration |

---

## 3. Aturan Baku & Konvensi Pemrograman untuk AI Agent

### A. Penggunaan Utilitas `cn()` untuk Penggabungan Class
Selalu gunakan fungsi `cn()` saat menggabungkan class Tailwind atau menerapkan styling kondisional:
```tsx
import { cn } from "@/utils/tailwind";

// Contoh:
<div className={cn(
  "p-3 rounded-xl bg-[#161c30] border border-[#232c4a] transition-all",
  isActive && "border-indigo-500 shadow-md shadow-indigo-500/20"
)}>
```

### B. Kompatibilitas Estetika Termius Dark (Midnight Navy)
Apps mengadopsi estetika **Termius Desktop Client**. Seluruh komponen shadcn/ui yang digunakan harus selaras dengan palet midnight navy:
- **Background Utama**: `#0a0d18` / `#0b0e14`
- **Sidebar & Header Bar**: `#0e1220` / `#121620`
- **Kartu Host / Group**: `#161c30` dengan border `#232c4a`
- **Hover State**: `#1c243e`
- **Aksen Utama**: Indigo `#6366f1` atau Electric Blue `#2979ff`
- **Teks**: Primary `#ffffff` / `#e2e8f0`, Secondary `#8c9cb6` / `#94a3b8`, Muted `#586885`

> **DILARANG**: Membiarkan komponen shadcn memakai background putih (`bg-white`) atau border abu-abu terang yang merusak tema gelap aplikasi. Pastikan class `dark` selalu aktif pada root `<html>`.

### C. Penanganan Tooltip (`TooltipProvider`)
Aplikasi telah dibungkus oleh `<TooltipProvider>` di root [`src/app.tsx`](file:///src/app.tsx). Saat menambahkan tooltip pada tombol aksi atau ikon terminal:
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <TerminalIcon size={16} />
    </Button>
  </TooltipTrigger>
  <TooltipContent className="bg-[#121620] border-[#1e2330] text-slate-200 text-xs">
    Buka Terminal SSH
  </TooltipContent>
</Tooltip>
```

### D. Dialog & Modal Form (Menggantikan `alert()` dan `prompt()`)
Gunakan komponen `Dialog` atau `AlertDialog` resmi shadcn untuk konfirmasi penghapusan, pembuatan folder, pengeditan kredensial host, atau dialog pengaturan:
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="bg-[#10131a] border-[#1e2330] text-white sm:max-w-[480px]">
    <DialogHeader>
      <DialogTitle>Tambah Host Baru</DialogTitle>
      <DialogDescription className="text-slate-400 text-xs">
        Masukkan detail konfigurasi server SSH remote.
      </DialogDescription>
    </DialogHeader>
    {/* Form fields */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
      <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">Simpan</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### E. Notifikasi Interaktif via `sonner`
Untuk memberikan feedback operasi (seperti koneksi SSH sukses, port forwarding aktif, keypair berhasil disalin, atau file SFTP terunduh):
```tsx
import { toast } from "sonner";

// Contoh pemanggilan:
toast.success("Koneksi SSH berhasil terhubung ke server produksi", {
  description: "Latensi: 24ms • Enkripsi: chacha20-poly1305"
});
```

---

## 4. Prosedur Penambahan Komponen Baru

Jika di masa mendatang diperlukan penambahan variasi komponen dari registry shadcn, **AI Agent WAJIB menggunakan `npm`**:

```bash
# Menambah komponen tertentu:
npm dlx shadcn@latest add <component-name>

# Contoh:
npm dlx shadcn@latest add dropdown-menu
```

> **Catatan Paket Manajer**: Repositori `Apps` menggunakan **`npm`** (bukan `pnpm`). Jangan pernah menjalankan perintah `pnpm dlx` atau membuat `pnpm-workspace.yaml`.

---

## 5. Checklist Kepatuhan AI Agent
Sebelum menyelesaikan tugas yang berkaitan dengan frontend/UI, pastikan:
- [ ] Tombol menggunakan `<Button>` dari `@/components/ui/button` dengan prop `variant` dan `size` yang tepat.
- [ ] Modal/dialog menggunakan `<Dialog>` dari `@/components/ui/dialog`.
- [ ] Seluruh input teks, dropdown, dan form controls menggunakan komponen `@/components/ui/*`.
- [ ] Warna selaras dengan palet Midnight Navy Termius (tidak ada elemen yang terpotong atau berwarna putih mencolok).
- [ ] Class utilitas dikombinasikan secara aman menggunakan `cn(...)`.
