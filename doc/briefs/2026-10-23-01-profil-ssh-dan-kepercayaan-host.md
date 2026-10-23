# Brief 01 — Profil SSH dan kepercayaan host

Tanggal: 23 Oktober 2026  
Status: diimplementasikan dan divalidasi pada cakupan runtime v2; lihat [laporan penerimaan](../release/2026-10-23-v2.md) dan batas dukungannya  
Sumber: [Rangkaian v2](2026-10-23-00-rangkaian-v2-ssh-dan-diagnostik.md), [PRD v1](../../PRD.md)  
Urutan: 1 dari 5 dalam v2  
Dependensi: v1 selesai; backup metadata tervalidasi sebelum migrasi.

## Tujuan

Memperluas profil dengan metode Direct / VPN dan SSH Tunnel, tanpa mengubah
perilaku profil v1 atau menyimpan private key dalam database aplikasi.

## Pekerjaan

- Tambahkan metode koneksi `direct` dan `ssh`; profil lama dimigrasikan sebagai
  `direct`. Host/port MySQL tetap merupakan tujuan database; pada mode SSH,
  alamat itu diinterpretasikan dari mesin SSH, bukan dari Mac.
- Simpan konfigurasi SSH: host, port default 22, username, dan path absolut
  private key lokal. V2 awal hanya mendukung autentikasi public key melalui
  OpenSSH dan ssh-agent; password SSH, input passphrase melalui web, jump host
  berantai, serta impor isi private key berada di luar cakupan.
- Key dengan passphrase harus sudah dimuat dalam ssh-agent yang dapat diakses
  runtime PHP. Jika agent tidak tersedia, tampilkan kebutuhan konfigurasi;
  jangan beralih ke prompt interaktif atau menyimpan passphrase.
- Validasi parameter bertipe dan panjang terbatas, port 1–65535, key berupa file
  reguler yang dapat dibaca dengan izin privat. Tolak karakter kontrol dan
  nilai yang dapat menjadi opsi SSH. Jangan menerima opsi/command SSH bebas.
- Simpan known_hosts khusus aplikasi di storage privat di luar document root.
  Pemeriksaan awal boleh mengambil kandidat host key, tetapi hasil tersebut
  belum dipercaya. Tampilkan algoritme dan fingerprint SHA256 agar pengguna
  memverifikasi lewat sumber terpisah sebelum persetujuan eksplisit ber-CSRF.
- Host key belum dikenal memblokir Test/Connect sampai disetujui. Perubahan key
  memblokir koneksi; penggantian trust memerlukan aksi khusus dengan fingerprint
  lama/baru. Jangan otomatis menerima key dari jaringan atau menonaktifkan
  pemeriksaan identitas. Persetujuan trust tidak menjalankan login MySQL.
- Perubahan metode, parameter SSH, atau trust terkait membatalkan konteks lama
  yang terpengaruh. Gunakan revision check untuk menolak persetujuan yang basi.
- Migrasi metadata harus aditif, terversi, transaksional, dan mempertahankan
  profil, ciphertext, identitas store, serta registry kunci yang sudah ada.
  Perluas backup/recovery untuk metadata SSH dan trust; private key serta agent
  tetap dependensi eksternal dan tidak disalin ke backup.

## Kriteria selesai dan pengujian

- Profil v1 tetap terbaca sebagai direct, tanpa kehilangan data atau rahasia.
- Profil SSH valid dapat disimpan ketika offline; input tidak valid ditolak.
- Unknown/changed host key memblokir koneksi; approval yang basi atau tanpa CSRF
  ditolak. Host/port berbeda tidak memakai trust target lain.
- Uji key tidak terbaca, izin terlalu terbuka, agent hilang, dan input injeksi.
- Backup/restore fixture mencakup konfigurasi/trust, tanpa isi private key;
  restore tetap disabled dan tidak menghidupkan sesi lama.

## Hasil yang diserahkan

Migrasi, validasi profil, penyimpanan trust privat, kontrak approval host key,
perluasan recovery, dan pengujian fixture.

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

- Sebelumnya: [Brief 07 v1](2026-10-22-07-validasi-rilis-dokumentasi-dan-pemulihan.md).
- Berikutnya: [Brief 02](2026-10-23-02-pengelola-tunnel-openssh.md)
