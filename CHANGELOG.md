# Changelog

Semua perubahan pada proyek xphpMyAdmin didokumentasikan di berkas ini.

## [Penyimpanan Profil - Brief 02] - 2026-10-22

### Lapisan Database & Repositori Profil (Profile Storage & Repository)
- Menambahkan kelas `PhpMyAdmin\Local\ProfileDatabase` untuk mengelola koneksi SQLite privat (`data_dir/profiles.sqlite`), penegakan `PRAGMA foreign_keys=ON`, `synchronous=FULL`, migrasi schema versi 1 terisolasi (`profiles`, `profile_imports`), serta dukungan transaksi bertingkat berbasis savepoint.
- Menambahkan kelas `PhpMyAdmin\Local\ProfileInput` untuk validasi dan normalisasi input metadata profil (nama, host loopback, port TCP, username, database default, environment tag, dan konfigurasi TLS).
- Menambahkan kelas `PhpMyAdmin\Local\ProfileRepository` yang menyediakan kontrak operasi CRUD profil, pelacakan revisi koneksi, dan indexing pencarian/penggunaan terakhir.
- Menambahkan kelas `PhpMyAdmin\Local\StorageException` untuk enkapsulasi kegagalan database yang aman tanpa mengekspos query SQL, parameter, atau path internal.
- Menambahkan helper `Foundation::privateFile()` untuk verifikasi keamanan permission berkas privat.

### Impor Profil Warisan & Inisialisasi CLI (Legacy Profile Importer & CLI Init)
- Menambahkan kelas `PhpMyAdmin\Local\LegacyProfileImporter` untuk mengimpor konfigurasi server lokal dari `$cfg['Servers']` lama secara idempoten tanpa menyalin atau menyimpan plaintext password.
- Menambahkan skrip CLI `scripts/local-profiles-init.php` untuk menjalankan inisialisasi schema database profil dan impor awal konfigurasi secara terkontrol dari terminal.

### Pengujian Otomatis Profil (Automated Testing)
- Menambahkan rangkaian uji CLI `test/local/profiles.php` yang memverifikasi migrasi schema SQLite, transaksi/savepoint rollback, pembatasan permission berkas (0600), validasi metadata masukan, operasi CRUD repositori, serta keandalan impor konfigurasi warisan tanpa bocoran password.

### Dokumentasi & Pelaporan Profil (Documentation)
- Memperbarui `README` dengan dokumentasi inisialisasi metadata profil dan panduan pengujian.
- Memperbarui status implementasi pada `doc/briefs/2026-10-22-02-penyimpanan-profil-dan-impor-awal.md` menjadi selesai diverifikasi.
- Menambahkan dokumen teknis komprehensif `doc/penyimpanan-profil.md` yang merinci inisialisasi, schema/transaksi SQLite, kontrak layanan internal, aturan impor idempoten, penanganan error dan sanitasi, serta panduan verifikasi dan pemulihan.

## [Fondasi Lokal - Brief 01] - 2026-10-22

### Keamanan & Akses Jaringan (Local Access Guard)
- Menambahkan kelas `PhpMyAdmin\Local\Access` untuk membatasi akses HTTP hanya dari loopback IPv4 (`127.0.0.0/8`) dan IPv6 (`::1`).
- Menolak semua permintaan dengan header forwarded (`Forwarded`, `X-Forwarded-*`, `X-Real-IP`) untuk mencegah spoofing IP asal di belakang reverse proxy/FastCGI.
- Memasang guard `libraries/local-access.php` pada seluruh entry point web:
  - `index.php`
  - `url.php`
  - `show_config_errors.php`
  - `js/messages.php`
  - `setup/config.php`, `setup/index.php`, `setup/validate.php`
  - Skrip contoh: `examples/config.manyhosts.inc.php`, `examples/openid.php`, `examples/signon-script.php`, `examples/signon.php`

### Fondasi Runtime & Penyimpanan Privat (Runtime & Private Storage)
- Menambahkan kelas `PhpMyAdmin\Local\Foundation` untuk verifikasi dependensi native runtime (`PDO SQLite`, `ext-sodium`), proteksi manipulasi path direktori privat di luar web root, dan validasi token CSRF mutasi profil.
- Menyediakan skrip CLI `scripts/local-bootstrap.php` untuk inisialisasi direktori penyimpanan privat aman (`~/Library/Application Support/xphpmyadmin/`) dengan permission ketat (0700/0600) dan konfigurasi awal `local.json`.
- Menyediakan endpoint diagnostik `local-runtime.php` (CLI dan web GET) untuk memverifikasi kesiapan runtime PHP dan izin akses penyimpanan privat.

### Pengujian Otomatis Fondasi (Automated Testing)
- Menambahkan skrip CLI `test/local/foundation.php` untuk verifikasi unit dan fungsional kelas `Access`, validasi konfigurasi dan runtime `Foundation`, serta pengujian penolakan CSRF dan izin file direktori privat.
- Menambahkan skrip integrasi HTTP `test/local/check_http.py` untuk menguji penolakan akses eksternal, pemblokiran header forwarded di seluruh entry point web di bawah server FPM/Herd, penolakan method selain GET, dan pencegahan path traversal ke direktori privat menggunakan file canary.

### Dokumentasi & Pelaporan Fondasi (Documentation)
- Memperbarui `README` dengan instruksi pembatasan loopback, bootstrap privat, serta petunjuk menjalankan diagnostik CLI dan web.
- Memperbarui status implementasi pada `doc/briefs/2026-10-22-01-fondasi-runtime-dan-akses-lokal.md` menjadi selesai terverifikasi.
- Menambahkan dokumen arsitektur dan operasional lengkap `doc/runtime-dan-akses-lokal.md` yang mencakup peta integrasi phpMyAdmin, konfigurasi runtime & penyimpanan privat, pengikatan listener Herd, baseline backup tarball, dan prosedur pemulihan.
