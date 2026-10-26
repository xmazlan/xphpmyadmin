# 04 — Skema Basis Data SQLite v3 & Repository Profil

Dokumen ini menguraikan arsitektur basis data relasional lokal yang digunakan oleh **xphpMyAdmin Desktop**. Struktur skema ini mempertahankan kompatibilitas 100% dengan skema versi 3 yang dirancang pada xphpMyAdmin web.

---

## 1. Definisi Skema SQLite v3

Basis data tersimpan secara lokal pada lokasi berkas:
- **macOS**: `~/Library/Application Support/xphpmyadmin/data/profiles.sqlite`
- **Linux**: `~/.config/xphpmyadmin/data/profiles.sqlite`
- **Windows**: `%APPDATA%\xphpmyadmin\data\profiles.sqlite`

### A. Tabel `profiles` (Metadata Utama)
Menyimpan seluruh konfigurasi server database tanpa menyimpan materi rahasia (password tidak pernah menjadi kolom pada tabel ini).

```sql
CREATE TABLE profiles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK(length(name) > 0),
    host TEXT NOT NULL CHECK(length(host) > 0),
    port INTEGER NOT NULL CHECK(typeof(port) = 'integer' AND port BETWEEN 1 AND 65535),
    username TEXT NOT NULL CHECK(length(username) > 0),
    database_name TEXT,
    environment TEXT NOT NULL CHECK(environment IN ('Local', 'Staging', 'Production', 'Other')),
    tls_enabled INTEGER NOT NULL CHECK(tls_enabled IN (0, 1)),
    tls_verify INTEGER NOT NULL CHECK(tls_verify = 1),
    tls_ca TEXT,
    tls_cert TEXT,
    tls_key TEXT,
    favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_used_at TEXT,
    connection_revision INTEGER NOT NULL DEFAULT 1 CHECK(connection_revision >= 1),
    method TEXT NOT NULL DEFAULT 'direct' CHECK(method IN ('direct', 'ssh')),
    ssh_json TEXT
);

CREATE INDEX profiles_recent ON profiles(last_used_at DESC, id);
```

### B. Tabel `profile_imports` (Pelacak Impor Idempotent)
Melacak riwayat impor konfigurasi dari sumber lama (misal: `config.inc.php` atau berkas JSON eksternal) agar eksekusi impor berulang tidak menciptakan profil duplikat.

```sql
CREATE TABLE profile_imports (
    origin TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    imported_at TEXT NOT NULL
);
```

### C. Tabel `secret_key_registry` (Sidik Jari Kunci Master)
Mencatat identitas kriptografi kunci master (`master.key`) yang valid untuk basis data ini.

```sql
CREATE TABLE secret_key_registry (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    key_id TEXT NOT NULL CHECK(length(key_id) = 64),
    created_at TEXT NOT NULL
);
```

### D. Tabel `profile_secrets` (Enkripsi Ciphertext Password)
Menyimpan ciphertext password terenkripsi. Terhubung langsung dengan foreign key `ON DELETE CASCADE`.

```sql
CREATE TABLE profile_secrets (
    profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cipher_version INTEGER NOT NULL CHECK(cipher_version = 1),
    key_id TEXT NOT NULL CHECK(length(key_id) = 64),
    nonce BLOB NOT NULL CHECK(length(nonce) = 24),
    ciphertext BLOB NOT NULL CHECK(length(ciphertext) >= 16),
    updated_at TEXT NOT NULL
);
```

### E. Tabel `ssh_trust` (Trust Store Host Key SSH)
Menyimpan sidik jari algoritma dan kunci publik server SSH yang telah disetujui pengguna.

```sql
CREATE TABLE ssh_trust (
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    algorithm TEXT NOT NULL,
    public_key TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    revision INTEGER NOT NULL,
    blocked INTEGER NOT NULL DEFAULT 0 CHECK(blocked IN (0, 1)),
    PRIMARY KEY(host, port)
);
```

