# 01 — Studi & Analisis Mendalam Arsitektur xphpMyAdmin

Dokumen ini membedah secara menyeluruh temuan arsitektural, keputusan desain, mekanisme keamanan, dan batasan operasional yang ditemukan pada basis kode **xphpMyAdmin** (turunan phpMyAdmin 5.2.3 kustom).

---

## 1. Konteks & Masalah Asli phpMyAdmin

Secara historis, phpMyAdmin standar dirancang untuk lingkungan server web statis:
- **Konfigurasi Berkas Statis (`config.inc.php`)**: Untuk menambahkan server MySQL/MariaDB baru, administrator harus mengedit berkas PHP di server secara manual.
- **Autentikasi Cookie Tradisional**: Mengharuskan pengguna memasukkan ulang kredensial setiap kali sesi kedaluwarsa atau saat berpindah target.
- **Ketidaktersediaan Pengelola Profil Multi-Lingkungan**: Developer yang mengelola puluhan database (Local Docker, Staging VPS, Production Cluster) tidak memiliki daftar profil terorganisir dengan tag lingkungan, filter favorit, atau riwayat waktu pemakaian.
- **Risiko Tab Hijacking / Silent Target Drift**: Pada phpMyAdmin biasa, variabel server aktif sering kali bersifat global atau berbasis cookie browser tunggal. Jika pengguna membuka Server A di Tab 1, lalu menghubungkan Server B di Tab 2, eksekusi query di Tab 1 dapat secara tidak sengaja terarah ke Server B (berisiko fatal bagi server Production).

---

## 2. Inovasi Arsitektur xphpMyAdmin (v1 & v2)

Tim pengembang xphpMyAdmin melakukan perombakan arsitektural menyeluruh tanpa memodifikasi pustaka upstream phpMyAdmin secara destruktif, dirangkum dalam evolusi berikut:

```
+-----------------------------------------------------------------------------+
|                            ARSITEKTUR XPHPMYADMIN                           |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [ local-connections.php ] <---> [ local-profiles.php ] (CRUD Profil JSON)  |
|          |                                   |                              |
|          v                                   v                              |
|  [ local-connect.php ] <---------> [ ConnectionContexts ]                   |
|          |                             | (Token Opaque 256-bit per Tab)     |
|          |                             v                                    |
|          +----------------------> [ Transport ]                             |
|                                        |                                    |
|                     +------------------+------------------+                 |
|                     |                                     |                 |
|                     v (Direct / VPN)                      v (SSH Tunnel)    |
|             [ MySqlConnector ]                     [ SshTunnels ]           |
|                     |                        (OpenSSH Master Socket)        |
|                     |                                     |                 |
|                     v                                     v                 |
|           [ MySQL / MariaDB ]                   [ Remote SSH Server ]       |
|                                                           |                 |
|                                                           v                 |
|                                                 [ MySQL / MariaDB ]         |
+-----------------------------------------------------------------------------+
```

### A. Penyimpanan Profil Terisolasi (Brief 02 — SQLite v1)
- Penyimpanan metadata profil menggunakan **SQLite lokal** (`profiles.sqlite`) yang diletakkan di direktori privat akun sistem (`~/Library/Application Support/xphpmyadmin/data/`), sepenuhnya di luar *document root* web server.
- Menggunakan skema UUID v4 yang stabil, field nama, host, port (1–65535), username, initial database, lingkungan (`Local`, `Staging`, `Production`, `Other`), konfigurasi TLS, favorit, dan revisi koneksi (`connection_revision`).
- Operasi penyimpanan bersifat **offline-first**: profil dapat disimpan kapan saja meskipun server database target sedang offline.
- Terdapat tabel `profile_imports` untuk mengimpor konfigurasi lama dari `config.inc.php` secara *idempotent* tanpa menduplikasi profil pada inisialisasi berikutnya.

### B. Kriptografi Rahasia & Siklus Password (Brief 03 — SQLite v2)
- Password tidak pernah disimpan dalam format teks polos (`plaintext`).
- Menggunakan authenticated encryption **Sodium XChaCha20-Poly1305 IETF AEAD**:
  - Kunci enkripsi 32-byte (`master.key`) disimpan terpisah di `keys/master.key` dengan izin `0600`.
  - Nonce acak 24-byte di-generate per penyimpanan password.
  - Authentication tag 16-byte mengikat ciphertext dengan konteks `profile:<id>`.
  - Tabel `secret_key_registry` mencatat sidik jari SHA-256 dari `master.key` untuk mencegah pemakaian kunci asing.
- Tiga aksi eksplisit penanganan password:
  1. `keep` (default): Mempertahankan password terenkripsi yang sudah ada tanpa membaca ulang atau mendekripsi.
  2. `replace`: Mengenkripsi password baru dari form dan memperbarui ciphertext.
  3. `remove`: Menghapus baris rahasia di tabel `profile_secrets`.
- **Password Sementara Sesi (`SessionPasswords`)**: Untuk pengguna yang memilih "Jangan simpan password", password hanya disimpan di memori sesi aktif PHP yang dienkripsi dengan kunci sesi dinamis, dan dihapus otomatis setelah 1.440 detik (24 menit) atau saat disconnect/logout.

### C. Konektor MySQL & Verifikasi TLS (Brief 04)
- Koneksi selalu menggunakan transport TCP (menolak Unix socket default atau prefix persisten `p:`).
- Timeout terpisah:
  - **Connect Timeout**: 10 detik.
  - **Test Read Timeout**: 10 detik (hanya untuk pengujian awal respon greeting server).
  - **Administration Query Timeout**: Mengikuti net read timeout runtime normal (memungkinkan query berat/ekspor berjalan tanpa terpotong).
