# Halaman Koneksi dan drawer profil

Implementasi Brief 06, diverifikasi 23 Oktober 2026.

## Penggunaan

Buka `/local-connections.php`, atau halaman awal aplikasi. Saat profil diaktifkan,
halaman awal membuka Koneksi tanpa menjalankan autentikasi/koneksi server lama.
Daftar menyediakan nama, host/port, username, lingkungan, favorit, terakhir
digunakan, pencarian nama/host/username, serta urutan nama atau terakhir digunakan.
Timestamp tersebut bukan pemeriksaan online. Loading, tidak ada hasil, daftar
kosong, dan kegagalan layanan mempunyai pesan serta tindakan lanjut.

Tambah/Edit membuka drawer kanan dengan fokus di nama koneksi. Label, urutan Tab,
Escape, fokus setelah tutup, dan focus trap memakai komponen Bootstrap yang sudah
tersedia. Tema phpMyAdmin tidak menyertakan CSS offcanvas; styling drawer/backdrop
minimal disediakan lokal, menggunakan bahasa visual tema yang sama. Popup hapus
menyebut nama dan host/port, menjelaskan pencabutan profil/rahasia/konteks lokal,
dan menyatakan database remote tidak dihapus. Fokus awal popup berada di Batal.

- **Tes koneksi** menguji draft, termasuk draft belum disimpan. Input tetap ada
  jika gagal. Password tersimpan/sesi hanya dapat dipakai bila parameter target
  draft persis cocok; target yang berubah meminta input password baru.
- **Simpan** menyimpan metadata secara lokal walaupun server offline. Tidak ada
  tes/koneksi remote otomatis. Perubahan belum disimpan menonaktifkan Hubungkan.
- **Hubungkan** memakai ID/revisi profil tersimpan, membuat konteks baru untuk tab
  tersebut, dan membuka database awal profil tanpa membawa database/tabel tab
  sebelumnya. Profil tidak diduplikasi. Last-used diperbarui oleh layanan connect
  setelah berhasil, bukan oleh UI.

Password tersimpan hanya diwakili indikator. Field edit selalu mulai kosong.
Pilihan default profil baru adalah **Jangan simpan password**. Profil dengan
rahasia tersimpan menyediakan **Pertahankan (keep)**, **Simpan/ganti (replace)**,
dan **Hapus (remove)**. Input untuk Tes/Hubungkan bersifat sementara kecuali
replace dipilih saat Simpan. Checkbox input kosong memungkinkan akun tanpa
password secara eksplisit. Setelah penyimpanan terenkripsi berhasil, input
password dibersihkan; menutup drawer juga membersihkannya. Input dipertahankan
ketika request gagal. Password tidak dimasukkan ke URL, payload baca,
localStorage, maupun log aplikasi.

Aksi mutasi/tes/connect menonaktifkan kontrol selama request berlangsung. Guard
request mencegah pengiriman ganda. Permintaan daftar memakai nomor generasi agar
hasil pencarian lama tidak menggantikan hasil pencarian terbaru.

## Identitas target dan perubahan belum disimpan

Administrasi menampilkan nama, host/port, username, dan lingkungan dari konteks
tervalidasi. Label **Production** memakai teks, border, dan warna khusus. Bar
identitas tetap melekat di bawah menu saat scroll dan menyediakan Koneksi/ganti
server. Parameter identitas di header diserialisasikan sebagai objek JSON dengan
escaping HTML yang aman, termasuk pada respons AJAX.

Klik Koneksi/ganti server ketika textarea SQL/CodeMirror berubah membuka modal
konfirmasi. **Tetap di editor** mempertahankan query dan target; **Buka Koneksi**
baru melakukan navigasi. Membuka link di tab baru tidak meninggalkan editor tab
asal. Drawer juga mengonfirmasi pembuangan perubahan saat ditutup; browser
menampilkan peringatan sebelum unload bila ada perubahan.

Respons AJAX 409 `reconnect` menampilkan kebutuhan reconnect pada bar identitas,
menonaktifkan submit, dan mempertahankan query di editor. Reload URL konteks
lama menampilkan halaman reconnect dengan nama/host profil yang tepat dan akses
ke Koneksi. Label konteks yang dicabut disimpan hanya sebagai informasi sesi;
label tersebut tidak pernah dipakai sebagai otoritas koneksi. Profil lain tetap
memakai konteksnya sendiri.

