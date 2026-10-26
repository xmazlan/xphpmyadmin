# 02 — Cetak Biru Arsitektur Desktop Electron

Dokumen ini menjelaskan arsitektur sistem tingkat tinggi dari aplikasi desktop **xphpMyAdmin Desktop** (`app-desktop`), menguraikan pemisahan tanggung jawab antar-proses, protokol komunikasi IPC yang aman, serta subsistem inti yang menggerakkan aplikasi.

---

## 1. Diagram Arsitektur Multi-Proses Electron

Aplikasi dibangun di atas pondasi **Electron 44** dengan arsitektur multi-proses yang memisahkan eksekusi hak istimewa tinggi (*Node.js native runtime*) dari lapisan presentasi visual (*Sandboxed React 19 Renderer*):

```
+-----------------------------------------------------------------------------------+
|                           MAIN PROCESS (Node.js 22+ Runtime)                      |
|                                                                                   |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  |   Storage Manager   |   |    Vault / Crypto   |   |   Connection Supervisor |  |
|  |  (SQLite v3 Engine) |   |  (AEAD Secret Store)|   |  (Contexts & Sweeper)   |  |
|  +---------------------+   +---------------------+   +-------------------------+  |
|             |                         |                           |               |
|             +-------------------------+---------------------------+               |
|                                       |                                           |
|                      +---------------------------------+                          |
|                      |   oRPC / IPC Dispatcher Server  |                          |
|                      +---------------------------------+                          |
+---------------------------------------|-------------------------------------------+
                                        | (Structured IPC MessagePorts)
+---------------------------------------|-------------------------------------------+
|                          PRELOAD LAYER (Context Isolation)                        |
|                                       |                                           |
|         contextBridge.exposeInMainWorld('electronAPI', { ...rpcBridge })          |
+---------------------------------------|-------------------------------------------+
                                        | (Type-Safe RPC Invocations)
+---------------------------------------v-------------------------------------------+
|                         RENDERER PROCESS (Chromium Sandbox)                       |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |  TanStack Router (File-based Routing) + TanStack React Query (State Cache)  |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                   Termius Dark (Midnight Navy) UI Shell                     |  |
|  |  [Top Omni-Search & Tabs] | [Left Nav Sidebar] | [Split Grid & Inspector]   |  |
|  +-----------------------------------------------------------------------------+  |
|  |                 62+ shadcn/ui Components (Radix-Nova Preset)                |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Subsistem Utama di Main Process

Main Process bertindak sebagai pelaksana tugas-tugas dengan hak istimewa tinggi (*privileged subsystem*). Tidak ada koneksi database langsung atau operasi filesystem yang diizinkan dijalankan di Renderer Process.

### A. Storage Manager (`src/main/storage/`)
- Mengelola berkas basis data SQLite v3 di `app.getPath('userData')/data/profiles.sqlite`.
- Menjalankan migrasi transaksional dari v1 hingga v3 secara otomatis saat aplikasi dimulai (*bootstrap*).
- Menjamin invariant:
  - `PRAGMA foreign_keys = ON`
  - `PRAGMA synchronous = FULL`
  - `PRAGMA busy_timeout = 250`
  - `PRAGMA secure_delete = ON`
- Menyediakan fungsi CRUD profil, pencarian teks dengan escape wildcard (`%`, `_`), filter favorit, dan pengurutan (`recent`, `name`).

### B. Vault & Secret Store (`src/main/vault/`)
- Mengelola enkripsi dan dekripsi password menggunakan algoritma **AES-256-GCM** atau **XChaCha20-Poly1305**.
- Berkas kunci `master.key` (32 bytes cryptographically secure random) disimpan di `app.getPath('userData')/keys/master.key` dengan izin filesystem `0600` (atau ACL terisolasi pada Windows).
- Memastikan integritas dengan sidik jari SHA-256 pada tabel `secret_key_registry`.
- Menjalankan siklus password tiga jalur:
  - `keep`: Tidak ada operasi kriptografi; mempertahankan ciphertext lama.
  - `replace`: Enkripsi password baru dan perbarui ciphertext di SQLite.
  - `remove`: Hapus baris ciphertext dari SQLite.
- Mengelola **Session Memory Vault**: Penyimpanan sementara di memori Node.js (`Map<string, Buffer>`) untuk koneksi dengan password sementara, otomatis terhapus saat disconnect, tab ditutup, atau mencapai timeout 1.440 detik (24 menit).

### C. MySQL Transport & Diagnostic Engine (`src/main/mysql/`)
- Menangani koneksi TCP langsung ke server MySQL/MariaDB menggunakan pustaka `mysql2/promise`.
- Mengimplementasikan dua batas timeout yang ketat:
  - **Connect Timeout**: 10 detik.
  - **Test Read Timeout**: 10 detik.
- Menguji parameter verifikasi TLS: CA authority, client certificate, dan client key pair.
- Menguji ketersediaan *initial database* sebelum koneksi dinyatakan valid.
- Menjalankan pengujian 4 tahap (*4-Stage Diagnostic Pipeline*) yang mengembalikan status tiap fase:
  1. `local_validation`
  2. `ssh_trust` (jika menggunakan SSH)
  3. `ssh_authentication_forwarding` (jika menggunakan SSH)
  4. `mysql_tls_authentication_initial_database`

### D. OpenSSH Supervisor & Lease Manager (`src/main/ssh/`)
- Mengawasi proses `ssh` OpenSSH native sistem (`/usr/bin/ssh` pada macOS/Linux atau `C:\Windows\System32\OpenSSH\ssh.exe` pada Windows).
- Menjalankan pemindaian *host key* menggunakan `ssh-keyscan` dan memverifikasi sidik jari SHA-256 terhadap data di tabel `ssh_trust`.
- Membuka tunnel berbasis soket kontrol unik per konteks kapabilitas:
  ```bash
  ssh -F /dev/null -f -N -M -S /path/to/socket.sock -i /path/to/key -L 127.0.0.1:<port>:<mysql_host>:<mysql_port> user@ssh_host
  ```
- Mengalokasikan port loopback `127.0.0.1` dinamis yang bebas tabrakan.
- Menjalankan timer *sweeper* berkala (setiap 60 detik) untuk menutup tunnel yang kedaluwarsa atau kehilangan kepemilikan.
- Menegakkan aturan keamanan: memblokir kombinasi `SSH + TLS` (`tls_tunnel`) secara preventif.

### E. Session & Capability Context Supervisor (`src/main/contexts/`)
- Menghasilkan token kapabilitas acak 256-bit (`context_token`) untuk setiap tab yang terhubung.
- Mengaitkan tab dengan:
  - Profil database dan nomor revisi terkini (`connection_revision`).
  - Handle koneksi MySQL aktif atau port tunnel SSH terdedikasi.
  - Snapshot informasi identitas target untuk status bar header.
- Mengatur pembatalan (*revocation*) konteks secara otomatis jika konfigurasi host, port, username, atau TLS profil diubah di inspector.

---

## 3. Komunikasi Antar-Proses: IPC & oRPC

Untuk memastikan integrasi antara React 19 dan Main Process bebas dari *type error*, komunikasi menggunakan pustaka **oRPC** yang mengadopsi skema validasi **Zod**:

```
[ Renderer Component ]
        |
        |  orpc.profiles.list({ search: 'prod', favoritesOnly: true })
        v
