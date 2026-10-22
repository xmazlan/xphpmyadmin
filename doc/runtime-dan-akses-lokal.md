# Fondasi runtime dan akses lokal

Implementasi Brief 01, diverifikasi 22 Oktober 2026. Profil belum tersedia dan
`profiles_enabled` tetap `false`. Tidak ada schema SQLite, master key, impor profil,
atau perubahan konfigurasi server MySQL/MariaDB pada tahap ini.

## Peta integrasi

| Area | Kode dan integrasi berikutnya |
| --- | --- |
| Bootstrap | `index.php` → constants/autoload → `Common::run()` → dispatcher. Guard `libraries/local-access.php` berjalan sebelum konfigurasi, sesi, dan database. |
| Routing | `libraries/routes.php`, `libraries/classes/Routing.php`, controller dan container `libraries/services.php`. Tambahkan route profil di sini, bukan menulis ulang `config.inc.php`. |
| Autentikasi | `Common`, `libraries/classes/Plugins/AuthenticationPlugin.php`, plugin `libraries/classes/Plugins/Auth/`. Integrasi profil dan isolasi tab merupakan brief berikutnya. |
| Sesi | `libraries/classes/Session.php`, dipanggil `Common::run()`. Token sesi bernama ` PMA_token ` dipakai kembali. |
| CSRF | `Common::checkTokenRequestParam()` memvalidasi POST dan membuang parameter tidak valid. Setiap controller mutasi profil wajib memanggil `Foundation::requireMutation($_SERVER, $_POST, $_SESSION)` setelah bootstrap sesi dan sebelum efek samping. Helper menolak non-POST serta token kosong/salah/array. Token berasal dari sesi dan disertakan dengan helper form phpMyAdmin yang sudah tersedia. |
| Runtime/konfigurasi privat | `libraries/classes/Local/Foundation.php`; `runtime()` menguji SQLite in-memory dan authenticated encryption Sodium; `configuration()` memvalidasi lokasi/permission. Controller profil berikutnya wajib memeriksa flag, runtime, konfigurasi dan akses sebelum operasi. GET hanya membaca; tidak membuat direktori, kunci atau database. |
| Entry point tambahan | Guard juga dipasang pada `url.php`, `show_config_errors.php`, tiga endpoint setup, `js/messages.php`, dan empat contoh PHP. Setiap endpoint web baru wajib memuat guard paling awal. |

Tidak ada endpoint mutasi profil pada brief ini. Helper CSRF sudah tersedia dan
diuji; pengujian controller profil aktual dilakukan ketika controller dibuat.
Jangan menganggap pembersihan parameter oleh Common saja cukup untuk mutasi baru.

## Runtime dan bootstrap privat

Dependency tambahan fitur lokal: **PDO, ext-pdo_sqlite dan ext-sodium native**.
Dependensi ini opsional untuk phpMyAdmin lama; manifest upstream tidak diubah.
Polyfill Sodium vendor tidak menggantikan syarat native pada fondasi ini.
Diagnostik memeriksa kemampuan nyata, bukan hanya versi PHP.

Jalankan sebagai akun yang menjalankan PHP FPM/Herd:

```sh
php scripts/local-bootstrap.php
php local-runtime.php
curl --noproxy '*' http://xphpmyadmin.test/local-runtime.php
```

Bootstrap membuat direktori dan konfigurasi saja, idempotent, tidak menimpa file
lama, dan tidak mencetak isinya. Jalankan diagnostik CLI **dan web** setelah ganti
versi PHP/Herd. Runtime FPM tidak diasumsikan sama dengan CLI.

Default berdasarkan home akun efektif PHP, bukan hostname browser:

- `~/Library/Application Support/xphpmyadmin/local.json`: konfigurasi privat, 0600.
- `~/Library/Application Support/xphpmyadmin/data/`: calon SQLite dan sidecar, 0700.
- `~/Library/Application Support/xphpmyadmin/keys/`: calon master key, 0700, terpisah dari data.
- Direktori induk `xphpmyadmin/`: 0700, dimiliki akun PHP. File SQLite/kunci kelak 0600.