- **Verifikasi Sertifikat TLS Ketat**:
  - `tls_verify` wajib aktif secara baku.
  - Mendukung file Certificate Authority (`tls_ca`), client certificate (`tls_cert`), dan client private key (`tls_key`). Pasangan sertifikat/kunci klien divalidasi kecocokannya via OpenSSL sebelum menghubungkan TCP.
  - Tidak ada *fallback* diam-diam ke koneksi non-TLS jika handshake TLS gagal.

### D. Isolasi Tab Berbasis Kapabilitas (Brief 05)
- Setiap tab browser yang terhubung mendapatkan token acak 256-bit (`xpma_context`).
- Token ini terdaftar secara eksklusif dalam sesi PHP dan mengikat:
  - `profile_id`
  - `connection_revision`
  - Nomor server cache dinamis (`next >= 1000000`)
  - Timestamp kedaluwarsa (`expires = time() + 1440`)
  - Identitas storage unik (`storage = sha256(file:inode)`)
- Jika profil di-update (host, port, user, TLS berubah), `connection_revision` bertambah satu, secara otomatis membatalkan konteks lama dan memaksa tab lama melakukan *reconnect* eksplisit daripada mengalirkan query ke konfigurasi yang salah.

### E. Integrasi SSH Tunnel OpenSSH & Trust Host Key (v2)
- Menggunakan OpenSSH sistem (`/usr/bin/ssh`) dengan mekanisme **ControlMaster Unix Socket** per kapabilitas.
- Pemeriksaan sidik jari host SSH (`ssh_trust`):
  - Mengambil fingerprint server SSH target menggunakan `ssh-keyscan`.
  - Membandingkan dengan trust store lokal: status `trusted`, `unknown`, atau `changed`.
  - Jika fingerprint berubah (*changed*), koneksi langsung diblokir untuk mencegah serangan Man-in-the-Middle (MitM) dan memerlukan konfirmasi eksplisit dari pengguna.
- Port forwarding lokal loopback dinamis pada `127.0.0.1:<random_port>`.
- Pembersihan berkala melalui proses *sweeper* (`local-ssh-sweep.php`) yang memutus soket kontrol (`ssh -O exit`) jika lease kedaluwarsa.
- **Invarian Penting**: Kombinasi `SSH + TLS` diblokir (`tls_tunnel`) karena driver MySQLi tidak mendukung verifikasi Subject Alternative Name (SAN) hostname jika dihubungkan melalui forwarder loopback `127.0.0.1`.

---

## 3. Matriks Komparasi: Implementasi Web vs Desktop

| Dimensi | Implementasi Web (xphpMyAdmin PHP) | Implementasi Desktop (Electron App) |
| :--- | :--- | :--- |
| **Runtime Lingkungan** | PHP 8.2+ CLI & FPM (Herd/Nginx) | Electron 44 (Node.js 22+ V8 Engine) |
| **Penyimpanan Profil** | PDO SQLite (`profiles.sqlite`) | `better-sqlite3` atau driver SQLite terenkripsi |
| **Enkripsi Kunci Master** | Sodium Extension (`crypto_aead_xchacha20poly1305_ietf`) | Node.js `node:crypto` (AES-256-GCM / ChaCha20) |
| **Penyimpanan Sesi Sementara** | `$_SESSION` PHP + `SessionPasswords` | In-Memory Session Store (Node.js Main Process) |
| **Proses SSH Tunnel** | `proc_open` OpenSSH CLI + Unix Socket di macOS | Node.js `child_process.spawn` OpenSSH + Socket / Named Pipe |
| **Isolasi Tab** | URL param `?xpma_context=<token>` | State Context di Zustand / React Query + IPC Channel |
| **Antarmuka Pengguna** | Bootstrap 5 + CSS Kustom + phpMyAdmin Theme | React 19 + Tailwind CSS v4 + shadcn/ui (Termius Dark) |
| **Aksesibilitas & Keamanan** | Loopback Guard (127.0.0.1/::1) + CSRF Token | Context Isolation, Sandboxed Renderer, Nonce CSP |
| **Konektivitas Database** | Ekstensi PHP `mysqli` | Pustaka `mysql2/promise` native Node.js |

---

## 4. Pelajaran Utama untuk Arsitektur Desktop

1. **Konsistensi Skema v3**: Desktop harus mengadopsi struktur skema SQLite v3 yang sama agar format backup dan database profil dapat dipertukarkan antara versi web dan versi desktop tanpa friksi.
2. **Kerahasiaan Password Tanpa Kompromi**:
   - Password tidak boleh di-*expose* ke Renderer Process kecuali saat pengguna secara sengaja mengetik di formulir.
   - Respon IPC untuk pembacaan profil hanya boleh menyertakan `{ has_saved_password: boolean }`.
3. **Penyelarasan Desain dengan Termius UI**:
   - Pengalaman pengguna xphpMyAdmin web yang menggunakan offcanvas drawer Bootstrap dapat ditingkatkan secara signifikan pada desktop menggunakan panel Host Details di kolom kanan dengan debounced auto-save atau tombol simpan yang elegan, selaras dengan panduan `luluax-termius-ui`.
4. **Manajemen Siklus Hidup Proses Asinkron**:
   - Electron memiliki keunggulan proses latar belakang (*background worker*) yang stabil. Proses sweep SSH tunnel dan ping keep-alive database dapat berjalan mulus di Main Process tanpa membutuhkan cron/LaunchAgent eksternal.
