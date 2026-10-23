<?php

declare(strict_types=1);

require_once __DIR__ . '/libraries/local-access.php';
require_once __DIR__ . '/vendor/autoload.php';

use PhpMyAdmin\Config;
use PhpMyAdmin\ErrorHandler;
use PhpMyAdmin\Local\ConnectionContexts;
use PhpMyAdmin\Local\Foundation;
use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Session;

header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405); header('Allow: GET'); exit('Gunakan GET.');
}
try {
    if (! Foundation::configuration()['profiles_enabled']) {
        http_response_code(404); exit('Fitur profil koneksi belum diaktifkan pada konfigurasi privat.');
    }
    Foundation::runtime();
    define('ROOT_PATH', __DIR__ . DIRECTORY_SEPARATOR);
    define('PHPMYADMIN', true);
    require_once ROOT_PATH . 'libraries/constants.php';
    $GLOBALS['PMA_PHP_SELF'] = (string) ($_SERVER['SCRIPT_NAME'] ?? '/local-connections.php');
    $config = new Config(CONFIG_FILE);
    if ($config->errorConfigFile) { throw new RuntimeException(); }
    Session::setUp($config, new ErrorHandler());
    header('Cache-Control: no-store');
    $token = $_SESSION[' PMA_token '];
    $context = is_string($_GET['xpma_context'] ?? null) ? $_GET['xpma_context'] : '';
    $active = null; $hint = ConnectionContexts::hint($context);
    if ($context !== '') {
        try {
            $contexts = new ConnectionContexts(ProfileDatabase::openExistingConfigured());
            $resolved = $contexts->resolve($context);
            $active = ConnectionContexts::identity($resolved['profile']);
            $hint = $active;
        } catch (Throwable $ignored) {
            // The page remains usable while remote servers or old contexts are unavailable.
        }
    }
} catch (Throwable $error) {
    http_response_code(503);
    exit('Layanan profil lokal tidak tersedia. Periksa konfigurasi privat dan penyimpanan, lalu muat ulang.');
}
function escape(string $text): string { return htmlspecialchars($text, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Koneksi · phpMyAdmin</title>
<link rel="icon" href="static/favicon.ico">
<link rel="stylesheet" href="themes/pmahomme/css/theme.css">
<link rel="stylesheet" href="css/local-connections.css">
<script defer src="js/vendor/bootstrap/bootstrap.bundle.min.js"></script>
<script defer src="js/dist/local-connections.js"></script>
</head>
<body id="xpma-connections" data-token="<?= escape($token) ?>" data-context="<?= escape($context) ?>">
<header class="xpma-masthead"><a href="local-connections.php" aria-label="phpMyAdmin — Koneksi"><img src="themes/pmahomme/img/logo_right.png" alt="phpMyAdmin" width="165"></a><span>Pengelola koneksi</span></header>
<main class="xpma-workspace">
<?php if ($context !== ''): ?>
<section class="alert <?= $active === null ? 'alert-warning' : 'alert-info' ?> xpma-current" aria-label="Konteks tab">
<div><strong><?= $active === null ? 'Hubungkan kembali' : 'Target tab ini' ?></strong>
<?php if ($hint !== null): ?><span> · <?= escape($hint['name']) ?> — <?= escape($hint['host']) ?>:<?= (int) $hint['port'] ?></span><?php endif ?>
<?php if ($active === null): ?><p class="mb-0">Konteks kedaluwarsa, terputus, atau profil berubah. Pilih profil dan hubungkan kembali; tidak ada perpindahan ke server default.</p><?php endif ?></div>
<?php if ($active !== null): ?><div class="xpma-actions"><a class="btn btn-outline-primary" href="index.php?<?= escape(http_build_query(['route' => '/', 'xpma_context' => $context, 'db' => $active['database'] ?? ''])) ?>">Kembali ke administrasi</a><button id="disconnect" class="btn btn-outline-secondary" type="button">Disconnect tab ini</button></div><?php endif ?>
</section>
<?php endif ?>
<div class="xpma-title"><div><h1>Koneksi</h1><p class="text-muted">Pilih profil untuk membuka administrasi database di tab ini.</p></div><div class="xpma-actions"><button id="logout" class="btn btn-outline-secondary" type="button">Logout semua koneksi</button><button id="add-profile" class="btn btn-primary" type="button">Tambah koneksi</button></div></div>
<div id="notice" role="status" aria-live="polite"></div>
<section aria-label="Profil koneksi">
<div class="xpma-toolbar"><div class="xpma-search"><label for="search">Cari profil</label><input id="search" class="form-control" type="search" placeholder="Nama, host, atau username" maxlength="512" autocomplete="off"></div><div><label for="sort">Urutkan</label><select id="sort" class="form-select"><option value="recent">Terakhir digunakan</option><option value="name">Nama</option></select></div><div class="form-check"><input id="favorites" class="form-check-input" type="checkbox"><label for="favorites" class="form-check-label">Favorit saja</label></div><button id="reload" type="button" class="btn btn-outline-secondary">Muat ulang</button></div>
<p class="xpma-explanation text-muted">Terakhir digunakan mencatat keberhasilan Hubungkan, bukan status server saat ini.</p>
<div id="list-state" class="xpma-state" role="status">Memuat profil koneksi…</div>
<div id="profile-table" class="table-responsive" hidden><table class="table table-hover align-middle"><caption class="visually-hidden">Profil server yang tersimpan secara lokal</caption><thead><tr><th scope="col">Favorit</th><th scope="col">Nama / lingkungan</th><th scope="col">Host / port</th><th scope="col">Username</th><th scope="col">Terakhir digunakan</th><th scope="col">Aksi</th></tr></thead><tbody id="profiles"></tbody></table></div>
</section>
</main>
<div class="offcanvas offcanvas-end" tabindex="-1" id="profile-drawer" aria-labelledby="drawer-title" data-bs-backdrop="static" data-bs-keyboard="false">
<div class="offcanvas-header"><h2 class="offcanvas-title" id="drawer-title">Tambah koneksi</h2><button class="btn-close" id="close-drawer" aria-label="Tutup drawer" type="button"></button></div>
<div class="offcanvas-body"><p class="text-muted">Simpan profil meski server offline. Tes koneksi tidak menyimpan perubahan.</p>
<form id="profile-form" autocomplete="off">
<div class="mb-3"><label for="profile-name" class="form-label">Nama koneksi <span aria-hidden="true">*</span></label><input id="profile-name" name="name" class="form-control" required maxlength="255"></div>
<div class="xpma-form-grid"><div><label for="profile-host" class="form-label">Host <span aria-hidden="true">*</span></label><input id="profile-host" name="host" class="form-control" required maxlength="253" placeholder="db.example.com"></div><div><label for="profile-port" class="form-label">Port <span aria-hidden="true">*</span></label><input id="profile-port" name="port" class="form-control" type="number" value="3306" required min="1" max="65535"></div></div>
<div class="xpma-form-grid"><div><label for="profile-user" class="form-label">Username <span aria-hidden="true">*</span></label><input id="profile-user" name="username" class="form-control" required maxlength="128" autocomplete="off"></div><div><label for="profile-database" class="form-label">Database awal <span class="text-muted">(opsional)</span></label><input id="profile-database" name="database" class="form-control" maxlength="64"></div></div>
<div class="xpma-form-grid"><div><label for="profile-environment" class="form-label">Lingkungan</label><select id="profile-environment" name="environment" class="form-select"><option>Local</option><option>Staging</option><option>Production</option><option selected>Other</option></select></div><div class="form-check"><input id="profile-favorite" name="favorite" class="form-check-input" type="checkbox"><label for="profile-favorite" class="form-check-label">Tandai favorit</label></div></div>
<fieldset class="xpma-fieldset"><legend>TLS</legend><div class="form-check mb-2"><input id="tls-enabled" name="tls_enabled" class="form-check-input" type="checkbox" checked><label for="tls-enabled" class="form-check-label">Gunakan TLS dengan verifikasi sertifikat</label></div><p class="small text-muted">TLS aktif secara default. Nonaktifkan hanya bila Anda memilih koneksi tanpa TLS secara eksplisit.</p>
<div id="tls-files"><div class="mb-3"><label for="tls-ca" class="form-label">File CA lokal <span class="text-muted">(opsional)</span></label><input id="tls-ca" name="tls_ca" class="form-control" placeholder="/path/to/ca.pem" maxlength="4096"></div><div class="mb-3"><label for="tls-cert" class="form-label">Sertifikat klien <span class="text-muted">(opsional)</span></label><input id="tls-cert" name="tls_cert" class="form-control" placeholder="/path/to/client.pem" maxlength="4096"></div><div><label for="tls-key" class="form-label">Kunci klien <span class="text-muted">(opsional)</span></label><input id="tls-key" name="tls_key" class="form-control" placeholder="/path/to/client.key" maxlength="4096"></div><p class="small text-muted mt-2">Path absolut di mesin PHP. Sertifikat dan kunci klien harus diisi berpasangan.</p></div></fieldset>
<fieldset class="xpma-fieldset"><legend>Password</legend><p id="password-status" class="small">Belum ada password tersimpan.</p><label for="password-action" class="form-label">Penyimpanan password</label><select id="password-action" class="form-select mb-3"><option value="keep">Jangan simpan password</option><option value="replace">Simpan / ganti password terenkripsi</option><option value="remove">Hapus password tersimpan</option></select><label for="profile-password" class="form-label">Password untuk Tes / Hubungkan</label><input id="profile-password" class="form-control" type="password" autocomplete="new-password" maxlength="65536"><div class="form-check mt-2"><input id="use-password" class="form-check-input" type="checkbox"><label for="use-password" class="form-check-label">Gunakan input password (termasuk kosong)</label></div><p class="small text-muted mt-2">Password tersimpan tidak ditampilkan kembali. Input tidak dipersistenkan kecuali Anda memilih Simpan / ganti.</p></fieldset>
<div id="drawer-notice" role="status" aria-live="polite"></div>
<div class="xpma-drawer-actions"><button id="test-profile" type="button" class="btn btn-outline-primary">Tes koneksi</button><button id="save-profile" type="submit" class="btn btn-primary">Simpan</button><button id="connect-profile" type="button" class="btn btn-outline-primary">Hubungkan</button></div><p id="dirty-note" class="small text-muted mt-2">Simpan profil sebelum Hubungkan.</p>
</form></div></div>
<div class="modal fade" id="delete-modal" tabindex="-1" aria-labelledby="delete-title" aria-describedby="delete-description"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="delete-title">Hapus profil koneksi?</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Batal hapus"></button></div><div class="modal-body"><p id="delete-description"></p><p>Profil lokal, password tersimpan, dan konteks sesi terkait akan dicabut. Database dan tabel di server tidak dihapus.</p><div id="delete-notice" role="status"></div></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button><button type="button" id="confirm-delete" class="btn btn-danger">Hapus profil lokal</button></div></div></div></div>
<noscript><p class="alert alert-warning m-4">Aktifkan JavaScript untuk mengelola koneksi.</p></noscript>
</body></html>
