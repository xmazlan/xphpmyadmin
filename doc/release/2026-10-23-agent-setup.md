# Konfigurasi agent untuk Herd aktif

23 Oktober 2026. Pada Herd PHP 8.5.12 FPM, `SSH_AUTH_SOCK` environment awalnya
kosong dan proses SSH aplikasi tidak dapat mengakses agent login pengguna.

Ditambahkan dukungan `ssh_agent_socket` pada konfigurasi privat aplikasi sebagai
override environment SSH subprocess. Socket harus tetap lolos pemeriksaan path,
tipe socket dan ownership yang sama. Tidak mengubah shared pool Herd, konfigurasi
SSH global, passphrase atau private key. Konfigurasi privat asli dibackup sebelum
perubahan atomik berizin 0600.

Probe FastCGI pada pool Herd aktif (bukan PHP CLI) memverifikasi:

- SAPI `fpm-fcgi`.
- Environment agent tetap kosong; tidak ada perluasan environment pool.
- Subprocess `ssh-add -l` berhasil melalui override aplikasi.
- Key publik yang diharapkan sudah tersedia dalam agent.

Regresi `python3 test/local/ssh_fixture.py` lulus: proses/trust, MySQL/MariaDB,
HTTP isolasi target, changed host key, auth/timeout, FPM, dan encrypted identity.
Ditambahkan kasus CLI/FPM menggunakan encrypted key melalui override privat
ketika environment `SSH_AUTH_SOCK` dihapus.

Path key pada drawer dikembalikan dari notasi tilde ke path absolut key yang
sama. Fingerprint kandidat server cocok dengan catatan known_hosts lokal yang
sudah ada. Persetujuan trust aplikasi tetap merupakan aksi eksplisit pengguna;
probe agent ini tidak login ke database pengguna atau mengubah password.
