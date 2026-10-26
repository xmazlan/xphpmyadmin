# xphpMyAdmin Desktop — Dokumentasi Arsitektur, Sistem Desain, & Cetak Biru Implementasi

Selamat datang di repositori dokumentasi resmi untuk versi desktop dari **xphpMyAdmin Connection Manager** (`app-desktop`).

Dokumentasi ini merangkum seluruh hasil pembelajaran mendalam terhadap sistem basis **xphpMyAdmin** (PHP 5.2.3 kustom v1 & v2), membedah arsitektur keamanannya, dan menerjemahkannya secara komprehensif ke dalam arsitektur aplikasi desktop modern berbasis **Electron 44 + React 19 + Vite 8 + Tailwind CSS v4 + shadcn/ui (Radix Nova)** dengan estetika **Termius Dark (Midnight Navy)**.

---

## 📚 Daftar Isi Dokumentasi

| Berkas | Judul & Topik Utama | Deskripsi Singkat |
| :--- | :--- | :--- |
| [`01-STUDI-ANALISIS-XPHPMYADMIN.md`](./01-STUDI-ANALISIS-XPHPMYADMIN.md) | **Studi Analisis Lengkap xphpMyAdmin** | Analisis mendalam arsitektur PHP, PRD v1/v2, SQLite v3, enkripsi Sodium AEAD, isolasi tab, dan OpenSSH master tunnel. |
| [`02-CETAK-BIRU-ARSITEKTUR-DESKTOP.md`](./02-CETAK-BIRU-ARSITEKTUR-DESKTOP.md) | **Cetak Biru Arsitektur Desktop Electron** | Pembagian proses Electron (Main, Preload, Renderer), IPC/oRPC type-safe, subsistem native Node.js, dan security boundary. |
| [`03-SISTEM-DESAIN-TERMIUS-MIDNIGHT-NAVY.md`](./03-SISTEM-DESAIN-TERMIUS-MIDNIGHT-NAVY.md) | **Sistem Desain UI Termius Midnight Navy** | Token visual CSS, hierarki layout 3-kolom, omni-search, dynamic tabs, cards grid, right inspector panel, dan 62+ komponen shadcn/ui. |
| [`04-SKEMA-SQLITE-DAN-REPOSITORY-PROFIL.md`](./04-SKEMA-SQLITE-DAN-REPOSITORY-PROFIL.md) | **Skema SQLite & Repository Profil** | Struktur tabel SQLite v3, migrasi transaksional, CRUD repository, pencarian literal, dan aturan `connection_revision`. |
| [`05-SISTEM-KRIPTOGRAFI-DAN-SIKLUS-PASSWORD.md`](./05-SISTEM-KRIPTOGRAFI-DAN-SIKLUS-PASSWORD.md) | **Sistem Kriptografi & Siklus Rahasia** | Enkripsi authenticated AEAD (XChaCha20-Poly1305 / AES-256-GCM), master key 0600 terpisah, siklus `keep/replace/remove`, dan password sesi memori. |
| [`06-KONEKTOR-MYSQL-TLS-DAN-DIAGNOSTIK.md`](./06-KONEKTOR-MYSQL-TLS-DAN-DIAGNOSTIK.md) | **Konektor MySQL, TLS, & 4-Stage Diagnostik** | Timeout 10 detik, verifikasi TLS ketat, pemilihan initial DB, dan pipeline diagnostik 4 tahap dengan klasifikasi error presisi. |
| [`07-SSH-TUNNEL-DAN-TRUST-HOST-KEY.md`](./07-SSH-TUNNEL-DAN-TRUST-HOST-KEY.md) | **SSH Tunneling & Verifikasi Host Key** | Manajemen OpenSSH master control socket, pemindaian `ssh-keyscan`, verifikasi fingerprint SHA-256, lease loopback, dan sweeper. |
| [`08-ISOLASI-TAB-DAN-SESI-KONEKSI.md`](./08-ISOLASI-TAB-DAN-SESI-KONEKSI.md) | **Isolasi Tab & Sesi Administrasi** | Token kapabilitas 256-bit, multi-tab database isolation, pencegahan silent target drift, dan konfirmasi query belum disimpan. |
| [`09-BACKUP-RESTORE-DAN-DISASTER-RECOVERY.md`](./09-BACKUP-RESTORE-DAN-DISASTER-RECOVERY.md) | **Backup, Restore, & Disaster Recovery** | Snapshot atomik `VACUUM INTO`, backup kunci terpisah, prosedur restore ke direktori baru, validasi checksum, dan rollback. |
| [`10-PANDUAN-KODE-DAN-IMPLEMENTASI-FITUR.md`](./10-PANDUAN-KODE-DAN-IMPLEMENTASI-FITUR.md) | **Panduan Implementasi Kode (Playbook)** | Resep implementasi TypeScript, definisi skema Zod, IPC handlers, TanStack Router routes, dan komponen UI siap pakai. |

---

## 🎯 Prinsip Inti yang Dipertahankan dari Web ke Desktop

1. **Penyimpanan Terisolasi di Luar Bundle**: Seluruh metadata disimpan di SQLite privat pengguna (`app.getPath('userData')/data/profiles.sqlite`), bukan di dalam ASAR atau direktori aplikasi publik.
2. **Kunci Master Terpisah**: Berkas kunci simetris `master.key` disimpan di direktori privat terpisah (`app.getPath('userData')/keys/master.key`) dengan izin ketat (0600 pada POSIX / ACL privat pada Windows).
3. **Password Tidak Pernah Masuk Form Edit atau Log**: Payload baca profil hanya menyajikan boolean `has_saved_password: true/false`. Form edit selalu mulai dengan input password kosong.
4. **Isolasi Penuh Antar Tab**: Membuka koneksi server B di Tab 2 tidak akan pernah mengubah target query, schema tree, atau navigasi di Tab 1.
5. **Verifikasi TLS Ketat & Aturan SSH+TLS**: TLS mewajibkan verifikasi sertifikat server. Kombinasi `SSH + TLS` diblokir (`tls_tunnel`) secara aman karena batasan SAN hostname matching pada loopback forwarder.
6. **Estetika Premium Termius Dark**: Seluruh antarmuka menggunakan palet warna Midnight Navy (`#0a0d18`, `#0e1220`, `#161c30`, `#2979ff`), tipografi modern Geist/Inter, micro-animation, dan visual hierarchy kelas dunia.
