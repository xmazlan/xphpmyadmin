# 07 — Terowongan SSH (SSH Tunnel) & Trust Host Key

Dokumen ini menjelaskan implementasi fitur **SSH Tunneling bawaan** pada **xphpMyAdmin Desktop**. Fitur ini memungkinkan pengguna menghubungkan basis data remote yang berada di balik firewall atau jaringan privat tanpa memerlukan perkakas tunnel pihak ketiga eksternal.

---

## 1. Filosofi & Batasan Keamanan

Berbeda dari aplikasi desktop lain yang sering kali mengabaikan verifikasi identitas host SSH:
1. **Tidak Ada Password SSH Web**: Autentikasi SSH hanya menggunakan **kunci privat lokal** (`id_ed25519`, `id_rsa`) atau `ssh-agent`. Kunci privat tidak pernah diunggah ke mana pun dan isinya tidak disimpan di dalam basis data.
2. **Pencegahan Serangan Man-in-the-Middle (MitM)**: Setiap host SSH yang baru pertama kali dihubungi wajib diverifikasi sidik jarinya (*fingerprint verification*). Jika sidik jari server berubah di masa mendatang, koneksi diblokir secara otomatis.
3. **Pemberhentian Terowongan yang Andal**: Menghindari proses *zombie* SSH yang terus berjalan di latar belakang dan memakan memori/port sistem.
4. **Aturan Invarian SSH + TLS**: Kombinasi `SSH + TLS` diblokir secara preventif (`tls_tunnel`) karena alamat endpoint di forwarder lokal adalah `127.0.0.1`, yang tidak akan cocok dengan Subject Alternative Name (SAN) sertifikat remote server sehingga berisiko menurunkan verifikasi sertifikat.

---

## 2. Arsitektur ControlMaster OpenSSH

Main Process berinteraksi langsung dengan executable **OpenSSH sistem** (`/usr/bin/ssh` pada macOS/Linux atau `C:\Windows\System32\OpenSSH\ssh.exe` pada Windows):

```
+-----------------------------------------------------------------------------------+
|                        MAIN PROCESS SUPERVISOR (Node.js)                          |
+-----------------------------------------------------------------------------------+
         |                                                 |
         | (1. Buat KnownHosts & Socket)                   | (4. Kirim Sinyal Kontrol)
         v                                                 v
  [ data/ssh/<id>.hosts ]                           [ ssh -O exit ]
         |
         | (2. Spawn Master Tunnel)
         v
  [ Child Process: ssh -f -N -M -S <id>.sock -L 127.0.0.1:<port>:<db_host>:<db_port> ]
         |
         | (3. Port Forwarding Berjalan di Loopback)
         v
  [ 127.0.0.1:<port> ] <=========================> [ Remote MySQL / MariaDB Server ]
```

### Parameter Baris Perintah OpenSSH yang Digunakan:
```bash
/usr/bin/ssh \
  -F /dev/null \
  -f -N -M -n -T -a -x \
  -S "/path/to/ssh/<token>.sock" \
  -i "/path/to/private_key" \
  -p 22 \
  -l username \
  -L 127.0.0.1:<allocated_port>:<remote_mysql_host>:3306 \
  -o BatchMode=yes \
  -o PasswordAuthentication=no \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile="/path/to/ssh/<token>.hosts" \
  -o GlobalKnownHostsFile=/dev/null \
  -o ConnectTimeout=10 \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=2 \
  -o ExitOnForwardFailure=yes \
  remote.ssh.server.com
```

---

## 3. Alur Verifikasi Sidik Jari Host Key (`SshTrust`)

Sebelum koneksi SSH diizinkan, aplikasi memverifikasi identitas kriptografis server SSH:

```
[ Drawer Profil ] -> Klik "Periksa host key profil tersimpan"
       |
       v
[ Eksekusi ssh-keyscan -T 10 -p <port> <ssh_host> ]
       |
       v
[ Ekstraksi Algoritma (ed25519/rsa) & Hitung Sidik Jari SHA256 ]
       |
       v
+-------------------------------------------------------------------------------+
| PEMERIKSAAN TERHADAP TABEL ssh_trust:                                         |
| 1. Belum Ada di Database -> Status: UNKNOWN (Tampilkan sidik jari baru)       |
| 2. Ada & Cocok           -> Status: TRUSTED (Koneksi diizinkan)               |
| 3. Ada & Berbeda         -> Status: CHANGED (BAHAYA! Potensi Serangan MitM)   |
+-------------------------------------------------------------------------------+
       |
       v
[ Pengguna Meninjau Sidik Jari & Menekan "Setujui Fingerprint" ]
       |
       v
[ Simpan ke Tabel ssh_trust & Siap Digunakan untuk Hubungkan ]
```

### Format Tampilan Sidik Jari di UI:
- **Algoritma**: `ssh-ed25519` (Disarankan) atau `rsa-sha2-512`
- **Sidik Jari**: `SHA256:7uK2Z9j...XyQ4`
- **Peringatan Perubahan**: Jika berstatus `changed`, kartu inspector menampilkan banner merah terang dengan tombol konfirmasi ganda (*double confirmation*) untuk mencegah pembobolan sesi.

---

## 4. Manajemen Lease & Background Sweeper

Untuk mencegah kebocoran port dan proses menggantung:
1. **Bukti Kepemilikan Ganda (`Receipt Verification`)**:
   - Setiap tunnel menyimpan berkas status JSON (`<id>.json`) dan berkas bukti tanda terima kepemilikan (`<id>.json.owner`) di direktori `userData/ssh/`.
   - Jika berkas tanda terima hilang atau tidak cocok dengan status JSON, tunnel dianggap *corrupted* dan segera dihentikan.
2. **Pemberhentian Bersih Melalui Soket Kontrol**:
   - Untuk mematikan tunnel, sistem tidak menggunakan `kill -9` sembarangan pada PID, melainkan mengirimkan perintah kontrol resmi ke soket:
     ```bash
     ssh -F /dev/null -S <id>.sock -O exit localhost
     ```
3. **Pembersih Otomatis Latar Belakang (`Sweeper Worker`)**:
   - Main Process menjalankan fungsi *sweeper* setiap 60 detik.
   - Menginspeksi seluruh berkas tunnel di direktori `userData/ssh/`:
     - Jika masa berlaku lease telah lewat (`expires <= now()`),
     - Jika konfigurasi profil induk telah diubah revisinya (`connection_revision`),
     - Jika tab sesi administrasi telah ditutup,
     - Maka proses SSH segera dihentikan dan seluruh berkas soket/known_hosts sementara dibersihkan.
4. **Terowongan Uji Sementara (*Ephemeral Test Tunnel*)**:
   - Saat pengguna menekan **"Tes Koneksi"** pada profil metode SSH, tunnel dibuka secara sementara hanya untuk mengecek port database, lalu **SEGERA DITUTUP** pada blok `finally`.
