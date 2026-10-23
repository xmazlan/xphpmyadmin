# 09 — Backup, Restore, & Pemulihan Bencana (Disaster Recovery)

Dokumen ini menjelaskan strategi pencadangan data (*backup*), prosedur pemulihan (*restore*), serta mitigasi insiden kehilangan kunci atau kerusakan data pada **xphpMyAdmin Desktop**.

---

## 1. Mekanisme Backup Atomik Konsisten

Mencadangkan basis data SQLite saat aplikasi sedang berjalan (*live system*) tidak boleh dilakukan dengan sekadar menyalin berkas `profiles.sqlite` secara langsung (karena berkas Write-Ahead Logging `profiles.sqlite-wal` dapat menyebabkan inkonsistensi data).

Sebagai gantinya, aplikasi menggunakan perintah atomik SQLite **`VACUUM INTO`**:

```typescript
// Eksekusi di Main Process
async function createConsistentBackup(destMetadataDir: string, destKeyDir: string) {
  const snapshotPath = path.join(destMetadataDir, 'profiles.sqlite');
  
  // 1. Eksekusi VACUUM INTO untuk membuat snapshot konsisten
  db.prepare('VACUUM INTO ?').run(snapshotPath);
  
  // 2. Verifikasi Integritas Snapshot
  const snapshotDb = new Database(snapshotPath);
  const integrity = snapshotDb.pragma('integrity_check', { simple: true });
  if (integrity !== 'ok') {
    throw new Error('Verifikasi integritas snapshot gagal.');
  }
  
  // 3. Salin Kunci Master Secara Terpisah
  const masterKeySource = path.join(getKeyDir(), 'master.key');
  const masterKeyDest = path.join(destKeyDir, 'master.key');
  fs.copyFileSync(masterKeySource, masterKeyDest);
  fs.chmodSync(masterKeyDest, 0o600);
  
  // 4. Buat Berkas manifest.json
  const manifest = {
    version: 1,
    schema_version: 3,
    profile_count: getProfileCount(snapshotDb),
    created_at: new Date().toISOString(),
    checksum_database: calculateSha256(snapshotPath),
    checksum_master_key: calculateSha256(masterKeyDest),
  };
  fs.writeFileSync(path.join(destMetadataDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}
```

### Karakteristik Berkas Cadangan:
1. `metadata/profiles.sqlite`: Berisi seluruh profil, riwayat impor, ciphertext password, dan registry kunci.
2. `metadata/manifest.json`: Berisi metadata, jumlah profil, timestamp, dan checksum SHA-256 (tanpa memuat materi rahasia).
3. `keys/master.key`: Berkas kunci simetris asli dengan izin ketat `0600`.
4. **Pemisahan Penyimpanan**: Direktori metadata dan direktori kunci wajib disimpan di lokasi penyimpanan yang terpisah demi keamanan.

---

## 2. Prosedur Restore ke Lokasi Baru

Prinsip utama pemulihan: **Jangan pernah menimpa instalasi aktif secara langsung!**

```
[ Berkas Backup ] 
       |
       v (Verifikasi Checksum & Integritas)
+---------------------------------------------------------------------------------+
| TAHAP PEMULIHAN KE DIREKTORI BARU (STAGING FOLDER)                              |
| Direktori Tujuan: userData/recovered-<timestamp>/                               |
|   ├── data/profiles.sqlite                                                      |
|   └── keys/master.key                                                           |
+---------------------------------------------------------------------------------+
       |
       v (Pemeriksaan Sidik Jari: master.key == secret_key_registry.key_id)
       v (Uji Coba Dekripsi Satu Entri Kredensial Sampel)
+---------------------------------------------------------------------------------+
| VERIFIKASI SUKSES -> ALIKAN POINTER AKTIF APLIKASI KE DIREKTORI HASIL RESTORE   |
+---------------------------------------------------------------------------------+
```

### Langkah-Langkah Pemulihan:
1. Pastikan folder tujuan merupakan direktori baru yang belum ada sebelumnya.
2. Salin basis data dan berkas kunci ke folder tujuan.
3. Jalankan `PRAGMA integrity_check` dan pastikan hasilnya `ok`.
4. Hitung sidik jari SHA-256 dari `keys/master.key` dan pastikan nilainya sama persis dengan `key_id` di tabel `secret_key_registry`.
5. Alihkan jalur konfigurasi aplikasi (*storage path*) ke direktori baru tersebut dan restart aplikasi.

---

## 3. Mitigasi Insiden: Kunci Master Hilang atau Ciphertext Rusak

Jika terjadi insiden fatal di mana berkas `master.key` hilang atau rusak akibat kerusakan media penyimpanan:

1. **Profil Tetap Terselamatkan**:
   - Seluruh daftar server (nama, host, port, username, database awal, tag lingkungan, status favorit) **tetap dapat dibaca dan dibuka dengan normal**.
   - Aplikasi tidak akan mengalami crash (*fail gracefully*).
2. **Indikator Kredensial**:
   - Kolom password menampilkan peringatan: *"Kunci master tidak tersedia. Masukkan password untuk sesi ini atau perbarui password tersimpan."*
3. **Pemulihan Kunci Spesifik**:
   - Jika pengguna memiliki salinan cadangan berkas `master.key` asli di tempat lain, pengguna cukup memilih opsi **"Pulihkan Kunci Master"** di menu Keychain.
   - Sistem akan memvalidasi apakah sidik jari berkas yang dipilih cocok dengan `key_id` lama. Jika cocok, kunci langsung dipulihkan dan seluruh password tersimpan lama langsung dapat didekripsi kembali.
4. **Aturan Larangan Mutlak**:
   - ❌ **Dilarang keras** menghapus baris tabel `secret_key_registry` atau menjalankan `init` baru secara otomatis saat kunci hilang, karena tindakan tersebut akan memusnahkan kemampuan pemulihan ciphertext profil lama untuk selamanya.
