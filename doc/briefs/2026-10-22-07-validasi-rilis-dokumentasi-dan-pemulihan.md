# Brief 07 — Validasi rilis, dokumentasi, dan pemulihan

Tanggal: 22 Oktober 2026  
Status: selesai — gerbang rilis dan drill pemulihan lulus 23 Oktober 2026
Sumber: [PRD](../../PRD.md)  
Urutan: 7 dari 7  
Dependensi: Brief 01–06 selesai.  
Cakupan PRD: Verifikasi menyeluruh F01–F12 dan seluruh kriteria rilis PRD.

## Tujuan

Membuktikan bahwa v1 memenuhi PRD dan dapat dijalankan serta dipulihkan tanpa
mengubah data database pengguna selama pengujian.

## Pekerjaan

- Susun matriks F01–F12 ke bukti pengujian dari brief 02–06; catat hasil, environment, dan masalah tersisa. Jangan menganggap penyelesaian UI sebagai bukti integrasi backend.
- Siapkan MySQL dan MariaDB disposable dengan target A/B yang mudah dibedakan, akun terbatas, serta fixture TLS valid/tidak valid. Jangan memakai koneksi production atau database pengguna untuk tes destruktif.
- Jalankan skenario restart, CRUD offline, favorit/pencarian, impor idempotent, password opsional, kunci hilang, ciphertext rusak, dan kegagalan tulis.
- Jalankan regresi multi-tab serta browse, SQL, impor/ekspor, connect/disconnect/logout, edit target, dan hapus profil. Buktikan setiap operasi mencapai server yang dimaksud.
- Verifikasi CSRF, penolakan akses nonlokal, konteks invalid, dan tidak adanya rahasia pada log/URL/respons baca. Jangan mencetak rahasia nyata untuk membuktikan pemeriksaan.
- Uji backup/restore metadata dan kunci pada direktori sementara privat. Uji rollback ke baseline konfigurasi; jangan menghapus database remote atau mengganti kunci aktif.
- Perbarui README dengan kebutuhan runtime, setup lokal, penyimpanan privat, cara penggunaan, backup/restore, troubleshooting, serta batas cakupan. Tandai hanya fitur yang benar-benar lulus sebagai tersedia.
- Perbarui status PRD/brief berdasarkan hasil aktual dan catat batasan yang menghalangi rilis. Bersihkan fixture disposable milik pengujian setelah bukti dikumpulkan.

## Kriteria selesai dan pengujian

- Seluruh F01–F12 mempunyai bukti lulus; kegagalan keamanan/isolation/persistensi menjadi penghalang rilis.
- MySQL dan MariaDB lulus regresi dasar serta koneksi TLS sesuai PRD.
- Tidak ada perubahan data remote pengguna akibat pengujian, impor konfigurasi, atau penghapusan profil.
- Backup dapat dipulihkan di lingkungan sementara dan rollback aplikasi terdokumentasi tanpa reset data.
- README sesuai perilaku yang tersedia, tanpa menyatakan pengujian yang tidak dijalankan sebagai lulus.

## Hasil yang diserahkan

Matriks penerimaan dan laporan uji, dokumentasi penggunaan/pemulihan, serta keputusan kesiapan rilis berbasis bukti.

Sertakan ringkasan perubahan, pemeriksaan yang benar-benar dijalankan, hasilnya,
dan keterbatasan yang masih ada. Jangan menandai brief selesai bila kriteria
penerimaan belum terpenuhi.

## Batasan bersama

- Implementasi lokal pribadi, MySQL/MariaDB, akses langsung/VPN; tanpa SSH bawaan,
  multi-user, hosting publik, atau sinkronisasi profil.
- Pilihan produk pada PRD tetap berlaku. Detail teknis di brief adalah arahan
  implementasi; cocokkan dengan kode yang ada dan dokumentasikan penyesuaian.
- Pertahankan konfigurasi lama dan data remote. Tidak ada reset/truncate database
  pengguna; pengujian menggunakan fixture disposable dan data sintetis.
- Jangan mencantumkan password/kunci nyata di kode, dokumentasi, log, atau laporan.
- Brief ini tidak menyatakan bahwa fitur telah diimplementasikan.

## Navigasi

- Sebelumnya: [Brief 06](2026-10-22-06-halaman-koneksi-dan-drawer-profil.md).
- Berikutnya: Tidak ada; akhir rangkaian v1.

## Hasil implementasi — 23 Oktober 2026

- [Matriks F01–F12 dan keputusan rilis](../validasi-rilis-v1.md) tersedia, dengan
  bukti layanan, HTTP, UI Brief 06, environment, efek samping dan batasan.
- [Laporan mesin](../release/2026-10-23-validation.json) mencatat seluruh gerbang
  PASS pada PHP CLI/FPM 8.5.12, SQLite 3.45.2, MySQL 9.4.0 dan MariaDB 11.4.13.
- CLI `scripts/local-backup.php` membuat snapshot SQLite/WAL tervalidasi dengan
  kunci terpisah, serta restore ke direktori baru dengan fitur disabled. Tidak
  menimpa store/kunci/config aktif atau menginisialisasi ulang kunci.
- Konteks ditambah binding identitas store agar restore tidak menghidupkan sesi
  lama. Penolakan sekaligus membersihkan password sementara konteks lama.
- Regresi A/B sekarang memakai sentinel berbeda dan INSERT terbatas pada probe
  disposable, query balik dan ekspor CSV spesifik target, edit/delete tanpa SQL,
  restart proses web dan saved-password reconnect, serta rollback flag fail-closed.
- [README](../../README), [PRD](../../PRD.md), dan
  [panduan backup/pemulihan](../pemulihan-dan-backup.md) sesuai implementasi aktual.

Perintah utama `python3 test/local/release.py --report doc/release/2026-10-23-validation.json` lulus: fondasi 35, profil 163, password
124, recovery 34, AJAX 12, koneksi 83, lifecycle 23, suite HTTP UI/multi-tab,
Herd/LAN guards, dan drill arsip rollback. Syntax 19 PHP, 7 JavaScript, 6 Python
serta `git diff --check` lulus. Kode/config baseline diekstrak ke staging privat;
tidak dideploy atau dipakai login ke database pengguna.

Semua fixture baru dibersihkan; sentinel remote utuh dan hanya dua INSERT probe
allowlist terjadi. Konfigurasi/kunci/marker impor/rahasia/registry instalasi nyata
identik; fingerprint profil live berubah selama situs tersedia, dan variasi itu
dicatat tanpa menimpa data pengguna. Pengujian tetap hanya memutasi fixture.

Keputusan: v1 siap untuk penggunaan lokal pribadi pada runtime teruji. Tidak ada
penghalang keamanan/isolation/persistensi yang tersisa dalam suite penerimaan.
Chrome desktop mempunyai bukti Brief 06; browser lain, mobile, screen reader,
VPN aktual, power-loss/hardware failure dan suite upstream yang tidak terpasang
belum diklaim teruji. Rincian batas dukungan terdapat di matriks penerimaan.
