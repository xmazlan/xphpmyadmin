# Brief 02 — Penyimpanan profil dan impor awal

Tanggal: 22 Oktober 2026  
Status: belum dikerjakan  
Sumber: [PRD](../../PRD.md)  
Urutan: 2 dari 7  
Dependensi: Brief 01 selesai.  
Cakupan PRD: F01, F02, F04, F06, F11, F12 (lapisan metadata).

## Tujuan

Menyediakan repositori profil persisten yang tetap bekerja saat seluruh server
remote offline, serta membawa koneksi lokal lama ke daftar awal.

## Pekerjaan

- Buat skema SQLite berversi dan migrasi nondestruktif. Profil memiliki ID stabil, nama, host, port, username, database awal opsional, lingkungan, TLS/rujukan file sertifikat, favorit, timestamps, dan revisi parameter koneksi.
- Sediakan layanan internal list/detail/create/update/delete/favorite dan pencatatan keberhasilan connect. Gunakan transaksi dan parameterized query; jangan menyimpan password plaintext di metadata.
- Validasi nama, host, username wajib; port integer 1–65535 dengan default 3306; lingkungan Local/Staging/Production/Other. Database awal opsional. Host adalah alamat database, bukan URL atau perintah shell.
- Simpan profil tanpa membuka koneksi remote. Izinkan beberapa profil dengan host sama; identitas profil tidak bergantung pada posisi daftar atau kombinasi host/username.
- Sediakan pencarian nama/host/username, filter favorit, dan urutan terakhir digunakan. Profil yang belum pernah berhasil connect tidak diberi timestamp keberhasilan palsu.
- Impor metadata koneksi lokal yang telah dikonfigurasi secara idempotent dengan penanda asal; jangan menyalin password atau menulis ulang config.inc.php. Setelah profil impor diedit/dihapus pengguna, startup berikutnya tidak menimpa/membuat ulang profil tersebut secara diam-diam.
- Perubahan host/port/username/database awal/TLS menaikkan revisi parameter untuk invalidasi sesi pada brief 05. Perubahan nama/favorit tidak mengganti identitas target.
- Siapkan operasi hapus atomik yang dapat menyertakan penghapusan rahasia pada brief 03; tidak menjalankan SQL terhadap server tujuan.

## Kriteria selesai dan pengujian

- CRUD/favorit tetap tersedia setelah proses dimulai ulang dan ketika remote offline.
- Input tidak valid ditolak di backend; profil dengan host sama tetap dapat dibuat sebagai profil berbeda.
- Impor berulang tidak menduplikasi profil, menimpa edit pengguna, atau mempersistenkan password.
- Kegagalan tulis/SQLite terkunci menghasilkan error yang benar tanpa data setengah tersimpan.
- Hanya operasi pencatatan connect sukses mengubah last_used_at; tes dan kegagalan tidak mengubahnya.
- Hapus profil tidak mengakses database remote.

## Hasil yang diserahkan

Migrasi SQLite, repositori/layanan metadata, impor idempotent, dan pengujian persistensi serta kegagalan tulis.

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

- Sebelumnya: [Brief 01](2026-10-22-01-fondasi-runtime-dan-akses-lokal.md).
- Berikutnya: [Brief 03](2026-10-22-03-penyimpanan-rahasia-dan-siklus-password.md).
