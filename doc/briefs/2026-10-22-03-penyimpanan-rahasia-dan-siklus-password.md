# Brief 03 — Penyimpanan rahasia dan siklus password

Tanggal: 22 Oktober 2026  
Status: selesai — layanan rahasia diverifikasi 22 Oktober 2026
Sumber: [PRD](../../PRD.md)  
Urutan: 3 dari 7  
Dependensi: Brief 01–02 selesai.  
Cakupan PRD: F07; mendukung F05 dan F11.

## Tujuan

Menyediakan password opsional terenkripsi dan aturan sesi yang jelas tanpa
membocorkan rahasia lewat UI, log, atau metadata.

## Pekerjaan

- Gunakan authenticated encryption Sodium dengan nonce acak dan kunci acak privat terpisah dari SQLite/repo. Gunakan implementasi kriptografi yang tersedia, bukan algoritme buatan sendiri.
- Default simpan password mati. Antarmuka internal membedakan keep, replace, dan remove; field kosong tidak boleh secara ambigu menghapus atau mengganti rahasia.
- Simpan metadata dan perubahan ciphertext dalam transaksi SQLite yang sama. Menonaktifkan persistensi menghapus ciphertext; menghapus profil menghapus rahasia terkait.
- Respons baca hanya menyertakan indikator password tersimpan, tanpa plaintext/ciphertext atau isi kunci. Password tidak diisi ulang ke form, URL, localStorage, pesan error, atau log.
- Sediakan fasilitas rahasia sementara server-side untuk konteks sesi; integrasikan penghancurannya pada disconnect/logout melalui brief 05.
- Kunci hilang atau ciphertext rusak membuat rahasia tidak dapat digunakan tetapi metadata tetap terbaca. Minta password ulang; jangan membuat kunci pengganti atau menghapus rahasia lama secara otomatis.
- Dokumentasikan backup dan pemulihan metadata beserta kunci secara terpisah. Pemulihan kunci harus eksplisit dan tidak merusak rahasia profil lain.

## Kriteria selesai dan pengujian

- Password yang dipersistenkan dapat didekripsi setelah restart; SQLite dan output log tidak memuat plaintext uji.
- Keep mempertahankan password, replace mengganti, remove menghapus; transaksi gagal tidak meninggalkan metadata/rahasia tidak konsisten.
- Password tanpa persistensi tidak tersedia setelah sesi berakhir.
- Kunci hilang/salah dan ciphertext dimodifikasi ditolak; daftar profil tetap dapat diakses.
- Payload baca tidak mengandung password, ciphertext, atau kunci; hapus profil membersihkan rahasianya.

## Hasil yang diserahkan

Layanan rahasia, kontrak operasi password, pengujian siklus rahasia, dan prosedur backup/pemulihan.

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

Kontrak password, penyimpanan sesi, pengujian, backup dan pemulihan kunci:
[Rahasia dan siklus password](../rahasia-dan-siklus-password.md). UI tetap
nonaktif; pemasangan hook disconnect/logout mengikuti integrasi Brief 05.

## Navigasi

- Sebelumnya: [Brief 02](2026-10-22-02-penyimpanan-profil-dan-impor-awal.md).
- Berikutnya: [Brief 04](2026-10-22-04-layanan-tes-koneksi-dan-tls.md).
