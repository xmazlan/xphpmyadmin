# PRD — xphpMyAdmin Remote Connection Manager

Tanggal: 22 Oktober 2026  
Status: v1 diimplementasikan; validasi rilis lokal pribadi 23 Oktober 2026.
Bukti dan batas dukungan: [matriks penerimaan](doc/validasi-rilis-v1.md).
Basis aplikasi: phpMyAdmin 5.2.3.

## 1. Tujuan dan keputusan produk

Pengguna dapat menyimpan profil MySQL/MariaDB remote, memilihnya kembali, dan
menggunakan kemampuan administrasi phpMyAdmin tanpa mengedit konfigurasi server
secara manual untuk setiap koneksi.

Keputusan yang telah dipilih pengguna:

- Aplikasi berjalan lokal untuk penggunaan pribadi di Mac.
- Koneksi langsung atau melalui VPN; tunnel dikelola di luar aplikasi.
- Password boleh disimpan terenkripsi secara opsional, dengan default tidak disimpan.

Pengguna utama adalah developer/operator yang mengelola beberapa database lokal,
staging, dan production. Keberhasilan v1 diukur dari profil yang tetap tersedia
setelah aplikasi/browser dibuka ulang, koneksi ulang yang mudah, dan tidak adanya
perpindahan target query tanpa tindakan pengguna pada tab terkait.

Kondisi awal: konfigurasi yang diperiksa menunjuk ke `127.0.0.1:3306` dengan
`auth_type = config`. Kondisi awal tersebut dipertahankan sebagai baseline; fitur v1 yang lulus
dicatat dalam matriks penerimaan dan README.

## 2. Cakupan dan pengalaman pengguna

### Tata letak yang direkomendasikan

- Halaman **Koneksi** menjadi pintu masuk pengelolaan profil.
- Daftar menampilkan nama, host/port, username, lingkungan, favorit, dan waktu
  terakhir berhasil digunakan. Password tidak pernah ditampilkan di daftar.
- Pencarian berdasarkan nama, host, atau username; filter favorit dan urutan
  terakhir digunakan tersedia. Timestamp terakhir bukan status online saat ini.
- Drawer untuk tambah/edit profil; popup konfirmasi untuk hapus profil.
- Dari layar administrasi tersedia akses kembali ke pengelola koneksi serta
  indikator nama server, host/port, dan lingkungan aktif.

### Alur utama

1. Pengguna membuka halaman Koneksi dan memilih profil atau menambahkan profil baru.
2. Pengguna mengisi parameter, lalu dapat menjalankan **Tes koneksi** tanpa menyimpan.
3. **Simpan** menyimpan profil meskipun server offline, selama input valid.
4. **Hubungkan** pada profil tersimpan meminta password jika belum tersedia dalam
   sesi atau penyimpanan rahasia, lalu membuka konteks administrasi setelah berhasil.
5. Keberhasilan Hubungkan memperbarui waktu terakhir digunakan pada profil yang sama.
   Tes koneksi tidak menambahkan riwayat penggunaan atau mengganti server aktif.
6. Saat berpindah server, konteks database di tab tersebut diinisialisasi ulang;
   editor dengan perubahan belum disimpan meminta konfirmasi sebelum navigasi.

Drawer dengan perubahan belum disimpan meminta pengguna menyimpan sebelum
Hubungkan; pengguna tetap dapat melakukan Tes koneksi tanpa menyimpan. Profil
tersimpan menjadi sumber daftar terakhir digunakan, sehingga reconnect tidak
membuat profil duplikat. Profil berbeda untuk host yang sama tetap diperbolehkan,
misalnya untuk username atau database awal berbeda.

### Di luar cakupan v1

- Login aplikasi untuk banyak pengguna, pembagian profil, dan hosting publik.
- SSH tunnel bawaan, sinkronisasi antarperangkat, dan ekspor/impor profil.
- PostgreSQL atau mesin database lain di luar MySQL/MariaDB.
- Penyalinan isi database, scheduler backup, dan riwayat SQL lintas server baru.
- Mode read-only buatan aplikasi; hak akses tetap mengikuti akun database.