---

## 2. Parameter Invariant SQLite

Setiap koneksi basis data SQLite di Main Process wajib mengaktifkan pragma berikut:
```typescript
db.pragma('foreign_keys = ON');       // Menjamin cascade delete pada tabel secrets
db.pragma('busy_timeout = 250');       // Menghindari deadlock dengan batas tunggu 250ms
db.pragma('synchronous = FULL');       // Menjamin konsistensi transaksi ke storage disk
db.pragma('secure_delete = ON');       // Menimpa blok data yang dihapus dengan angka nol
```

---

## 3. Logika & Operasi Repository (`ProfileRepository`)

### A. Aturan Kenaikan Revisi (`connection_revision`)
Revisi koneksi digunakan oleh subsistem isolasi tab untuk mendeteksi apakah parameter target server telah berubah:
- **Parameter yang Menaikkan Revisi (`revision++`)**:
  - `host`, `port`, `username`, `database_name`
  - Konfigurasi `tls` (`enabled`, `verify`, `ca`, `cert`, `key`)
  - Konfigurasi `method` (`direct` vs `ssh`)
  - Konfigurasi objek `ssh` (`host`, `port`, `username`, `key`)
- **Parameter yang TIDAK Menaikkan Revisi**:
  - `name` (label nama tampilan)
  - `environment` (kategori lingkungan)
  - `favorite` (status bintang)
  - Password (memiliki siklus pembaruan mandiri di tabel `profile_secrets`)

Saat revisi bertambah, seluruh sesi tab yang terikat dengan revisi sebelumnya secara otomatis dicabut (*revoked*), dan pengguna diminta melakukan *reconnect* eksplisit.

### B. Validasi Masukan (`ProfileInput`)
Setiap data profil yang masuk ke repository divalidasi dengan ketat:
1. `name`: String UTF-8 tanpa karakter kontrol, panjang 1–255 karakter.
2. `host`: Alamat IPv4, IPv6, atau hostname domain yang valid (maksimal 253 karakter). Karakter perintah shell, spasi, atau URL otomatis ditolak.
3. `port`: Integer antara 1 hingga 65535 (default 3306).
4. `username`: String 1–128 karakter.
5. `database`: String opsional 1–64 karakter.
6. `environment`: Harus salah satu dari `'Local' | 'Staging' | 'Production' | 'Other'`.
7. `tls`: Flag `verify` wajib selalu bernilai `true`. Path file CA, sertifikat klien, dan kunci privat klien harus berupa path absolut di sistem lokal. Sertifikat dan kunci klien wajib diisi berpasangan.

### C. Proyeksi Aman Tanpa Rahasia
Query pembacaan profil (`list` dan `detail`) menggunakan proyeksi kolom eksplisit yang menyertakan kolom komputasi:
```sql
EXISTS(SELECT 1 FROM profile_secrets s WHERE s.profile_id = p.id) AS has_saved_password
```
Ciphertext, nonce, dan hash kunci master tidak pernah disertakan dalam query ini sehingga tidak ada celah pembocoran kredensial ke antarmuka pengguna.

### D. Pencarian & Pengurutan
- **Pencarian Substring**: Mencari kecocokan pada `name`, `host`, atau `username`. Karakter wildcard SQL (`%`, `_`) dan backslash (`\`) di-escape secara otomatis menjadi literal:
  ```sql
  WHERE (p.name LIKE :search ESCAPE '\' OR p.host LIKE :search ESCAPE '\' OR p.username LIKE :search ESCAPE '\')
  ```
- **Pengurutan (`sort`)**:
  - `recent`: `(p.last_used_at IS NULL) ASC, p.last_used_at DESC, p.created_at ASC, p.id ASC` (server yang paling baru sukses terhubung muncul paling atas).
  - `name`: `p.name COLLATE NOCASE ASC, p.id ASC` (alfabetis tidak peka huruf besar/kecil).
