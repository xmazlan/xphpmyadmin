# Backup, restore, dan rollback lokal

Diverifikasi 23 Oktober 2026. Tool CLI tidak memakai MySQL/MariaDB dan tidak
menimpa konfigurasi, SQLite, atau kunci instalasi aktif ketika restore.

## Backup konsisten

Jalankan sebagai akun pemilik penyimpanan PHP. Parent tujuan harus sudah ada,
berada di luar semua document root/alias publik dan bersifat privat. Kedua leaf
metadata/kunci harus baru, kanonis, absolut, terpisah, dan bukan symlink.
Contoh berikut memakai placeholder path, bukan lokasi data pengguna:

```sh
php scripts/local-backup.php backup /absolute/private/backups/metadata-NEW /absolute/private/backups/keys-NEW
```

Tool membaca konfigurasi melalui `XPHPMYADMIN_LOCAL_CONFIG` atau lokasi privat
default. Tool tidak menginisialisasi schema atau kunci. `VACUUM INTO` SQLite
3.27+ memotret data konsisten termasuk commit WAL; hasil snapshot di-flush dan
diverifikasi. Hasil:

- `metadata-NEW/profiles.sqlite`: semua metadata, marker impor, ciphertext dan
  registry kunci. File 0600 di direktori 0700.
- `metadata-NEW/manifest.json`: versi format/schema, jumlah profil, timestamp dan
  checksum. Tidak berisi password/kunci atau path instalasi aktif.
- `keys-NEW/master.key`: salinan kunci asli, 0600; tidak dibuat jika instalasi
  memang belum pernah menginisialisasi kunci.

Integrity check, foreign keys, registry kunci dan AEAD seluruh ciphertext harus
lulus sebelum backup dilaporkan berhasil. Kunci hilang, salah, atau ciphertext
rusak membuat backup penuh gagal secara aman. Tool tidak menghapus metadata
sumber dan tidak membuat kunci pengganti. Snapshot ini bukan fitur ekspor profil
UI atau penyimpanan isi database remote.

Simpan kedua bagian secara terpisah dan privat. Backup metadata tanpa kunci
asli tidak memulihkan password. Checksum mendeteksi kerusakan snapshot, bukan
pengganti custody backup terpercaya. Simpan juga konfigurasi privat dan
`config.inc.php`/arsip kode secara privat bila memerlukan disaster recovery;
file-file tersebut dapat mengandung kredensial dan tidak masuk laporan publik.

## Restore ke lokasi baru

```sh
php scripts/local-backup.php restore /absolute/private/backups/metadata-NEW /absolute/private/backups/keys-NEW /absolute/private/recovered-NEW
XPHPMYADMIN_LOCAL_CONFIG=/absolute/private/recovered-NEW/local.json php local-runtime.php
```

Restore memeriksa checksum, schema, integritas, kunci sesuai registry dan semua
ciphertext sebelum membuat tujuan. Tujuan harus belum ada. Hasilnya:

```text
recovered-NEW/
  local.json       # path data/key sudah disesuaikan; profiles_enabled=false
  data/profiles.sqlite
  keys/master.key  # hanya bila backup berisi kunci terdaftar
```

Tidak ada sesi, cookie, password sementara, atau capability yang disalin.
Profil, ID, revisi, favorit, marker impor dan last-used dipertahankan. Kunci asli
disalinkan tanpa rotasi; target aktif tidak pernah dipakai sebagai tujuan
implisit. Tool menolak tujuan yang sudah ada, termasuk direktori instalasi aktif.

Setelah verifikasi:

1. Hentikan akses situs sementara dan pertahankan instalasi lama sebagai fallback.
2. Arahkan **CLI dan FPM** ke `local.json` hasil restore, bukan mengedit path file
   backup agar menunjuk kembali ke direktori aktif lama.
3. Jalankan diagnostik CLI dan web, periksa loopback/permission, lalu aktifkan flag
   profil pada konfigurasi hasil restore bila siap digunakan.
4. Hubungkan ulang. Konteks terikat ke path/inode penyimpanan; konteks store lama
   ditolak walaupun profil dan revisinya sama. Konteks dari versi sebelum binding
   ini juga meminta reconnect. Jangan memindahkan file DB aktif sambil melayani query.

