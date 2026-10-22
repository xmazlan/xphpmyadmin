# Tes koneksi dan TLS

Implementasi Brief 04, 22 Oktober 2026. Layanan tes menerima draft tanpa menyimpan
profil. Endpoint tersedia tetapi mengikuti `profiles_enabled`; instalasi ini
mempertahankan flag **false**. Integrasi Connect dan konteks tab mengikuti Brief
05, antarmuka mengikuti Brief 06.

## Layanan bersama

`PhpMyAdmin\Local\MySqlConnector::open($draft, $password, $readTimeout = null)`
melakukan validasi metadata, transport TCP, autentikasi, verifikasi TLS, dan
pemilihan database awal. Return `VerifiedConnection` memiliki `native()` untuk
adapter Connect berikutnya, `summary()` tanpa kredensial, serta `close()` yang
idempotent dan dipanggil destructor. Jangan menserialisasi handle native.

`ConnectionTester::testDraft($draft, $password)` memakai konektor yang sama dan
**selalu menutup** handle dalam finally. Tidak memakai DBAL lama karena DBAL
tersebut memiliki perilaku retry TLS. Tidak ada retry, penggantian password,
penurunan verifikasi, atau fallback database dalam konektor baru.

`draft` memakai field `ProfileInput::FIELDS`. Untuk profil tersimpan, adapter
Connect kelak memproyeksikan field tersebut dari detail profil setelah otorisasi
konteks/revisi, bukan meneruskan semua metadata administratif sebagai input draft.

### Timeout

- `MYSQLI_OPT_CONNECT_TIMEOUT=10` berlaku pada semua koneksi baru.
- Test menggunakan read timeout **10 detik** pada handle sementara, sehingga peer
  TCP yang menerima socket tetapi tidak mengirim greeting MySQL juga gagal dengan
  kategori timeout. Handle ini tidak pernah dipakai untuk administrasi.
- Handle Connect/shared `open()` default mempertahankan read timeout runtime
  `mysqlnd.net_read_timeout`; tidak menerima batas read 10 detik dari Test.
  Parameter read timeout internal dapat diatur eksplisit oleh adapter administrasi.
- Tidak mengandalkan penggantian opsi read timeout setelah socket terbuka. Pada
  mysqlnd, opsi tersebut tidak menjamin timeout socket yang sama ikut berubah.
  Pemisahan dibuktikan dengan query `SELECT SLEEP(11)` yang berhasil pada handle
  administrasi, sementara tes greeting macet gagal sekitar 10 detik.
- Angka 10 adalah timeout driver TCP/read Test, bukan janji deadline total mutlak
  untuk seluruh resolusi DNS, percobaan alamat OS, dan semua fase handshake.
  Read policy handshake pada handle administrasi mengikuti runtime. Deadline
  end-to-end Connect, jika dibutuhkan, harus ditangani pada integrasi berikutnya.

