# Brief 01 — Fondasi runtime dan akses lokal

Tanggal: 22 Oktober 2026  
Status: selesai — fondasi diverifikasi 22 Oktober 2026  
Sumber: [PRD](../../PRD.md)  
Urutan: 1 dari 7  
Dependensi: Tidak ada; dikerjakan pertama.  
Cakupan PRD: Fondasi untuk F01–F12; keamanan dan tahapan implementasi PRD.

## Tujuan

Menyiapkan lingkungan implementasi yang dapat dipulihkan, penyimpanan privat,
dan pembatasan akses lokal sebelum fitur profil diaktifkan.

## Pekerjaan

- Inventarisasi bootstrap, routing, autentikasi, sesi, serta build/test phpMyAdmin yang tersedia. Catat titik integrasi dan cara menjalankan pemeriksaan tanpa mengubah database pengguna.
- Buat baseline kode dan backup konfigurasi sebelum implementasi; simpan backup yang mengandung rahasia di luar repo/document root. Jangan mencetak kredensial.
- Periksa dukungan SQLite melalui PDO dan kemampuan Sodium pada runtime PHP yang benar-benar digunakan Herd. Nyatakan dependency tambahan secara eksplisit, jangan menganggap CLI dan web memakai runtime identik.
- Tetapkan konfigurasi lokasi data privat dan lokasi kunci terpisah di luar document root/repo; dokumentasikan permission untuk akun PHP, prosedur bootstrap, dan pesan error bila lokasi tidak dapat ditulis.
- Terapkan akses lokal pada aplikasi: izinkan loopback IPv4/IPv6, tolak akses jaringan lain. Jangan mempercayai forwarded header tanpa konfigurasi proxy tepercaya; bila Herd memakai proxy, verifikasi pembatasan juga pada titik masuk proxy.
- Tentukan integrasi proteksi CSRF yang sudah tersedia untuk seluruh endpoint mutasi baru. GET hanya untuk pembacaan.
- Dokumentasikan cara menonaktifkan fitur dan kembali ke baseline tanpa menghapus data profil atau database remote.

## Kriteria selesai dan pengujian

- Pemeriksaan runtime memberikan hasil yang jelas pada web dan CLI; dependency yang hilang gagal dengan pesan aman.
- Lokasi data/kunci berada di luar area publik dan tidak dapat diunduh melalui HTTP.
- Request loopback yang valid diterima; akses nonlokal dan upaya spoof forwarded header ditolak.
- Backup dapat dibaca kembali oleh akun yang berwenang, tanpa rahasia tercetak dalam laporan.
- Konfigurasi dan data database pengguna tetap utuh.

## Hasil yang diserahkan

Catatan arsitektur integrasi, konfigurasi bootstrap privat, pembatasan akses, dan panduan pemulihan baseline.

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

## Hasil implementasi

Catatan arsitektur, konfigurasi privat, hasil uji, keterbatasan, dan pemulihan:
[Runtime dan akses lokal](../runtime-dan-akses-lokal.md). Fitur profil tetap
nonaktif; tahap ini tidak mengimplementasikan F01–F12.

## Navigasi

- Sebelumnya: Tidak ada.
- Berikutnya: [Brief 02](2026-10-22-02-penyimpanan-profil-dan-impor-awal.md).
