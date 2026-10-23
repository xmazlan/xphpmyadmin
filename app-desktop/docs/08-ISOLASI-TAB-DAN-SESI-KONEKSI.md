# 08 — Isolasi Tab & Sesi Administrasi Database

Dokumen ini menjelaskan arsitektur penanganan multi-tab dan pencegahan pembelokan target (*Silent Target Drift*) pada **xphpMyAdmin Desktop**.

---

## 1. Masalah "Silent Target Drift" pada Pengelola Database Tradisional

Pada aplikasi administrasi database multi-koneksi standar:
- Sering kali hanya ada satu variabel koneksi aktif secara global.
- Jika pengguna membuka tab koneksi server **Staging** di Tab 1, lalu menghubungkan server **Production** di Tab 2:
  - Ketika pengguna kembali ke Tab 1 dan menekan tombol *Execute Query* (`DROP TABLE test_users`), query tersebut bisa saja dieksekusi di server **Production** karena koneksi aktif telah berubah di latar belakang tanpa disadari pengguna!
- **Bencana ini dieliminasi 100% oleh arsitektur kapabilitas xphpMyAdmin.**

---

## 2. Model Kapabilitas Berbasis Token 256-Bit (`context_token`)

Setiap kali pengguna menekan tombol **"Hubungkan"** pada profil tersimpan, sistem tidak menyetel variabel global, melainkan menghasilkan token kapabilitas acak 256-bit:

```typescript
interface TabConnectionContext {
  token: string;                     // 256-bit random hex string
  profileId: string;                 // UUID v4 profil
  revision: number;                  // connection_revision yang diikat saat connect
  targetIdentity: {
    name: string;
    host: string;
    port: number;
    username: string;
    database: string | null;
    environment: 'Local' | 'Staging' | 'Production' | 'Other';
  };
  tunnelPort?: number;               // Port lokal loopback jika via SSH
  expiresAt: number;                 // Timestamp kedaluwarsa sesi (1.440 detik)
}
```

```
+-----------------------------------------------------------------------------------+
|                         HEADER TABS MULTI-KONEKSI                                 |
+-----------------------------------------------------------------------------------+
|  [ Tab 1: 🔴 Prod Cluster ]    [ Tab 2: 🟡 Staging API ]   [ Tab 3: 🟢 Local Dev ]|
+-----------------------------------------------------------------------------------+
            |                               |                           |
            v                               v                           v
  [ Context Token A ]             [ Context Token B ]         [ Context Token C ]
  (Server 10.0.1.5:3306)          (Server 172.16.0.2:3306)    (127.0.0.1:3306)
            |                               |                           |
            v                               v                           v
  [ MySQL Connection A ]          [ MySQL Connection B ]      [ MySQL Connection C ]
```

### Invarian Isolasi:
1. **Eksekusi Terisolasi**: Setiap permintaan eksekusi query SQL, navigasi struktur tabel, atau ekspor data membawa `context_token` masing-masing.
2. **Pengecekan Revisi Ketat**: Sebelum menjalankan query di server, sistem memvalidasi bahwa `revision` pada token cocok dengan `connection_revision` profil saat ini di SQLite.
3. **Pencabutan Otomatis (*Auto-Revocation*)**: Jika pengguna mengedit alamat host, port, username, atau kunci TLS profil di inspector, seluruh token sesi yang sedang aktif untuk profil tersebut otomatis dibatalkan. Saat pengguna membuka kembali tab tersebut, antarmuka menampilkan pesan:
   > *"Koneksi kedaluwarsa atau parameter target telah diubah. Silakan hubungkan kembali secara eksplisit."*

---

## 3. Konfirmasi Perubahan Editor Belum Disimpan (*Dirty State Confirmation*)

Untuk mencegah kehilangan query SQL yang sedang diketik atau salah mengeksekusi script:
- Jika pengguna telah mengetik teks di editor query SQL, status editor ditandai sebagai `isDirty: true`.
- Jika pengguna mencoba:
  - Mengganti target koneksi pada tab yang sama,
  - Menutup tab administrasi, atau
  - Menavigasi kembali ke daftar server utama,
- Sistem akan memunculkan dialog konfirmasi pencegahan:

```tsx
<AlertDialog open={isSwitchConfirmOpen}>
  <AlertDialogContent className="bg-[#10131a] border-[#232c4a] text-white">
    <AlertDialogHeader>
      <AlertDialogTitle>Perubahan Query Belum Disimpan</AlertDialogTitle>
      <AlertDialogDescription className="text-slate-400 text-sm">
        Editor SQL memiliki script query yang belum dieksekusi atau disimpan. 
        Meninggalkan layar ini akan membuang script tersebut.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <Button variant="outline" onClick={() => setIsSwitchConfirmOpen(false)}>
        Tetap di Editor
      </Button>
      <Button variant="destructive" onClick={() => proceedNavigation()}>
        Tinggalkan & Putus Koneksi
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 4. Semantik Disconnect vs Logout

Aplikasi membedakan secara tegas antara memutus satu koneksi dengan membersihkan seluruh sesi:

1. **`Disconnect` (Tunggal)**:
   - Berlaku hanya untuk tab yang bersangkutan (`context_token`).
   - Menutup soket TCP MySQL atau proses SSH Tunnel khusus tab tersebut.
   - Menghapus entri password sementara miliknya di memori vault.
   - **Tab lain tetap berjalan normal dan tidak terpengaruh.**
2. **`Logout` (Menyeluruh)**:
   - Menghentikan seluruh proses SSH Tunnel aktif.
   - Menutup seluruh koneksi MySQL terbuka di semua tab.
   - Mengosongkan seluruh memori brankas password (`sessionVault.clear()`).
   - Mengarahkan seluruh tab kembali ke halaman awal *Koneksi*.

---

## 5. Dua Mode Integrasi Administrasi di Versi Desktop

Arsitektur desktop mendukung dua opsi tampilan administrasi:

- **Mode A: Native Desktop Studio (Rekomendasi)**:
  - Komponen antarmuka React 19 native: Tree View daftar database & tabel di panel kiri, editor query Monaco/CodeMirror dengan syntax highlighting di tengah, dan tabel hasil eksekusi interaktif dengan pagination di bawah.
  - Memberikan kecepatan rendering 60 FPS dan konsumsi memori sangat rendah.
- **Mode B: Embedded phpMyAdmin Webview**:
  - Komponen `<webview>` Electron yang memuat aplikasi phpMyAdmin lokal dengan menyematkan query parameter `?xpma_context=<token>`.
  - Mempertahankan fungsionalitas impor/ekspor, desainer visual relasi, dan fitur-fitur kompleks phpMyAdmin 5.2 tanpa perlu menulis ulang seluruh fitur dari awal.
