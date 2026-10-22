# Changelog

Semua perubahan pada proyek xphpMyAdmin didokumentasikan di berkas ini.

## [Layanan Tes Koneksi & TLS - Brief 04] - 2026-10-22

### Konektor Bersama & Layanan Tes Koneksi (MySQL/MariaDB Connector & Tester)
- Menambahkan kelas `PhpMyAdmin\Local\MySqlConnector` sebagai transport bersama untuk tes koneksi dan Connect (Brief 05) dengan verifikasi ketat sertifikat TLS (`MYSQLI_OPT_SSL_VERIFY_SERVER_CERT=1`, tanpa retry downgrade non-TLS), batasan connect timeout 10 detik, dan isolasi read timeout.
- Menambahkan kelas `PhpMyAdmin\Local\VerifiedConnection` yang mengenkapsulasi koneksi aktif terverifikasi dengan ringkasan status non-rahasia dan penutupan socket secara idempoten.
- Menambahkan exception `PhpMyAdmin\Local\ConnectionFailure` untuk kategorisasi kegagalan terstruktur (`input`, `dns`, `network`, `timeout`, `authentication`, `database`, `tls`, `storage`) dengan pesan error yang aman tanpa membocorkan kredensial atau stack trace.
- Menambahkan kelas `PhpMyAdmin\Local\ConnectionTester` untuk pengujian draft koneksi secara terisolasi tanpa efek samping penyimpanan ke profil SQLite.
- Memperbarui `PhpMyAdmin\Local\ProfileDatabase` dengan metode `openConfigured(bool $initialize = true)` dan `openExistingConfigured()` untuk mencegah pembuatan database atau eksekusi migrasi tak terduga saat pembacaan kredensial tes koneksi.

### Adaptor Aksi & Endpoint Web Pengujian Koneksi (Connection Test Action & Web Endpoint)
- Menambahkan kelas `PhpMyAdmin\Local\ConnectionTestAction` untuk menangani payload POST tes koneksi, mendukung verifikasi kredensial dari tiga sumber (`input`, `saved`, `session`) dengan validasi kesesuaian revisi dan target koneksi.
- Menambahkan endpoint web POST `local-connection-test.php` yang diproteksi oleh guard akses loopback, pemeriksaan flag `profiles_enabled`, penolakan method non-POST, penolakan query string dan payload non-JSON, inisialisasi sesi phpMyAdmin minimal, serta penegakan validasi token CSRF.

### Pengujian Otomatis Koneksi & TLS (Automated Testing)
- Menambahkan rangkaian pengujian CLI komprehensif `test/local/connections.php` untuk memvalidasi seluruh kategori error `ConnectionFailure`, verifikasi sertifikat CA/klien, pemisahan read timeout, penanganan kredensial draft/tersimpan/sesi, dan penutupan koneksi.
- Menambahkan orkestrator pengujian `test/local/check_connections.py` yang menjalankan server MySQL dan MariaDB disposable dengan konfigurasi TLS kustom, memverifikasi koneksi sukses, kegagalan autentikasi, sertifikat tidak valid, dan pemblokiran akses forwarded pada endpoint web.
- Memperbarui `test/local/check_http.py` untuk menguji proteksi loopback dan penolakan header forwarded pada endpoint baru `local-connection-test.php`.

### Dokumentasi & Pelaporan Tes Koneksi & TLS (Documentation)
- Memperbarui `README` dengan instruksi pengujian koneksi, verifikasi TLS, dan perintah eksekusi tes koneksi.
- Memperbarui status implementasi pada `doc/briefs/2026-10-22-04-layanan-tes-koneksi-dan-tls.md` menjadi selesai diverifikasi.
- Menambahkan dokumen teknis lengkap `doc/tes-koneksi-dan-tls.md` yang merinci kontrak konektor bersama, kebijakan timeout, verifikasi TLS ketat, resolusi sumber kredensial, proteksi endpoint web, serta strategi pemulihan.

