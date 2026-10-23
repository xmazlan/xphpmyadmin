# Validasi rilis v1 — 23 Oktober 2026

Keputusan: **v1 diterima untuk penggunaan lokal pribadi pada runtime teruji**.
Seluruh F01–F12 memiliki bukti lulus. Tidak ada penghalang keamanan, isolasi,
atau persistensi yang tersisa pada suite penerimaan ini. Keputusan tidak mencakup
hosting publik, seluruh versi server/browser, atau simulasi kegagalan hardware.

Laporan mesin: [2026-10-23-validation.json](release/2026-10-23-validation.json).
Bukti UI browser pada Brief 06 tetap dipakai sebagai bukti yang dikumpulkan pada
23 Oktober; tidak diklaim dijalankan ulang sebagai otomasi browser di Brief 07.

## Environment

| Komponen | Yang benar-benar digunakan |
| --- | --- |
| Host | macOS 26.3 arm64, penggunaan lokal pribadi |
| Aplikasi | phpMyAdmin 5.2.3 + adapter profil lokal; schema SQLite 2 |
| PHP | CLI dan Herd FPM 8.5.12; mysqli/mysqlnd, OpenSSL, PDO SQLite, Sodium native |
| SQLite | 3.45.2; backup memakai VACUUM INTO dan uji committed WAL |
| Target A | MySQL 9.4.0, datadir/socket/port ephemeral milik fixture |
| Target B | MariaDB 11.4.13, datadir/socket/port ephemeral berbeda |
| Fixture tambahan | MariaDB sertifikat hostname salah dan non-TLS; peer handshake stall; port tertutup; CA/key salah |
| Akun fixture | SELECT pada schema fixture; INSERT hanya pada tabel import_probe; tidak diberi hak menulis sentinel |
| Identitas target | Nilai sentinel berbeda `unchanged-mysql` / `unchanged-mariadb`; port hasil SQL juga berbeda |
| Tool | Python 3.9.6, Node 22.23.4; PHP CLI untuk layanan dan recovery |
| Browser | Bukti Chrome desktop pada Brief 06, dengan fixture yang sudah dibersihkan |

Server terbuat dari datadir baru dalam TemporaryDirectory privat. Tidak ada
koneksi ke server pengguna atau production untuk pengujian. Tes HTTP Herd hanya
menggunakan diagnostik/guard/file canary, bukan autentikasi database pengguna.

## Matriks penerimaan F01–F12

