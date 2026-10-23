<?php

declare(strict_types=1);
require_once __DIR__ . '/libraries/local-access.php';
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405); header('Allow: GET'); exit('Gunakan GET.');
}
?>
<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Panduan SSH · phpMyAdmin</title>
<link rel="icon" href="static/favicon.ico">
<link rel="stylesheet" href="themes/pmahomme/css/theme.css">
<link rel="stylesheet" href="css/local-connections.css">
</head>
<body id="xpma-connections">
<header class="xpma-masthead"><a href="local-connections.php" aria-label="phpMyAdmin — Koneksi"><img src="themes/pmahomme/img/logo_right.png" alt="phpMyAdmin" width="165"></a><span>Panduan SSH</span></header>
<main class="xpma-workspace xpma-ssh-guide">
<h1>Menyiapkan koneksi SSH</h1>
<p>Gunakan tiga lokasi berikut sesuai langkahnya: <strong>server SSH</strong> untuk memeriksa identitas server, <strong>Terminal Mac</strong> untuk key login dan agent, serta <strong>drawer xphpMyAdmin</strong> untuk menyetujui trust dan mengetes koneksi.</p>
<p>Panduan ini dibuka di tab terpisah. Kembali ke tab koneksi semula untuk melanjutkan; input drawer tetap ada.</p>
<nav aria-label="Isi panduan"><ul><li><a href="#host-key">Memverifikasi dan mempercayai host key</a></li><li><a href="#agent">Private key, passphrase, dan agent Herd</a></li><li><a href="#errors">Arti hasil diagnostik</a></li></ul></nav>
<section id="host-key" aria-labelledby="host-key-title">
<h2 id="host-key-title">1. Verifikasi identitas server, lalu setujui di aplikasi</h2>
<ol>
<li><strong>Di drawer:</strong> simpan profil SSH, lalu klik <strong>Periksa host key profil tersimpan</strong>. Catat host/port, algoritme dan fingerprint SHA256 yang ditampilkan.</li>
<li><strong>Di console server SSH yang sudah dipercaya:</strong> periksa fingerprint public host key. Untuk ED25519, jalankan:
<pre class="xpma-guide-command"><code>sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub</code></pre>
Jika algoritme yang ditampilkan aplikasi berbeda, minta administrator memeriksa public host key untuk algoritme tersebut. Lokasi file dapat berbeda jika server dikonfigurasi khusus. Anda juga dapat meminta fingerprint melalui saluran terpisah yang dipercaya.</li>
<li><strong>Bandingkan:</strong> algoritme dan fingerprint SHA256 harus sama persis. Jangan mempercayai hasil pengambilan key dari jaringan tanpa pembanding independen. Jangan membuat koneksi baru yang belum dipercaya hanya untuk memverifikasi koneksi itu sendiri.</li>
<li><strong>Kembali ke drawer:</strong> klik <strong>Percayai fingerprint yang telah diverifikasi</strong>, lalu <strong>Tes koneksi</strong>. Persetujuan trust sendiri tidak melakukan login MySQL.</li>
</ol>
<p><strong>Herd PHP-FPM tidak mempunyai tombol trust tersendiri.</strong> Trust disetujui di xphpMyAdmin setelah identitas server diverifikasi. Catatan <code>~/.ssh/known_hosts</code> Terminal tidak otomatis menjadi trust aplikasi.</p>
<p>Jika kandidat kedaluwarsa, klik Periksa host key lagi dan cocokkan kembali fingerprint sebelum menyetujui. Jika key berubah, periksa penyebabnya bersama administrator dan tinjau fingerprint lama/baru sebelum memilih penggantian trust.</p>
</section>
<section id="agent" aria-labelledby="agent-title">
<h2 id="agent-title">2. Siapkan key login dan agent di Mac</h2>
<p><strong>Host key server</strong> membuktikan identitas server. <strong>Key login Anda</strong> membuktikan akun Anda kepada server. Fingerprint dari <code>ssh-add -l</code> adalah fingerprint key login, sehingga tidak digunakan untuk menyetujui host key server.</p>
<ol>
<li>Isi path absolut private key di drawer, misalnya <code>/Users/nama-anda/.ssh/id_ed25519</code>. Notasi <code>~/.ssh/id_ed25519</code> tidak diterima. File harus dapat dibaca akun PHP dan mempunyai izin privat 0600 atau 0400.</li>
<li>Untuk key berpassphrase, jalankan di <strong>Terminal Mac</strong>:
<pre class="xpma-guide-command"><code>ssh-add --apple-use-keychain ~/.ssh/id_ed25519
ssh-add -l</code></pre>
Masukkan passphrase melalui prompt lokal jika diminta. Pastikan key Anda muncul pada daftar agent. Jangan memasukkan passphrase atau isi private key ke drawer.</li>
<li><strong>Pastikan agent dapat diakses Herd PHP-FPM.</strong> Berhasil di Terminal atau tersimpan di Apple Keychain belum membuktikan akses dari PHP-FPM. Konfigurasi agent khusus aplikasi dapat diperlukan; panduan teknis tersedia pada <code>doc/ssh-dan-diagnostik.md</code> di proyek. Perubahan socket setelah logout/restart agent mungkin memerlukan konfigurasi ulang.</li>
</ol>
<p>Aplikasi menggunakan konfigurasi OpenSSH terkendali; pengaturan <code>UseKeychain</code>, <code>AddKeysToAgent</code> dan <code>IdentityFile</code> dalam <code>~/.ssh/config</code> tidak diwarisi. Path key dipilih melalui profil.</p>
<p>Jika server membutuhkan VPN, sambungkan VPN sebelum memeriksa host key atau mengetes koneksi. Host MySQL dalam profil SSH dilihat dari server SSH. TLS MySQL tetap merupakan pilihan terpisah; kombinasi TLS melalui SSH yang belum didukung akan diblokir secara jelas.</p>
</section>
<section id="errors" aria-labelledby="errors-title">
<h2 id="errors-title">3. Membaca diagnostik</h2>
<div class="table-responsive"><table class="table"><thead><tr><th scope="col">Kode</th><th scope="col">Tindakan</th></tr></thead><tbody>
<tr><td><code>input</code></td><td>Periksa field wajib, port, path absolut dan izin key.</td></tr>
<tr><td><code>ssh_unknown</code></td><td>Verifikasi dan setujui host key melalui langkah 1. Autentikasi key login belum dijalankan.</td></tr>
<tr><td><code>ssh_changed</code></td><td>Konfirmasikan perubahan identitas server kepada administrator sebelum mengganti trust.</td></tr>
<tr><td><code>ssh_prerequisite</code> / <code>ssh_authentication</code></td><td>Periksa runtime Herd, akun SSH, key yang dipilih dan akses agent. Key berpassphrase harus sudah dimuat.</td></tr>
<tr><td><code>ssh_timeout</code></td><td>Periksa host/port SSH, jaringan dan VPN. Timeout bukan bukti passphrase salah.</td></tr>
<tr><td><code>authentication</code> / <code>database</code></td><td>Periksa akun/password MySQL atau izin database awal. SSH berhasil belum berarti login MySQL berhasil.</td></tr>
<tr><td><code>skipped</code></td><td>Tahap belum dijalankan karena dilewati atau tahap sebelumnya gagal.</td></tr>
</tbody></table></div>
</section>
<p>Kembali ke tab drawer semula untuk melanjutkan. <a href="local-connections.php">Buka pengelola koneksi</a> jika tab tersebut sudah ditutup.</p>
</main>
</body></html>