## 3. Kebutuhan fungsional

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| F01 | Kelola profil | Tambah, baca, edit, favorit, dan hapus tersedia; data bertahan setelah restart. |
| F02 | Parameter koneksi | Nama, host, port, username wajib; database awal opsional; lingkungan Local/Staging/Production/Other tersedia. Port default 3306 dan valid 1–65535. |
| F03 | Tes koneksi | Menguji autentikasi, TLS, dan akses database awal jika diisi, tanpa menulis data atau mengubah server aktif. |
| F04 | Simpan saat offline | Kegagalan jaringan tidak menghalangi penyimpanan profil yang valid. |
| F05 | Koneksi ulang | Profil dapat dipilih kembali; password diminta hanya jika tidak tersedia untuk profil tersebut. |
| F06 | Terakhir digunakan | Hanya Hubungkan yang berhasil memperbarui timestamp; kegagalan tidak menimpa waktu berhasil terakhir. |
| F07 | Rahasia opsional | Simpan password default mati; mengaktifkannya menyimpan ciphertext, menonaktifkannya menghapus rahasia persisten. |
| F08 | TLS | Mendukung TLS dengan verifikasi sertifikat dan CA lokal opsional, serta pasangan sertifikat/kunci klien bila diperlukan. Tidak ada fallback diam-diam ke non-TLS. |
| F09 | Identitas target | Nama, host/port, dan lingkungan terlihat selama administrasi; Production dibedakan dengan teks dan warna. |
| F10 | Isolasi tab | Membuka server B tidak mengubah target query, navigasi, atau aksi di tab server A. |
| F11 | Hapus profil | Konfirmasi menyebut nama/host; hanya profil, rahasia, dan konteks sesi terkait yang dihapus atau dinonaktifkan, tanpa SQL ke server tujuan. |
| F12 | Koneksi lama | Koneksi lokal yang sudah dikonfigurasi tersedia sebagai profil awal melalui impor idempotent; password tidak dipersistenkan otomatis. |

Edit host, port, username, database awal, atau TLS membatalkan konteks koneksi lama
untuk profil terkait dan meminta koneksi ulang. Tab lama menampilkan kebutuhan
reconnect, bukan mengarahkan operasi berikutnya secara diam-diam ke target baru.

Untuk TLS, default yang direkomendasikan bagi profil remote baru adalah aktif
dengan verifikasi sertifikat. Pengguna dapat memilih non-TLS secara eksplisit
untuk koneksi lokal atau jaringan privat. Keamanan jaringan VPN tidak diasumsikan
atau dideteksi otomatis. Alamat file CA/sertifikat/kunci merujuk ke mesin PHP.

## 4. Penyimpanan, keamanan, dan integrasi

Bagian ini mencatat rekomendasi teknis awal. Implementasi aktual dan bukti
validasinya dijelaskan dalam matriks penerimaan; detail operasional ada di README.

- Gunakan SQLite lokal di luar document root. Penyimpanan tidak bergantung pada
  server tujuan, sehingga daftar profil tetap dapat dibuka ketika remote offline.
- Profil memiliki ID stabil, nama, host, port, username, database awal opsional,
  lingkungan, konfigurasi TLS, favorit, waktu dibuat/diubah, dan waktu terakhir
  berhasil digunakan. Jangan menggunakan nomor urut daftar sebagai identitas.
- Rahasia disimpan dengan authenticated encryption menggunakan fasilitas Sodium
  yang tersedia pada basis aplikasi; kunci acak terpisah dari SQLite dan repo,
  dengan izin filesystem hanya untuk akun yang menjalankan aplikasi.
- Password tidak dikirim kembali dalam respons baca profil, diisi ulang ke form,
  atau disimpan dalam localStorage, URL, pesan error, maupun log. Form edit harus
  membedakan mempertahankan, mengganti, dan menghapus password tersimpan.
- Password tanpa persistensi hanya tersedia selama sesi lokal yang relevan;
  disconnect/logout menghapus rahasia sementara dan konteks autentikasi terkait.
- Jika kunci hilang atau ciphertext gagal diverifikasi, profil tetap terlihat;
  minta password ulang dan jangan mengganti kunci atau menghapus data diam-diam.
- Gunakan transaksi untuk perubahan profil/rahasia; kegagalan tulis harus terlihat
  dan tidak dilaporkan sebagai berhasil. Backup mencakup metadata dan mekanisme
  pemulihan kunci yang terpisah; backup tanpa kunci tidak memulihkan password.
- Request kelola profil memakai validasi server-side, proteksi CSRF, dan aturan
  akses lokal. Operasi mutasi tidak menggunakan GET. Jangan menganggap hostname
  `.test` otomatis mencegah akses dari jaringan; verifikasi pembatasan loopback.
- Integrasikan profil dengan alur autentikasi dan pemilihan server phpMyAdmin;
  jangan menghasilkan ulang `config.inc.php` setiap kali pengguna mengedit profil.
- Setiap request database membawa konteks koneksi yang divalidasi di backend.
  Jangan mengandalkan satu variabel server aktif global untuk semua tab.
- Tidak ada public API baru yang dijanjikan v1. Antarmuka internal menyediakan
  daftar/detail profil, simpan/hapus/favorit, tes, connect, dan disconnect dengan
  ID profil stabil; payload baca hanya menyatakan apakah password tersimpan.

Tes koneksi memiliki timeout koneksi awal 10 detik yang direkomendasikan, terpisah
dari timeout query administrasi. Error membedakan input tidak valid, DNS/jaringan,
timeout, autentikasi, database awal, sertifikat, dan penyimpanan lokal tanpa
membocorkan rahasia. Database awal yang tidak dapat diakses tidak boleh diam-diam
diganti dengan database lain.