| ID | Hasil | Bukti layanan/backend dan integrasi |
| --- | --- | --- |
| F01 Kelola profil | Lulus | `profiles.php`: CRUD/favorit/restart proses/transaksi; `profiles_http.py`: create/update/delete offline dan reload; restart proses web mempertahankan set ID; drawer/fokus/popup diuji di Brief 06. |
| F02 Parameter | Lulus | `profiles.php` / `ProfileInput`: field wajib, port integer/range, database opsional, lingkungan, path/pasangan TLS; `connections.php`: input invalid ditolak sebelum transport; UI seluruh field pada Brief 06. |
| F03 Tes koneksi | Lulus | `connections.php` + HTTP: MySQL/MariaDB, default TLS, mutual TLS, auth/db/DNS/network/timeout/certificate errors; snapshot SQLite dan konteks aktif tidak berubah. |
| F04 Simpan offline | Lulus | `profiles.php` dan `profiles_http.py`: host offline disimpan tanpa transport; DNS test gagal tidak menghapus input pada browser Brief 06. |
| F05 Reconnect | Lulus | `contexts.php` / `context_http.py`: input/saved/session, reconnect target eksplisit, profil tidak diduplikasi; saved credential tetap bekerja setelah proses PHP web direstart; browser reconnect Brief 06. |
| F06 Last-used | Lulus | Connect mencatat hanya setelah TLS/database awal valid; context test membandingkan timestamp sebelum/sesudah gagal connect; draft Test tidak mengubah timestamp; last-used dipertahankan saat restore. |
| F07 Rahasia opsional | Lulus | `passwords.php`: default off, keep/replace/remove, AEAD/nonce/binding, hilang/salah/korupsi key, ciphertext corrupt, kegagalan transaksi/tulis, restart dan expiry; read response/SQLite/log tidak memuat plaintext; `recovery.php` memulihkan kunci asli di lokasi baru. |
| F08 TLS | Lulus | Kedua engine: TLS verified dan non-TLS eksplisit; CA salah, hostname tidak cocok, pasangan cert/key salah, mutual TLS, tidak ada silent downgrade. TLS files berada di mesin PHP. |
| F09 Identitas target | Lulus | HTML/JS header membawa identitas tervalidasi sebagai objek tanpa warning PHP; bukti Chrome menunjukkan Production lewat teks/warna pada SQL dan browse. Batal pindah mempertahankan query/target; reconnect memberi identitas profil tepat. |
| F10 Isolasi tab | Lulus | A/B bergantian browse + SQL @@port + unggah SELECT/INSERT + CSV berbeda per target; gagal connect, duplicate/disconnect/logout, edit/delete, missing/forged/cross-session/conflicting/revision/expiry/store contexts ditolak. Browser A/B dan CodeMirror telah diuji di Brief 06. |
| F11 Hapus profil | Lulus | Transaksi lokal/cascade, password/konteks terkait dicabut; HTTP mengukur log sebelum/sesudah delete dan penolakan konteks: nol SQL remote. A tetap valid setelah B berubah/dihapus. Popup nama/host/dampak lokal diuji di Brief 06. |
| F12 Koneksi lama | Lulus | `profiles.php`: impor idempotent, concurrent import, edit/delete marker, restart, tidak mengimpor password; hash config.inc.php cocok baseline asli, pengujian rollback tidak menulis konfigurasi atau membuka koneksi remote. |

## Perintah dan hasil

```sh
python3 test/local/release.py --report doc/release/2026-10-23-validation.json
```

Runner berhenti pada kegagalan dan hanya menyimpan ringkasan aman, bukan exception
arguments, SQL/kredensial, cookie, atau isi konfigurasi privat. Suite yang lulus:

| Suite | Hasil |
| --- | --- |
| `php test/local/foundation.php` | 35 pemeriksaan |
| `php test/local/profiles.php` | 163 pemeriksaan |
| `php test/local/passwords.php` | 124 pemeriksaan |
| `php test/local/recovery.php` | 34 pemeriksaan |
| `node test/local/context-js.cjs` | 12 pemeriksaan kode sumber/distribusi |
| `python3 test/local/rollback.py` | Verifikasi arsip/config, ekstraksi staging dan adapter nonaktif tanpa SQL |
| `python3 test/local/check_http.py` | Herd FPM, LAN/listener, IPv4/IPv6, spoof, metode, storage/dependency errors, private canary dan CLI HTTP denial |
| `python3 test/local/check_connections.py` | 83 pemeriksaan koneksi + 23 lifecycle konteks, HTTP UI/A-B, restart web, dan audit log/sentinel |

Pemeriksaan tambahan: syntax seluruh PHP yang berubah/baru, JavaScript, kompilasi
syntax Python, dan `git diff --check`. Tool upstream PHPUnit/PHPCS/PHPStan/Psalm
belum tersedia; tidak diklaim dijalankan atau lulus.

## Bukti target dan batas efek samping

Browse dan unduhan CSV harus memuat nilai sentinel spesifik target, bukan sekadar
HTTP 200. SQL/unggah SELECT memeriksa port aktual. Unggah INSERT hanya diizinkan
ke `import_probe`, dengan marker `import_a` pada A dan `import_b` pada B. Query
balik membuktikan marker lawan tidak ada pada target tersebut.

Log remote hanya boleh memiliki dua INSERT allowlist itu selama fase uji, masing-
masing satu pada A/B; DDL/DML lainnya ditolak oleh assertion. Sentinel pada keempat
server tetap tepat satu baris dengan nilai awalnya. Setup akun/schema dilakukan
sebelum logging fase uji, hanya melalui socket datadir fixture yang baru dibuat.
Test yang memang menguji koneksi gagal tidak diartikan sebagai server online.

