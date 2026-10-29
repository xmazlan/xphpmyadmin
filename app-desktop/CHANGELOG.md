# Changelog — xphpMyAdmin Desktop

Semua perubahan penting pada aplikasi **xphpMyAdmin Desktop** didokumentasikan dalam berkas ini. Format pencatatan mengacu pada prinsip [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan [Semantic Versioning](https://semver.org/).

---

## [1.4.2] - 2026-10-30

### Pusat Pengaturan Terpadu & Sinkronisasi Cerdas
- **Pusat Pengaturan Aplikasi Mandiri (`SettingsView`)**: Menggantikan jendela modal sembul dengan halaman pengaturan terpadu penuh yang dapat diakses langsung melalui tombol pintasan di sudut kiri bawah bilah navigasi samping, mencakup kustomisasi bahasa, tema visual, interval *keep-alive*, batas kueri default, dan pengaturan sinkronisasi awan.
- **Sinkronisasi Cloud Berbasis Aksi (Event-Driven)**: Mengubah mekanisme animasi sinkronisasi yang sebelumnya berputar terus-menerus menjadi sinkronisasi hening otomatis yang hanya terpicu saat pengguna melakukan aksi nyata (menyimpan koneksi, memperbarui preferensi, menghapus profil, atau mengedit data) untuk akun berlangganan aktif.
- **Standardisasi Tombol Batal**: Menambahkan tombol pembatalan eksplisit (*Cancel* / *Batal*) pada seluruh formulir, modal, dan dialog aksi (impor, ekspor, manajemen koneksi) untuk fleksibilitas pembatalan interaktif.
- **Dukungan Dwibahasa Penuh & Default Bahasa Inggris**: Mengonfigurasi dukungan dwibahasa (Bahasa Inggris dan Bahasa Indonesia) dengan Bahasa Inggris (`en`) sebagai bahasa bawaan aktif pada seluruh komponen antarmuka, pesan validasi, dan formulir.
- **Penyederhanaan Tampilan Masuk & Pendaftaran**: Merapikan halaman autentikasi menjadi satu kartu ringkas bebas bilah gulir vertikal dan horizontal (`overflow-hidden`), dengan navigasi tab satu-klik yang intuitif antara formulir Masuk dan Daftar.
- **Pembersihan Bilah Atas & Identitas ER Suite**: Menghilangkan tombol pengubah bahasa redundan dari bilah judul jendela (*title bar*), serta menyelaraskan penamaan layanan sinkronisasi awan dengan identitas resmi ER Suite.

### Antarmuka Responsif Adaptif (Windowed & Fullscreen)
- **Deteksi Mode Jendela Dinamis**: Implementasi hook `useResponsiveWindow` dan event IPC status jendela (`maximize`, `unmaximize`, `resize`) untuk sinkronisasi state jendela secara real-time.
- **Ikon Kontrol Jendela Adaptif**: Tombol kontrol di header otomatis beralih antara ikon Maksimalkan (kotak tunggal) saat mode windowed dan Pulihkan (dua kotak bertumpuk) saat mode layar penuh / maximized, dengan pintasan *double-click* pada title bar.
- **Koreksi Batas Layar Studio**: Memperbaiki container utama studio (`workspace/$profileId`) dari `h-screen w-screen` menjadi `h-full w-full min-h-0 min-w-0` sehingga tidak meluap atau terpotong oleh title bar dan header.
- **Grid Kartu Host Responsif**: Penataan grid kartu host otomatis beralih ke 1 kolom lega (`grid-cols-1`) saat panel inspektur terbuka pada mode jendela sedang/sempit, dan mengembang menjadi 2-3 kolom pada mode layar penuh.
- **Pencegahan Text Clipping**: Nama koneksi, alamat host:port, rute tunnel SSH, dan badge status kini dilengkapi penanganan `truncate` dan `min-w-0`.
- **Pengguliran Horizontal Aman pada Seluruh Tabel**: Seluruh wrapper tabel data (Struktur tabel, Rutin, Pemicu, Status MariaDB, Variabel server, Charset, Engine, Plugin, dan Hasil query SQL) kini dilengkapi `overflow-x-auto` dengan lebar minimum terproteksi.

### Harmonisasi Kontras Tinggi Tema Terang (Light Mode)
- **Dukungan Adaptif Warna Ungu**: Seluruh elemen bertema ungu untuk SSH Tunneling, filter tab, jalur loopback VPS, dan badge paket Business kini menggunakan varian adaptif dengan kontras tajam (`text-purple-700/900`, `bg-purple-50/100`, `border-purple-200/300`) di tema terang, serta tetap elegan di tema gelap.

---

## [1.4.1] - 2026-10-29

### Standarisasi Terowongan Server (VPS & SSH Tunneling)
- **Preset Pengguna VPS Standar**: Menambahkan tombol chip pilihan cepat untuk nama akun standar industri (`root`, `ubuntu`, `debian`, `ec2-user`).
- **Pilihan Cepat Path Kunci Privat**: Menambahkan tombol pilihan berkas kunci akses standar (`~/.ssh/id_ed25519`, `~/.ssh/id_rsa`, `~/.ssh/id_ecdsa`) dan integrasi dialog pemilihan berkas lokal.
- **Dukungan Frasa Sandi (Passphrase)**: Menambahkan kolom masukan passphrase kunci privat terenkripsi dengan tombol intip/sembunyikan sandi (*eye toggle*).
- **Otomasi Ping Kestabilan (Auto Keep-Alive)**: Mengaktifkan pengiriman sinyal *keep-alive* otomatis setiap 15 detik (maksimal 3 percobaan) untuk mencegah firewall atau router NAT memutus koneksi saat keadaan hening (*idle*).
- **Forwarding Loopback Aman**: Menyelaraskan rute koneksi langsung ke `127.0.0.1:3306` pada VPS target.
- **Pintasan Perintah Terminal (CLI)**: Tombol satu-klik untuk menyalin perintah terminal `ssh -N -L` yang otomatis disesuaikan dengan konfigurasi server dan port.

### Sinkronisasi Cloud & Jurnal Aktivitas (Cloud Sync & State Journaling)
- **Auto-Sync Default untuk Akun Berlangganan**: Setiap aksi pengguna pada paket non-free (`Pro`, `Team`, `Business`) kini otomatis disinkronkan ke server cloud Neon secara *debounced* (600ms–1000ms) tanpa membebani antarmuka.
- **Otomasi Pengurasan Antrean saat Masuk (Login & Startup Auto-Sync)**: Memastikan pengguna akun berlangganan yang masuk (`login`, `register`, `oauth`, atau pemulihan sesi saat aplikasi dibuka) langsung memicu sinkronisasi otomatis di latar belakang untuk menguras seluruh aksi tertunda (*pending*) ke basis data cloud Neon, tanpa perlu klik manual.
- **Penyelarasan Indikator Status Cloud di Header**: Menghilangkan lencana peringatan (*amber badge*) bagi pengguna berbayar karena seluruh antrean diproses secara otomatis di latar belakang, serta menampilkan ikon putaran Teal dinamis selama proses pengiriman data berlangsung.
- **Mekanisme Antrean Trailing Aman (*In-Flight Queue*)**: Mengatasi potensi data tertinggal saat sinkronisasi simultan dengan menyimpan bendera permintaan beruntun dan mengeksekusinya tepat setelah proses aktif selesai.
- **Tombol Pintas Sinkronisasi Manual**: Menambahkan tombol sinkronisasi manual 1-klik di bilah navigasi header dengan ikon animasi proses berputar (*spinner*) secara *live*.
- **Tombol Sinkronisasi Manual pada Jurnal**: Menambahkan tombol *"Sinkronkan Manual"* langsung di atas daftar jurnal transaksi aktivitas.
- **Sakelar Kendali Auto-Sync**: Menghadirkan pengaturan sakelar (*switch*) di jendela modal sinkronisasi dengan status `AKTIF SECARA DEFAULT` bagi akun berbayar.
- **Proteksi Brankas Lokal Akun Gratis (Starter)**: Pengguna akun gratis dilindungi dengan brankas lokal mandiri tanpa batas waktu, dan diarahkan secara edukatif ketika mencoba menyinkronkan data ke cloud.

### Penyelarasan Tema Visual & Pembersihan Istilah
- **Standarisasi Warna Aksen Teal**: Menyelaraskan seluruh aksen visual aplikasi ke palet warna Teal (`#14b8a6` / `teal-500`) pada jendela modal, tombol aksi, kartu server, dan navigasi.
- **Pembersihan Istilah Teknis Internal**: Mengganti seluruh istilah kode internal pengembang (`er-backend`) menjadi terminologi layanan yang ramah pengguna ("Cloud Server", "xphpMyAdmin Cloud", "Endpoint API Sinkronisasi").
- **Keterbacaan Kolom Masukan**: Menyesuaikan ruang vertikal (*padding*) pada bidang isian teks agar karakter garis bawah (`_`) dan huruf berekor terlihat utuh.

### Autentikasi Eksternal & Paket Distribusi Multi-Platform
- **Otorisasi Peramban Eksternal**: Pengguna dapat masuk menggunakan Google atau GitHub melalui peramban web bawaan sistem yang aman, dengan pengalihan balik (*auto-reopen callback*) instan ke aplikasi desktop.
- **Pendaftaran Mandiri Cepat**: Pendaftaran akun baru langsung memberikan akses penuh ke brankas lokal tanpa pemaksaan pemilihan paket pembayaran di awal.
- **Pusat Operasi Basis Data Lengkap**: Modul ekspor/impor multi-format (SQL, CSV, JSON, XML), pemeliharaan tabel (Optimize, Check, Repair, Checksum), pencarian mendalam lintas tabel, serta inspeksi dan pemanggilan prosedur/fungsi/trigger tersimpan.
- **Paket Distribusi Multi-Platform**: Skrip otomatisasi build untuk Linux (`.deb`), macOS (`.dmg`/`.zip` untuk Apple Silicon M1/M2/M3/M4 dan Intel), serta Windows (`.exe`/`.zip`).

---

## [1.0.0] - 2026-10-24

### Peluncuran Antarmuka Desktop Modern
- **Basis Canvas Gelap**: Desain antarmuka berbasis desktop responsif mode windowed dan layar penuh.
- **Navigasi Tab phpMyAdmin Lengkap**: Dukungan tab Basis Data, SQL, Status, Pengguna, Ekspor, Impor, Variabel, Charset, Engine, dan Plugin.
- **Pengelola Sambungan Terpusat**: Pencarian cerdas, multi-tab sesi kerja, dan diagnosa kesehatan koneksi otomatis.
- **Pengamanan Kredensial Mandiri**: Penyimpanan kredensial terenkripsi lokal dan dialog konfirmasi perlindungan visual untuk tindakan sensitif.
