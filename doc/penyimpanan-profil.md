# Penyimpanan profil dan impor awal

Catatan tahap Brief 02. Schema saat ini ditingkatkan ke versi 2 dan layanan
rahasia sudah tersedia melalui [Brief 03](rahasia-dan-siklus-password.md).
Penjelasan belum tersedianya rahasia di bawah menggambarkan kondisi akhir Brief 02.

Implementasi Brief 02, 22 Oktober 2026. Lapisan metadata tersedia secara internal;
UI, endpoint HTTP profil, tes koneksi, autentikasi/tab, dan enkripsi password
belum diimplementasikan. `profiles_enabled` tetap `false`.

## Inisialisasi

Jalankan sebagai akun PHP/Herd, setelah bootstrap Brief 01:

```sh
php scripts/local-profiles-init.php
```

Perintah memvalidasi runtime/lokasi privat, membuka atau membuat
`data_dir/profiles.sqlite`, menerapkan migrasi, lalu mengimpor metadata lokal dari
`config.inc.php`. Tidak menjalankan bootstrap aplikasi phpMyAdmin, koneksi MySQL,
atau SQL ke server tujuan. File konfigurasi lama hanya dibaca, tidak ditulis.
CLI ini tetap dapat menyiapkan penyimpanan ketika flag UI false.

Perintah hanya tersedia di CLI; akses web mendapat 404. Keluaran hanya jumlah
impor/slot yang sudah ditangani/slot nonlokal yang dilewati. Konfigurasi PHP lokal
merupakan kode tepercaya dan dievaluasi dalam scope terpisah; output/peringatan
konfigurasi tidak diteruskan. Error konfigurasi arbitrer tidak dicetak.

Hasil pada instalasi ini: schema versi 1 siap, satu metadata koneksi lokal
berhasil diimpor. Eksekusi kedua menghasilkan nol profil baru dan satu asal yang
sudah ditangani. Konfigurasi sumber menggunakan default username phpMyAdmin;
importer mengambil default dari `Config\Settings\Server`, tanpa menebaknya dan
tanpa memasukkan password ke objek default tersebut.

Tidak ada migrasi/impor otomatis pada setiap request phpMyAdmin lama. Pada brief
integrasi berikutnya, startup pengelola profil harus membuka database dan
memanggil importer dengan `$cfg['Servers']` yang telah dimuat, sebelum melayani
profil. Impor berulang aman; operasi pertama yang menyiapkan schema/impor harus
berada pada bootstrap terkontrol, bukan GET baca profil.

## Schema dan transaksi

`ProfileDatabase::openConfigured()` memvalidasi `Foundation::configuration()`;
file baru 0600, direktori tetap 0700. File SQLite/sidecar symlink, owner berbeda,
atau permission terlalu terbuka ditolak. Tidak mengubah permission file lama
secara diam-diam. Semua koneksi memakai PDO SQLite, `foreign_keys=ON`,
`synchronous=FULL`, dan `busy_timeout=250ms`. Tidak ada fallback ke MySQL.

`PRAGMA user_version=1` menandai migrasi pertama:

- `profiles`: UUID v4 stabil; nama, host, port, username, database awal nullable,
  lingkungan, TLS enabled/verify serta referensi CA/client cert/key, favorit,
  created/updated/last-used, dan `connection_revision` mulai 1.
- `profile_imports`: origin unik, referensi profile ID unik, waktu impor. Foreign
  key `ON DELETE SET NULL` mempertahankan penanda setelah profil dihapus.
- Indeks urutan penggunaan terakhir. SQL CHECK membatasi port, lingkungan,
  boolean dan revisi. Password/ciphertext tidak menjadi kolom metadata.

Migrasi dijalankan dalam `BEGIN IMMEDIATE`, membaca ulang versi setelah mendapat
lock, lalu commit schema dan versi bersamaan. Tidak menjatuhkan/mengganti tabel
lama. Versi lebih baru ditolak; schema bertabrakan gagal dan rollback, tanpa
mencoba reset/repair otomatis. Versi schema ini belum membutuhkan upgrade dari
versi aplikasi terdahulu yang memiliki tabel profil.

Semua mutasi memakai transaksi dan parameter binding. Transaksi bertingkat
menggunakan savepoint. Kegagalan operasi atau commit memicu rollback; tidak
melaporkan berhasil bila tulis gagal. SQLite busy/locked menghasilkan
`StorageException` dengan pesan retry; kesalahan driver lainnya disamarkan menjadi
pesan permission/ruang penyimpanan. Path, SQL, parameter, dan exception driver
asli tidak disertakan pada error yang diteruskan.

## Kontrak layanan internal

Contoh pemakaian oleh kode tepercaya setelah autoload:

```php
$database = ProfileDatabase::openConfigured();
$profiles = new ProfileRepository($database);
$profile = $profiles->create([
    'name' => 'Development',
    'host' => 'db.internal',
    'username' => 'developer',
]);
$profiles->list('development', true, 'recent');
$profiles->detail($profile['id']);
$profiles->update($profile['id'], ['name' => 'New name']);
$profiles->favorite($profile['id'], true);
```

Namespace semua class di atas `PhpMyAdmin\Local`. Belum ada endpoint/API publik.
Controller baru tetap wajib memeriksa guard lokal, flag fitur, metode POST dan
CSRF Brief 01 sebelum memanggil mutasi. Repository ini bukan lapisan autentikasi.

- `create(array)`, `update(id, patch)`, `favorite(id, bool)` mengembalikan metadata;
  `detail(id)` mengembalikan null jika tidak ada; `delete(id)` menolak ID tak ada.
- `list(search='', favoritesOnly=false, order='recent')` mencari substring nama,
  host, username. `%`, `_`, dan backslash diperlakukan sebagai literal, bukan
  wildcard. Default SQLite NOCASE/LIKE bersifat case-insensitive untuk ASCII;
  pencarian Unicode penuh belum disediakan. Urutan `recent` mendahulukan timestamp
  terbesar dan meletakkan null terakhir; tie memakai created_at dan UUID.
  Pilihan lain `name`; teks sort lain ditolak.
- ID dibuat acak, tidak diturunkan dari host/username/posisi daftar. Beberapa
  profil dengan target sama diperbolehkan. Save/list/delete tidak membuka remote.
- `update` berupa patch. Field yang tidak dikirim dipertahankan, termasuk field
  TLS yang tidak disebut pada patch TLS. Null mengosongkan field opsional;
  cert/key harus dikosongkan atau diisi berpasangan. Update identik tidak menulis.
- Host, port, username, database awal, atau salah satu parameter TLS yang berubah
  menaikkan revisi **sekali per update**. Nama, favorit, dan label lingkungan
  tidak mengubah revisi target. ID selalu dipertahankan.
- `recordConnectSuccess(id, expectedRevision)` hanya boleh dipanggil alur
  Hubungkan yang benar-benar berhasil pada brief berikutnya. Revisi lama/ID
  terhapus ditolak. Ini satu-satunya operasi yang menulis `last_used_at`;
  create/update/favorite/import tidak menulisnya. Test/failure tidak memiliki
  operasi pencatatan penggunaan. Timestamp UTC ISO 8601 dengan mikrodetik.
  Keberhasilan connect tidak mengubah `updated_at` metadata.
- Projection list/detail eksplisit; tidak mengembalikan nilai rahasia. Indikator
  password tersimpan ditambahkan bersama layanan rahasia pada Brief 03.

Nama/host/username wajib, port integer 1–65535 (default 3306), lingkungan
`Local/Staging/Production/Other` (default Other), database awal opsional. Host
menerima IP IPv4/IPv6 atau hostname, tanpa URL, port tertempel, spasi atau karakter
perintah shell. Host disimpan tanpa DNS lookup. Nama maksimum 255 byte, username
128, database 64, host 253; teks harus UTF-8 tanpa karakter kontrol.

Profil baru default TLS aktif dengan verifikasi sertifikat. Non-TLS harus dipilih
secara eksplisit. `tls.verify=false` ditolak agar tidak mengimpor/membuat profil
yang menurunkan verifikasi diam-diam. Referensi file TLS harus path absolut, bukan
isi sertifikat/kunci; keberadaan/validitas file diuji saat tes koneksi kelak,
sehingga profil offline tetap bisa disimpan. Field tak dikenal, termasuk password,
ID/revisi/timestamp buatan caller, ditolak.

## Impor idempotent

`LegacyProfileImporter($database, $profiles)->import($servers)` berjalan dalam satu
transaksi untuk seluruh batch. Origin stabil `legacy-config:server:<slot>` tidak
bergantung pada host/username/password sumber. Slot yang pernah diimpor dilewati
**sebelum** membaca ulang parameternya. Setelah edit profil, perubahan konfigurasi
lama tidak menimpa edit; setelah delete profil, marker tetap ada dan mencegah
pembuatan ulang. Tidak ada operasi penghapusan marker otomatis.

Hanya koneksi ke `localhost`, loopback IPv4, atau `::1` diimpor. Slot remote
langsung/VPN dilewati pada impor awal lokal ini. Username yang dihilangkan memakai
default phpMyAdmin; username eksplisit kosong ditolak. String port lama berupa
angka dikonversi ke integer; port kosong memakai 3306. `verbose` menjadi nama atau
diganti label lokal berdasarkan slot. TLS lama dipertahankan, termasuk non-TLS
lokal eksplisit/default. Password, controlpass, blowfish key, auth cookie, dan
seluruh konfigurasi sumber tidak diserialisasi ke SQLite. `only_db` adalah filter
akses phpMyAdmin, bukan database awal, sehingga tidak disalin menjadi database awal.

