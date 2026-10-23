# Integrasi autentikasi dan isolasi tab

Implementasi Brief 05, 23 Oktober 2026.

## Kontrak internal untuk halaman Koneksi (Brief 06)

`local-connect.php` menerima POST JSON, dari loopback tanpa forwarded headers,
dengan sesi phpMyAdmin dan `token` CSRF yang sah. Fitur memerlukan
`profiles_enabled=true` dalam konfigurasi privat yang sudah diinisialisasi.
Endpoint ini tidak menjalankan autentikasi konfigurasi lama.

- Connect: `action=connect`, `profile_id`, `revision` integer, dan `credential`.
  Credential adalah `{source: input, password: ...}`, `{source: saved}`, atau
  `{source: session, context: ...}`. Password input eksplisit boleh kosong.
  Credential sesi harus berasal dari konteks valid untuk profil/revisi yang sama.
- Hasil sukses: `ok`, `context`, `url`, dan `target` tervalidasi. Navigasikan tab
  yang melakukan connect ke `url`; jangan menyalin database/tabel/editor tab lama.
  Konfirmasi editor yang belum disimpan merupakan pekerjaan UI Brief 06.
- Disconnect: `action=disconnect`, `context`. Mencabut capability tersebut dan
  password sementara miliknya. Konteks lain, termasuk profil yang sama, tetap sah.
- Logout: `action=logout`. Mencabut semua konteks/password sementara dan merotasi
  sesi serta CSRF. Logout phpMyAdmin juga membersihkan seluruh konteks.

Respons tidak berisi password. Error konteks memakai HTTP 409 `reconnect`;
CSRF 403, input 422, kegagalan transport 502, timeout 504, penyimpanan 503.
Tidak ada profil baru yang dibuat oleh Connect; `last_used_at` diperbarui hanya
setelah autentikasi, TLS, dan database awal berhasil divalidasi. Revisi diperiksa
ulang setelah validasi jaringan sebelum mencatat keberhasilan.

## Batas otoritas request

Parameter `xpma_context` adalah token acak 256-bit, terdaftar hanya dalam sesi PHP
pemiliknya dan terikat ke ID profil, revisi, nomor server cache, dan expiry.
ID profil, cookie server terakhir, maupun parameter `server` bukan otoritas target.
Saat fitur aktif, setiap request administrasi melalui `Common::run()` harus
memiliki capability valid; request tanpa konteks tidak mengakses server default.
Kerusakan/ketidaktersediaan konfigurasi privat juga gagal tertutup.
Saat fitur dimatikan, alur konfigurasi lama tersedia untuk request tanpa konteks;
URL konteks lama tetap ditolak, tanpa fallback.

Adapter membangun konfigurasi server hanya untuk request berjalan, dari default
bersih dan metadata profil terkini. `config.inc.php` tidak ditulis. Controluser,
socket, perintah inisialisasi, dan konfigurasi penyimpanan server lama tidak
diwariskan. ZeroConf dimatikan pada request profil agar tidak membuat penyimpanan
phpMyAdmin otomatis di target. Kedua handle user/control memakai konektor bersama
MySQL dengan verifikasi TLS dan database awal; tidak memakai fallback TLS legacy.
Nomor server berbeda untuk setiap konteks mengisolasi cache sesi phpMyAdmin.

Konteks dan credential sementara berumur tetap 1.440 detik, mengikuti default
layanan password sesi; kedaluwarsa meminta reconnect. Edit parameter/hapus profil
mencabut konteks dan password profil pada sesi aktif. Konteks sesi lain ditolak
berdasarkan revisi/keberadaan profil ketika dipakai, sebelum koneksi remote, dan
password sementaranya dibersihkan saat penolakan tersebut. Hapus tidak mengirim
SQL remote. Request yang sudah lolos validasi dan sedang menjalankan query tidak
dibatalkan secara paksa oleh edit/delete yang terjadi bersamaan.

Duplikat tab membawa capability yang sama dan tetap pada target yang sama.
Connect di salah satu tab membuat capability baru; capability lama tidak berubah.
Mencabut capability bersama membuat semua salinan meminta reconnect.

## Propagasi dan data UI

`Url::getCommonRaw()`, hidden inputs/fields, dan parameter JS header membawa
konteks. AJAX prefilter melengkapi request buatan JS ke `index.php` aplikasi yang
sama, tanpa mengirim capability ke origin/path lain. Konteks eksplisit yang sudah
ada tidak diganti oleh prefilter. SQL, navigasi, browse, unggah impor, dan unduh
ekspor melewati gate yang sama. Header membatasi referrer dan cache; URL capability
bukan password, tetapi tetap jangan dibagikan.

`Header::getJsParams()` menyediakan `validated_target`: ID, nama, host, port,
username, database awal, lingkungan, dan revisi. Ini sumber indikator Brief 06;
UI tidak perlu mempercayai ID profil atau label dari browser.

## Verifikasi dan batas pengujian

Jalankan `php test/local/foundation.php`, `php test/local/profiles.php`,
`php test/local/passwords.php`, `node test/local/context-js.cjs`, dan `python3 test/local/check_connections.py`.
Runner terakhir memerlukan binary MySQL/MariaDB terisolasi seperti dijelaskan
di [tes koneksi/TLS](tes-koneksi-dan-tls.md). Runner membuat datadir, SQLite,
kunci, sesi, akun sintetis, dan sertifikat disposable di luar repositori lalu
membersihkannya. Tidak memakai server/database pengguna.

`contexts.php` memeriksa lifecycle capability, expiry, lintas sesi, revision,
delete, session credential, last-used, dan pembersihan password. `context_http.py`
memakai satu cookie sesi dengan URL A/B terpisah untuk mensimulasikan tab,
refresh/duplikat, browse, query `@@port`, unggah SQL, ekspor CSV, connect/reconnect,
gagal connect, CSRF, disconnect, dan logout. Log remote diperiksa agar tidak ada
DDL/DML fase pengujian; sentinel serta kerahasiaan password diperiksa.
Pengujian ini memakai HTTP, bukan otomasi dua jendela browser. UI halaman Koneksi,
drawer, indikator, dan konfirmasi editor tetap cakupan Brief 06.
