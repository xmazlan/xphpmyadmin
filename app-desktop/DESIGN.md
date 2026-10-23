---
version: 1.0.0
name: raycast-developer-tools-design
description: |
  Spesifikasi Sistem Desain Resmi untuk xphpMyAdmin Desktop, diadaptasi langsung dari
  arsitektur Raycast Developer Tools (VoltAgent awesome-design-md). Mengusung canvas
  ultra-dark (#07080a / #0a0d18), hairline 1px borders (#242728), command-palette navigation,
  Inter ss03 typography, tight 6-10px radii, keycap shortcuts, serta high-contrast white pill CTA.
colors:
  primary: "#ffffff"
  primary-pressed: "#e8e8e8"
  on-primary: "#000000"
  ink: "#f4f4f6"
  body: "#cdcdcd"
  charcoal: "#d3d3d4"
  mute: "#9c9c9d"
  ash: "#6a6b6c"
  stone: "#434345"
  on-dark: "#ffffff"
  on-dark-mute: "rgba(255, 255, 255, 0.72)"
  canvas: "#07080a"
  canvas-subtle: "#0a0d18"
  surface: "#0d0d0d"
  surface-elevated: "#101111"
  surface-card: "#121212"
  button-fg: "#18191a"
  hairline: "#242728"
  hairline-soft: "rgba(255, 255, 255, 0.08)"
  hairline-strong: "rgba(255, 255, 255, 0.16)"
  accent-blue: "#57c1ff"
  accent-blue-soft: "rgba(87, 193, 255, 0.15)"
  accent-red: "#ff6161"
  accent-red-soft: "rgba(255, 97, 97, 0.15)"
  accent-green: "#59d499"
  accent-green-soft: "rgba(89, 212, 153, 0.15)"
  accent-yellow: "#ffc533"
  accent-yellow-soft: "rgba(255, 197, 51, 0.15)"
  accent-purple: "#a78bfa"
  accent-purple-soft: "rgba(167, 139, 250, 0.15)"
  key-bg-start: "#141517"
  key-bg-end: "#0d0e10"

typography:
  display-xl:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
    fontFeature: '"calt", "kern", "liga", "ss03"'
  heading-lg:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
    fontFeature: '"calt", "kern", "liga", "ss03"'
  heading-md:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.005em
    fontFeature: '"calt", "kern", "liga", "ss03"'
  body-md:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
    fontFeature: '"calt", "kern", "liga", "ss03"'
  body-strong:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
    fontFeature: '"calt", "kern", "liga", "ss03"'
  body-sm:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
    fontFeature: '"calt", "kern", "liga", "ss03"'
  caption:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em
    fontFeature: '"calt", "kern", "liga", "ss03"'
  code-mono:
    fontFamily: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 24px

components:
  command-palette-bar:
    backgroundColor: "{colors.surface-elevated}"
    borderColor: "{colors.hairline}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
    padding: 8px 14px
    height: 40px
  server-card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.hairline}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
    padding: 16px
    hoverBorderColor: "{colors.hairline-strong}"
    activeBorderColor: "{colors.accent-blue}"
  inspector-panel:
    backgroundColor: "{colors.surface-elevated}"
    borderColor: "{colors.hairline}"
    borderWidth: 1px
    rounded: "{rounded.none}"
    padding: 16px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    fontWeight: 600
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 32px
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    borderWidth: 1px
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 32px
  keycap:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.hairline}"
    borderWidth: 1px
    textColor: "{colors.body}"
    rounded: "{rounded.xs}"
    fontSize: 10px
    padding: 1px 5px
    height: 18px
---

# Raycast Developer Tools Design System (`DESIGN.md`)

Dokumen ini adalah cetak biru antarmuka pengguna (*design system*) resmi untuk **xphpMyAdmin Desktop**, yang mengadopsi standar desain **Raycast** dari repositori [VoltAgent awesome-design-md](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/raycast).

---

## 1. Filosofi Inti: "The Interface is a Precision Tool"

1. **Deep Obsidian Canvas**: Latar belakang tidak pernah menggunakan abu-abu terang atau hitam murni 100% tanpa hierarki. Menggunakan tingkatan obsidian `#07080a` (canvas) → `#0d0d0d` (surface) → `#101111` (elevated) → `#121212` (card).
2. **Hairline Precision**: Seluruh pembatas (*borders*) menggunakan garis setipis 1px dengan kontras rendah `#242728` (`hairline`) atau `rgba(255, 255, 255, 0.08)` agar batas antar komponen terdefinisi rapi tanpa mengalihkan fokus dari data.
3. **Keyboard & Command-Palette First**: Setiap aksi penting dilengkapi pintasan keyboard yang ditampilkan melalui elemen `<Kbd>` (*keycap*) khas Raycast (`⌘K`, `Enter`, `Esc`, `Tab`).
4. **High-Contrast Single Primary CTA**: Tombol aksi utama menggunakan kontras tertinggi (latar belakang putih `#ffffff` dengan teks hitam `#000000`), sementara aksi sekunder berupa *ghost/outline* tombol semi-transparan.
5. **Purposeful Accents**: Warna aksen hanya digunakan secara fungsional untuk status koneksi database:
   - **Green** (`#59d499`): Online, connected, active SSH tunnel.
   - **Yellow** (`#ffc533`): Standby, reconnecting, latency warning.
   - **Red** (`#ff6161`): Production environment badge, connection error, SSL failure.
   - **Blue** (`#57c1ff`): Standard MySQL connection, info notice.
   - **Purple** (`#a78bfa`): Staging database, custom query execution.

---

## 2. Struktur Hierarki Komponen UI

### A. Omni-Search & Command Bar
- Menggunakan input field berbentuk pill/rounded rectangle dengan tinggi 38-42px.
- Ikon pencarian Lucide `Search` di sisi kiri (`text-stone-400`).
- Keycap shortcut `⌘K` / `Ctrl+K` di sisi kanan dalam bingkai `keycap`.

### B. Kartu Host / Database Server (Raycast Style)
- Background: `#0d0d0d` / `#161c30` dengan border `1px solid #242728`.
- Sudut: `rounded-lg` (8px - 10px).
- Status dot: Bulatan 8px dengan pinging radar animation saat tersambung.
- Tag lingkungan: Badge kecil bersudut `rounded-xs` (4px) dengan latar semi-transparan (`bg-red-500/10 text-red-400 border border-red-500/20` untuk `PROD`).
- Aksi cepat saat hover: Tombol bintang favorit, tombol edit, dan tombol connect cepat.

### C. Inspector Host Details (Right Drawer / Panel)
- Background: `#101111` / `#0e1220` dengan hairline separator di sebelah kiri.
- Header dengan tab navigasi: **General**, **SSH Tunnel**, **SSL/TLS**, **Advanced**, **Diagnostics**.
- Field input bertingkat dengan label monospaced / subtitle muted.
- 4-Stage visual diagnostics bar (Socket -> Handshake -> Auth -> Schema).

---

## 3. Aturan Anti-Pattern (Strictly Forbidden)
- ❌ **Dilarang** menggunakan warna abu-abu generik bawaan browser (`#808080`, `#ccc`).
- ❌ **Dilarang** membuat border tebal (>1px) kecuali outline fokus keyboard (`focus:ring-1 focus:ring-blue-500`).
- ❌ **Dilarang** menggunakan sudut membulat berlebihan pada kartu data (maksimal 10px / `rounded-lg`). Sudut `rounded-full` hanya untuk pill tab dan avatar.
- ❌ **Dilarang** menampilkan pesan error atau notifikasi tanpa kode status atau diagnosis yang jelas.