Missing/forged/cross-session/conflicting contexts ditolak sebelum koneksi/query
remote; penolakan setelah edit/delete juga tidak menghubungi target. CSRF/token/
metode dan non-loopback/spoof diperiksa sebelum efek samping. Password fixture
serta canary tidak muncul pada SQLite/read payload/URL/log/stack yang dipindai.

Instalasi nyata diperiksa dengan fingerprint read-only terhadap konfigurasi,
SQLite/kunci dan seluruh baris tabel lokal sebelum/sesudah gerbang rilis. Konfigurasi lama/privat, kunci, marker impor, ciphertext dan registry identik.
Jumlah profil tetap dua, tetapi fingerprint baris profil/SQLite berubah selama
situs tetap tersedia, dengan aktivitas last-used pada profil aktif. Karena
baseline audit menyimpan hash, bukan isi baris, audit tidak mengklaim perbandingan
field demi field atau seluruh metadata profil identik. Perubahan terkini tidak
ditimpa untuk membuat hash cocok. Nilai hash/isi rahasia tidak diterbitkan.

Seluruh mutasi runner mengarah ke store/datadir/port disposable eksplisit; tidak
ada endpoint mutasi profil atau SQL pengguna yang dipanggil oleh pemeriksaan
instalasi nyata. Tidak ada penggantian kunci aktif, reset schema, atau pemulihan
snapshot di atas data aktif. Variasi data live dicatat dalam installation_audit
pada laporan mesin, bukan disembunyikan sebagai hasil identik.

## Recovery, rollback, dan perubahan yang ditemukan

[Drill pemulihan](pemulihan-dan-backup.md) membuktikan snapshot WAL, restore semua
metadata/ID/favorit/last-used, key/ciphertext asli dan dekripsi setelah restart.
Tujuan existing/public/symlink serta backup rusak ditolak; restore hanya ke
instalasi baru yang disabled. Kunci aktif tidak diganti.

Review recovery menemukan risiko capability lama ikut sah ketika metadata lama
memiliki ID/revisi sama. Binding path/inode store ditambahkan dan diuji: context
store asli ditolak pada store hasil restore, serta password sementara lama dibuang.
Perubahan ini meminta konteks versi sebelumnya reconnect secara fail-closed.

Rollback kode/config baseline dilakukan pada staging privat yang dibersihkan;
jalur flag false diuji tidak mengubah konfigurasi dan tidak membuat SQLite/key.
Tidak dilakukan deployment baseline atau login memakai kredensial pengguna.
Arsip baseline asli dibaca tanpa mencetak isi config atau password.

## Batas dukungan dan keputusan

Tidak ada penghalang rilis lokal yang diketahui setelah gerbang ini lulus.
Batas verifikasi yang tetap dicatat:

- Chrome desktop mempunyai bukti manual; Safari/Firefox, mobile, dan screen reader
  belum diuji. Popup hapus dibatalkan di browser; penghapusan final diuji HTTP.
- Pengujian TCP loopback dan sertifikat fixture tidak membuktikan jaringan VPN,
  DNS/CA atau akses produksi tertentu; masing-masing masih harus dikonfigurasi
  oleh pengguna. SSH bawaan, multi-user/public hosting dan sinkronisasi di luar v1.
- Power-loss, kegagalan filesystem/hardware, dan pemulihan mesin penuh tidak
  disimulasikan. Backup tervalidasi bukan jaminan media penyimpanannya selalu sehat.
- Baseline arsip bersifat privat dan tidak dikirim bersama repo. Mesin lain harus
  mempunyai baseline tepercaya sendiri (`XPM_BASELINE_DIR`) untuk mengulang drill.

Semua datadir, akun, sertifikat, key, session dan staging yang dibuat suite ini
dihapus setelah proses fixture dihentikan. Bukti tersisa hanya kode tes dan
ringkasan hasil aman di laporan, bukan kredensial atau data fixture.