[ Typed oRPC Client ]
        |
        v  MessagePort / IPC Channel: "orpc:request"
[ Electron IPC Main ]
        |
        v  Zod Schema Parser & Validator
[ IPC Router Handler ]
        |
        v  ProfileRepository.list(...)
[ SQLite Database ]
```

### Keunggulan oRPC pada Desktop:
1. **End-to-End Type Safety**: Perubahan skema di Main Process langsung memicu kompilasi error di TypeScript Renderer jika ada parameter yang hilang atau salah tipe.
2. **Auto-Serialization Error**: Error seperti `ConnectionFailure('ssh_changed')` atau `SecretUnavailable()` ditransformasikan menjadi objek error terstruktur dengan kode status dan pesan bahasa Indonesia yang ramah pengguna.
3. **Payload Sanitization**: Fungsi-fungsi pembacaan profil (`list`, `detail`) secara ketat memfilter data rahasia sehingga ciphertext, nonce, dan hash kunci tidak pernah melintasi batas IPC ke Renderer.

---

## 4. Arsitektur Renderer Process (UI Shell)

Renderer Process dibangun menggunakan ekosistem React 19 modern:

1. **Routing**: `TanStack Router` dengan konfigurasi *file-based routing* di `src/routes/`.
   - `/` : Tampilan Konsol Utama (Termius 3-Column: Navigation, Cards Grid, Host Inspector Panel).
   - `/administration` : Tampilan Workspace Administrasi Database Multi-Tab (Browser Tabel, Eksekutor Query SQL, Struktur Skema).
   - `/keychain` : Pengelola Kunci SSH, Master Key, dan Sertifikat TLS.
   - `/settings` : Pengaturan tema, direktori penyimpanan, dan backup.

2. **State Management & Caching**:
   - `TanStack React Query` untuk memvalidasi, meng-cache, dan memperbarui daftar koneksi, status latency, serta respon tes secara asinkron.
   - React state lokal untuk mengontrol drawer/inspector panel dan status omni-search.

3. **Sistem Desain & Styling**:
   - Mengadopsi preset estetika **Termius Dark (Midnight Navy)** dengan token warna khusus di `src/styles/global.css`.
   - Menggunakan 62+ komponen bawaan dari pustaka resmi `@/components/ui/*` (`Button`, `Dialog`, `Drawer`, `Card`, `Tabs`, `Command`, `Badge`, `Sonner`, `Field`, `Input`, `Switch`, dll.).
   - Utilitas `cn()` dari `@/utils/tailwind` untuk penggabungan class dinamis.

---

## 5. Matriks Keamanan (Security Hardening)

Aplikasi desktop mengimplementasikan standar keamanan Electron kelas atas:

| Aturan Keamanan | Implementasi di xphpMyAdmin Desktop |
| :--- | :--- |
| **Context Isolation** | `contextIsolation: true` wajib aktif pada BrowserWindow. |
| **Node Integration** | `nodeIntegration: false` untuk mencegah injeksi script jahat mengeksekusi shell langsung dari antarmuka web. |
| **Content Security Policy** | Header CSP membatasi `default-src 'self'`, memblokir eksekusi inline script yang tidak terdaftar, dan menonaktifkan `eval()`. |
| **Navigation Restrictions** | Mencegah pembukaan URL eksternal di dalam jendela utama; link eksternal dibuka via `shell.openExternal()`. |
| **Permission Handler** | Menolak permintaan izin browser yang tidak relevan (kamera, mikrofon, geolocation, notifikasi desktop liar). |
| **Strict File Permissions** | Direktori `userData/data` dan `userData/keys` diatur dengan izin `0700`, dan berkas SQLite/kunci diatur dengan `0600`. |
