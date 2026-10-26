# 03 — Sistem Desain UI Termius Midnight Navy & Integrasi shadcn/ui

Dokumen ini mendefinisikan secara menyeluruh sistem desain visual antarmuka (*UI Design System*) **xphpMyAdmin Desktop**. Desain ini mengadopsi estetika premium **Termius Desktop Client** dengan tema gelap berlapis (*layered deep dark midnight navy*), tipografi modern, serta integrasi 62+ komponen resmi **shadcn/ui**.

---

## 1. Filosofi & Karakter Desain

Desain xphpMyAdmin Desktop berorientasi pada kepuasan visual dan efisiensi kerja administrator database:
1. **Premium Dark Navy (Bukan Hitam Polos)**: Menghindari warna hitam pekat `#000000` atau abu-abu standar Bootstrap. Menggunakan gradasi biru laut dalam (*deep navy*) yang memberikan kedalaman (*depth*) dan kenyamanan mata dalam penggunaan jangka panjang.
2. **Pembedaan Lingkungan yang Tegas**: Server bertanda **Production** mendapat indikator visual yang menonjol (badge merah menyala, garis tepi aksen amber/merah halus) untuk mencegah kecelakaan eksekusi query berbahaya.
3. **Penyatuan Pengelolaan & Inspeksi (No Annoying Popups)**: Menghilangkan modal pop-up bertumpuk. Pengeditan konfigurasi dilakukan langsung pada panel **Host Details Inspector** di sebelah kanan layar dengan dukungan *auto-save* atau tombol aksi terintegrasi.
4. **Omni-Search Cepat**: Menyediakan bilah pencarian universal di bagian header atas untuk menemukan host atau langsung mengetik format `user@hostname:port` dan menekan `Enter` untuk menghubungkan.

---

## 2. Token Visual & Palet Warna CSS

Seluruh variabel warna terdefinisi dalam token CSS baku:

| Token / Variabel | Kode HEX / RGBA | Peruntukan Elemen |
| :--- | :--- | :--- |
| `--bg-canvas` | `#0a0d18` / `#0b0e14` | Latar belakang kanvas utama aplikasi |
| `--bg-surface-elevated` | `#0e1220` | Latar belakang sidebar kiri & header atas |
| `--card-base` | `#161c30` | Latar kartu host server dan grup folder |
| `--card-border` | `#232c4a` | Garis tepi (*border*) standar kartu server |
| `--card-hover` | `#1c243e` | Latar kartu saat kursor melintas (*hover state*) |
| `--accent-termius` | `#2979ff` / `#3b82f6` | Aksen biru Termius, tombol aksi utama (*Connect*) |
| `--accent-glow` | `rgba(41, 121, 255, 0.45)` | Efek pendaran bersinar (*glow outline*) pada kartu terpilih |
| `--text-title` | `#ffffff` / `#e2e8f0` | Teks judul kartu, label aktif, dan header utama |
| `--text-sub` | `#8c9cb6` / `#94a3b8` | Teks sekunder (username, host/port, deskripsi) |
| `--text-faint` | `#586885` | Placeholder input teks, ikon non-aktif, info footer |
| `--badge-production` | `#ef4444` / `#f87171` | Tag & border peringatan server Production |
| `--badge-staging` | `#f59e0b` / `#fbbf24` | Tag server Staging |
| `--badge-local` | `#10b981` / `#34d399` | Tag server Localhost / Docker |
| `--badge-other` | `#64748b` | Tag server pengembangan umum (*Other*) |
| `--distro-mysql` | `#00758f` / `#f29111` | Lencana ikon MySQL resmi |
| `--distro-mariadb` | `#c0765a` / `#003545` | Lencana ikon MariaDB resmi |

---

## 3. Hierarki Layout & Anatomi 3-Kolom

Tata letak utama menggunakan pembagian responsif 3-kolom yang efisien:

```
+--------------------------------------------------------------------------------------------------+
| [≡] [Personal ▾] [⚡ Local Docker ×] [🚀 Prod Cluster ×] [+] | [🔍 Cari host atau user@host...] | [— □ ✕] |
+--------------------------------------------------------------------------------------------------+
| [Hosts]         |  TOOLBAR: [+ Koneksi Baru ▾] [⚡ Quick Connect]     [Filter: Semua ▾] [⊞ ≡]   | HOST DETAILS INSPECTOR    |
| [Keychain]      |-------------------------------------------------------------------------------| Target: [🐧 db.prod.net]  |
| [SSH Tunnels]   |  FAVORIT                                                                      |                           |
| [SQL Snippets]  |  [★ 🐬 Local Dev (Docker)]  [★ 🐬 Staging API Server]                         | Umum:                     |
| [Backup & Logs] |-------------------------------------------------------------------------------|  Nama: Production Cluster |
|                 |  SEMUA KONEKSI                                                                |  Grup: Backend Core       |
|                 |  [🔴 Production Cluster*]  [🟢 QA Tester DB]  [⚪ Analytics Slave]             |  Lingkungan: [Production ▾]|
|                 |  (Active glowing blue outline)                                                |                           |
|                 |                                                                               | Metode: [ Direct | SSH ]  |
|                 |                                                                               | Host: [ db.prod.net   ]   |
|                 |                                                                               | Port: [ 3306          ]   |
|                 |                                                                               | Username: [ admin_app ]   |
|                 |                                                                               | Database: [ ecommerce ]   |
|                 |                                                                               |                           |
|                 |                                                                               | Keamanan:                 |
|                 |                                                                               |  [x] Verifikasi TLS Ketat |
|                 |                                                                               |  Password: [••••••••] 👁  |
|                 |                                                                               |                           |
| [⚙ Pengaturan]  |                                                                               | [Tes Koneksi] [ SIMPAN ]  |
|                 |                                                                               | [    HUBUNGKAN (Blue)   ] |
+--------------------------------------------------------------------------------------------------+
```

### A. Bilah Aplikasi Atas (`Top Application Header`)
1. **Hamburger Toggle**: Mengalihkan lebar sidebar kiri antara mode diperluas (*170px*) dan mode diciutkan (*52px*).
2. **Scope Selector**: Menampilkan vault profil yang sedang aktif (`Personal` atau `Team`).
3. **Dynamic Dynamic Tabs Bar**:
   - Setiap koneksi database aktif memunculkan tab dinamis dengan ikon mesin database (MySQL/MariaDB), nama host, dan tombol tutup (`×`).
   - Tombol tambah cepat `+` untuk membuka tab pencarian koneksi baru.
4. **Omni-Search Bar**:
   - Input terpusat dengan shortcut `Ctrl+K` / `Cmd+K`.
   - Mengetik nama, alamat IP, atau username langsung menyaring kartu server di grid utama.
   - Mengetik ekspresi langsung seperti `root@192.168.1.10:3306` dan menekan `Enter` langsung memicu pembukaan form koneksi cepat (*Quick Connect*).
5. **Window Controls (Platform Desktop)**:
   - Minimize, Maximize/Restore, dan Close yang terintegrasi rapi pada baris atas.

