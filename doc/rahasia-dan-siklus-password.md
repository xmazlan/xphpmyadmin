# Rahasia dan siklus password

Implementasi Brief 03, diverifikasi 22 Oktober 2026. Layanan password tersedia
secara internal. UI, endpoint profil, Connect, disconnect/logout yang terintegrasi
ke konteks tab, dan invalidasi lintas tab masih mengikuti Brief 04–06.
`profiles_enabled` tetap false. Tidak ada password pengguna yang disimpan selama
implementasi ini; hanya pengujian dengan data sintetis disposable.

## Schema dan enkripsi

Migrasi SQLite **versi 2** menambahkan dua tabel tanpa mengubah baris profil atau
penanda impor:

- `secret_key_registry`: identitas SHA-256 kunci dan waktu bootstrap, singleton.
  Ini fingerprint, bukan kunci enkripsi. Registry tetap ada meskipun seluruh
  password tersimpan telah dihapus.
- `profile_secrets`: `profile_id` sebagai primary key/FK `ON DELETE CASCADE`, versi
  format ciphertext, fingerprint kunci, nonce, ciphertext, dan waktu perubahan.
  Nonce/ciphertext di-bind sebagai BLOB, tidak pernah plaintext.

Database baru melewati schema 1 dan 2 dalam satu transaksi. Upgrade schema 1
hanya menambahkan tabel baru. Collision/migrasi gagal rollback tabel dan versi;
metadata lama tetap utuh. `secure_delete=ON` diterapkan pada koneksi aplikasi;
backup/snapshot lama tetap dapat berisi ciphertext terdahulu.

Enkripsi memakai **Sodium XChaCha20-Poly1305 IETF AEAD** native: kunci acak 32 byte,
nonce acak 24 byte pada setiap replace, authentication tag 16 byte. Associated
data mengikat ciphertext ke versi format dan ID profil; menyalin envelope profil
A ke B ditolak. Tidak ada algoritme kriptografi buatan sendiri. Referensi TLS key
pada metadata adalah path file sertifikat, bukan isi kunci master/password.

Tambahan runtime: layanan profil lokal memerlukan **PHP 8.2+** agar
`SensitiveParameter` meredaksi argumen pada stack trace, PDO SQLite, SQLite
**3.24+** untuk UPSERT, dan Sodium native yang menyediakan fungsi
`crypto_aead_xchacha20poly1305_ietf`. Runtime lokal yang diuji adalah PHP **8.5.10**
pada CLI dan FPM Herd. Dependensi upstream phpMyAdmin tidak diubah; diagnostik
fondasi sekarang menolak PHP terlalu lama dan memeriksa fungsi serta roundtrip
AEAD. phpMyAdmin lama tetap memakai konfigurasi lamanya.

## Bootstrap kunci

```sh
php scripts/local-profiles-init.php
php scripts/local-key.php init
php scripts/local-key.php init
php local-runtime.php
```

Kunci berada di `key_dir/master.key`, di luar repo/document root dan terpisah dari
SQLite. File 0600, direktori 0700, dimiliki akun PHP. Jalankan sebagai akun PHP
Herd. Tidak ada kunci di konfigurasi, environment variable, URL, atau output CLI.

`init` adalah tindakan administratif eksplisit. Pembuatan profil, list/detail,
keep/remove, dan upaya dekripsi **tidak** membuat kunci. Setelah registry tercatat,
file hilang/salah/rusak menyebabkan kegagalan aman; `init` tidak membuat pengganti,
bahkan jika tidak ada lagi password tersimpan. File kunci lengkap dipublikasikan
secara atomik dari temporary file 0600 yang di-flush/fsync. Bootstrap bersamaan
menggunakan lock transaksi SQLite; file yang ada tidak ditimpa oleh init.

Jika file berhasil dipublikasikan tetapi transaksi registry gagal, init berikutnya
secara eksplisit memvalidasi dan mendaftarkan file yang sama. Tidak menghasilkan
kunci kedua. Transaksi filesystem dan SQLite bukan satu transaksi lintas media;
pengujian crash listrik tidak dilakukan. Backup kunci tetap diperlukan.

