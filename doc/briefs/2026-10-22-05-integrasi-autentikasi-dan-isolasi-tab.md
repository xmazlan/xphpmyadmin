# Brief 05 — Integrasi autentikasi dan isolasi tab

Tanggal: 22 Oktober 2026  
Status: belum dikerjakan  
Sumber: [PRD](../../PRD.md)  
Urutan: 5 dari 7  
Dependensi: Brief 01–04 selesai.  
Cakupan PRD: F05, F06, F10, F11; invalidasi perubahan profil.

## Tujuan

Menghubungkan profil ke phpMyAdmin dengan konteks target eksplisit sehingga
operasi satu tab tidak pernah dialihkan oleh pergantian koneksi tab lain.

## Pekerjaan

- Integrasikan profil dengan pemilihan server/autentikasi phpMyAdmin tanpa menulis ulang config.inc.php dan tanpa satu server aktif global untuk seluruh tab.
- Buat konteks opaque server-side yang terikat ke sesi pengguna, ID profil, dan revisi parameter. Setiap request database memvalidasi konteks tersebut; ID profil dari browser saja bukan bukti konteks sah.
- Audit propagasi konteks pada navigasi, form, AJAX, SQL, browse, impor, dan ekspor. Konteks hilang/kedaluwarsa/diubah harus gagal tertutup, bukan fallback ke server default.
- Connect menggunakan profil tersimpan dan password input/sesi/penyimpanan yang tersedia. Buat konteks dan update last_used_at hanya setelah koneksi dan database awal berhasil divalidasi.
- Gagal connect ke B tidak merusak konteks A yang sudah valid. Jangan membuat profil baru pada reconnect.
- Perubahan parameter profil menginvalidasi konteks lama profil tersebut melalui revisi; tab lama diminta reconnect. Penghapusan profil menonaktifkan seluruh konteks profil tersebut tanpa SQL remote.
- Disconnect menutup konteks terkait dan rahasia sementaranya; logout mengakhiri seluruh konteks sesi. Profil lain tidak berganti target akibat disconnect satu konteks.
- Definisikan perilaku tab duplikat: konteks yang disalin tetap mengacu target yang sama; pindah server membuat konteks baru untuk tab yang berpindah. Jika konteks bersama dicabut, tab lain harus meminta reconnect, tidak berpindah target.
- Sediakan data identitas target tervalidasi untuk indikator UI brief 06.

## Kriteria selesai dan pengujian

- Dua tab server A/B menjalankan query identifikasi target dan selalu menghasilkan target masing-masing.
- Pergantian, kegagalan connect, disconnect, edit, delete, logout, refresh, dan tab duplikat tidak mengalihkan request ke target lain.
- Konteks palsu, hilang, lintas sesi, dan revisi lama ditolak sebelum query dijalankan.
- Browse, SQL, impor, dan ekspor mempertahankan konteks pada database disposable.
- Last-used berubah hanya pada connect sukses; password sementara dibersihkan sesuai cakupan disconnect/logout.

## Hasil yang diserahkan

Adapter autentikasi, manajemen konteks, propagasi request, dan pengujian integrasi multi-tab.

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

- Sebelumnya: [Brief 04](2026-10-22-04-layanan-tes-koneksi-dan-tls.md).
- Berikutnya: [Brief 06](2026-10-22-06-halaman-koneksi-dan-drawer-profil.md).