`local.json` memuat `profiles_enabled` (boolean), `data_dir` dan `key_dir`
(path absolut). Tidak memuat password atau kunci. Lokasi alternatif ditetapkan
melalui `XPHPMYADMIN_LOCAL_CONFIG` pada **CLI dan environment FPM**, lalu jalankan
bootstrap dan kedua diagnostik lagi. Jangan menaruh lokasi alternatif di path
parked/linked Herd, alias HTTP, repo atau document root. Jangan membuat symlink
publik ke penyimpanan privat. Path nonkanonis/symlink, path di dalam aplikasi atau
document root, direktori data/kunci sama atau bertumpuk, permission terbuka,
owner berbeda, atau akses baca/tulis tidak tersedia ditolak.

Herd melaporkan document root `/` sebagai mekanisme dispatch; validasi memakai
root aplikasi aktual untuk kasus khusus ini. Pada server dengan document root
biasa, kedua root diperiksa. Administrator tetap harus memastikan tidak ada
mapping HTTP lain ke lokasi privat. Pengujian HTTP menggunakan file canary
sintetis nyata di kedua direktori dan memeriksa tidak ada konten yang terunduh.

Kegagalan lokasi menampilkan pesan aman tentang bootstrap/owner/permission;
kegagalan dependency menyebut `ext-pdo_sqlite` dan `ext-sodium`, tanpa stack trace,
path privat, konfigurasi database, password atau kunci. Diagnostik web GET saja,
`Cache-Control: no-store`, status 503 pada kegagalan; CLI keluar 1. Jangan memakai
`phpinfo()` untuk diagnostik ini. Diagnostik tidak menulis data persisten.

## Batas akses dan Herd

Guard mengizinkan IPv4 `127.0.0.0/8` dan IPv6 `::1`; peer hilang/tidak valid atau
alamat jaringan lain mendapat 403 sebelum bootstrap phpMyAdmin. Seluruh header
`Forwarded`, `X-Forwarded-*`, dan `X-Real-IP` ditolak, bahkan dari loopback.
Tidak ada trusted HTTP proxy dalam konfigurasi ini. Jangan mengaktifkan layanan
tunnel/share/expose yang mengubah asal jaringan menjadi peer loopback.

Herd menggunakan nginx → Unix socket FPM dan meneruskan `REMOTE_ADDR` asli;
bukan HTTP reverse proxy yang perlu mempercayai forwarded header. Konfigurasi
`~/Library/Application Support/Herd/config/nginx/herd.conf` mengikat default site
ke `127.0.0.1:80`. Pemeriksaan socket aktual menemukan nginx hanya listen pada
`127.0.0.1` port 80, 443 dan 60. Koneksi menuju IP LAN pada ketiganya ditolak.
Tidak diperlukan perubahan konfigurasi nginx global. Ulangi pemeriksaan jika
mengaktifkan proxy atau mengubah binding Herd. Herd saat ini tidak listen IPv6;
izin IPv6 aplikasi diuji lewat server PHP sementara di `::1`.

Guard aplikasi melindungi endpoint dinamis; pembatasan listener Herd melindungi
file statis juga. Hosting publik bukan konfigurasi yang didukung brief ini.

## Baseline dan pemulihan

Repo awal berupa distribusi phpMyAdmin 5.2.3 tanpa `.git`. Sebelum perubahan,
seluruh tree disalin ke arsip privat:

`~/Library/Application Support/xphpmyadmin/backups/20261022-161158/baseline.tar.gz`

Arsip 0600, direktori backup leaf 0700, induk aplikasi privat 0700. Arsip berisi
konfigurasi lama: jangan dipindahkan ke repo/document root atau dilampirkan ke PR.
`manifest.json` di sebelahnya memuat hash arsip dan hash konfigurasi, tanpa isi
rahasia. Arsip dibuka kembali dan isi `config.inc.php` dibandingkan dengan file
asli; hash konfigurasi akhir tetap sama. Akun PHP lokal dapat membaca backup.

Untuk menonaktifkan fitur profil pada implementasi berikutnya, tetapkan
`profiles_enabled: false` di konfigurasi privat dan verifikasi diagnostik.
Saat ini flag sudah false dan belum ada fitur profil yang dapat diaktifkan.
Jangan menghapus direktori data/kunci saat menonaktifkan fitur.

