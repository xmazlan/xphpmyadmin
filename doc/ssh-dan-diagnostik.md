# SSH Tunnel dan diagnostik v2

Implementasi 23 Oktober 2026. Profil Direct / VPN, password tersimpan, TLS dan
isolasi tab v1 dipertahankan. SSH memakai OpenSSH sistem dan satu master per
konteks; tidak ada password SSH, upload private key, jump host atau passphrase web.

## Upgrade dan recovery

Sebelum upgrade, buat **backup penuh metadata dan master key** dengan prosedur
[backup/recovery](pemulihan-dan-backup.md). Jalankan sebagai akun PHP:

```sh
php scripts/local-profiles-init.php
```

Schema 2 menjadi 3 secara transaksional. Sebelum DDL, bootstrap mengambil snapshot
SQLite konsisten `data_dir/pre-v3-<random>.sqlite`, memeriksa integrity/version,
dan mempertahankan identitas file store asli. Snapshot ini tidak menggantikan
backup master key. Profil lama menjadi `direct`; ciphertext dan registry key
berada pada tabel yang sama. HTTP tidak melakukan migrasi otomatis.

Backup penuh schema 3 mencakup konfigurasi SSH dan trust host key dalam SQLite.
Private key SSH, socket agent, registry tunnel dan sesi **tidak disalin**. Restore
selalu ke lokasi baru, disabled, dengan identitas store baru. Periksa kembali path
key, fingerprint dan akses runtime sebelum mengaktifkan instalasi hasil restore.
Rollback aplikasi v1 harus memakai snapshot schema 2 dan master key aslinya di
lokasi pemulihan baru; jangan menjalankan v1 terhadap schema 3. Verifikasi identitas
profil dan kemampuan dekripsi pada fixture sebelum cutover. Simpan store asli.

## Runtime Mac / Herd

Diperlukan PHP 8.2+, mysqli/OpenSSL, PDO SQLite, Sodium, `proc_open`, serta
`/usr/bin/ssh`, `/usr/bin/ssh-keyscan`. Metadata di direktori privat 0700 di luar
aplikasi/document root; file 0600. Subdirektori `data_dir/ssh` menyimpan lock,
known_hosts per master, control socket, lease JSON dan ownership receipt privat.
Karena batas Unix-domain socket Mac, panjang path kanonis `data_dir/ssh` maksimum
78 byte. Pilih lokasi privat lebih pendek bila muncul `ssh_prerequisite`.

Path identity SSH harus absolut, file reguler readable, milik akun PHP, tanpa
izin group/other (0400/0600), tanpa symlink leaf atau token `%`. Isinya tidak
masuk database, respons atau browser. Profil dapat disimpan saat server offline.
Pada SSH, **host/port MySQL ditafsirkan dari mesin SSH**.

Key berpassphrase harus sudah dimuat ke ssh-agent dengan `ssh-add` di lingkungan
lokal yang dipercaya. PHP FPM perlu menerima `SSH_AUTH_SOCK` absolut yang benar,
menunjuk socket milik akun PHP. Terminal dan FPM mempunyai environment berbeda;
keberhasilan Terminal tidak membuktikan FPM. Atur environment pool FPM melalui
mekanisme konfigurasi Herd yang digunakan instalasi, lalu restart worker dan
jalankan Tes dari browser. Jangan menambahkan passphrase ke pool/config aplikasi.
Bila shared pool Herd tidak meneruskan environment agent, konfigurasi privat
`local.json` dapat memuat `"ssh_agent_socket": "/absolute/path/to/agent/socket"`.
Override ini hanya diberikan ke proses OpenSSH xphpMyAdmin, tanpa mengubah pool
FPM atau membuka environment seluruh aplikasi. Ambil lokasi socket login agent
lewat `launchctl getenv SSH_AUTH_SOCK`, lalu pastikan key sudah dimuat. Setelah
logout/restart agent, path dapat berubah; perbarui konfigurasi privat bila perlu.
Field ini bukan passphrase atau isi key. Konfigurasi instalasi ini memakai
override tersebut dan telah diverifikasi melalui FPM aktif.

Agent forwarding dimatikan. Runtime tanpa agent tetap dapat memakai key yang
tidak terenkripsi; encrypted key tanpa agent gagal noninteraktif dan meminta
konfigurasi agent. Environment SSH dibatasi PATH/locale dan socket agent tervalidasi.
Konfigurasi SSH pengguna/sistem tidak diwarisi (`-F /dev/null`).

## Trust host key

Simpan profil, pilih **Periksa host key profil tersimpan**, lalu bandingkan
algoritme/fingerprint SHA256 dengan sumber independen milik administrator server.
Pengambilan kandidat jaringan tidak memberikan trust. Tombol persetujuan adalah
POST ber-CSRF terpisah dan tidak login MySQL. Kandidat terikat profil, revision,
trust revision dan sesi; kedaluwarsa lima menit dan hanya dapat digunakan sekali.

