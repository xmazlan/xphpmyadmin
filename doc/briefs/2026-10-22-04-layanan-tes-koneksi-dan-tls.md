# Brief 04 — Layanan tes koneksi dan TLS

Tanggal: 22 Oktober 2026  
Status: selesai — layanan tes dan TLS diverifikasi 22 Oktober 2026
Sumber: [PRD](../../PRD.md)  
Urutan: 4 dari 7  
Dependensi: Brief 01–03 selesai.  
Cakupan PRD: F02, F03, F04, F08; dasar F05.

## Tujuan

Menguji parameter MySQL/MariaDB secara aman tanpa menyimpan profil,
mengganti server aktif, atau menjalankan perubahan data.

## Pekerjaan

- Buat layanan koneksi yang dipakai bersama oleh tes dan connect agar autentikasi/TLS tidak berbeda antaralur.
- Terima parameter draft untuk tes tanpa menyimpan profil. Password dapat berasal dari input sementara atau rahasia profil yang sah; jangan menaruh rahasia dalam URL.
- Gunakan timeout koneksi awal 10 detik; pisahkan dari timeout query administrasi. Tutup koneksi uji setelah selesai.
- Dukung TLS dengan verifikasi sertifikat, CA lokal opsional, serta pasangan sertifikat/kunci klien. Validasi file dapat dibaca dan pasangan lengkap; jangan tampilkan isi file.
- Profil remote baru default TLS aktif dengan verifikasi. Non-TLS harus pilihan eksplisit; tidak ada fallback otomatis saat handshake gagal. VPN tidak dideteksi atau diasumsikan.
- Verifikasi autentikasi dan database awal bila diisi. Database awal yang tidak dapat diakses menyebabkan kegagalan, bukan fallback ke database lain.
- Petakan kegagalan input, DNS/jaringan, timeout, autentikasi, database awal, TLS, dan penyimpanan lokal ke pesan aman. Hindari menampilkan exception mentah berisi rahasia.
- Tes hanya memerlukan operasi baca/handshake; tidak menjalankan DDL/DML atau memperbarui last_used_at. Simpan profil tetap bebas dari hasil tes.

## Kriteria selesai dan pengujian

- Tes sukses pada MySQL dan MariaDB disposable; parameter draft bisa diuji tanpa membuat profil.
- Password salah, host tidak terjangkau, timeout, dan database awal terlarang memberikan kategori error yang tepat.
- TLS valid sukses; CA salah, sertifikat tidak valid, dan key/cert tidak cocok gagal tanpa fallback.
- Tes sukses/gagal tidak mengganti konteks aktif, menulis data remote, atau mengubah timestamp penggunaan.
- Profil valid tetap dapat disimpan saat server offline.

## Hasil yang diserahkan

Layanan koneksi bersama, endpoint tes terlindungi CSRF, pemetaan error, dan pengujian jaringan/TLS.

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

Kontrak konektor bersama/endpoint, hasil uji MySQL dan MariaDB disposable,
pemisahan timeout, serta pemulihan:
[Tes koneksi dan TLS](../tes-koneksi-dan-tls.md). Flag UI tetap nonaktif;
integrasi Connect dan konteks tab mengikuti Brief 05.

## Navigasi

- Sebelumnya: [Brief 03](2026-10-22-03-penyimpanan-rahasia-dan-siklus-password.md).
- Berikutnya: [Brief 05](2026-10-22-05-integrasi-autentikasi-dan-isolasi-tab.md).
