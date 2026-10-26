# 06 — Konektor MySQL, Verifikasi TLS, & Pipeline Diagnostik 4-Tahap

Dokumen ini menguraikan arsitektur koneksi jaringan database MySQL/MariaDB, penegakan keamanan TLS (*Transport Layer Security*), pemilihan database awal, serta mesin diagnostik 4-tahap yang memberikan transparansi status koneksi kepada pengguna **xphpMyAdmin Desktop**.

---

## 1. Arsitektur Transport & Manajemen Timeout

Koneksi ke database dilakukan melalui subsistem Node.js di Main Process menggunakan pustaka `mysql2/promise` dengan konfigurasi parameter ketat:

```typescript
const connectionConfig = {
  host: normalizedHost,             // 'localhost' dinormalisasi menjadi '127.0.0.1'
  port: profile.port,               // Default: 3306
  user: profile.username,
  password: resolvedPassword,
  database: profile.database ?? undefined,
  connectTimeout: 10000,            // 10 detik batas waktu jabat tangan TCP
  ssl: tlsOptions,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
};
```

### Prinsip Pemisahan Timeout:
1. **Connect Timeout (10 Detik)**: Berlaku untuk semua percobaan pembuatan soket TCP baru. Jika host target tidak merespons dalam 10 detik, operasi dibatalkan dan diklasifikasikan sebagai `timeout`.
2. **Test Read Timeout (10 Detik)**: Hanya diterapkan pada soket uji koneksi (*Connection Test*). Menghindari proses UI tergantung (*hang*) jika server target menerima soket TCP tetapi menolak mengirimkan salam pembuka MySQL (*MySQL Handshake Greeting*).
3. **Administration Query Timeout**: Mengikuti kebijakan runtime normal yang tidak dibatasi oleh batas 10 detik, sehingga pengguna dapat menjalankan query agregasi kompleks, impor SQL ratusan megabyte, atau ekspor data tanpa terputus secara mendadak.

---

## 2. Penegakan Keamanan TLS & Verifikasi Sertifikat

Keamanan transmisi data merupakan prioritas mutlak. Aplikasi menolak penurunan tingkat enkripsi secara diam-diam (*no silent downgrade*):

1. **Verifikasi Sertifikat Wajib**:
   - Properti `tls_verify` selalu bernilai `true`.
   - Node.js memvalidasi rantai sertifikat menggunakan *trust store* sistem operasi atau berkas CA kustom (`tls_ca`).
2. **Mutual TLS (Otentikasi Klien)**:
   - Mendukung sertifikat klien (`tls_cert`) dan kunci privat klien (`tls_key`).
   - Sebelum memulai koneksi TCP, pasangan sertifikat dan kunci privat diverifikasi validitas dan kecocokannya menggunakan fungsi OpenSSL (`crypto.createPrivateKey` dan `crypto.X509Certificate`).
3. **Pemeriksaan Sandi Cipher Aktual**:
   - Setelah koneksi berhasil dibuka, sistem menjalankan query verifikasi:
     ```sql
     SHOW SESSION STATUS LIKE 'Ssl_cipher';
     ```
   - Jika konfigurasi meminta TLS aktif namun `Ssl_cipher` kosong atau bernilai `NULL`, koneksi **DITOLAK SEGERA** dan diklasifikasikan sebagai kegagalan `tls`.
4. **Pengecualian Non-TLS Eksplisit**:
   - Transmisi tanpa enkripsi hanya diizinkan jika pengguna secara sengaja menonaktifkan TLS melalui checkbox (*uncheck*).

---

## 3. Validasi Database Awal

Jika profil menyertakan parameter `database` (misalnya `ecommerce_db`):
- Pilihan database dieksekusi setelah verifikasi TLS selesai.
- Jika database tidak ada atau hak akses (*grant*) user tidak mencukupi, koneksi langsung dibatalkan dan menghasilkan pesan error kategori `database`.
- **Invarian Penting**: Sistem tidak akan pernah secara diam-diam memindahkan konteks administrasi ke database default lain seperti `information_schema` atau `test`.

