# Changelog — xphpMyAdmin Desktop

Semua perubahan penting pada aplikasi **xphpMyAdmin Desktop** didokumentasikan dalam berkas ini. Format pencatatan mengacu pada prinsip [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan [Semantic Versioning](https://semver.org/).

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

### Peluncuran Perdana Antarmuka Desktop Modern
- **Kanvas Gelap Responsif**: Tata letak desktop modern berbasis dark-canvas yang dinamis dan proporsional baik pada mode jendela kecil maupun layar penuh.
- **Bilah Navigasi Lengkap Inti phpMyAdmin**: Menghadirkan 10 tab utama manajemen basis data (Databases, SQL, Status, Users, Export, Import, Variables, Charsets, Engines, Plugins).
- **Pengelola Sambungan Terpadu**: Tata letak bertingkat dengan bilah pencarian cerdas, penyaring favorit, riwayat penggunaan terakhir, dan navigasi multi-tab server.
- **Diagnostik Kesehatan Sambungan Multi-Tahap**: Verifikasi otomatis kesiapan jaringan lokal, kepercayaan host SSH, autentikasi pengguna, dan pengukuran latensi (*latency ping*).
- **Brankas Sandi Terenkripsi (Keychain/Vault)**: Penyimpanan kredensial akses lokal yang terlindungi enkripsi dengan opsi perbarui (*replace*) atau hapus (*remove*).
- **Dialog Perlindungan Data Destruktif**: Peringatan konfirmasi visual terpadu sebelum eksekusi aksi sensitif (Drop Database, Drop Table, Truncate Table).
- **Standarisasi Token Semantik Desain**: Pondasi komponen antarmuka yang bersih berbasis token semantik shadcn/ui dan Tailwind CSS dengan dukungan tema terang dan gelap mulus.

