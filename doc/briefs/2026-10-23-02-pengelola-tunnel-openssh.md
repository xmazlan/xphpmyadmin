# Brief 02 — Pengelola tunnel OpenSSH

Tanggal: 23 Oktober 2026  
Status: diimplementasikan dan divalidasi pada cakupan runtime v2; lihat [laporan penerimaan](../release/2026-10-23-v2.md) dan batas dukungannya  
Sumber: [Rangkaian v2](2026-10-23-00-rangkaian-v2-ssh-dan-diagnostik.md), [PRD v1](../../PRD.md)  
Urutan: 2 dari 5 dalam v2  
Dependensi: Brief 01 selesai.

## Tujuan

Menyediakan tunnel yang bertahan lintas request PHP dan memiliki lifecycle
terukur, dengan listener hanya pada loopback Mac.

## Pekerjaan

- Gunakan executable OpenSSH sistem melalui argumen terstruktur tanpa shell.
  Periksa kemampuan runtime PHP/FPM, executable, direktori privat, dan agent
  yang benar-benar tersedia; keberadaan SSH di Terminal belum membuktikan FPM
  dapat memakainya. Laporkan prerequisite yang tidak tersedia secara aman.
- Jalankan local forwarding hanya ke `127.0.0.1` pada port dinamis, dengan
  autentikasi noninteraktif, strict host-key checking terhadap store aplikasi,
  ExitOnForwardFailure, timeout SSH 10 detik, serta keepalive terbatas.
  Jangan mewarisi konfigurasi SSH pengguna yang dapat menjalankan command atau
  mengubah forwarding; gunakan konfigurasi terkendali dan hanya agent socket
  yang tervalidasi. Port bentrok boleh dicoba ulang maksimal tiga kali.
- Kelola master OpenSSH dengan control socket privat, lock dan registry lokal
  agar proses bertahan lintas request. Satu tunnel per konteks koneksi; tidak
  berbagi tunnel antarkonteks pada v2 awal. Test memakai tunnel sementara.
- Registry mengikat owner session, context, store identity, profile revision,
  target SSH/MySQL, trust revision, control socket, listener, dan lease.
  Jangan mengandalkan PID atau nomor port sebagai satu-satunya bukti kepemilikan.
- Perbarui lease pada request konteks yang valid mengikuti TTL konteks saat ini
  (24 menit). Lakukan sweep saat entrypoint lokal dipanggil dan sediakan CLI
  sweep untuk dijadwalkan tiap menit; dokumentasikan konfigurasi scheduler.
  Penutupan tab tanpa notifikasi ditangani oleh lease, bukan klaim deteksi tab.
- Cleanup harus idempotent; hentikan hanya master yang kepemilikannya telah
  diverifikasi. Kegagalan connect/test selalu membersihkan tunnel sementara.
  Logout, disconnect, expiry, edit/delete profil dan perubahan trust mencabut
  lease. Restart PHP tetap dapat menemukan dan membersihkan proses terdaftar.
- Jika master mati, jangan menggunakan ulang port yang mungkin diambil proses
  lain. Konteks gagal tertutup dan meminta reconnect eksplisit; jangan otomatis
  menjalankan ulang query, terutama query tulis.

## Kriteria selesai dan pengujian

- Tunnel berhasil pada fixture SSH/database disposable dan tetap tersedia
  setelah request PHP pembuat selesai.
- Listener tidak tersedia pada antarmuka LAN; injeksi opsi/command ditolak.
- Concurrent connect tidak mencampur registry/listener; bentrok port, SSH hang,
  autentikasi gagal, key berubah, master mati, dan registry rusak gagal aman.
- Test, logout, expiry, perubahan profil dan sweep membersihkan proses milik
  fixture; proses SSH lain tetap berjalan. Uji restart PHP dan sweep CLI.

## Hasil yang diserahkan

Layanan tunnel, registry/locking/lease, CLI cleanup, pemeriksaan prerequisite,
dan uji proses/lifecycle. Tidak ada shell command bebas dari input browser.

## Batasan bersama

- Lokal pribadi di Mac melalui Herd; MySQL/MariaDB. Pertahankan akses loopback,
  isolasi tab, TLS terverifikasi dan penyimpanan password opsional v1.
- Tidak mencakup multi-user, hosting publik, sinkronisasi, ekspor/impor profil,
  duplikasi profil, atau riwayat koneksi persisten baru.
- Jangan reset/truncate data pengguna atau mencantumkan rahasia nyata dalam
  kode, fixture, dokumentasi, log maupun laporan. Tes memakai fixture disposable.
- Sertakan perubahan, pemeriksaan yang dijalankan, hasil dan keterbatasan.
  Dokumen ini merupakan brief pekerjaan, bukan bukti fitur tersedia.

## Navigasi

- Sebelumnya: [Brief 01](2026-10-23-01-profil-ssh-dan-kepercayaan-host.md).
- Berikutnya: [Brief 03](2026-10-23-03-integrasi-transport-dan-konteks.md)
