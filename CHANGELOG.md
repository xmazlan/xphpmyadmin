# Changelog

Semua perubahan pada proyek xphpMyAdmin didokumentasikan di berkas ini.

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
