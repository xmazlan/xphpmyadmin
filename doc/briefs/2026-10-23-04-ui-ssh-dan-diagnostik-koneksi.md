# Brief 04 — UI SSH dan diagnostik koneksi

Tanggal: 23 Oktober 2026  
Status: diimplementasikan dan divalidasi pada cakupan runtime v2; lihat [laporan penerimaan](../release/2026-10-23-v2.md) dan batas dukungannya  
Sumber: [Rangkaian v2](2026-10-23-00-rangkaian-v2-ssh-dan-diagnostik.md), [PRD v1](../../PRD.md)  
Urutan: 4 dari 5 dalam v2  
Dependensi: Brief 03 selesai.

## Tujuan

Memudahkan konfigurasi SSH dan menjelaskan kegagalan per tahap tanpa
menampilkan rahasia atau menyamakan riwayat sukses dengan status online.

## Pekerjaan

- Perluas drawer dengan metode Direct / VPN atau SSH Tunnel, field SSH dari
  Brief 01, dan bantuan bahwa host MySQL dilihat dari server SSH. Field TLS
  tetap terpisah; SSH tidak otomatis mematikan TLS. Private key diisi sebagai
  path lokal, tanpa upload atau pembacaan isinya ke browser.
- Sediakan alur trust yang menampilkan host/port, algoritme dan fingerprint;
  persetujuan eksplisit terpisah dari Test/Connect. Changed key menampilkan
  identitas lama/baru dengan aksi tinjau penggantian, tanpa auto-approval.
- Perluas respons tes secara aditif: `ok` dan `error.category/message` lama
  tetap tersedia; tambahkan `diagnostics` berupa daftar tahap dengan `stage`,
  `status` (passed/failed/skipped), `duration_ms`, dan `code` aman. Nilai yang
  tidak bisa dipisahkan driver diberi tahap gabungan, bukan hasil rekaan.
- Tahap yang ditampilkan meliputi validasi lokal, trust/SSH, forwarding,
  koneksi MySQL/TLS/autentikasi, dan akses database awal. Direct melewati
  tahap SSH. Tahap sesudah kegagalan ditandai skipped. Gunakan hasil aktual
  setelah request selesai; streaming dan polling latar belakang di luar cakupan.
- Tambahkan kategori aman untuk prerequisite SSH, host key belum dipercaya/
  berubah, autentikasi SSH, timeout SSH, forwarding, dan tunnel terputus;
  pertahankan kategori database yang ada. Sertakan saran tindakan relevan,
  bukan stderr, exception, password, isi key, environment, atau command mentah.
- Daftar/indikator target menampilkan metode koneksi. Status tunnel hanya
  berdasarkan pemeriksaan konteks yang relevan; last_used_at tetap berarti
  waktu keberhasilan terakhir, bukan indikator online. Aksi ganda dicegah
  saat request berjalan, input tidak hilang ketika tes gagal.
- Semua endpoint baru tunduk pada loopback-only, session, CSRF, validasi payload
  dan revision checks yang sama; operasi trust tidak memakai GET.

## Kriteria selesai dan pengujian

- Direct tetap sederhana; mode SSH menunjukkan field/bantuan yang sesuai.
- Unknown/changed key, agent tidak tersedia, SSH gagal, database gagal dan
  TLS gagal mempunyai pesan dan tahapan sesuai bukti backend.
- Tidak ada rahasia dalam DOM, URL, respons diagnostik atau log; fingerprint
  host publik boleh ditampilkan. Pesan dapat diakses dengan keyboard dan
  pembaca layar melalui label/fokus serta status region yang sesuai.
- Profil offline tetap dapat disimpan; Test tidak mengubah konteks tab aktif.
- Kontrak respons lama tetap dapat digunakan oleh pemanggil existing.

## Hasil yang diserahkan

Drawer SSH, alur trust, diagnostik backend/UI, kategori error aman dan uji HTTP/UI.

## Batasan bersama

- Lokal pribadi di Mac melalui Herd; MySQL/MariaDB. Pertahankan akses loopback,
  isolasi tab, TLS terverifikasi dan penyimpanan password opsional v1.
- Tidak mencakup multi-user, hosting publik, sinkronisasi, ekspor/impor profil,
  duplikasi profil, atau riwayat koneksi persisten baru.
- Jangan reset/truncate data pengguna atau mencantumkan rahasia nyata dalam
  kode, fixture, dokumentasi, log maupun laporan. Tes memakai fixture disposable.
- Sertakan perubahan, pemeriksaan yang dijalankan, hasil dan keterbatasan.
  Dokumen ini merupakan brief pekerjaan, bukan bukti fitur tersedia.

## Navigasi

- Sebelumnya: [Brief 03](2026-10-23-03-integrasi-transport-dan-konteks.md).
- Berikutnya: [Brief 05](2026-10-23-05-validasi-rilis-ssh-dan-diagnostik.md)
