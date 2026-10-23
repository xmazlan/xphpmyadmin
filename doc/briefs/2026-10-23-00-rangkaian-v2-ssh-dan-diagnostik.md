# Rangkaian brief v2 — SSH Tunnel dan diagnostik koneksi

Tanggal: 23 Oktober 2026  
Status: diimplementasikan dan divalidasi pada cakupan runtime v2; lihat [laporan penerimaan](../release/2026-10-23-v2.md) dan batas dukungannya

## Tujuan dan cakupan

Menambahkan SSH Tunnel bawaan dan diagnostik koneksi pada pengelola profil
xphpMyAdmin lokal pribadi. Ini merupakan perluasan v2; [PRD v1](../../PRD.md)
dan brief 01–07 tetap menjadi catatan baseline yang telah diimplementasikan.
Keputusan v1 tentang tunnel eksternal tidak diubah secara retrospektif.

Profil direct/VPN, password terenkripsi opsional, TLS, tes koneksi dan isolasi
tab sudah tersedia. V2 menambahkan transport SSH, trust host key, lifecycle
lintas request dan diagnostik; tidak mengimplementasikan ulang fitur tersebut.

## Urutan implementasi

1. [Brief 01 — Profil SSH dan kepercayaan host](2026-10-23-01-profil-ssh-dan-kepercayaan-host.md).
2. [Brief 02 — Pengelola tunnel OpenSSH](2026-10-23-02-pengelola-tunnel-openssh.md).
3. [Brief 03 — Integrasi transport dan konteks per tab](2026-10-23-03-integrasi-transport-dan-konteks.md).
4. [Brief 04 — UI SSH dan diagnostik koneksi](2026-10-23-04-ui-ssh-dan-diagnostik-koneksi.md).
5. [Brief 05 — Validasi rilis SSH dan diagnostik](2026-10-23-05-validasi-rilis-ssh-dan-diagnostik.md).

## Keputusan awal

- OpenSSH sistem, public key lokal dan ssh-agent; tidak ada password SSH,
  penyimpanan passphrase atau upload private key dalam iterasi awal.
- Satu tunnel per konteks; Test memakai tunnel sementara. Lease mengikuti TTL
  konteks 24 menit, dengan sweep on-request dan CLI tiap menit untuk orphan.
- Host key harus dipercaya secara eksplisit sebelum koneksi; perubahan key
  memblokir penggunaan sampai ditinjau. Listener hanya pada loopback.
- Identitas database logis harus tetap digunakan untuk TLS. Dukungan driver
  wajib dibuktikan; kombinasi yang tidak didukung diblokir, tanpa downgrade.
- Diagnostik berbasis hasil aktual per tahap; tidak memerlukan streaming,
  polling status global atau penyimpanan riwayat koneksi baru.

## Gerbang rilis

Tidak boleh ada salah target antar-tab, bypass verifikasi host key/TLS,
kebocoran rahasia, listener LAN atau proses tunnel yang gagal dibersihkan
oleh mekanisme lease/sweep. Migrasi dan recovery harus mempertahankan profil
serta rahasia v1. Hasil uji dicatat sebelum fitur dinyatakan tersedia.

Duplikasi profil, ekspor/impor profil dan riwayat koneksi tetap kandidat
pengembangan terpisah setelah paket SSH dan diagnostik selesai.
