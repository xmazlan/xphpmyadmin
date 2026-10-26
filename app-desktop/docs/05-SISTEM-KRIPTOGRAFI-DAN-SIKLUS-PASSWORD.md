# 05 — Sistem Kriptografi & Siklus Pengelolaan Password

Dokumen ini menjelaskan implementasi subsistem keamanan, manajemen kunci simetris (*Master Key*), algoritma enkripsi terotentikasi (*Authenticated Encryption with Associated Data / AEAD*), serta siklus hidup password pada **xphpMyAdmin Desktop**.

---

## 1. Algoritma Kriptografi & Spesifikasi Amplop

Aplikasi mengadopsi standar enkripsi authenticated modern yang setara dengan Sodium native:

- **Algoritma Utama**: **XChaCha20-Poly1305 IETF** atau **AES-256-GCM** via modul bawaan Node.js (`node:crypto`).
- **Panjang Kunci**: 256 bit (32 byte acak kriptografis).
- **Inisialisasi Nonce / IV**: 192 bit (24 byte) untuk XChaCha20 atau 96 bit (12 byte) untuk AES-GCM, di-generate secara acak per operasi enkripsi.
- **Authentication Tag**: 128 bit (16 byte) untuk memvalidasi integritas ciphertext dan mencegah modifikasi data tanpa izin.
- **Associated Data (AAD)**: String pengikat konteks berbentuk `profile:<profile_id>` diikutsertakan dalam kalkulasi autentikasi tag. Hal ini memastikan bahwa ciphertext yang dicuri dari profil A tidak dapat dipindahkan atau didekripsi pada profil B (*cryptographic context binding*).

```
+----------------------------------------------------------------------------------+
|                          AMPLOP CIPHERTEXT (BLOB)                                |
+----------------------------------------------------------------------------------+
| Versi Format (1 byte) | Nonce (24 bytes) | Ciphertext (Variabel) | Tag (16 bytes)|
+----------------------------------------------------------------------------------+
                                       ^
                                       | Diikat oleh AAD: "profile:<id>"
```

---

## 2. Manajemen Kunci Master (`master.key`)

1. **Lokasi Berkas**: Berada di luar bundle aplikasi dan terpisah dari direktori basis data:
   - macOS: `~/Library/Application Support/xphpmyadmin/keys/master.key`
   - Linux: `~/.config/xphpmyadmin/keys/master.key`
   - Windows: `%APPDATA%\xphpmyadmin\keys\master.key`
2. **Izin Berkas**:
   - POSIX: Mode `0600` (hanya dapat dibaca/ditulis oleh akun pengguna aktif).
   - Windows: NTFS Access Control List (ACL) yang hanya memberikan akses penuh ke akun pengguna saat ini (`AccessControlType.Allow`).
3. **Pendaftaran Sidik Jari (`secret_key_registry`)**:
   - Saat kunci master dibuat pertama kali, sidik jari SHA-256 dari kunci dihitung dan disimpan di tabel `secret_key_registry`.
   - Pada setiap operasi pembacaan rahasia, sidik jari berkas `master.key` dicocokkan dengan nilai di tabel tersebut.
   - **Prinsip Fail-Safe**: Jika berkas kunci hilang, rusak, atau memiliki sidik jari yang berbeda, aplikasi **MENOLAK** secara aman dengan melemparkan error `SecretUnavailable()`. Aplikasi tidak akan pernah membuat kunci pengganti baru secara diam-diam karena tindakan tersebut akan merusak ciphertext lama yang belum terdekripsi.

---

## 3. Tiga Aksi Siklus Password (`keep`, `replace`, `remove`)

Antarmuka pengguna dan IPC mengimplementasikan tiga aksi mutasi password yang eksplisit:

```
                  +----------------------------------+
                  |  Form Formulir Profil / Drawer   |
                  +----------------------------------+
                                   |
           +-----------------------+-----------------------+
           |                       |                       |
           v                       v                       v
     [ Mode: keep ]        [ Mode: replace ]       [ Mode: remove ]
           |                       |                       |
  Pertahankan Ciphertext    Enkripsi Password       Hapus Baris di
    Lama di SQLite            Baru & Simpan       Tabel profile_secrets
 (Kunci Tidak Disentuh)   Ciphertext di SQLite   (Kembali Tanpa Password)
```

1. **`keep` (Default)**:
   - Digunakan saat pengguna hanya ingin mengubah nama profil, host, database, atau tag favorit tanpa mengganti password.
   - Operasi ini tidak membuka berkas `master.key` dan tidak melakukan operasi tulis ke tabel `profile_secrets`.
2. **`replace`**:
   - Meminta parameter input password dari pengguna (maksimal 65.536 byte).
   - Mendukung string kosong `""` jika akun MySQL sengaja dikonfigurasi tanpa password (*empty password*).
   - Menghasilkan nonce acak baru, mengenkripsi password dengan kunci master, dan memperbarui baris pada tabel `profile_secrets`.
3. **`remove`**:
   - Menghapus baris rahasia di tabel `profile_secrets`. Profil kembali berstatus `has_saved_password: false`.

---

## 4. Penyimpanan Sementara di Memori (`Session Memory Vault`)

Bagi pengguna yang memilih opsi **"Jangan simpan password"**, aplikasi menyediakan brankas memori sementara di Main Process:

```typescript
interface SessionSecretEntry {
  profileId: string;
  revision: number;
  passwordBuffer: Buffer;
  expiresAt: number; // Timestamp kedaluwarsa (detik)
}

// In-Memory Vault di Main Process (TIDAK PERNAH DITULIS KE DISK)
const sessionVault = new Map<string, SessionSecretEntry>();
```

### Karakteristik Keamanan Sesi Sementara:
- **Terkait Erat dengan Token Kapabilitas**: Kunci pencarian pada map adalah token acak 256-bit (`context_token`) yang mewakili tab sesi administrasi.
- **Pembersihan Memori Kriptografis (`Memory Zeroing`)**: Saat koneksi diputus (*disconnect*), sesi ditutup (*logout*), atau sesi kedaluwarsa setelah 1.440 detik (24 menit), buffer memori ditimpa dengan angka nol sebelum dihapus dari memori:
  ```typescript
  passwordBuffer.fill(0);
  sessionVault.delete(contextToken);
  ```
- **Kekebalan terhadap Kehilangan Kunci Master**: Password sementara tidak menggunakan `master.key` sehingga tetap dapat digunakan untuk menghubungkan server database meskipun berkas `master.key` sistem sedang mengalami masalah.
- **Isolasi dari Renderer**: Nilai password tidak pernah disimpan di `localStorage`, `sessionStorage`, cookies, atau state global React.