Resource terjemahan JavaScript dan redirect dokumentasi memakai minimum Common
yang tidak membuka database; keduanya tidak memerlukan capability database.
Import progress tetap memvalidasi konteks. Pengecualian ini ditentukan kode PHP,
bukan parameter browser.

## Adapter internal

`local-profiles.php` menerima POST JSON dengan session/CSRF, flag fitur, dan guard
loopback yang sama dengan endpoint connect/test. Aksi tersedia: list, create,
update, favorite, delete. List mengembalikan projection metadata layanan profil,
indikator rahasia tersimpan, dan capability sesi milik sesi tersebut bila masih
berlaku. Tidak ada plaintext/envelope password dalam payload baca. Update/delete
memeriksa revisi atomik dengan operasi SQLite. Konflik meminta pengguna memuat
ulang; input drawer tidak dibuang.

`local-connections.php` hanya memuat konfigurasi/sesi phpMyAdmin, tidak memakai
`Common::run()` atau autentikasi legacy. Membuka pengelola tidak menghubungi
server remote. Penyimpanan yang belum diinisialisasi tidak dibuat otomatis oleh
request web; layanan menampilkan kegagalan yang aman.

## Pemeriksaan yang benar-benar dijalankan

- Foundation: 35 pemeriksaan; profil: 163; password: 124; AJAX propagation: 12.
- Runner MySQL/MariaDB disposable: 83 pemeriksaan koneksi dan 20 lifecycle
  konteks, ditambah suite HTTP profil dan multi-tab.
- HTTP UI: CRUD offline, pencarian tiga field, favorit/reload, password
  terenkripsi replace/remove, payload baca tanpa password, konflik revisi,
  CSRF, metode, spoof header, feature flag, resource JS dan halaman awal tanpa
  query remote, serta header identitas berbentuk objek tanpa warning PHP.
- HTTP administrasi A/B: browse, query identitas, unggah SQL, ekspor CSV,
  connect/reconnect/gagal connect, disconnect/logout, serta penolakan capability
  tanpa query remote. Sentinel utuh; log fase uji tanpa DDL/DML dan password.
- Chrome pada fixture disposable: drawer kanan dan backdrop, Tab/Escape serta
  pengembalian fokus, tes DNS gagal dengan input tetap utuh, simpan offline,
  favorit/filter, popup hapus dan pembatalannya, edit tanpa plaintext password,
  tes TLS sukses, connect/reconnect, dan dua target browser dengan `SELECT @@port`
  yang menghasilkan port MySQL/MariaDB masing-masing.
- Pembatalan modal pindah server mempertahankan query/target. Penolakan request
  CodeMirror setelah revisi profil berubah mempertahankan query dan menampilkan
  pesan reconnect. Tab B tetap valid ketika profil A direvisi. Reload konteks
  lama menunjukkan identitas profil yang benar.
- Herd FPM: guard loopback/LAN/spoof seluruh entrypoint, dependency/storage errors,
  dan perlindungan file privat lulus (`test/local/check_http.py`).
- Syntax seluruh PHP yang berubah/baru, empat JavaScript baru dan dua JavaScript
  propagasi, serta `git diff --check` lulus.

Verifikasi browser dilakukan pada Chrome desktop; Safari/Firefox, screen reader,
dan ukuran perangkat mobile belum diuji manual. Operasi hapus final diverifikasi
melalui HTTP disposable; browser dipakai memverifikasi isi popup, fokus, dan
pembatalan. Suite upstream PHPUnit/PHPCS/PHPStan tidak tersedia pada instalasi
ini. Validasi rilis lintas lingkungan dan pemulihan tetap cakupan Brief 07.

## Aktivasi lokal dan pemulihan

UI telah diaktifkan melalui `profiles_enabled=true` di konfigurasi privat.
Salinan sebelum aktivasi disimpan dengan permission 0600 di
`~/Library/Application Support/xphpmyadmin/local.before-brief06-20261023T025332Z.json`.
`config.inc.php`, metadata profil pengguna, kunci, dan data remote tidak diubah
untuk aktivasi atau QA. Browser lokal hanya dipakai membaca daftar nyata;
semua tes, mutasi profil, password sintetis, dan SQL memakai fixture disposable.

Untuk mematikan UI, ubah flag privat menjadi false atau pulihkan salinan
konfigurasi tersebut. Jangan menghapus SQLite/kunci atau mereset database.
Request tanpa capability kembali ke alur konfigurasi lama; URL capability lama
selalu gagal tertutup ketika fitur dimatikan.
