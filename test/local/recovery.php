<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';

use PhpMyAdmin\Local\ProfileBackup;
use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\ProfilePasswords;
use PhpMyAdmin\Local\ProfileRepository;
use PhpMyAdmin\Local\SecretKeyStore;

$count = 0;
function check(bool $ok, string $label): void {
    global $count;
    if (! $ok) { throw new RuntimeException('Recovery check failed: ' . $label); }
    $count++;
}
function rejects(callable $operation): void {
    try { $operation(); } catch (Throwable $error) { check(true, 'safe refusal'); return; }
    check(false, 'must refuse');
}
function clean(string $path): void {
    if (is_dir($path) && ! is_link($path)) {
        foreach (scandir($path) as $name) { if ($name !== '.' && $name !== '..') { clean($path . '/' . $name); } }
        rmdir($path);
    } else { unlink($path); }
}
$base = realpath(sys_get_temp_dir()) . '/xpma-recovery-' . bin2hex(random_bytes(8));
mkdir($base, 0700); mkdir($base . '/data', 0700); mkdir($base . '/keys', 0700);
$config = $base . '/local.json';
file_put_contents($config, json_encode(['profiles_enabled'=>true, 'data_dir'=>$base . '/data', 'key_dir'=>$base . '/keys'])); chmod($config, 0600);
$previous = getenv('XPHPMYADMIN_LOCAL_CONFIG'); putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $config);
$exitCode = 0;
$canary = 'synthetic-recovery-' . bin2hex(random_bytes(16));
try {
    $db = ProfileDatabase::openConfigured(); $profiles = new ProfileRepository($db);
    (new SecretKeyStore($db))->initialize();
    $a = (new ProfilePasswords($db))->create(['name'=>'Offline A', 'host'=>'offline.invalid', 'username'=>'fixture', 'favorite'=>true], ['action'=>'replace', 'password'=>$canary]);
    $profiles->recordConnectSuccess($a['id'], 1); // Synthetic last-used only; no remote connection in this suite.
    $profiles->create(['name'=>'Offline B', 'host'=>'other.invalid', 'username'=>'fixture']);
    $before = $profiles->list(); $configHash = hash_file('sha256', $config); $keyHash = hash_file('sha256', $base . '/keys/master.key');
    // Force committed WAL content to remain outside the main file while snapshotting.
    $wal = new PDO('sqlite:' . $base . '/data/profiles.sqlite');
    $wal->exec('PRAGMA journal_mode=WAL'); $wal->exec('PRAGMA wal_autocheckpoint=0');
    $profiles->update($a['id'], ['name'=>'WAL committed A']); $before = $profiles->list();
    check(is_file($base . '/data/profiles.sqlite-wal'), 'committed WAL present');
    ProfileBackup::backup($base . '/metadata', $base . '/backup-keys');
    check($profiles->list() === $before && hash_file('sha256', $config) === $configHash && hash_file('sha256', $base . '/keys/master.key') === $keyHash, 'active metadata/config/key preserved');
    foreach (['metadata', 'backup-keys'] as $dir) { check((fileperms($base . '/' . $dir) & 0777) === 0700, 'private directory'); }
    foreach (['metadata/profiles.sqlite', 'metadata/manifest.json', 'backup-keys/master.key'] as $file) {
        check((fileperms($base . '/' . $file) & 0777) === 0600, 'private file');
        check(strpos(file_get_contents($base . '/' . $file), $canary) === false, 'no plaintext password');
    }
    rejects(function () use ($base) { ProfileBackup::backup($base . '/metadata', $base . '/other-keys'); });
    check(! file_exists($base . '/other-keys'), 'no partial destination after refusal');
    ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/restored');
    $restored = json_decode(file_get_contents($base . '/restored/local.json'), true);
    check($restored['profiles_enabled'] === false && $restored['data_dir'] === $base . '/restored/data', 'disabled, rebased restore config');
    putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $base . '/restored/local.json');
    $recovered = ProfileDatabase::openExistingConfigured();
    check((new ProfileRepository($recovered))->list() === $before, 'identical IDs/metadata/favorite/revisions/last-used including WAL');
    check((new ProfilePasswords($recovered))->reveal($a['id'], 1) === $canary, 'original key decrypts after restore');
    $probe = $base . '/restart.php';
    file_put_contents($probe, '<?php require ' . var_export(dirname(__DIR__, 2) . '/vendor/autoload.php', true) . '; $d=PhpMyAdmin\\Local\\ProfileDatabase::openExistingConfigured(); echo hash("sha256",(new PhpMyAdmin\\Local\\ProfilePasswords($d))->reveal(' . var_export($a['id'], true) . ',1));'); chmod($probe, 0600);
    $output = []; $code = 1; exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($probe), $output, $code);
    check($code === 0 && implode('', $output) === hash('sha256', $canary), 'independent process/restart recovery');
    rejects(function () use ($base) { ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/restored'); });
    check(hash_file('sha256', $base . '/keys/master.key') === $keyHash, 'active key never replaced');
    $originalKey = file_get_contents($base . '/backup-keys/master.key');
    file_put_contents($base . '/backup-keys/master.key', random_bytes(32));
    rejects(function () use ($base) { ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/wrong-key'); });
    check(! file_exists($base . '/wrong-key'), 'wrong key refused before publication');
    file_put_contents($base . '/backup-keys/master.key', $originalKey); sodium_memzero($originalKey);
    $original = file_get_contents($base . '/metadata/profiles.sqlite');
    file_put_contents($base . '/metadata/profiles.sqlite', 'damaged');
    rejects(function () use ($base) { ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/damaged'); });
    check(! file_exists($base . '/damaged'), 'corrupt snapshot refused');
    file_put_contents($base . '/metadata/profiles.sqlite', $original); unset($original);
    $original = file_get_contents($base . '/metadata/profiles.sqlite');
    $originalManifest = file_get_contents($base . '/metadata/manifest.json');
    $corrupt = new PDO('sqlite:' . $base . '/metadata/profiles.sqlite');
    $corrupt->exec("UPDATE profile_secrets SET ciphertext=zeroblob(length(ciphertext))"); $corrupt = null;
    $manifest = json_decode($originalManifest, true);
    $manifest['database_sha256'] = hash_file('sha256', $base . '/metadata/profiles.sqlite');
    file_put_contents($base . '/metadata/manifest.json', json_encode($manifest));
    rejects(function () use ($base) { ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/bad-ciphertext'); });
    check(! file_exists($base . '/bad-ciphertext'), 'AEAD corruption rejected even with recomputed snapshot checksum');
    file_put_contents($base . '/metadata/profiles.sqlite', $original);
    file_put_contents($base . '/metadata/manifest.json', $originalManifest); unset($original);
    chmod($base . '/metadata/manifest.json', 0644);
    rejects(function () use ($base) { ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/open-mode'); });
    chmod($base . '/metadata/manifest.json', 0600);
    symlink($base . '/restored', $base . '/link');
    rejects(function () use ($base) { ProfileBackup::restore($base . '/metadata', $base . '/backup-keys', $base . '/link'); });
    putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $config);
    rename($base . '/keys/master.key', $base . '/keys/temporarily-missing.key');
    rejects(function () use ($base) { ProfileBackup::backup($base . '/missing-meta', $base . '/missing-keys'); });
    check(! file_exists($base . '/missing-meta') && ! file_exists($base . '/missing-keys'), 'missing key cleanup; no regeneration');
    rename($base . '/keys/temporarily-missing.key', $base . '/keys/master.key');
    rejects(function () use ($base) { ProfileBackup::backup(dirname(__DIR__, 2) . '/forbidden-backup', $base . '/forbidden-keys'); });
    rejects(function () use ($base) { ProfileBackup::backup($base . '/same-path', $base . '/same-path'); });
    check(! file_exists($base . '/same-path'), 'metadata and key backups must remain separate');
    // Exercise the actual CLI on a new destination, keeping all secrets out of arguments/output.
    $output = []; $status = 1;
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(dirname(__DIR__, 2) . '/scripts/local-backup.php')
        . ' backup ' . escapeshellarg($base . '/cli-meta') . ' ' . escapeshellarg($base . '/cli-keys'), $output, $status);
    check($status === 0 && strpos(implode('', $output), $canary) === false, 'CLI backup succeeds without credential output');
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(dirname(__DIR__, 2) . '/scripts/local-backup.php')
        . ' restore ' . escapeshellarg($base . '/cli-meta') . ' ' . escapeshellarg($base . '/cli-keys')
        . ' ' . escapeshellarg($base . '/cli-restored'), $output, $status);
    check($status === 0 && is_file($base . '/cli-restored/local.json'), 'CLI restore succeeds');
    // Schema/key-free installation also restores without silently generating a key.
    putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $base . '/blank/local.json');
    mkdir($base . '/blank', 0700); mkdir($base . '/blank/data', 0700); mkdir($base . '/blank/keys', 0700);
    file_put_contents($base . '/blank/local.json', json_encode(['profiles_enabled'=>false, 'data_dir'=>$base . '/blank/data', 'key_dir'=>$base . '/blank/keys'])); chmod($base . '/blank/local.json', 0600);
    ProfileDatabase::openConfigured(); ProfileBackup::backup($base . '/blank-meta', $base . '/blank-keys');
    ProfileBackup::restore($base . '/blank-meta', $base . '/blank-keys', $base . '/blank-restored');
    check(! file_exists($base . '/blank-restored/keys/master.key'), 'no key generation on key-free restore');
    echo $count . " recovery checks passed on disposable private directories; no remote database accessed.\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Recovery suite failed in ' . basename($error->getFile()) . ':' . $error->getLine() . "\n"); $exitCode = 1;
} finally {
    putenv($previous === false ? 'XPHPMYADMIN_LOCAL_CONFIG' : 'XPHPMYADMIN_LOCAL_CONFIG=' . $previous);
    clean($base);
}

exit($exitCode);
