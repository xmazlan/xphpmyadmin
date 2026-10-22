# Brief 07 — Validasi rilis, dokumentasi, dan pemulihan

Tanggal: 22 Oktober 2026  
Status: belum dikerjakan  
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