Untuk mengembalikan kode ke baseline:

1. Hentikan akses situs sementara; simpan salinan tree implementasi saat ini di
   luar document root jika ingin mempertahankan perubahan lanjutan.
2. Verifikasi SHA-256 arsip terhadap `manifest.json`. Ekstrak ke direktori staging
   privat (0700), bukan langsung menimpa situs aktif. Lindungi hasil ekstraksi
   karena memuat konfigurasi lama.
3. Pulihkan file baseline dari staging ke lokasi aplikasi. Hapus hanya tambahan
   brief ini yang tidak ada dalam baseline: `local-runtime.php`,
   `libraries/local-access.php`, `libraries/classes/Local/`,
   `scripts/local-bootstrap.php`, `test/local/`, dan dokumen hasil implementasi.
   File lama yang berubah adalah tujuh entrypoint utama/setup/JS dan empat
   file `examples/*.php`; salinan asli tersedia di arsip. Periksa perubahan
   setelah brief ini sebelum menimpa file.
4. Pertahankan `local.json`, direktori data, direktori kunci, dan backup di luar
   aplikasi. Tidak ada perintah SQL, reset, truncate, migrasi atau penghapusan
   database remote dalam proses pemulihan.
5. Jalankan lint pada entrypoint yang dipulihkan. Akses lokal lama tetap tersedia
   lewat binding loopback Herd; baseline tidak memiliki guard aplikasi tambahan.

## Pemeriksaan yang dijalankan

```sh
php test/local/foundation.php
python3 test/local/check_http.py
php scripts/local-bootstrap.php
php local-runtime.php
php -d disable_functions=sodium_crypto_secretbox local-runtime.php
```

Hasil 22 Oktober 2026:

- 35 pemeriksaan fondasi lulus: loopback/nonlokal, spoof header, CSRF, konfigurasi
  invalid/hilang, permission, direktori bertumpuk, lokasi publik dan symlink.
- CLI **8.5.10 / cli** dan Herd **8.5.10 / fpm-fcgi**: SQLite dan Sodium lulus;
  konfigurasi privat dapat dibaca oleh keduanya, flag false.
- HTTP Herd: diagnostik 200, POST diagnostik 405, spoof header 403 pada 11
  entrypoint, isi file privat/canary tidak tersaji pada URL biasa/traversal.
  phpMyAdmin dapat menjawab URL tidak dikenal dengan HTML 200; tes memeriksa
  konten, tidak menganggap semua URL privat harus 404.
- Server PHP sementara: loopback IPv4/IPv6 200, IP LAN nyata 403 termasuk spoof,
  konfigurasi hilang dan fungsi Sodium dinonaktifkan menghasilkan pesan aman 503.
- CLI dengan fungsi Sodium dinonaktifkan keluar 1 dengan pesan dependency aman.
- Bootstrap kedua mempertahankan file lama. Lint 17 file PHP baru/berubah lulus.
- Hash `config.inc.php` tidak berubah. Tidak ada SQL mutasi atau migrasi dijalankan.

Distribusi tidak menyertakan `vendor/bin`, PHPUnit, test suite upstream, maupun
node_modules. Karena itu `composer test`/Jest/build frontend tidak dijalankan;
tidak ada perubahan frontend atau vendor. Manifest mencatat PHPUnit/PHPCS/
PHPStan/Psalm dan build Yarn bila dependensi development disiapkan terpisah.
Pengujian di atas memakai SQLite in-memory, fixture privat disposable, dan
request HTTP; tidak membutuhkan perubahan database pengguna. URL fallback Herd
melewati bootstrap phpMyAdmin lama dan dapat membuka koneksi lama untuk membaca
halaman; tidak digunakan untuk menjalankan operasi database.

Pemulihan penuh situs aktif tidak dilakukan karena akan membatalkan implementasi;
yang diverifikasi adalah pembacaan arsip dan kesamaan konfigurasi tersimpan.
Proteksi CSRF endpoint profil dan fitur F01–F12 akan diuji pada brief terkait.
