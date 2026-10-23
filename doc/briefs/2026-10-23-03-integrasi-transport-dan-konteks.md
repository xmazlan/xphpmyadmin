# Brief 03 — Integrasi transport dan konteks per tab

Tanggal: 23 Oktober 2026  
Status: diimplementasikan dan divalidasi pada cakupan runtime v2; lihat [laporan penerimaan](../release/2026-10-23-v2.md) dan batas dukungannya  
Sumber: [Rangkaian v2](2026-10-23-00-rangkaian-v2-ssh-dan-diagnostik.md), [PRD v1](../../PRD.md)  
Urutan: 3 dari 5 dalam v2  
Dependensi: Brief 02 selesai.

## Tujuan

Menggunakan jalur transport yang sama untuk Test, Connect dan seluruh request
administrasi tanpa mengubah target tab atau menurunkan verifikasi TLS.

## Pekerjaan

- Tambahkan resolver transport bersama: profil direct menggunakan jalur lama;
  profil SSH menghasilkan endpoint loopback terkelola dan identitas target
  logis. Parameter transport internal tidak boleh menjadi profil tersimpan.
- Integrasikan resolver pada MySqlConnector dan runtime autentikasi phpMyAdmin,
  termasuk request AJAX, SQL, browse, import/export dan navigasi berikutnya.
  Setiap request wajib memvalidasi konteks, revision, trust dan tunnel sebelum
  membuka koneksi database; jangan hanya menambahkan SSH pada tombol Test.
- Pertahankan sumber password input/session/saved dan ikat pada profil/revision
  yang tepat. Rahasia MySQL tidak diberikan ke proses SSH. SSH sukses saja
  belum berarti koneksi MySQL sukses.
- Test draft menggunakan tunnel sementara, selalu ditutup setelah sukses/gagal;
  tidak mengubah konteks aktif, profil maupun last_used_at. Connect hanya
  mencatat keberhasilan setelah autentikasi/TLS/database awal lolos.
- Pertahankan TLS aktif default dan pilihan non-TLS eksplisit. Verifikasi
  sertifikat terhadap identitas host database logis, bukan otomatis terhadap
  alamat listener loopback. Buktikan dukungan driver sebelum melanjutkan;
  jika driver tidak dapat mempertahankannya, blokir kombinasi tersebut dengan
  pesan jelas. Dilarang melemahkan verifikasi atau mematikan TLS diam-diam.
- Pertahankan nama profil, tujuan MySQL, lingkungan, dan metode SSH pada identitas
  konteks; jangan menampilkan port listener sebagai identitas database remote.
- Putusnya tunnel membatalkan penggunaan konteks dan meminta reconnect;
  respons query yang terputus dinyatakan gagal/tidak pasti sesuai bukti yang
  tersedia. Jangan replay otomatis. Context A tidak boleh memakai tunnel B.

## Kriteria selesai dan pengujian

- Target A direct dan B via SSH dapat digunakan bersamaan; sentinel membuktikan
  browse, SQL, AJAX dan ekspor selalu menuju target yang dipilih.
- Dua tab dengan profil sama memakai konteks/tunnel terpisah; disconnect satu
  konteks tidak memutus yang lain. Logout semua menutup keduanya.
- Test tidak mengubah timestamp; autentikasi/database awal gagal tidak mencatat
  sukses. Profil direct dan TLS lama lulus regresi.
- Sertifikat SAN host logis valid lolos jika didukung; SAN salah/CA salah gagal.
  Driver yang tidak mendukung kombinasi diblokir, bukan diloloskan tanpa verifikasi.
- Edit/delete profil, key berubah, expiry dan master mati meminta reconnect
  tanpa mengarahkan request ke target lain atau mengulang query.

## Hasil yang diserahkan

Resolver transport bersama, integrasi konteks/runtime, cleanup terhubung lifecycle,
serta bukti uji target dan TLS. Dukungan TLS-over-tunnel yang belum terbukti
harus dinyatakan sebagai batas dukungan, bukan dianggap selesai.

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

- Sebelumnya: [Brief 02](2026-10-23-02-pengelola-tunnel-openssh.md).
- Berikutnya: [Brief 04](2026-10-23-04-ui-ssh-dan-diagnostik-koneksi.md)
