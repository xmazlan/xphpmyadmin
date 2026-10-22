# Brief 06 — Halaman Koneksi dan drawer profil

Tanggal: 22 Oktober 2026  
Status: belum dikerjakan  
Sumber: [PRD](../../PRD.md)  
Urutan: 6 dari 7  
Dependensi: Brief 01–05 selesai; gunakan layanan yang sudah diuji.  
Cakupan PRD: F01–F12 pada lapisan UI, terutama F09.

## Tujuan

Memberikan alur memilih, mengelola, dan menggunakan profil secara jelas,
termasuk identitas target serta penanganan perubahan belum disimpan.

## Pekerjaan

- Buat halaman Koneksi sebagai pintu masuk dengan nama, host/port, username, lingkungan, favorit, last-used, pencarian, dan filter favorit. Sediakan empty/loading/error state.
- Gunakan komponen dan sistem visual phpMyAdmin yang tersedia; drawer tambah/edit dan popup konfirmasi hapus harus dapat digunakan dengan keyboard, label form, serta pengembalian fokus yang benar.
- Form mencakup seluruh parameter PRD, TLS dan file lokal, serta simpan password yang default mati. Tampilkan indikator password tersimpan tanpa mengisi plaintext; sediakan keep/replace/remove secara jelas.
- Pisahkan Tes koneksi, Simpan, dan Hubungkan. Tes menerima draft; Simpan tidak bergantung server online; perubahan belum disimpan harus disimpan sebelum Hubungkan.
- Minta password bila tidak tersedia; tampilkan hasil tes/error tanpa rahasia. Blokir pengiriman ganda selama request berjalan tanpa menghilangkan input saat gagal.
- Last-used adalah waktu connect sukses, bukan indikator server online. Favorit dan reconnect tidak membuat duplikat profil.
- Konfirmasi hapus menyebut nama/host dan dampaknya pada profil lokal serta sesi, bukan menyiratkan penghapusan database.
- Tampilkan nama server, host/port, dan label lingkungan selama administrasi. Production dibedakan melalui teks dan warna, bukan warna saja; sediakan akses ke halaman Koneksi.
- Pindah server mereset pilihan database hanya di konteks tab terkait. Editor dengan perubahan belum disimpan meminta konfirmasi sebelum navigasi; batal mempertahankan editor dan target.
- Tab yang konteksnya dicabut menampilkan kebutuhan reconnect dan tidak menawarkan eksekusi ke server default.

## Kriteria selesai dan pengujian

- Alur tambah → tes → simpan → connect → reconnect → edit → hapus berhasil dan dapat dipakai dengan keyboard.
- Simpan saat offline berhasil; tes gagal mempertahankan input dan tidak mengubah target aktif.
- Profil/favorit/last-used tetap tampil setelah reload; pencarian bekerja pada nama, host, username.
- Password tidak tampil pada daftar, field edit awal, URL, maupun payload baca.
- Label Production dan identitas target terlihat selama browse/SQL; batal perpindahan mempertahankan query belum disimpan.
- Konfirmasi hapus dan error reconnect menunjukkan profil yang benar tanpa memengaruhi target profil lain.

## Hasil yang diserahkan

Halaman/drawer lengkap, indikator target, integrasi aksi internal, dan verifikasi visual serta alur pengguna.

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

- Sebelumnya: [Brief 05](2026-10-22-05-integrasi-autentikasi-dan-isolasi-tab.md).
- Berikutnya: [Brief 07](2026-10-22-07-validasi-rilis-dokumentasi-dan-pemulihan.md).