Tabel `profiles` dan registry tidak dimigrasikan/downgrade oleh restore. Schema
lebih baru harus dipulihkan dengan versi aplikasi yang mendukungnya. Tool saat
ini menerima schema 2 dan format backup 1.

## Kunci hilang atau ciphertext rusak

Profil tetap dapat dibaca. Jangan menghapus SQLite, registry atau profil untuk
memperbaiki kunci hilang. Password input dapat dipakai kembali tanpa membaca
rahasia persisten yang rusak. Bila memiliki **backup kunci asli yang sesuai**,
prosedur terpisah ini memulihkan file kunci pada instalasi yang dipilih:

```sh
php scripts/local-key.php restore /absolute/private/original-master-key-backup
```

Perintah tersebut adalah perbaikan kunci eksplisit, berbeda dari restore instalasi
baru. Ia hanya menerima kunci yang cocok dengan registry; tidak merotasi kunci
atau mengubah ciphertext. Jangan menjalankan `init` untuk mengganti kunci yang
hilang. Kunci yang sesuai tidak memperbaiki ciphertext yang sudah rusak: input
ulang password dan pilih replace secara eksplisit untuk profil yang bersangkutan.
Drill semua kondisi tersebut dijalankan hanya pada fixture, bukan kunci aktif.

## Rollback konfigurasi dan kode

Rollback fitur paling sempit adalah mengubah `profiles_enabled` menjadi false.
Simpan SQLite/kunci dan konfigurasi server lama. URL tanpa konteks kembali ke
alur legacy; URL dengan konteks selalu ditolak dan tidak memakai server default.
Pemadaman flag bukan penghapusan profil, perubahan kredensial, atau reset schema.

Baseline awal berada secara privat di:

```text
~/Library/Application Support/xphpmyadmin/backups/20261022-161158/
  baseline.tar.gz
  manifest.json
```

`manifest.json` mencatat checksum arsip dan konfigurasi. Untuk pemulihan kode
penuh, hentikan akses situs, simpan tree saat ini serta perubahan pengguna,
verifikasi checksum, lalu ekstrak baseline ke staging privat baru. Periksa bahwa
`config.inc.php` yang diharapkan identik sebelum melakukan pergantian root situs.
Pertahankan `.git`, SQLite/kunci, konfigurasi privat dan backup versi sekarang.
Jangan menjalankan ekstraksi di atas tree aktif, `rsync --delete`, migrasi fresh,
reset/truncate database, atau menimpa perubahan pengguna untuk rollback.

Baseline sebelum guard aplikasi harus tetap dibatasi listener web loopback bila
kelak dijalankan. Drill rilis tidak melakukan deployment baseline atau login SQL
menggunakan kredensial nyata; ia memulihkan kode/config ke staging privat,
memeriksa checksum, dan menguji jalur adapter nonaktif tanpa koneksi remote.

## Bukti drill

- `php test/local/recovery.php`: 34 pemeriksaan. Snapshot WAL, metadata/ID/favorit/
  revisi/last-used identik, password asli pulih, proses PHP baru dapat dekripsi,
  izin file/direktori, CLI backup/restore, penolakan overwrite, public path,
  symlink, kunci salah/hilang, checksum rusak, AEAD rusak walau checksum dihitung
  ulang, dan restore instalasi tanpa kunci tanpa regenerasi. Semua fixture privat
  dibersihkan setelah tes.
- `python3 test/local/rollback.py`: checksum arsip awal cocok, konfigurasi baseline
  identik dengan `config.inc.php` aktif, ekstraksi kode lengkap ke staging privat,
  adapter nonaktif tidak mengubah konfigurasi, tidak membuat SQLite/kunci dan
  tidak membuka database. Staging dibersihkan.
- `test/local/contexts.php` melalui runner koneksi: capability store asli ditolak
  pada store hasil restore dan password sementara lama dibersihkan.
- HTTP restart PHP: ID profil tetap sama dan saved-password reconnect berhasil.
  Flag nonaktif menolak URL konteks lama sebelum SQL; delete/revocation tidak
  mengeksekusi SQL remote.

Uji ini bukan simulasi power-loss, media penyimpanan rusak, atau pemulihan mesin
penuh. Jangan menyatakan backup pulih hanya karena copy selesai: gunakan restore
ke direktori privat baru dan pemeriksaan aplikasi sebelum bergantung padanya.
