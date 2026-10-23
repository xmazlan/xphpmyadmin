<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\ProfileRepository;
use PhpMyAdmin\Local\ProfilePasswords;
use PhpMyAdmin\Local\SecretKeyStore;
use PhpMyAdmin\Local\SecretUnavailable;
use PhpMyAdmin\Local\SessionPasswords;
use PhpMyAdmin\Local\StorageException;

$count = 0;
$logs = '';
function check(bool $ok, string $label): void
{
    global $count;
    if (! $ok) {
        throw new RuntimeException('Check failed: ' . $label);
    }
    $count++;
}
function rejects(callable $operation, string $type, string $label): void
{
    global $logs;
    try {
        $operation();
    } catch (Throwable $error) {
        $logs .= (string) $error . "\n";
        check($error instanceof $type, $label . ' exception');
        return;
    }
    check(false, $label . ' must fail');
}
function clean(string $path): void
{
    if (is_dir($path) && ! is_link($path)) {
        foreach (scandir($path) as $name) {
            if ($name !== '.' && $name !== '..') {
                clean($path . '/' . $name);
            }
        }
        rmdir($path);
    } elseif (file_exists($path) || is_link($path)) {
        unlink($path);
    }
}
$base = realpath(sys_get_temp_dir()) . '/xpma-passwords-' . bin2hex(random_bytes(8));
mkdir($base, 0700); mkdir($base . '/data', 0700); mkdir($base . '/keys', 0700); mkdir($base . '/sessions', 0700);
$config = $base . '/local.json';
file_put_contents($config, json_encode(['profiles_enabled' => false, 'data_dir' => $base . '/data', 'key_dir' => $base . '/keys']));
chmod($config, 0600);
$previous = getenv('XPHPMYADMIN_LOCAL_CONFIG');
putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $config);
$oldIgnoreArgs = ini_set('zend.exception_ignore_args', '0');
$file = $base . '/data/profiles.sqlite';
$keyFile = $base . '/keys/master.key';
$canary = 'synthetic-password-' . bin2hex(random_bytes(16));
$nextPassword = 'synthetic-replacement-' . bin2hex(random_bytes(16));
$temporaryPassword = 'synthetic-session-' . bin2hex(random_bytes(16));
$key = '';
try {
    $db = ProfileDatabase::openConfigured();
    $profiles = new ProfileRepository($db);
    $passwords = new ProfilePasswords($db);
    $keys = new SecretKeyStore($db);
    $inspect = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $metadata = ['name' => 'Synthetic A', 'host' => 'offline.invalid', 'username' => 'fixture'];
    $a = $passwords->create($metadata);
    $b = $passwords->create(array_replace($metadata, ['name' => 'Synthetic B']));
    check(! $a['has_saved_password'] && $passwords->reveal($a['id'], 1) === null, 'default no persistence');
    check(! file_exists($keyFile), 'read/create never generates key');
    $before = $profiles->detail($a['id']);
    rejects(function () use ($passwords, $a, $canary): void {
        $passwords->update($a['id'], ['name' => 'Must rollback'], ['action' => 'replace', 'password' => $canary]);
    }, SecretUnavailable::class, 'uninitialized key');
    check($profiles->detail($a['id']) === $before && ! file_exists($keyFile), 'failed save no metadata or key');

    // Explicit bootstrap, then idempotent bootstrap preserves the original key.
    $keys->initialize();
    $key = file_get_contents($keyFile);
    check(strlen($key) === 32 && (fileperms($keyFile) & 0777) === 0600, 'random private key');
    $keys->initialize();
    check(file_get_contents($keyFile) === $key, 'idempotent key init');
    $keyBackup = $base . '/original-key.backup'; file_put_contents($keyBackup, $key); chmod($keyBackup, 0600);
    $a = $passwords->update($a['id'], [], ['action' => 'replace', 'password' => $canary]);
    $b = $passwords->update($b['id'], [], ['action' => 'replace', 'password' => $canary]);
    check($a['has_saved_password'] && $b['has_saved_password'], 'saved indicator');
    check($passwords->reveal($a['id'], 1) === $canary, 'authenticated roundtrip');
    $rows = $inspect->query('SELECT profile_id, nonce, ciphertext FROM profile_secrets ORDER BY profile_id')->fetchAll(PDO::FETCH_ASSOC);
    check($rows[0]['nonce'] !== $rows[1]['nonce'] && $rows[0]['ciphertext'] !== $rows[1]['ciphertext'], 'random nonce for equal passwords');
    check(strlen($rows[0]['nonce']) === 24, 'nonce size');
    check($inspect->query('SELECT typeof(nonce) FROM profile_secrets LIMIT 1')->fetchColumn() === 'blob', 'binary envelope');
    check(! $profiles->create(array_replace($metadata, ['name' => 'No-save']))['has_saved_password'], 'other profile default unchanged');
    $rawBefore = $inspect->query("SELECT hex(ciphertext) FROM profile_secrets WHERE profile_id='" . $a['id'] . "'")->fetchColumn();
    $passwords->update($a['id'], ['name' => 'Keep edit']);
    check($passwords->reveal($a['id'], 1) === $canary, 'default keep existing');
    check($inspect->query("SELECT hex(ciphertext) FROM profile_secrets WHERE profile_id='" . $a['id'] . "'")->fetchColumn() === $rawBefore, 'keep does not reencrypt');
    $passwords->update($a['id'], [], ['action' => 'keep']);
    check($passwords->reveal($a['id'], 1) === $canary, 'explicit keep');
    $a = $passwords->update($a['id'], ['name' => 'Replace edit'], ['action' => 'replace', 'password' => $nextPassword]);
    check($passwords->reveal($a['id'], 1) === $nextPassword, 'replace password');
    check($a['last_used_at'] === null && $a['connection_revision'] === 1, 'secret operation no fake usage or target revision');
    $a = $passwords->update($a['id'], [], ['action' => 'remove']);
    check(! $a['has_saved_password'] && $passwords->reveal($a['id'], 1) === null, 'disable persistence removes ciphertext');
    check($passwords->reveal($b['id'], 1) === $canary, 'remove isolated to profile');
    $a = $passwords->update($a['id'], [], ['action' => 'replace', 'password' => '']);
    check($a['has_saved_password'] && $passwords->reveal($a['id'], 1) === '', 'explicit empty replacement is a valid password');
    $passwords->update($a['id'], [], ['action' => 'replace', 'password' => $nextPassword]);
    foreach ([['password' => ''], ['action' => 'keep', 'password' => ''], ['action' => 'remove', 'password' => ''],
        ['action' => 'replace'], ['action' => 'replace', 'password' => null], ['action' => 'replace', 'password' => []],
        ['action' => 'replace', 'password' => str_repeat('x', 65537)], ['action' => ''], ['action' => null],
        ['persist' => false], ['action' => 'replace', 'password' => $canary, 'unknown' => true]] as $change) {
        rejects(function () use ($passwords, $a, $change): void { $passwords->update($a['id'], ['name' => 'Invalid operation'], $change); }, InvalidArgumentException::class, 'invalid password command');
    }
    check($passwords->reveal($a['id'], 1) === $nextPassword, 'invalid commands preserve old password');
    rejects(function () use ($passwords, $metadata, $canary): void { $passwords->create($metadata + ['password' => $canary]); }, InvalidArgumentException::class, 'misplaced plaintext input rejected and redacted');

    // A failed ciphertext write rolls back metadata, connection revision, and any preceding secret changes.
    $before = $profiles->detail($a['id']);
    $inspect->exec("CREATE TRIGGER fail_secret BEFORE UPDATE ON profile_secrets BEGIN SELECT RAISE(ABORT, 'fixture write failure'); END");
    rejects(function () use ($passwords, $a, $canary): void { $passwords->update($a['id'], ['host' => 'rollback.invalid'], ['action' => 'replace', 'password' => $canary]); }, StorageException::class, 'atomic update failure');
    check($profiles->detail($a['id']) === $before && $passwords->reveal($a['id'], 1) === $nextPassword, 'metadata and old secret rollback together');
    $inspect->exec('DROP TRIGGER fail_secret');
    $inspect->exec("CREATE TRIGGER fail_insert BEFORE INSERT ON profile_secrets BEGIN SELECT RAISE(ABORT, 'fixture write failure'); END");
    $countBefore = count($profiles->list());
    rejects(function () use ($passwords, $metadata, $canary): void { $passwords->create($metadata, ['action' => 'replace', 'password' => $canary]); }, StorageException::class, 'atomic create failure');
    check(count($profiles->list()) === $countBefore, 'failed secret create leaves no metadata');
    $inspect->exec('DROP TRIGGER fail_insert');
    $inspect->exec("CREATE TRIGGER fail_remove BEFORE DELETE ON profile_secrets BEGIN SELECT RAISE(ABORT, 'fixture write failure'); END");
    rejects(function () use ($passwords, $a): void { $passwords->update($a['id'], ['name' => 'Rollback remove'], ['action' => 'remove']); }, StorageException::class, 'atomic removal failure');
    check($profiles->detail($a['id']) === $before, 'failed removal restores metadata');
    rejects(function () use ($profiles, $a): void { $profiles->delete($a['id']); }, StorageException::class, 'cascade deletion failure');
    check($profiles->detail($a['id']) === $before && $passwords->reveal($a['id'], 1) === $nextPassword, 'delete rollback retains secret');
    $inspect->exec('DROP TRIGGER fail_remove');
    $inspect->exec('BEGIN IMMEDIATE');
    try {
        rejects(function () use ($passwords, $a, $canary): void { $passwords->update($a['id'], ['name' => 'Locked'], ['action' => 'replace', 'password' => $canary]); }, StorageException::class, 'busy write');
    } finally {
        $inspect->exec('ROLLBACK');
    }
    check($profiles->detail($a['id']) === $before, 'locked write preserves metadata');

    // Missing, wrong, truncated and symlink keys never cause regeneration or data deletion.
    unlink($keyFile);
    foreach ([function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); },
        function () use ($keys): void { $keys->initialize(); },
        function () use ($passwords, $a, $canary): void { $passwords->update($a['id'], [], ['action' => 'replace', 'password' => $canary]); }] as $operation) {
        rejects($operation, SecretUnavailable::class, 'missing key');
        check(! file_exists($keyFile), 'missing key not recreated');
    }
    check(count($profiles->list()) === $countBefore && $profiles->detail($a['id'])['has_saved_password'], 'metadata available without key');
    $passwords->update($a['id'], ['name' => 'Keep without key'], ['action' => 'keep']);
    check($profiles->detail($a['id'])['name'] === 'Keep without key', 'metadata can edit with missing key');
    $keys->restore($keyBackup);
    check($passwords->reveal($a['id'], 1) === $nextPassword && $passwords->reveal($b['id'], 1) === $canary, 'explicit original key restoration');
    $wrongKey = random_bytes(32); $wrongBackup = $base . '/wrong-key'; file_put_contents($wrongBackup, $wrongKey); chmod($wrongBackup, 0600);
    rejects(function () use ($keys, $wrongBackup): void { $keys->restore($wrongBackup); }, SecretUnavailable::class, 'wrong restore candidate');
    check(file_get_contents($keyFile) === $key && $passwords->reveal($b['id'], 1) === $canary, 'wrong restore leaves healthy profiles untouched');
    foreach ([['init'], ['restore', $wrongBackup], ['restore', $keyBackup]] as $arguments) {
        $command = [PHP_BINARY, dirname(__DIR__, 2) . '/scripts/local-key.php'];
        $child = proc_open(array_merge($command, $arguments), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $logs .= stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        check(proc_close($child) === ($arguments === ['restore', $wrongBackup] ? 1 : 0), 'key CLI status');
    }
    check(file_get_contents($keyFile) === $key && $passwords->reveal($b['id'], 1) === $canary, 'key CLI never rotates existing key or ciphertext');

    file_put_contents($keyFile, $wrongKey);
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'wrong current key');
    rejects(function () use ($keys): void { $keys->initialize(); }, SecretUnavailable::class, 'init rejects wrong key');
    check(file_get_contents($keyFile) === $wrongKey, 'wrong key not silently replaced');
    file_put_contents($keyFile, 'truncated');
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'truncated key');
    $keys->restore($keyBackup);
    chmod($keyFile, 0644);
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'open key permissions');
    chmod($keyFile, 0600); unlink($keyFile); symlink($keyBackup, $keyFile);
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'symlink key rejected');
    rejects(function () use ($keys, $keyBackup): void { $keys->restore($keyBackup); }, RuntimeException::class, 'restore refuses unsafe destination');
    unlink($keyFile); $keys->restore($keyBackup);

    // Corruption and row substitution fail authentication. Other profiles remain usable.
    $statement = $inspect->prepare('SELECT * FROM profile_secrets WHERE profile_id=:id'); $statement->execute([':id' => $a['id']]); $original = $statement->fetch(PDO::FETCH_ASSOC);
    $damaged = $original['ciphertext']; $damaged[0] = chr(ord($damaged[0]) ^ 1);
    $statement = $inspect->prepare('UPDATE profile_secrets SET ciphertext=:value WHERE profile_id=:id');
    $statement->bindValue(':value', $damaged, PDO::PARAM_LOB); $statement->bindValue(':id', $a['id']); $statement->execute();
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'tampered ciphertext');
    check($profiles->detail($a['id'])['has_saved_password'] && $passwords->reveal($b['id'], 1) === $canary, 'tamper does not erase metadata or other secret');
    unlink($keyFile); $keys->restore($keyBackup);
    check($passwords->reveal($b['id'], 1) === $canary, 'restore still recovers healthy rows when another row corrupt');
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'restore never rewrites damaged ciphertext');
    $inspect->exec("UPDATE profile_secrets SET nonce=(SELECT nonce FROM profile_secrets WHERE profile_id='" . $b['id'] . "'), ciphertext=(SELECT ciphertext FROM profile_secrets WHERE profile_id='" . $b['id'] . "') WHERE profile_id='" . $a['id'] . "'");
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, SecretUnavailable::class, 'cross profile envelope replay');
    $passwords->update($a['id'], [], ['action' => 'replace', 'password' => $nextPassword]);
    $a = $passwords->update($a['id'], ['host' => 'new.invalid']);
    rejects(function () use ($passwords, $a): void { $passwords->reveal($a['id'], 1); }, RuntimeException::class, 'stale revision');
    check($passwords->reveal($a['id'], 2) === $nextPassword, 'current revision reveal');

    // Reveal after a real new PHP process; output contains only pass/fail, never a password.
    $worker = $base . '/reader.php';
    file_put_contents($worker, '<?php require ' . var_export(dirname(__DIR__, 2) . '/vendor/autoload.php', true)
        . '; $service = new \\PhpMyAdmin\\Local\\ProfilePasswords(\\PhpMyAdmin\\Local\\ProfileDatabase::openConfigured());'
        . ' echo hash_equals(' . var_export(hash('sha256', $nextPassword), true) . ', hash("sha256",$service->reveal('
        . var_export($a['id'], true) . ',2))) ? "restart-ok" : "failed";');
    $output = []; exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($worker) . ' 2>&1', $output, $status);
    $logs .= implode("\n", $output);
    check($status === 0 && implode('', $output) === 'restart-ok', 'decrypt after process restart');
    $public = json_encode([$profiles->list(), $profiles->detail($a['id'])]);
    foreach (['ciphertext', 'nonce', 'key_id', 'cipher_version', $canary, $nextPassword, base64_encode($key), bin2hex($key)] as $forbidden) {
        check(strpos($public, $forbidden) === false, 'safe read projection');
    }
    foreach (glob($base . '/data/*') as $storageFile) {
        $bytes = file_get_contents($storageFile);
        foreach ([$canary, $nextPassword, $key] as $forbidden) {
            check(strpos($bytes, $forbidden) === false, 'no plaintext/key in SQLite or sidecars');
        }
    }

    // PHP sessions: isolated context/revision, separate session, expiry, disconnect and logout hooks.
    ini_set('session.use_cookies', '0'); ini_set('session.cache_limiter', '');
    session_save_path($base . '/sessions'); session_id('fixture-session-a'); session_start();
    $session = new SessionPasswords(60); $contextA = bin2hex(random_bytes(16)); $contextB = bin2hex(random_bytes(16));
    $session->put($contextA, $a['id'], 2, $temporaryPassword); $session->put($contextB, $b['id'], 1, '');
    check($session->get($contextA, $a['id'], 2) === $temporaryPassword && $session->get($contextB, $b['id'], 1) === '', 'session roundtrip including explicit empty');
    check($session->get($contextA, $b['id'], 2) === null && $session->get($contextA, $a['id'], 1) === null, 'session profile/revision isolation');
    session_regenerate_id(true);
    $nativeSession = session_id();
    check($session->get($contextA, $a['id'], 2) === $temporaryPassword, 'native session ID rotation preserves same session');
    session_write_close();
    check($session->get($contextA, $a['id'], 2) === null, 'inactive session cannot reveal');
    check(strpos(file_get_contents($base . '/sessions/sess_' . $nativeSession), $temporaryPassword) === false, 'session file has no plaintext');
    session_id('fixture-session-b'); session_start();
    check($session->get($contextA, $a['id'], 2) === null, 'separate session has no secret');
    session_destroy(); $_SESSION = [];
    session_id($nativeSession); session_start();
    check($session->get($contextA, $a['id'], 2) === $temporaryPassword, 'same active session survives request boundary');
    $session->forgetContext($contextA);
    check($session->get($contextA, $a['id'], 2) === null && $session->get($contextB, $b['id'], 1) === '', 'disconnect only clears selected context');
    $session->put($contextA, $a['id'], 2, $temporaryPassword); $session->forgetProfile($a['id']);
    check($session->get($contextA, $a['id'], 2) === null && $session->get($contextB, $b['id'], 1) === '', 'profile revocation isolated');
    $session->put($contextA, $a['id'], 2, $temporaryPassword);
    $_SESSION[' xphpmyadmin_passwords ']['contexts'][$contextA]['expires_at'] = 0;
    check($session->get($contextA, $a['id'], 2) === null, 'expired entry cleared');
    $session->put($contextA, $a['id'], 2, $temporaryPassword);
    $_SESSION[' xphpmyadmin_passwords ']['contexts'][$contextA]['envelope']['ciphertext'][0] = chr(ord($_SESSION[' xphpmyadmin_passwords ']['contexts'][$contextA]['envelope']['ciphertext'][0]) ^ 1);
    rejects(function () use ($session, $contextA, $a): void { $session->get($contextA, $a['id'], 2); }, SecretUnavailable::class, 'session tampering');
    $session->clearAll(); check(! isset($_SESSION[' xphpmyadmin_passwords ']), 'logout hook clears encryption key and contexts');
    $session->put($contextA, $a['id'], 2, $temporaryPassword);
    session_unset(); session_destroy();
    check($session->get($contextA, $a['id'], 2) === null && ! file_exists($base . '/sessions/sess_' . $nativeSession), 'native session destruction removes temporary secrets');
    $_SESSION = []; session_id('fixture-new-session'); session_start();
    check($session->get($contextA, $a['id'], 2) === null, 'new session after logout cannot recover password');
    $session->clearAll(); session_destroy(); $_SESSION = [];
    rejects(function () use ($session, $contextA, $a, $temporaryPassword): void { $session->put($contextA, $a['id'], 2, $temporaryPassword); }, RuntimeException::class, 'cannot store outside session');
    check((int) $inspect->query('SELECT COUNT(*) FROM profile_secrets')->fetchColumn() === 2, 'temporary store does not persist to SQLite');
    $createdWithSecret = $passwords->create(array_replace($metadata, ['name' => 'Create persisted']), ['action' => 'replace', 'password' => $nextPassword]);
    check($createdWithSecret['has_saved_password'] && $passwords->reveal($createdWithSecret['id'], 1) === $nextPassword, 'atomic create with saved password');
    $profiles->delete($createdWithSecret['id']);
    $profiles->delete($a['id']);
    check($profiles->detail($a['id']) === null && (int) $inspect->query('SELECT COUNT(*) FROM profile_secrets')->fetchColumn() === 1, 'actual secrets cascade on profile deletion');
    check($passwords->reveal($b['id'], 1) === $canary, 'delete leaves other password intact');
    foreach ([$canary, $nextPassword, $temporaryPassword, $key, bin2hex($key), base64_encode($key)] as $forbidden) {
        check(strpos($logs, $forbidden) === false, 'exceptions and child output redact sensitive arguments');
    }
    $passwords->update($b['id'], [], ['action' => 'remove']);
    check((int) $inspect->query('SELECT COUNT(*) FROM profile_secrets')->fetchColumn() === 0, 'last saved secret can be removed');
    unlink($keyFile);
    rejects(function () use ($keys): void { $keys->initialize(); }, SecretUnavailable::class, 'registry prevents key regeneration even with zero secrets');
    check(! file_exists($keyFile) && count($profiles->list()) > 0, 'empty secret set does not lose key identity or metadata');
    $keys->restore($keyBackup);
    check($inspect->query('PRAGMA integrity_check')->fetchColumn() === 'ok', 'secret SQLite integrity');
    unset($passwords, $profiles, $keys, $db, $inspect);

    // Upgrade v1 fixture with a DDL collision: no partial v2 tables or metadata changes.
    $legacy = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $legacy->exec('DROP TABLE profile_secrets'); $legacy->exec('DROP TABLE secret_key_registry'); $legacy->exec('DROP TABLE ssh_trust'); $legacy->exec('ALTER TABLE profiles DROP COLUMN method'); $legacy->exec('ALTER TABLE profiles DROP COLUMN ssh_json'); $legacy->exec('PRAGMA user_version=1');
    $oldRows = $legacy->query('SELECT * FROM profiles ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    $legacy->exec('CREATE TABLE profile_secrets (fixture TEXT)');
    rejects(function (): void { ProfileDatabase::openConfigured(); }, StorageException::class, 'failed v1 migration');
    check((int) $legacy->query('PRAGMA user_version')->fetchColumn() === 1, 'failed upgrade preserves schema version');
    check((int) $legacy->query("SELECT COUNT(*) FROM sqlite_master WHERE name='secret_key_registry'")->fetchColumn() === 0, 'failed upgrade no half schema');
    check($legacy->query('SELECT * FROM profiles ORDER BY id')->fetchAll(PDO::FETCH_ASSOC) === $oldRows, 'failed upgrade metadata unchanged');
    $legacy->exec('DROP TABLE profile_secrets');
    $upgraded = ProfileDatabase::openConfigured();
    check((int) $legacy->query('PRAGMA user_version')->fetchColumn() === 3, 'v1 migration succeeds');
    check(array_map(static function ($row) { unset($row['method'], $row['ssh_json']); return $row; }, $legacy->query('SELECT * FROM profiles ORDER BY id')->fetchAll(PDO::FETCH_ASSOC)) === $oldRows, 'v1 upgrade preserves all metadata');
    check(file_get_contents($keyFile) === $key, 'upgrade never overwrites key');
    $recoveredKeys = new SecretKeyStore($upgraded);
    $recoveredKeys->initialize();
    check(file_get_contents($keyFile) === $key, 'explicit init adopts already-published complete key without replacing it');
    $legacy->exec('DELETE FROM secret_key_registry');
    unlink($keyFile);
    $legacy->exec("CREATE TRIGGER fail_registry BEFORE INSERT ON secret_key_registry BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
    rejects(function () use ($recoveredKeys): void { $recoveredKeys->initialize(); }, StorageException::class, 'registry commit failure');
    $published = file_get_contents($keyFile);
    check(strlen($published) === 32 && (int) $legacy->query('SELECT COUNT(*) FROM secret_key_registry')->fetchColumn() === 0, 'failed key registry leaves complete private key and no half registry');
    $legacy->exec('DROP TRIGGER fail_registry');
    $recoveredKeys->initialize();
    check(file_get_contents($keyFile) === $published, 'explicit retry recovers published key without regeneration');
    unset($legacy, $upgraded, $recoveredKeys);
    echo $count . " password checks passed with disposable SQLite, keys, and PHP sessions only.\n";
} finally {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    $_SESSION = [];
    putenv($previous === false ? 'XPHPMYADMIN_LOCAL_CONFIG' : 'XPHPMYADMIN_LOCAL_CONFIG=' . $previous);
    ini_set('zend.exception_ignore_args', (string) $oldIgnoreArgs);
    if ($key !== '') {
        sodium_memzero($key);
    }
    clean($base);
}