Perilaku opsi mengikuti [manual MySQLi](https://www.php.net/manual/en/mysqli.options.php)
dan implementasi [mysqlnd VIO](https://github.com/php/php-src/blob/PHP-8.5/ext/mysqlnd/mysqlnd_vio.c).

### TLS dan database awal

TLS default aktif dan verifikasi sertifikat wajib. Konektor menyetel
`MYSQLI_OPT_SSL_VERIFY_SERVER_CERT=1`, memakai flag `MYSQLI_CLIENT_SSL`, dan
memeriksa hasil `SHOW SESSION STATUS LIKE 'Ssl_cipher'` sebelum memilih database.
Handshake yang tidak menghasilkan TLS saat diminta ditolak. Tidak ada retry
non-TLS. Non-TLS hanya melalui `tls.enabled=false` secara eksplisit.

CA opsional mengikuti trust store OpenSSL/PHP runtime jika tidak diberikan.
CA/client cert/key yang diberikan harus berupa file lokal biasa yang bisa dibaca.
Pasangan client cert/key harus lengkap dan cocok menurut OpenSSL; file tidak
terbaca, format/pasangan salah, CA tidak dipercaya, atau identitas server salah
menghasilkan kategori TLS. Encrypted client private key dengan passphrase belum
didukung; tidak ada field passphrase yang disimpan. Isi file tidak ditampilkan.
Pengujian mencakup autentikasi client certificate pada akun `REQUIRE X509`.

Koneksi selalu TCP dan nonpersistent. Literal `localhost` dinormalisasi ke
`127.0.0.1`, sehingga port draft tetap dihormati dan tidak beralih ke Unix socket
bawaan PHP. Untuk TLS dengan literal ini, sertifikat harus mencakup SAN IP
`127.0.0.1`. Gunakan hostname DNS yang cocok dengan sertifikat untuk server lain.
Alamat IPv4/IPv6 selain alias tersebut dipertahankan; prefix `p:`, URL dan karakter
perintah ditolak validasi. VPN tidak dideteksi atau diasumsikan.

Database awal dikirim dengan `select_db` setelah verifikasi transport. Database
terlarang/tidak ada menyebabkan kegagalan dan penutupan koneksi; tidak membuka
administrasi pada database default lain. Charset utf8mb4 dipilih melalui opsi
handshake dan LOCAL INFILE dimatikan. Test tidak menjalankan DDL/DML, tidak
memperbarui last_used_at, tidak mengganti server/tab aktif, dan tidak menyimpan
password atau draft. Simpan offline tetap memakai repository tanpa tes jaringan.

## Endpoint internal

`POST /local-connection-test.php`, `Content-Type: application/json`, body maksimal
512 KiB. Query string ditolak agar credential/token tidak ditaruh di URL. Contoh
struktur berikut memakai variabel input, bukan password/kunci nyata:

```json
{
  "token": "token-sesi-phpMyAdmin",
  "draft": {
    "name": "Draft",
    "host": "db.internal",
    "port": 3306,
    "username": "developer",
    "database": null,
    "tls": {"enabled": true, "verify": true, "ca": null}
  },
  "credential": {"source": "input", "password": "password-dari-input"}
}
```

Password input harus dikirim eksplisit; string kosong diperbolehkan sebagai
password kosong, bukan perintah hapus atau penanda mengambil password lain.
Tidak ada pembacaan password dari query string, GET, localStorage, atau default
password pada php.ini.

Alternatif credential:

- `source: saved`, `profile_id`, `revision`: baca password persisten profil yang
  masih ada dan revisinya cocok.
- `source: session`, `profile_id`, `revision`, `context`: baca entry `SessionPasswords`
  pada sesi PHP yang sama. Entry harus terkait konteks/profil/revisi tersebut.

Untuk kedua sumber ini, **host, port, username, database awal, dan seluruh TLS
harus sama dengan target profil tersimpan**. Perubahan nama/label tidak mengubah
target. Draft yang mengubah tujuan atau CA tidak boleh mengirim password tersimpan
ke server lain; ditolak sebelum koneksi. Untuk menguji target baru, pengguna
memasukkan password eksplisit. Tidak ada otomatisasi yang menganggap draft baru
berhak memakai rahasia profil lama.

Credential read memakai `ProfileDatabase::openExistingConfigured()`: database
hilang/schema belum siap ditolak, bukan dibuat atau dimigrasikan oleh request tes.
`openConfigured()` tetap menjadi bootstrap/migrasi administratif eksplisit.
Tidak adanya password/kunci persisten menghasilkan pesan aman untuk input ulang;
input sementara tetap dapat diuji tanpa master key.

Endpoint memuat guard loopback paling awal, memeriksa flag, validasi format,
lalu menggunakan `Config` dan `Session::setUp()` phpMyAdmin untuk cookie serta
` PMA_token ` yang sama. Tidak memanggil `Common::run()`/autentikasi database lama.
`Foundation::requireMutation()` memverifikasi token POST sebelum sumber kredensial
atau jaringan diakses. Sesi dilepas sebelum menunggu jaringan agar tes tidak
memblokir request tab lain. Variabel target aktif tidak disentuh.

Request GET/PUT mendapat 405; spoof forwarded header/nonloopback 403; flag off
404; token hilang/salah/array atau sesi tidak cocok 403. Respons selalu JSON untuk
jalur endpoint normal, dengan `Cache-Control: no-store` dan nosniff. Header cache
disetel ulang setelah bootstrap sesi karena cache limiter phpMyAdmin dapat
mengubahnya. Guard lokal yang berjalan sebelum endpoint tetap memakai respons
403 plain text sebagaimana Brief 01.

Sukses hanya mengembalikan:

```json
{"ok":true,"tls":true,"database_selected":true}
```

Gagal mengembalikan `{ok:false,error:{category,message}}` dengan pesan tetap:

| Kategori | Status | Arti |
| --- | --- | --- |
| input | 422 | Metadata/payload/credential target tidak valid |
| dns | 502 | Hostname tidak dapat di-resolve |
| network | 502 | TCP ditolak/tidak terjangkau atau koneksi terputus |
| timeout | 504 | Timeout driver saat tes koneksi awal |
| authentication | 502 | Akun/password/plugin autentikasi ditolak |
| database | 502 | Database awal tidak ada/tidak diizinkan |
| tls | 502 | Negosiasi/verifikasi TLS atau client cert/key gagal |
| storage | 503 | Runtime, sesi, atau rahasia/penyimpanan lokal tidak tersedia |

Kode driver yang tegas didahulukan. Pemutusan koneksi selama negosiasi TLS bisa
dilaporkan sebagai kegagalan TLS tanpa membocorkan pesan vendor; tidak selalu
mungkin menentukan akar gangguan jaringan versus handshake dari kode driver.
Tidak ada raw exception, SQL, password, key material, atau isi sertifikat dalam
respons. Argumen draft/password/payload sensitif memakai `SensitiveParameter`.
Mode error-report MySQLi dipulihkan setelah operasi; warning native dibuang setelah
hanya mengambil bit klasifikasi, bukan dicatat mentah.

## Pengujian disposable

```sh
python3 test/local/check_connections.py
php test/local/passwords.php
php test/local/profiles.php
php test/local/foundation.php
python3 test/local/check_http.py
```

Harness membuat datadir/socket/port baru yang dipilih OS dan akun sintetis hanya
di dalam direktori temporary 0700. Semua proses dijalankan dengan `--no-defaults`,
`--datadir` dan Unix socket eksplisit, bind loopback, tanpa memuat konfigurasi/data
server pengguna. Bootstrap DDL/DML hanya untuk fixture. Sesudah fase setup,
general log diaktifkan untuk membuktikan fase Test tidak menjalankan DDL/DML.
Seluruh proses dihentikan dan fixture dibersihkan dalam finally.

Binaries yang dipakai: MySQL Community **9.4.0** dari instalasi Herd (hanya binary,
bukan layanan/datadir yang sedang aktif), MariaDB **11.4.13** dari bottle Homebrew
yang diekstrak ke lokasi privat `~/Library/Application Support/xphpmyadmin/test-tools/`.
OpenSSL 4 dan PCRE2 bottle diekstrak di lokasi yang sama untuk dependency binary
MariaDB; `DYLD_LIBRARY_PATH` hanya disetel pada proses fixture tersebut. Tidak
menjalankan `brew install`, `brew services`, atau post-install database global.

Untuk mesin lain, sediakan binary sendiri lewat `XPM_TEST_MYSQL_BASE` dan
`XPM_TEST_MARIADB_BASE`. Default MySQL mencari path Herd 9.4.0; default MariaDB
mencari `test-tools/mariadb@11.4/*`. Harness gagal jelas jika binary tidak tersedia,
bukan menganggap tes dilewati sebagai lulus. Bila memakai bottle privat,
`brew fetch --force-bottle mariadb@11.4 openssl@4 pcre2` hanya mengambil paket;
ekstrak ke test-tools terpisah, bukan repo/document root, sebelum menjalankan tes.
Informasi paket: [formula MariaDB 11.4](https://formulae.brew.sh/formula/mariadb@11.4).

**Hasil: 83 pemeriksaan koneksi CLI dan seluruh pemeriksaan HTTP lulus.**
Pengujian mencakup MySQL/MariaDB valid, draft tanpa penyimpanan, input/password salah,
DNS/port tertutup/greeting timeout, database awal terlarang/tidak ada, CA salah,
identitas sertifikat salah, client key/cert mismatch, mutual TLS, server tanpa TLS,
CA runtime opsional, serta read query 11 detik yang independen dari Test timeout.
Endpoint diuji dengan sesi/token phpMyAdmin nyata pada server PHP sementara,
termasuk saved/session credential, binding target, header cache, flag off, dan
storage error, HTTP timeout 504, serta password input yang tetap bekerja saat
master key fixture hilang. Byte SQLite sebelum/sesudah HTTP identik; konteks
sesi aktif tetap ada. Semua sentinel remote tetap utuh, general log fase tes
tidak mengandung DDL/DML atau password fixture plaintext. Ini bukan pengujian
pada database pengguna.

Runtime CLI dan FPM Herd saat ini **PHP 8.5.12**, dengan mysqlnd/OpenSSL tersedia.
Endpoint Herd nyata diperiksa untuk penolakan metode/flag; jalur sukses HTTP
menggunakan fixture dan server PHP sementara dengan environment terisolasi.
Sertifikat expired/revoked dan seluruh kombinasi plugin autentikasi/versi database
belum diuji. Sertifikat invalid yang diuji mencakup CA tidak dipercaya dan identitas
hostname salah. CRL/OCSP/pinning bukan fitur yang ditambahkan brief ini.
Regresi 124 pemeriksaan password, 163 pemeriksaan profil, 35 pemeriksaan
fondasi dan suite HTTP lokal dijalankan. Lint PHP serta git diff --check
dijalankan; hash konfigurasi lama, local.json, SQLite dan master key dicocokkan
dengan baseline. Suite upstream PHPUnit/PHPCS/PHPStan/Psalm belum tersedia;
tidak dijalankan.

## Baseline dan pemulihan

Baseline kode sebelum Brief 04 dan snapshot SQLite konsisten yang diverifikasi:

`~/Library/Application Support/xphpmyadmin/backups/20261022-231727-brief04/`

Arsip dan snapshot 0600 di direktori 0700, di luar repo/document root. Manifest
memuat hash konfigurasi lama, local.json, SQLite dan master key tanpa isinya.
Tidak ada migrasi schema atau bootstrap key baru pada brief ini.

Untuk menonaktifkan endpoint, pertahankan `profiles_enabled=false` (kondisi saat
ini). Untuk rollback kode, pulihkan `ProfileDatabase.php` dari baseline dan
singkirkan hanya class koneksi/tes, endpoint, test serta dokumentasi Brief 04 yang
ditambahkan. Pertahankan `.git`, perubahan pengguna berikutnya, profiles.sqlite,
marker impor, master key, local.json dan backup. Jangan menghapus schema, profil,
atau data database tujuan. Tidak perlu mengubah runtime/server MySQL/MariaDB
pengguna untuk mengaktifkan atau membatalkan perubahan ini.
