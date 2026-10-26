---
name: raycast-design
description: "Panduan dan spesifikasi sistem desain Raycast Developer Tools untuk xphpMyAdmin Desktop (React 19 + Tailwind CSS v4 + shadcn/ui). Diadaptasi langsung dari VoltAgent awesome-design-md (design-md/raycast). Mengatur palet warna obsidian canvas (#07080a / #0a0d18), hairline 1px borders (#242728), command-palette navigation, keycaps shortcut, tight 6-10px radii, high-contrast primary CTA, serta aturan wajib eksekusi antarmuka untuk AI Agent."
metadata:
  version: "1.0.0"
  source: "https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/raycast"
  framework: "React 19 + Tailwind v4 + shadcn/ui + Radix"
  category: "ui-design-system"
  tags:
    - raycast
    - developer-tools
    - dark-theme
    - command-palette
    - hairline-borders
    - desktop-app
---

# Raycast Developer Tools UI — Playbook & Mandatory AI Execution Rules

> **KEBIJAKAN WAJIB DIEKSEKUSI (MANDATORY POLICY FOR AI AGENTS)**:  
> Seluruh AI Agent yang mengimplementasikan atau memodifikasi antarmuka visual (halaman, dialog, inspector, kartu koneksi, tabel data, atau command palette) pada `app-desktop` **WAJIB MEMATUHI DAN MENGEKSEKUSI** aturan desain yang didefinisikan dalam skill ini serta [`DESIGN.md`](file:///DESIGN.md).  
> Dilarang menggunakan warna abu-abu default HTML/CSS, border tebal lebih dari 1px, sudut membulat berlebihan pada kartu, atau tombol tanpa hierarki kontras yang jelas.

---

## 1. Sumber Desain & Filosofi Raycast

Desain ini diambil langsung dari analisis arsitektur [VoltAgent awesome-design-md (Raycast)](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/raycast).

Raycast memperlakukan seluruh aplikasi desktop seperti command-palette presisi tinggi:
1. **Continuous Obsidian Canvas**: Tidak ada kontras putih yang menyilaukan; semua panel hidup dalam kedalaman bertingkat (`#07080a` → `#0d0d0d` → `#101111` → `#121212`).
2. **Hairline 1px Precision**: Seluruh pemisah menggunakan garis presisi 1px (`#242728` atau `rgba(255, 255, 255, 0.08)`).
3. **High-Contrast Single Primary CTA**: Aksi utama menggunakan tombol putih murni (`#ffffff`) dengan teks hitam (`#000000`), memberikan jangkar fokus instan.
4. **Command Palette & Keyboard-First**: Setiap opsi penting dilengkapi penanda shortcut keyboard (`<kbd>`).
5. **Purposeful Saturated Accents**: Aksen warna hanya digunakan untuk status fungsional (Koneksi aktif, Standby, Error, Production).

---

## 2. Token Visual & Kelas Tailwind v4

| Token Raycast | Nilai HEX / CSS | Kelas Tailwind v4 / Rekomendasi | Penggunaan |
| :--- | :--- | :--- | :--- |
| `canvas` | `#07080a` | `bg-[#07080a]` atau `bg-[#0a0d18]` | Viewport utama & latar belakang aplikasi |
| `surface` | `#0d0d0d` | `bg-[#0d0d0d]` atau `bg-[#161c30]` | Kartu koneksi server & sidebar |
| `surface-elevated` | `#101111` | `bg-[#101111]` atau `bg-[#0e1220]` | Inspector Host Details & Header bar |
| `surface-card` | `#121212` | `bg-[#121212]` | Latar belakang badge, row aktif & keycaps |
| `hairline` | `#242728` | `border-[#242728]` atau `border-white/10` | Garis tepi 1px di seluruh komponen |
| `hairline-strong`| `rgba(255,255,255,0.16)`| `border-white/20` | Garis tepi saat elemen di-hover |
| `primary` | `#ffffff` | `bg-white text-black hover:bg-[#e8e8e8]` | Tombol aksi utama (Connect, Save) |
| `ink` | `#f4f4f6` | `text-[#f4f4f6]` | Judul utama, nama host, label aktif |
| `body` | `#cdcdcd` | `text-[#cdcdcd]` | Teks tubuh standar, parameter form |
| `mute` | `#9c9c9d` | `text-[#9c9c9d]` | Subtitle, port, username, timestamp |
| `ash` | `#6a6b6c` | `text-[#6a6b6c]` | Placeholder input, watermark, chevron |
| `accent-green` | `#59d499` | `text-[#59d499] bg-[#59d499]/15` | Status tersambung, health check sukses |
| `accent-yellow`| `#ffc533` | `text-[#ffc533] bg-[#ffc533]/15` | Status standby, reconnecting, dev env |
| `accent-red` | `#ff6161` | `text-[#ff6161] bg-[#ff6161]/15` | Status error, koneksi gagal, badge PROD |
| `accent-blue` | `#57c1ff` | `text-[#57c1ff] bg-[#57c1ff]/15` | MySQL standard, TLS handshake, info |
| `accent-purple`| `#a78bfa` | `text-[#a78bfa] bg-[#a78bfa]/15` | SSH tunnel active, staging env |

---

## 3. Komponen UI Baku (Pola Raycast)

### A. Omni-Search & Command Bar
Pencarian cepat global harus selalu memiliki keycap `⌘K` dan tampilan elevated:
```tsx
<div className="relative flex items-center">
  <Search className="absolute left-3 w-4 h-4 text-[#6a6b6c]" />
  <input 
    type="text"
    placeholder="Cari server, database, atau tabel... (Ctrl+K)"
    className="w-full h-9 pl-9 pr-14 text-xs bg-[#101111] border border-[#242728] rounded-lg text-[#f4f4f6] placeholder-[#6a6b6c] focus:outline-none focus:border-white/30 transition-colors"
  />
  <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono bg-[#121212] border border-[#242728] text-[#9c9c9d] rounded">
    ⌘K
  </kbd>
</div>
```

### B. Kartu Server / Host Grid (Raycast Card)
Kartu dengan sudut `rounded-lg` (8-10px), hairline border, dan hover feedback halus:
```tsx
<div className={cn(
  "p-3.5 rounded-lg bg-[#0d0d0d] border border-[#242728] hover:border-white/20 transition-all cursor-pointer relative group",
  isSelected && "border-[#57c1ff] shadow-[0_0_12px_rgba(87,193,255,0.15)]"
)}>
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-[#59d499] shadow-[0_0_6px_#59d499]" />
      <span className="font-semibold text-xs text-[#f4f4f6] tracking-tight">{profile.name}</span>
    </div>
    <span className="px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase rounded bg-[#ff6161]/10 text-[#ff6161] border border-[#ff6161]/20">
      PROD
    </span>
  </div>
  <p className="text-[11px] text-[#9c9c9d] font-mono truncate">{profile.host}:{profile.port}</p>
</div>
```

### C. Keycap Shortcut `<kbd>`
Gunakan styling keycap Raycast di samping aksi tombol atau menu item:
```tsx
<kbd className="inline-flex items-center justify-center h-4.5 min-w-4 px-1 text-[10px] font-mono font-medium bg-[#121212] border border-[#242728] text-[#cdcdcd] rounded">
  {shortcut}
</kbd>
```

### D. Tombol Aksi Primer & Sekunder
Hierarki kontras tinggi:
```tsx
{/* Tombol Primer (White Pill / Rounded Rectangle) */}
<button className="h-8 px-3.5 text-xs font-semibold bg-white text-black hover:bg-[#e8e8e8] rounded-md transition-all shadow-sm active:scale-95">
  Connect
</button>

{/* Tombol Sekunder (Ghost Hairline) */}
<button className="h-8 px-3.5 text-xs font-medium text-[#f4f4f6] bg-transparent border border-[#242728] hover:bg-[#101111] hover:border-white/20 rounded-md transition-all">
  Test Diagnostics
</button>
```

---

## 4. Checklist Eksekusi AI Agent (Pre-Commit Validation)

Sebelum menyatakan tugas UI selesai, AI Agent **WAJIB MEMERIKSA**:
1. [ ] Apakah warna latar belakang mengikuti tangga obsidian (`#07080a` → `#0d0d0d` → `#101111`)?
2. [ ] Apakah seluruh border komponen menggunakan ketebalan presisi 1px (`#242728` atau `border-white/10`)?
3. [ ] Apakah tombol aksi utama memiliki kontras tertinggi (`bg-white text-black`)?
4. [ ] Apakah pintasan keyboard ditampilkan dengan keycap `<kbd>` bergaya Raycast?
5. [ ] Apakah badge lingkungan (PROD, STAGING, DEV) menggunakan opacity lembut (`/10` bg + `/20` border) dan tidak mendominasi layar?
6. [ ] Apakah tipografi menggunakan font sans yang bersih dengan letter-spacing proporsional?
