# Panduan & Konvensi AI Agent — xphpMyAdmin Desktop

> **PERINGATAN WAJIB DIPATUHI (MANDATORY POLICY)**:  
> Seluruh AI Agent yang bekerja pada repositori `app-desktop` **WAJIB MEMATUHI DAN MENGEKSEKUSI** seluruh aturan arsitektur, standar estetika desain, prosedur pencatatan rilis, dan pelaporan kegiatan yang tertera pada berkas ini, [`DESIGN.md`](file:///DESIGN.md), serta direktori [`.agents/skills/`](file:///.agents/skills/).  
> Pelanggaran terhadap standar desain, kelalaian pelaporan kegiatan ke portfolio pada perubahan yang dirasakan pengguna, maupun pelanggaran invarian teknis dilarang keras.

---

## 1. Kepatuhan Skill Wajib (.agents/skills/)

Seluruh AI Agent **WAJIB MENGEKSEKUSI** panduan dari 3 skill inti berikut saat menjalankan tugas:

### 1. `raycast-design` ([`.agents/skills/raycast-design/SKILL.md`](file:///.agents/skills/raycast-design/SKILL.md) & [`DESIGN.md`](file:///DESIGN.md))
- **Kewajiban**: Standar estetika visual desktop developer tools dari [VoltAgent awesome-design-md (Raycast)](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/raycast).
- **Implementasi**: Canvas ultra-dark obsidian (`#07080a` / `#0a0d18`), permukaan bertingkat (`#0d0d0d` → `#101111` → `#121212`), hairline 1px borders (`#242728`), keycap `<kbd>` shortcuts, command-palette omni-search, dan tombol aksi utama kontras tinggi (`bg-white text-black`).
- **Aturan Eksekusi**: Setiap penambahan atau modifikasi komponen antarmuka harus mematuhi palet dan checklist pada skill ini.

### 2. `shadcn-ui` ([`.agents/skills/shadcn-ui/SKILL.md`](file:///.agents/skills/shadcn-ui/SKILL.md))
- **Kewajiban**: Standar arsitektur komponen UI, pustaka 62+ komponen di `@/components/ui/`, integrasi Tailwind CSS v4 + Radix UI, serta penggabungan class menggunakan utilitas `cn()` (`@/utils/tailwind`).
- **Aturan Eksekusi**: Dilarang membuat tombol atau modal unstyled mentah jika komponen resmi shadcn sudah tersedia di `src/components/ui/`.

### 3. `activity-sync` & `release-notes` ([`.agents/skills/activity-sync/SKILL.md`](file:///.agents/skills/activity-sync/SKILL.md))
- **Kewajiban**: Setiap selesai mengerjakan perubahan yang **dirasakan pengguna** (fitur baru, perbaikan bug, perubahan perilaku, rilis, deploy, hapus fitur), AI **WAJIB** mencatat di berkas rilis lalu mengirim satu entri kegiatan ke portfolio (`https://ajoroby.is-a.dev/api/activities`) sebelum menyelesaikan tugas. Refactor internal, format, komentar, dan tes yang tak terlihat pengguna: jangan kirim.
- **Aturan Eksekusi**:
  1. Tulis/perbarui berkas rilis `releases/YYYY-MM-DD-*.json` memakai skill `release-notes` ([`.agents/skills/activity-sync/release-notes/SKILL.md`](file:///.agents/skills/activity-sync/release-notes/SKILL.md)): konsolidasi 1 berkas JSON per hari, dwibahasa (`id` + `en`), bahasa pelayanan publik — bebas istilah teknis/library/framework/celah internal.
  2. Muat skill `activity-sync` dan ikuti alur CRUD di sana: cek proyek (`GET /api/projects?key=`), kirim isi berkas rilis `releases/*.json` apa adanya lewat `POST` (tambah `"project": {"name": "xphpMyAdmin — Pengelola Koneksi Database Remote"}`; API yang memetakan `type`/`date`/`items` otomatis), ubah (`PATCH`), hapus (`DELETE`), lalu verifikasi (`GET` + cek tidak dobel).
  3. Kunci `X-project` proyek ini: dibaca dari berkas `.ACTIVITY_PROJECT_KEYS` di `.agents/skills/activity-sync/.ACTIVITY_PROJECT_KEYS` — JANGAN commit berkas kunci ke git, JANGAN tampilkan ke user kecuali diminta.
  4. Setiap kiriman wajib dwibahasa (`id` + `en`), maksimal 300 karakter judul / 2000 karakter isi, bahasa pelayanan publik (dilarang menyebut library, framework, database, file kode, atau mekanisme internal).
  5. Laporkan ke user: apa yang dikirim (id baris), hasil verifikasi, dan apa pun yang gagal.

---

## 2. Invarian Arsitektur & Aturan Teknis Desktop

1. **Runtime & Modul Native**:
   - Runtime desktop adalah **Electron 44 / Node.js 22**.
   - Driver database menggunakan `mysql2/promise` murni (pure JavaScript) untuk menjamin kompatibilitas cross-platform tanpa memerlukan kompilasi native C++ (`node-gyp`).
   - SSH Tunneling menggunakan pustaka `ssh2` murni.
2. **Kriptografi & Password Lifecycle**:
   - Master Key disimpan secara aman pada OS Keychain / DPAPI (`keytar` / `safeStorage`).
   - Kredensial database dienkripsi menggunakan AES-256-GCM.
   - Siklus password profil koneksi: opsi `keep` (pertahankan rahasia terenkripsi), `replace` (input password baru), dan `remove` (hapus password dari vault).
3. **Validasi & Integritas Data**:
   - Seluruh payload profil, konfigurasi SSH, dan pengaturan SSL/TLS wajib divalidasi menggunakan skema **Zod** (`src/types/connection.ts`) sebelum disimpan ke SQLite lokal.
4. **Isolasi Tab & Diagnostik Visual**:
   - Setiap tab koneksi database memiliki worker pool dan sesi tunnel terisolasi.
   - Diagnostik koneksi dijalankan dalam 4 tahap sekuensial yang terpantau secara visual:
     1. `socket`: TCP Socket Connection
     2. `handshake`: Protocol Handshake
     3. `auth`: Authentication & Permission Check
     4. `schema`: Metadata & Information Schema Discovery

---

## 3. Checklist Pre-Commit untuk AI Agent

Sebelum menyelesaikan tugas atau menjawab pengguna, AI Agent **WAJIB MEMASTIKAN**:
- [x] Antarmuka mematuhi **Raycast Design System** (hairline borders 1px, continuous dark canvas, high-contrast primary CTA).
- [x] Komponen UI memanfaatkan pustaka `@/components/ui/*` melalui `cn()`.
- [x] Validasi data dilakukan dengan skema Zod.
- [x] Tidak ada warning `ERESOLVE` pada dependency npm.
- [x] Seluruh unit test (`npm test`) lolos dengan status 100% hijau.
- [x] **Activity Sync**: Jika terdapat perubahan yang dirasakan pengguna, buat/perbarui berkas rilis harian di `releases/` dan kirimkan entri kegiatan ke portfolio via API.