## [Penyimpanan Rahasia & Password - Brief 03] - 2026-10-22

### Manajemen Kunci Master & Enkripsi AEAD (Master Key & AEAD Cipher)
- Penegakan syarat runtime PHP 8.2+ untuk redaksi otomatis argumen sensitif pada stack trace, SQLite 3.24+ untuk operasi atomik, serta ekstensi native Sodium XChaCha20-Poly1305 IETF AEAD pada `PhpMyAdmin\Local\Foundation`.
- Menambahkan kelas `PhpMyAdmin\Local\SecretCipher` untuk enkripsi dan dekripsi AEAD biner dengan nonce 24-byte acak, authentication tag 16-byte, pengikatan ID profil pada associated data, serta fingerprint kunci SHA-256.
- Menambahkan kelas `PhpMyAdmin\Local\SecretKeyStore` untuk inisialisasi (`init`) dan pemulihan (`restore`) master key privat (`key_dir/master.key`, 0600) secara atomik dengan registrasi fingerprint singleton pada SQLite.
- Menambahkan exception `PhpMyAdmin\Local\SecretUnavailable` untuk kegagalan kriptografi/kunci yang aman tanpa eksposur detail error driver atau path berkas.
- Menambahkan utilitas CLI `scripts/local-key.php` untuk inisialisasi administratif master key dan pemulihan backup kunci secara eksplisit.

### Siklus Hidup Password Profil & Rahasia Sesi (Password Lifecycle & Session Secrets)
- Migrasi schema SQLite ke versi 2 (`secret_key_registry`, `profile_secrets` dengan referensi cascade) dan pengaktifan `PRAGMA secure_delete = ON` pada `ProfileDatabase`.
- Menambahkan kelas `PhpMyAdmin\Local\ProfilePasswords` untuk mengelola operasi password profil (`keep`, `replace`, `remove`) secara terenkripsi, penyimpanan atomic envelope, serta penghapusan aman.
- Menambahkan kelas `PhpMyAdmin\Local\SessionPasswords` untuk manajemen password sementara berbasis server-side PHP Session terisolasi dengan batas TTL, penegakan identitas tab, dan enkripsi sesi.
- Memperbarui `ProfileRepository` dengan proyeksi indikator `has_saved_password` (tanpa membocorkan material rahasia ke respons daftar/detail profil) dan penambahan atribut `#[\SensitiveParameter]`.
- Menerapkan atribut `#[\SensitiveParameter]` pada `ProfileInput` dan `LegacyProfileImporter` untuk mencegah kebocoran password pada logging error PHP.

### Pengujian Otomatis Layanan Rahasia (Automated Testing)
- Menambahkan rangkaian pengujian CLI komprehensif `test/local/passwords.php` untuk menguji roundtrip cipher AEAD, pencegahan tamper associated data, siklus master key (init, idempotency, restore, permission check), operasi keep/replace/remove password, isolasi password sesi dan kedaluwarsa TTL.
- Memperbarui `test/local/profiles.php` agar selaras dengan migrasi schema versi 2 SQLite dan validasi integritas rollback.
- Memperbarui `test/local/check_http.py` dengan assertion proteksi HTTP 404 terhadap akses web langsung ke berkas `scripts/local-key.php` dan `test/local/passwords.php`.

### Dokumentasi & Pelaporan Siklus Password (Documentation)
- Memperbarui `README` dengan instruksi inisialisasi master key dan ketentuan runtime PHP 8.2+ serta Sodium native.
- Memperbarui status implementasi pada `doc/briefs/2026-10-22-03-penyimpanan-rahasia-dan-siklus-password.md` menjadi selesai diverifikasi.
- Memperbarui `doc/penyimpanan-profil.md` dengan catatan peningkatan schema versi 2.
- Menambahkan dokumen teknis lengkap `doc/rahasia-dan-siklus-password.md` yang merinci schema v2, spesifikasi enkripsi Sodium AEAD, alur kerja keep/replace/remove, manajemen password sesi, dan prosedur backup/restore master key.

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