---

## 4. Pipeline Diagnostik 4-Tahap (*4-Stage Diagnostic Pipeline*)

Saat pengguna menekan tombol **"Tes Koneksi"**, sistem menjalankan pengujian bertahap tanpa menyimpan profil ke basis data. Setiap tahap memancarkan status terstruktur ke UI:

```
[ Form Drawer ] -> Klik "Tes Koneksi"
       |
       v
+---------------------------------------------------------------------------------+
| TAHAP 1: Validasi Parameter Lokal (Format Host, Port Range, File TLS)           |
+---------------------------------------------------------------------------------+
       | (Sukses)
       v
+---------------------------------------------------------------------------------+
| TAHAP 2: Pemeriksaan Trust Host Key SSH (Khusus Metode SSH)                    |
+---------------------------------------------------------------------------------+
       | (Sukses / Dilewati jika Direct)
       v
+---------------------------------------------------------------------------------+
| TAHAP 3: Autentikasi SSH & Alokasi Forwarding Port Loopback (Khusus Metode SSH)  |
+---------------------------------------------------------------------------------+
       | (Sukses / Dilewati jika Direct)
       v
+---------------------------------------------------------------------------------+
| TAHAP 4: Handshake TCP MySQL, Negosiasi TLS, Login Akun, & Cek Initial Database |
+---------------------------------------------------------------------------------+
       |
       v  Hasil Evaluasi Lengkap
[ Indikator Visual UI: Hijau (Sukses) / Merah (Gagal) + Durasi Tiap Tahap (ms) ]
```

### Struktur Objek Respon Diagnostik:
```typescript
interface DiagnosticStage {
  stage: 'local_validation' | 'ssh_trust' | 'ssh_authentication_forwarding' | 'mysql_tls_authentication_initial_database';
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration_ms: number;
  code?: string;
  message?: string;
}

interface ConnectionTestResponse {
  ok: boolean;
  tls_active?: boolean;
  database_selected?: boolean;
  diagnostics: DiagnosticStage[];
  error?: {
    category: 'input' | 'dns' | 'network' | 'timeout' | 'authentication' | 'database' | 'tls' | 'storage' | 'ssh_unknown' | 'ssh_changed' | 'ssh_timeout' | 'ssh_authentication' | 'tls_tunnel';
    message: string;
  };
}
```

---

## 5. Matriks Klasifikasi Error & Pesan Aman

Aplikasi menyamarkan detail pesan driver mentah (*raw exception stack traces*) agar tidak membocorkan kredensial atau topologi jaringan:

| Kategori Error | Kode HTTP / IPC | Makna & Tindakan yang Disarankan |
| :--- | :--- | :--- |
| `input` | 422 | Format host, port, atau kredensial tidak valid. |
| `dns` | 502 | Hostname server tidak dapat di-resolve oleh DNS. |
| `network` | 502 | Port TCP ditolak, firewall memblokir, atau koneksi terputus. |
| `timeout` | 504 | Batas waktu jabat tangan 10 detik terlampaui. |
| `authentication` | 502 | Username atau password ditolak oleh MySQL/MariaDB. |
| `database` | 502 | Database awal tidak ditemukan atau user tidak memiliki hak akses. |
| `tls` | 502 | Sertifikat CA salah, masa berlaku kedaluwarsa, atau pasangan kunci tidak cocok. |
| `ssh_unknown` | 403 | Server SSH belum terdaftar di trust store. Klik "Periksa Host Key". |
| `ssh_changed` | 403 | **Peringatan Keamanan**: Sidik jari server SSH telah berubah dari catatan lama. |
| `ssh_timeout` | 504 | Server SSH tidak merespons dalam 10 detik. |
| `ssh_authentication`| 502 | Private key SSH ditolak oleh remote host. |
| `tls_tunnel` | 422 | **Batasan**: Kombinasi SSH Tunnel + TLS tidak didukung untuk mencegah kesalahan verifikasi SAN. |
| `storage` | 503 | Terjadi kesalahan akses pada basis data lokal atau Master Key. |