Unix socket eksplisit dan TLS CA-directory/cipher restrictions yang belum dapat
diwakili ditolak tanpa impor parsial. TLS yang mematikan verifikasi juga ditolak.
Batasan/filter konfigurasi phpMyAdmin lain tidak dipindahkan ke schema ini; UI
masih nonaktif, dan integrasi autentikasi harus mempertimbangkannya pada brief
berikutnya. Jangan menganggap profil hasil impor sebagai pengganti seluruh
kebijakan `config.inc.php`.

## Hapus dan persiapan Brief 03

Delete hanya menghapus baris lokal dalam transaksi. Tidak ada SQL ke target,
penghapusan file TLS, atau penghapusan database pengguna. Marker asal tetap ada.
Tabel rahasia kelak harus memakai `REFERENCES profiles(id) ON DELETE CASCADE`
pada database yang sama. Mutasi metadata/rahasia dapat dibungkus dengan
`$database->transaction(...)`; repository di dalamnya memakai savepoint sehingga
kegagalan ciphertext membatalkan metadata juga. Pengujian memakai tabel rahasia
fixture untuk membuktikan cascade dan rollback. Belum ada penyimpanan password
atau pembuatan master key pada Brief 02.

## Pengujian dan hasil

```sh
php test/local/profiles.php
php test/local/foundation.php
python3 test/local/check_http.py
php scripts/local-profiles-init.php
php scripts/local-profiles-init.php
php local-runtime.php
```

Hasil: **163 pemeriksaan profil lulus** pada direktori disposable 0700 dengan
konfigurasi sintetis. Mencakup CRUD/favorit offline, target duplikat, validasi input,
search literal dan injection, null/urut timestamp, revisi tiap parameter koneksi,
penolakan sukses pada revisi lama, impor berulang/edit/delete, default username,
rollback batch, dua proses impor bersamaan, restart proses PHP, write lock,
readonly SQLite, kegagalan tulis via trigger, rollback metadata bersama fixture
rahasia, cascade delete, collision migrasi tanpa schema parsial, retry migrasi,
versi schema lebih baru, dan path/permission tidak aman. Tidak membuat koneksi
MySQL/MariaDB pada suite ini. File fixture dibersihkan setelah pengujian.

Regresi: 35 pemeriksaan fondasi serta suite HTTP Brief 01 lulus. Lint dijalankan
pada file PHP baru/berubah. Runtime CLI dan web tetap 8.5.10; flag fitur false.
Impor nyata dijalankan dua kali, menghasilkan tepat satu profil lokal tanpa
last-used palsu. Integritas SQLite dan hash konfigurasi lama diperiksa.

Suite upstream PHPUnit/PHPCS/PHPStan/Psalm belum tersedia pada distribusi ini,
sehingga tidak dijalankan. UI, koneksi remote aktual, per-tab context, dan
penyimpanan password bukan bagian verifikasi Brief 02.

## Backup dan pemulihan

Sebelum perubahan, tree aplikasi (termasuk konfigurasi lama) diarsipkan dan
pembacaan ulang diverifikasi di luar document root:

`~/Library/Application Support/xphpmyadmin/backups/20261022-162318-brief02/`

`baseline.tar.gz` dan manifest hash 0600, direktori 0700. Direktori data privat
masih kosong sebelum implementasi, sehingga tidak ada SQLite lama yang ditimpa.
Konfigurasi aplikasi/privat tetap dipertahankan. Jangan menerbitkan isi backup.

Untuk backup metadata setelah inisialisasi, hentikan penulis lalu salin SQLite,
atau gunakan SQLite backup API agar snapshot konsisten. Jangan menyalin file
utama saja ketika transaksi sedang berjalan atau WAL dipakai. Simpan snapshot
0600 di luar repo/document root dan sertakan `local.json` privat. Kunci master
terpisah belum dibuat; prosedur backup kunci ditambahkan pada Brief 03.

Rollback kode mengikuti panduan Brief 01 dengan baseline **pre-brief02** di atas.
Pertahankan `.git` dan perubahan pengguna setelah baseline. Pulihkan
`Foundation.php` dan file dokumentasi yang berubah, lalu singkirkan hanya
tambahan Brief 02 (`StorageException`, `ProfileDatabase`, `ProfileInput`,
`ProfileRepository`, `LegacyProfileImporter`, CLI init, test profil dan panduan
ini). Pertahankan `profiles.sqlite`, marker impor, konfigurasi privat, dan folder
kunci. Jangan mereset schema, menghapus SQLite, atau menghapus marker untuk
rollback fitur. Flag tetap false; phpMyAdmin lama tetap memakai konfigurasi lama.