Pada instalasi ini schema 2 dan kunci sudah diinisialisasi. Init kedua idempotent;
baris metadata dan marker impor identik dengan snapshot sebelum upgrade,
konfigurasi aplikasi/privat tidak berubah, dan jumlah password tersimpan **nol**.

## Kontrak operasi password

Semua class berikut berada dalam namespace `PhpMyAdmin\Local`:

```php
$database = ProfileDatabase::openConfigured();
$profiles = new ProfileRepository($database);
$passwords = new ProfilePasswords($database);

$profile = $passwords->create($metadata); // default tidak menyimpan password
$profile = $passwords->update($id, $metadataPatch, ['action' => 'keep']);
$profile = $passwords->update($id, $metadataPatch, [
    'action' => 'replace',
    'password' => $passwordFromInput,
]);
$profile = $passwords->update($id, $metadataPatch, ['action' => 'remove']);
```

- `keep` adalah default. Tidak membuka file kunci atau menulis ulang ciphertext;
  metadata tetap dapat diedit saat file kunci hilang/ciphertext bermasalah.
  Pada create tanpa rahasia lama, keep tetap tidak menyimpan password.
- `replace` meminta field password bertipe string, maksimum 65536 byte.
  String kosong hanya berarti password kosong ketika action replace dipilih
  secara eksplisit. Ini mendukung akun MySQL dengan password kosong, tanpa
  menafsirkan field form kosong sebagai penghapusan otomatis.
- `keep`/`remove` melarang field password, termasuk string kosong. Field password
  tanpa action, action tidak dikenal, dan field operasi tambahan ditolak.
- Mematikan checkbox persistensi kelak harus mengirim **remove**. Password yang
  hanya dipakai sementara diserahkan ke `SessionPasswords`, bukan perintah
  replace. Form edit dengan rahasia yang dipertahankan mengirim keep tanpa field
  password. Password tidak diisi ulang ke form.
- Create/update metadata dan replace/remove ciphertext berada di transaksi SQLite
  **yang sama**, memakai savepoint repository. Kegagalan key load, enkripsi,
  write, atau commit membatalkan metadata, revisi target, dan rahasia bersama.
- Password-only change tidak menaikkan revisi parameter target atau mencatat
  keberhasilan connect. Ciphertext mempunyai timestamp perubahan sendiri.
- `$profiles->delete($id)` menghapus ciphertext terkait lewat FK dalam transaksi
  yang sama; failure cascade mengembalikan profil dan ciphertext. Marker impor
  tetap dipertahankan. Tidak ada SQL ke database remote.

List/detail/create/update hanya mengembalikan metadata dan
`has_saved_password: boolean`. Tidak mengembalikan plaintext, ciphertext, nonce,
fingerprint master key atau isi kunci. Indikator tetap true pada ciphertext yang
belum bisa didekripsi; ini menyatakan adanya data tersimpan, bukan validitasnya.

`$passwords->reveal($id, $expectedConnectionRevision)` hanya untuk kode Connect
internal, **setelah validasi konteks server-side Brief 05**. Return null berarti
belum ada password persisten; string kosong adalah password kosong yang sengaja
disimpan. Return plaintext tidak boleh diserialisasi ke respons/log. Revisi lama
atau profil terhapus ditolak. List/detail tidak memanggil reveal.

Kunci hilang/salah, permission terbuka/symlink, format rusak, atau authentication
tag gagal menghasilkan `SecretUnavailable`: minta password ulang atau pulihkan
kunci asli. Tidak menghapus ciphertext/metadata atau memperbaiki kunci otomatis.
Kunci dibaca ulang setiap operasi; tidak ada cache kunci lama setelah restore.

Input password, envelope, kunci, array metadata mentah, dan callback transaksi
sensitif dirahasiakan dari argumen stack trace dengan `SensitiveParameter` pada
batas layanan terkait. Error Sodium/driver tidak dirantai ke error publik.
Jangan menambahkan logging request body/session, var_dump, atau penyertaan pesan
exception mentah pada endpoint baru. Proteksi lokal, flag fitur, POST dan CSRF
Brief 01 tetap wajib pada controller mutasi mendatang.

## Password sesi sementara

`SessionPasswords` menggunakan sesi PHP aktif yang sudah disiapkan phpMyAdmin;
tidak memulai sesi sendiri dan tidak mengirim cookie/kunci/password ke browser.
Gunakan context opaque yang dibuat/diotorisasi backend Brief 05, bukan ID profil
atau teks context dari browser yang belum divalidasi.