### B. Sidebar Navigasi Kiri (`Left Navigation Sidebar`)
- Lebar: **170px** (normal) atau **52px** (collapsed).
- Transisi mulus: `transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- Navigasi item:
  - **Hosts (Koneksi)**: Ikon server ganda bertingkat.
  - **Keychain (Kredensial)**: Ikon kunci diagonal untuk melihat daftar sertifikat TLS dan status Master Key.
  - **SSH Tunnels**: Ikon panah belok dengan simpul port untuk memantau tunnel aktif dan status lease.
  - **SQL Snippets**: Ikon kurung kurawal `{ }` untuk menyimpan template query query harian.
  - **Backup & Logs**: Ikon arsip dan jam audit untuk menjalankan snapshot SQLite.
  - **Settings (Pengaturan)**: Ikon roda gigi di dasar sidebar.

### C. Grid Kartu Server (`Main Connections Grid`)
- Mengorganisir kartu koneksi ke dalam kategori: **Favorit**, **Grup/Folder**, dan **Daftar Semua Server**.
- Kartu server menyajikan:
  - Lencana ikon mesin: SVG resmi MySQL lumba-lumba (`#00758f`) atau MariaDB anjing laut (`#c0765a`).
  - Lencana status lingkungan: `Local` (emerald), `Staging` (amber), `Production` (crimson dengan efek glowing red border), `Other` (slate).
  - Judul profil tebal berwarna putih (`text-white font-semibold`).
  - Subtitle detail: `host:port • user` dalam warna abu-abu lembut (`text-slate-400`).
  - Indikator waktu berhasil digunakan terakhir (*relative timestamp*, misal *"2 jam yang lalu"*).
  - Bintang favorit interaktif untuk toggle cepat.
  - **Active State (`.active`)**: Mendapat seleksi outline biru menyala:
    ```css
    box-shadow: 0 0 0 2px #2979ff, 0 0 16px rgba(41, 121, 255, 0.45);
    ```

### D. Panel Detail Host Kanan (`Host Details Inspector Panel`)
Panel kanan terbuka di sisi kanan layar (bisa dalam bentuk *docked inspector* atau *slide-over drawer*):
1. **Bagian Identitas**:
   - Nama koneksi (wajib).
   - Tag lingkungan (`Local`, `Staging`, `Production`, `Other`).
   - Penanda favorit.
2. **Pilihan Metode Transport**:
   - Tab switcher: `Direct / VPN` vs `SSH Tunnel`.
3. **Parameter Database**:
   - Host target, Port (default 3306), Username, dan Database Awal (opsional).
4. **Parameter SSH Tunnel (Bila Metode SSH Dipilih)**:
   - Host SSH, Port SSH (default 22), Username SSH, Path Private Key lokal.
   - Tombol **"Periksa Host Key"** untuk mengambil sidik jari server SSH dan tombol persetujuan verifikasi.
5. **Konfigurasi Keamanan TLS**:
   - Checkbox wajib: *"Gunakan TLS dengan verifikasi sertifikat"*.
   - File picker untuk file CA lokal, sertifikat klien, dan kunci privat klien.
6. **Siklus Penyimpanan Password**:
   - Dropdown opsi:
     - `Jangan simpan password` (hanya digunakan untuk sesi sementara).
     - `Simpan / ganti password terenkripsi` (disimpan terenkripsi dengan Master Key).
     - `Hapus password tersimpan` (menghapus password persisten dari SQLite).
   - Input field password dengan tombol toggle mata (`👁`) untuk mengintip.
7. **Bar Diagnostik Visual 4-Tahap**:
   - Menampilkan visual pipeline pengujian koneksi saat tombol "Tes Koneksi" ditekan.
8. **Tombol Aksi**:
   - `Tes Koneksi`: Menguji parameter tanpa menyimpan perubahan.
   - `Simpan`: Menyimpan perubahan ke SQLite secara offline-first.
   - `Hubungkan`: Memvalidasi jaringan, memperbarui timestamp `last_used_at`, dan membuka sesi administrasi database.

---

## 4. Penggunaan 62+ Komponen shadcn/ui

Aplikasi memanfaatkan pustaka komponen shadcn/ui resmi di `@/components/ui/` secara penuh:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/utils/tailwind";
```

### Aturan Baku untuk AI Agent & Pengembang:
- ❌ **Dilarang keras** membuat tombol mentah `<button className="...">` jika `<Button variant="outline" | "default" | "ghost">` sudah tersedia.
- ❌ **Dilarang** membiarkan warna komponen kembali ke default putih terang (`bg-white`). Seluruh modal dan popover wajib memiliki styling latar `#10131a` atau `#161c30` dengan border `#232c4a`.
- ✅ **Gunakan Sonner Toast** untuk umpan balik instan:
  ```tsx
  toast.success("Profil koneksi berhasil disimpan", {
    description: "Database: ecommerce_prod pada port 3306"
  });
  ```