Key unknown memblokir koneksi. Perubahan yang teramati memblokir trust tersimpan,
mencabut tunnel target tersebut dan menampilkan fingerprint lama/baru. Penggantian
memerlukan aksi khusus. Koneksi baru juga memakai strict host-key checking;
perubahan yang terdeteksi OpenSSH ditolak dan mencabut trust/master terkait.
Periksa kembali key melalui UI untuk meninjau penggantian. Master SSH yang sudah terautentikasi
bukan pemeriksaan key jaringan baru pada setiap query.

## TLS dan diagnostik

TLS tetap aktif default. Driver mysqli yang digunakan di sini belum menyediakan
peer hostname terpisah dari endpoint TCP. Karena itu **SSH + TLS diblokir dengan
`tls_tunnel`**, sebelum membuka database; tidak ada downgrade atau pengecualian
verifikasi sertifikat. Gunakan direct/VPN dengan TLS untuk kebutuhan tersebut.
Non-TLS melalui SSH tersedia hanya setelah pilihan non-TLS eksplisit pengguna;
hop server SSH ke database tidak mendapat TLS MySQL.

Rujukan API: [opsi mysqli](https://www.php.net/manual/en/mysqli.options.php) dan
[OpenSSH](https://man.openbsd.org/ssh.1). Batas dukungan tidak dianggap sebagai
bukti SAN hostname database berhasil lewat tunnel.

Respons Test mempertahankan `ok` dan `error.category/message`, dengan tambahan
`diagnostics`: `stage`, `status`, `duration_ms`, `code`. Tahapan:

- validasi lokal;
- trust SSH;
- autentikasi SSH dan forwarding (satu operasi OpenSSH);
- MySQL/TLS/autentikasi/database awal (satu tahap driver gabungan).

Direct melewati tahap SSH. Tahap yang belum dijalankan berstatus skipped. UI
menampilkan hasil setelah request selesai, tanpa polling atau riwayat koneksi.
Durasi tahap gabungan tidak dipecah menjadi estimasi DNS/TLS/login yang tidak
terukur. Respons tidak menampilkan stderr/command/environment atau rahasia.

## Lifecycle dan scheduler wajib

Test membuat tunnel sementara, ditutup setelah sukses/gagal; tidak mengubah target
aktif atau last_used_at. Connect mencatat sukses setelah validasi database awal.
Setiap request administrasi memvalidasi capability sesi, store, revision, trust,
control master dan listener terkelola. Target label tetap host MySQL logis.
Konteks dan credential idle TTL 24 menit; request valid memperbarui lease.
Tab yang ditutup ditangani lewat expiry, bukan deteksi penutupan browser.

Sweep berjalan saat store existing dibuka dari entrypoint lokal. Jadwalkan CLI
**setiap menit sebagai akun PHP**, dengan path PHP absolut dan konfigurasi privat
instalasi yang sesuai. Contoh crontab (ganti semua placeholder):

```cron
* * * * * XPHPMYADMIN_LOCAL_CONFIG=/absolute/private/local.json /absolute/path/php /absolute/path/xphpmyadmin/scripts/local-ssh-sweep.php
```

Aplikasi web tidak memasang scheduler otomatis. Pada instalasi lokal yang
mengimplementasikan v2 ini, LaunchAgent `id.xmazlan.xphpmyadmin.local-ssh-sweep`
sudah diaktifkan setiap 60 detik; eksekusi awal exit 0. Plist berada di
`~/Library/LaunchAgents/id.xmazlan.xphpmyadmin.local-ssh-sweep.plist`, dengan PHP
absolut, konfigurasi privat dan log 0600 dalam `data_dir/ssh`. LaunchAgent berjalan
saat akun login. Untuk pemasangan lain, pilih satu scheduler (LaunchAgent atau
contoh cron di atas). Periksa status dengan:

```sh
launchctl print "gui/$(id -u)/id.xmazlan.xphpmyadmin.local-ssh-sweep"
```

Untuk menghentikannya tanpa menghapus konfigurasi:

```sh
launchctl bootout "gui/$(id -u)/id.xmazlan.xphpmyadmin.local-ssh-sweep"
```

Tanpa scheduler, proses
idle dibersihkan pada request berikutnya, bukan dijamin saat semua tab tertutup.
Disconnect, logout, edit/delete profil, perubahan trust dan expiry mencabut lease.
Lock mengoordinasikan request/CLI. Ownership receipt memulihkan lease JSON yang
rusak/hilang; cleanup mengirim control `exit` hanya pada socket privat terikat
capability, bukan kill berdasarkan PID/port. Receipt dan lease yang keduanya rusak
memerlukan pemeriksaan operator; aplikasi tidak menebak kepemilikan proses lain.

Master mati menyebabkan reconnect eksplisit. Tidak ada restart tunnel atau replay
query otomatis. Jika jaringan putus di tengah query tulis, hasilnya mungkin tidak
pasti; periksa database setelah reconnect sebelum mengulangi operasi.

## Validasi

Lihat [matriks penerimaan](release/2026-10-23-v2.md). Semua uji memakai server,
profil, key, session dan data sintetis disposable; database aktif pengguna tidak
dipakai. Jalankan ulang dengan:

```sh
python3 test/local/release.py --report doc/release/2026-10-23-v2-regression.json
```