```php
$temporary = new SessionPasswords(); // TTL default 1440 detik
$temporary->put($contextId, $profileId, $revision, $passwordFromInput);
$password = $temporary->get($contextId, $profileId, $revision);

$temporary->forgetContext($contextId); // disconnect satu konteks
$temporary->forgetProfile($profileId); // hapus/cabut seluruh konteks profil dalam sesi ini
$temporary->clearAll();               // logout, sebelum session_unset/session_destroy
```

Penyimpanan terikat pada konteks + profil + revisi, serta sesi PHP tempat data
berada. ID konteks 32–128 karakter opaque dan revisi positif divalidasi bentuknya;
**validasi otorisasi konteks tetap tanggung jawab Brief 05**. Masa hidup dapat
diatur 1–86400 detik; expiry dicek pada read dan entry kedaluwarsa dibuang.
Tidak membaca/menulis `profile_secrets` dan tidak bergantung pada master key,
sehingga input sementara tetap dapat digunakan ketika kunci persisten hilang.

Envelope sesi juga memakai AEAD dan kunci acak **khusus sesi**. Password plaintext
tidak muncul di berkas sesi. Kunci sesi berada di backend sesi yang sama dengan
envelope: ini bukan perlindungan terhadap pihak yang bisa membaca seluruh backend
sesi. Permission dan keamanan backend sesi tetap diperlukan. Kunci tersebut
berakhir bersama sesi dan tidak dipakai sebagai kunci master persisten.

Native session ID rotation mempertahankan sesi yang sama; sesi lain tidak mendapat
entry tersebut. Setelah session_write_close, getter menolak akses sampai sesi
yang sah dibuka kembali. Logout harus menghapus namespace rahasia sebelum
menghancurkan sesi. Disconnect satu konteks tidak menghapus konteks profil lain.
Tidak menjanjikan penghapusan file sesi seketika saat browser ditutup: tanpa
logout, TTL dan garbage collection PHP mengatur sisa backend. Native
session_destroy diuji menghapus berkas sesi dan rahasia tidak tersedia pada sesi
baru. Tidak ada localStorage atau password yang dikembalikan ke form.

Hook disconnect/logout/delete tersedia dan diuji terpisah; belum dipasang ke alur
phpMyAdmin lama. Integrasi konteks/tab dan penghapusan lintas konteks dilakukan
Brief 05. Pengambilan rahasia harus selalu didahului pemeriksaan profil/revisi
terbaru, sehingga context terhapus atau lama tidak dipakai diam-diam.

## Backup dan pemulihan kunci

Baseline sebelum Brief 03 dan snapshot SQLite konsisten disimpan privat di:

`~/Library/Application Support/xphpmyadmin/backups/20261022-164314-brief03/`

Direktori 0700; `baseline.tar.gz`, manifest hash, `profiles-before.sqlite`, dan
`profiles-after-init.sqlite` 0600. Arsip kode tidak menyertakan `.git` maupun
penyimpanan privat; konfigurasi lama dalam arsip tetap mengandung informasi privat.
Snapshot setelah init menyertakan registry kunci, tetapi bukan kunci itu sendiri.

Backup kunci dibuat dan pembacaan ulang diverifikasi **secara terpisah** di:

`~/Library/Application Support/xphpmyadmin/key-backups/20261022-brief03/master.key`

Parent/leaf directory 0700, file 0600. Tidak ada isi kunci atau password dicetak.
Untuk backup berikutnya, gunakan SQLite backup API atau hentikan seluruh penulis
sebelum menyalin SQLite. Simpan `local.json` privat bersama konfigurasi pemulihan;
salin master.key ke lokasi backup kunci terpisah dengan permission yang sama.
Jangan menyertakan kunci di repo, document root, arsip metadata yang dibagikan,
atau output log. Snapshot metadata tanpa kunci tidak memulihkan password.

Pemulihan eksplisit:

```sh
php scripts/local-key.php restore /absolute/private/key-backup/master.key
```

