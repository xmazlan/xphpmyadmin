# Brief 05 — Validasi rilis SSH dan diagnostik

Tanggal: 23 Oktober 2026  
Status: diimplementasikan dan divalidasi pada cakupan runtime v2; lihat [laporan penerimaan](../release/2026-10-23-v2.md) dan batas dukungannya  
Sumber: [Rangkaian v2](2026-10-23-00-rangkaian-v2-ssh-dan-diagnostik.md), [PRD v1](../../PRD.md)  
Urutan: 5 dari 5 dalam v2  
Dependensi: Brief 04 selesai.

## Tujuan

Membuktikan paket v2 aman digunakan lokal di Mac tanpa merusak v1,
meninggalkan proses tunnel, atau mengubah database pengguna.

## Pekerjaan

- Siapkan fixture disposable: server SSH dengan key dikenal/berubah, private
  key terenkripsi/tanpa passphrase, agent, MySQL dan MariaDB, target A/B,
  serta sertifikat TLS untuk hostname database logis. Gunakan data sintetis.
- Susun matriks penerimaan Brief 01–04, termasuk migrasi v1, trust approval,
  FPM versus CLI, lifecycle proses, concurrency, lease/scheduler, koneksi
  per tab, TLS dan kategori diagnostik. Jalankan regresi v1 yang relevan.
- Buktikan request administrasi benar-benar mencapai target dengan sentinel;
  setiap uji tulis hanya pada tabel probe fixture yang diizinkan. Verifikasi
  registry proses bersih dan tidak ada listener yang terekspos ke LAN.
- Uji kehilangan agent/key, host key berubah, SSH/network putus, port bentrok,
  restart PHP, expiry tanpa tab terbuka, dan cleanup ketika kegagalan parsial.
  Pastikan tidak ada query yang diulang otomatis.
- Backup metadata/trust fixture sebelum migrasi dan lakukan restore ke lokasi
  privat baru yang disabled. Uji prosedur rollback versi aplikasi memakai
  snapshot pra-migrasi; jangan menjalankan kode lama terhadap schema baru
  tanpa bukti kompatibilitas. Jangan menimpa store/kunci instalasi nyata.
- Perbarui PRD sebagai perluasan v2 atas keputusan v1 tunnel eksternal, README,
  panduan setup OpenSSH/agent untuk Herd FPM, trust, scheduler cleanup,
  troubleshooting, backup/restore dan batas TLS-over-tunnel yang terbukti.
- Catat runtime, browser, perintah, hasil aktual, serta batas dukungan. Status
  brief hanya berubah selesai setelah bukti tersedia. Penolakan host key,
  kebocoran rahasia/listener, salah target dan orphan cleanup menjadi blocker.

## Kriteria selesai dan pengujian

- Brief 01–04 mempunyai bukti penerimaan; MySQL/MariaDB, direct dan SSH lulus
  pada runtime yang dinyatakan didukung. Kombinasi TLS yang tidak didukung
  ditolak jelas dan didokumentasikan.
- Migrasi/restore mempertahankan data profil dan rahasia; sesi lama tidak hidup
  kembali dari restore. Data remote pengguna tidak digunakan untuk pengujian.
- Semua proses fixture selesai dibersihkan; proses SSH lain tidak terpengaruh.
- Dokumentasi membedakan fitur tersedia, batas dukungan dan tes belum dijalankan.

## Hasil yang diserahkan

Laporan uji dan matriks penerimaan v2, panduan operasional/pemulihan, serta
keputusan kesiapan rilis dengan penghalang yang masih ada bila ditemukan.

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

- Sebelumnya: [Brief 04](2026-10-23-04-ui-ssh-dan-diagnostik-koneksi.md).
- Berikutnya: Akhir rangkaian v2.