## 5. Validasi dan kriteria rilis

- CRUD, pencarian, favorit, dan urutan terakhir digunakan bekerja setelah restart.
- Profil offline bisa disimpan; tes gagal tidak mengubah profil atau koneksi aktif.
- MySQL dan MariaDB berhasil diakses dengan akun valid; password salah, host tidak
  terjangkau, timeout, dan database awal tidak diizinkan menghasilkan error jelas.
- TLS valid berhasil; CA salah, sertifikat tidak valid, atau key/cert tidak cocok
  gagal tanpa menurunkan keamanan secara otomatis.
- Password yang tidak disimpan hilang setelah sesi berakhir; password yang disimpan
  dapat dipakai kembali dan tidak muncul sebagai plaintext pada SQLite atau log.
- Mengganti/menghapus password dan kehilangan kunci diuji; profil tetap dapat dipulihkan
  melalui input password baru, tanpa penghapusan metadata otomatis.
- Dua tab pada server berbeda diuji dengan query identifikasi target; connect,
  disconnect, edit, dan hapus profil tidak mengalihkan aksi tab lain ke server salah.
- Menghapus profil tidak menghapus database/tabel remote. Pengujian memakai database
  disposable, bukan database production atau koneksi pengguna yang sedang aktif.
- Impor konfigurasi lokal idempotent; tidak menulis ulang konfigurasi lama atau
  menyimpan passwordnya tanpa pilihan pengguna.
- Browse tabel, SQL, serta impor/ekspor phpMyAdmin diuji pada target disposable untuk
  memastikan konteks server yang benar setelah integrasi.
- Uji penyimpanan tidak dapat ditulis, request CSRF tidak valid, dan akses nonlokal
  untuk memastikan kegagalan ditolak dengan jelas.

Rilis diterima ketika seluruh kebutuhan F01–F12 terpenuhi dan regresi alur
administrasi dasar lulus. Tidak diperlukan telemetri eksternal untuk v1.

## 6. Tahapan implementasi

1. Siapkan baseline versi dan backup konfigurasi; validasi kebutuhan runtime SQLite,
   lokasi penyimpanan privat, serta pembatasan akses lokal tanpa mengubah data remote.
2. Bangun penyimpanan profil, penyimpanan rahasia, dan impor konfigurasi awal idempotent.
3. Bangun halaman/drawer, validasi, tes koneksi, favorit, dan riwayat penggunaan.
4. Integrasikan autentikasi, konteks antar-tab, indikator target, dan disconnect.
5. Jalankan kriteria rilis pada database disposable dan perbarui README sesuai fitur
   yang benar-benar tersedia. Jika integrasi gagal, kembali ke baseline konfigurasi
   aplikasi; jangan mereset atau menghapus database tujuan.

## Referensi

- [README proyek](README)
- [Dokumentasi konfigurasi phpMyAdmin 5.2](https://docs.phpmyadmin.net/en/release_5_2_0/config.html)
- Manifest lokal: `composer.json` dan `package.json`.

## 7. Keputusan rilis — 23 Oktober 2026

F01–F12 lulus bukti layanan, HTTP dan pemulihan pada runtime lokal teruji.
V1 diterima untuk penggunaan lokal pribadi dengan MySQL 9.4.0 / MariaDB 11.4.13,
PHP CLI/FPM 8.5.12 dan SQLite 3.45.2. Backup/restore diuji ke direktori baru;
rollback baseline diuji melalui ekstraksi privat dan jalur konfigurasi nonaktif,
bukan deployment atau login ke database pengguna. Konteks juga diikat ke identitas
penyimpanan agar restore tidak menghidupkan capability sesi lama.

UI Chrome desktop mempunyai bukti Brief 06; browser lain, mobile, screen reader,
VPN aktual, power-loss/hardware failure, dan suite upstream yang tidak terpasang
belum diklaim teruji. Tidak ada kegagalan keamanan/isolation/persistensi yang
tersisa pada suite penerimaan lokal. Lihat [laporan rilis](doc/validasi-rilis-v1.md)
untuk cakupan, perintah, bukti tiap F, dan batasan lengkap.

## Perluasan v2 — 23 Oktober 2026

Keputusan v1 memakai tunnel eksternal tetap catatan baseline. V2 menambahkan
transport SSH OpenSSH bawaan, trust host key eksplisit, registry/lease per konteks,
cleanup CLI dan diagnostik hasil aktual. Profil direct/VPN dan identitas target
logis tetap berlaku. TLS terverifikasi melalui SSH diblokir pada driver mysqli
saat ini; tidak ada downgrade otomatis. Panduan dan cakupan validasi tersedia di
[SSH dan diagnostik](doc/ssh-dan-diagnostik.md) dan
[matriks penerimaan v2](doc/release/2026-10-23-v2.md).