1. Pertahankan salinan SQLite dan file kunci yang ada sebelum recovery. Kembalikan
   snapshot SQLite yang dimaksud melalui prosedur backup konsisten bila perlu;
   jangan menggabungkan registry dari snapshot yang berbeda secara manual.
2. Pastikan direktori kunci ada, 0700, dimiliki akun PHP, dan kandidat backup
   berada di luar area publik, berupa file biasa canonical 0600.
3. Jalankan restore di atas. Fingerprint kandidat harus cocok dengan registry
   **yang sudah ada**. Salah kandidat ditolak sebelum file saat ini diubah.
   Restore atomik hanya mengganti file master key; tidak mengganti registry,
   menghapus ciphertext, atau mengenkripsi ulang profil lain.
4. Periksa diagnostik dan lakukan reconnect secara normal setelah integrasi
   tersedia. Ciphertext yang sudah rusak tetap ditolak; profil sehat dapat
   dipulihkan walaupun baris profil lain rusak. Masukkan password baru untuk
   mengganti rahasia yang rusak setelah kunci asli pulih.

Jika tidak punya backup kunci asli, ciphertext lama tidak dapat dipulihkan.
Metadata tetap tersedia dan password dapat dimasukkan ulang untuk sesi sementara.
Jangan menghapus registry/ciphertext untuk memaksa init membuat kunci baru.
Rotasi kunci bukan operasi otomatis atau bagian brief ini.

Rollback kode memakai baseline sebelum Brief 03, mempertahankan `.git`, perubahan
pengguna, SQLite versi 2, kunci, konfigurasi privat dan backup. Jangan downgrade
schema untuk memaksa kode Brief 02 membuka versi 2. UI masih false sehingga
phpMyAdmin lama tetap memakai konfigurasi lamanya. Tidak ada reset, truncate,
penghapusan profil pengguna, atau operasi terhadap database remote untuk rollback.

## Pemeriksaan yang dijalankan

```sh
php test/local/passwords.php
php test/local/profiles.php
php test/local/foundation.php
python3 test/local/check_http.py
php scripts/local-profiles-init.php
php scripts/local-key.php init
php scripts/local-key.php init
php local-runtime.php
```

- **124 pemeriksaan password** lulus pada SQLite, key dan sesi PHP disposable:
  keep/replace/remove, empty password eksplisit, default off, validasi perintah,
  nonce acak, binary envelope, dekripsi proses PHP baru, transaksi gagal/lock,
  cascade delete, kunci hilang/salah/truncated/symlink/permission terbuka,
  penolakan regenerasi walau tidak ada rahasia lagi, ciphertext rusak dan
  envelope lintas profil, pemulihan hanya kunci asli, idempotensi CLI, registry
  gagal lalu retry tanpa regenerasi, serta upgrade v1→v2 tanpa perubahan metadata.
- Session test mencakup konteks/profil/revisi/sesi terpisah, native ID rotation,
  inactive session, expiry, tamper, disconnect, pencabutan profil, logout,
  session_destroy, dan sesi baru tanpa rahasia lama. File sesi tidak memuat
  plaintext password uji.
- Byte scan SQLite/sidecar dan output/stack trace uji dengan
  `zend.exception_ignore_args=0` tidak memuat password plaintext atau kunci uji.
  Projection list/detail tidak memuat envelope atau material kunci.
- Regresi **163 pemeriksaan profil**, **35 pemeriksaan fondasi**, dan suite HTTP
  lulus. Endpoint CLI init-key dan test password ditolak 404 lewat HTTP.
- Lint file PHP baru/berubah, `git diff --check`, integritas SQLite nyata, serta
  hash konfigurasi dan seluruh baris metadata/asal impor terhadap baseline
  diperiksa. Runtime web/CLI tetap 8.5.10; UI false; nol password nyata tersimpan.

Suite upstream PHPUnit/PHPCS/PHPStan/Psalm tidak tersedia dan tidak dijalankan.
Pemulihan kandidat salah/asli diuji pada fixture; master key instalasi nyata tidak
dirubah untuk mensimulasikan kerusakan. Power-loss, rotasi kunci, UI dan lifecycle
autentikasi/tab penuh belum diuji; masing-masing tidak diklaim selesai oleh brief
ini. Seluruh tes rahasia menggunakan data sintetis, tanpa koneksi/SQL remote.
