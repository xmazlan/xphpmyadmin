<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

use PhpMyAdmin\Local\Foundation;
use PhpMyAdmin\Local\LegacyProfileImporter;
use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\ProfileRepository;
use PhpMyAdmin\Local\StorageException;

$count = 0;
function check(bool $ok, string $label): void
{
    global $count;
    if (! $ok) {
        throw new RuntimeException('Check failed: ' . $label);
    }
    $count++;
}
function rejects(callable $action, string $class, string $label, string $message = ''): void
{
    try {
        $action();
    } catch (Throwable $error) {
        check($error instanceof $class, $label . ' exception type');
        check($message === '' || strpos($error->getMessage(), $message) !== false, $label . ' safe message');
        return;
    }
    check(false, $label . ' must fail');
}
function removeTree(string $path): void
{
    if (is_dir($path) && ! is_link($path)) {
        foreach (scandir($path) as $entry) {
            if ($entry !== '.' && $entry !== '..') {
                removeTree($path . '/' . $entry);
            }
        }
        rmdir($path);
    } else {
        unlink($path);
    }
}
$base = realpath(sys_get_temp_dir()) . '/xpma-profiles-' . bin2hex(random_bytes(8));
mkdir($base, 0700); mkdir($base . '/data', 0700); mkdir($base . '/keys', 0700);
$config = $base . '/local.json';
file_put_contents($config, json_encode(['profiles_enabled' => false, 'data_dir' => $base . '/data', 'key_dir' => $base . '/keys']));
chmod($config, 0600);
$previous = getenv('XPHPMYADMIN_LOCAL_CONFIG');
putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $config);
$file = $base . '/data/profiles.sqlite';
try {
    $db = ProfileDatabase::openConfigured();
    $repository = new ProfileRepository($db);
    $inspect = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    check((int) $inspect->query('PRAGMA user_version')->fetchColumn() === 3, 'schema version');
    check((fileperms($file) & 0777) === 0600, 'database private mode');
    check($repository->list() === [], 'empty store');
    $input = ['name' => 'Offline %_ profile', 'host' => 'offline.invalid', 'username' => 'test-user'];
    $first = $repository->create($input);
    $second = $repository->create($input);
    check($first['id'] !== $second['id'], 'duplicate target distinct stable IDs');
    check($first['last_used_at'] === null && $first['connection_revision'] === 1, 'no fake success');
    check($first['port'] === 3306 && $first['tls']['enabled'] && $first['tls']['verify'], 'safe defaults');
    check(count($repository->list()) === 2, 'offline CRUD');
    foreach (['offline', 'offline.invalid', 'test-user', '%_'] as $search) {
        check(count($repository->list($search)) === 2, 'search ' . $search);
    }
    check($repository->list("' OR 1=1 --") === [], 'search SQL injection bound');
    check($repository->list('missing%') === [], 'literal search wildcard');
    check($repository->list('', true) === [], 'favorites initially empty');
    check($repository->favorite($first['id'], true)['connection_revision'] === 1, 'favorite retains revision');
    check(count($repository->list('', true)) === 1, 'favorite filter');
    $profile = $repository->update($first['id'], ['name' => 'Renamed', 'environment' => 'Production']);
    check($profile['connection_revision'] === 1 && $profile['id'] === $first['id'], 'presentation changes retain identity');
    foreach ([['host' => 'other.invalid'], ['port' => 3307], ['username' => 'new-user'],
        ['database' => 'initial'], ['tls' => ['enabled' => false]]] as $patch) {
        $old = $profile;
        $profile = $repository->update($first['id'], $patch);
        check($profile['connection_revision'] === $old['connection_revision'] + 1, 'each connection field revision');
        check($profile['last_used_at'] === null, 'edit does not fake success');
    }
    $revision = $profile['connection_revision'];
    $profile = $repository->update($first['id'], ['tls' => ['ca' => '/synthetic/ca.pem']]);
    check(! $profile['tls']['enabled'] && $profile['connection_revision'] === $revision + 1, 'partial TLS update preserves mode and revises reference');
    check($repository->update($first['id'], []) === $profile, 'no-op update');
    $used = $repository->recordConnectSuccess($first['id'], $profile['connection_revision']);
    check($used['last_used_at'] !== null && $used['updated_at'] === $profile['updated_at'], 'only success sets usage');
    check($repository->list()[0]['id'] === $first['id'], 'never-used sorted after used');
    $usedAgain = $repository->recordConnectSuccess($second['id'], 1);
    check($repository->list()[0]['id'] === $second['id'], 'recent order');
    $changed = $repository->update($second['id'], ['host' => 'new.invalid']);
    rejects(function () use ($repository, $second): void { $repository->recordConnectSuccess($second['id'], 1); }, RuntimeException::class, 'stale connect rejected');
    check($repository->detail($second['id'])['last_used_at'] === $usedAgain['last_used_at'], 'stale success preserves prior timestamp');
    $invalid = [
        ['name' => ''], ['host' => ''], ['username' => ''], ['host' => 'mysql://localhost'],
        ['host' => 'host:3306'], ['host' => 'db;whoami'], ['host' => '$(id)'],
        ['host' => '999.999.999.999'], ['host' => '-bad.invalid'], ['host' => "bad\n.invalid"],
        ['port' => 0], ['port' => 65536], ['port' => '3306'], ['port' => 1.5], ['port' => null],
        ['environment' => 'production'], ['favorite' => 1], ['favorite' => null],
        ['database' => str_repeat('x', 65)], ['password' => 'synthetic-plaintext-must-not-store'],
        ['last_used_at' => 'fake'], ['connection_revision' => 20], ['tls' => null],
        ['tls' => ['verify' => false]], ['tls' => ['enabled' => null]], ['tls' => ['ca' => 'relative.pem']],
        ['tls' => ['cert' => '/synthetic/cert.pem']], ['tls' => ['key' => '/synthetic/key.pem']],
    ];
    foreach ($invalid as $patch) {
        rejects(function () use ($repository, $input, $patch): void { $repository->create(array_replace($input, $patch)); }, InvalidArgumentException::class, 'invalid create');
    }
    foreach (['127.0.0.1', '::1', '2001:db8::1', 'localhost', 'db.internal.', 'db-1.internal'] as $host) {
        check($repository->create(array_replace($input, ['host' => $host]))['host'] === $host, 'valid host');
    }
    $before = $repository->detail($first['id']);
    rejects(function () use ($repository, $first): void { $repository->update($first['id'], ['port' => 0]); }, InvalidArgumentException::class, 'invalid update');
    check($repository->detail($first['id']) === $before, 'invalid update no mutation');
    rejects(function () use ($repository): void { $repository->detail('not-an-id'); }, InvalidArgumentException::class, 'invalid ID');
    rejects(function () use ($repository): void { $repository->list('', false, 'DROP TABLE profiles'); }, InvalidArgumentException::class, 'sort allowlist');

    $importer = new LegacyProfileImporter($db, $repository);
    $servers = [1 => ['host' => '127.0.0.1', 'port' => '3306', 'user' => 'legacy', 'password' => 'synthetic-plaintext-must-not-store',
        'verbose' => 'Imported local', 'only_db' => 'restriction_not_initial'],
        2 => ['host' => 'remote.invalid', 'user' => 'remote']];
    $counts = $importer->import($servers);
    check($counts === ['created' => 1, 'existing' => 0, 'skipped' => 1], 'local-only import');
    $imported = $repository->list('Imported local')[0];
    check($imported['origin'] === 'legacy-config:server:1' && $imported['database'] === null, 'stable origin and only_db not initial');
    check(! $imported['tls']['enabled'] && $imported['environment'] === 'Local', 'legacy explicit local TLS mode');
    $edited = $repository->update($imported['id'], ['name' => 'User edit', 'host' => 'edited.invalid']);
    $servers[1]['user'] = '';
    check($importer->import($servers)['existing'] === 1, 'already handled slot skips changed source');
    check($repository->detail($imported['id']) === $edited, 'import never overwrites edits');

    // A future secret table participates in the same transaction and cascades on deletion.
    $db->transaction(function (PDO $pdo): void {
        $pdo->exec('CREATE TABLE fixture_secrets (profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE, ciphertext BLOB)');
    });
    $db->transaction(function (PDO $pdo) use ($imported): void {
        $statement = $pdo->prepare('INSERT INTO fixture_secrets VALUES (:id, :ciphertext)');
        $statement->execute([':id' => $imported['id'], ':ciphertext' => 'synthetic-ciphertext']);
    });
    $db->transaction(function (PDO $pdo): void {
        $pdo->exec("CREATE TRIGGER fixture_fail_delete BEFORE DELETE ON profiles BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END");
    });
    rejects(function () use ($repository, $imported): void { $repository->delete($imported['id']); }, StorageException::class, 'delete failure');
    check($repository->detail($imported['id']) === $edited, 'delete rollback profile');
    check((int) $inspect->query('SELECT COUNT(*) FROM fixture_secrets')->fetchColumn() === 1, 'delete rollback secret');
    check($inspect->query("SELECT profile_id FROM profile_imports WHERE origin='legacy-config:server:1'")->fetchColumn() === $imported['id'], 'delete rollback origin');
    $inspect->exec('DROP TRIGGER fixture_fail_delete');
    $repository->delete($imported['id']);
    check($repository->detail($imported['id']) === null, 'delete profile');
    check((int) $inspect->query('SELECT COUNT(*) FROM fixture_secrets')->fetchColumn() === 0, 'delete cascades secret');
    check($importer->import($servers)['existing'] === 1, 'deleted source never recreated');
    check($inspect->query("SELECT profile_id FROM profile_imports WHERE origin='legacy-config:server:1'")->fetchColumn() === null, 'persistent import tombstone');

    $countBefore = count($repository->list());
    rejects(function () use ($importer): void {
        $importer->import([3 => ['host' => 'localhost', 'user' => 'valid'], 4 => ['host' => 'localhost', 'user' => '']]);
    }, InvalidArgumentException::class, 'batch import rollback');
    check(count($repository->list()) === $countBefore, 'no half imported profiles');
    check((int) $inspect->query("SELECT COUNT(*) FROM profile_imports WHERE origin='legacy-config:server:3'")->fetchColumn() === 0, 'no half import marker');
    check($importer->import([3 => ['host' => 'localhost', 'user' => 'valid']])['created'] === 1, 'retry failed import');
    rejects(function () use ($importer): void { $importer->import([4 => ['host' => 'localhost', 'user' => 'u', 'socket' => '/synthetic/mysql.sock']]); }, InvalidArgumentException::class, 'unsupported socket');

    $defaultImport = $importer->import([5 => ['host' => '127.0.0.1', 'auth_type' => 'config']]);
    $defaultProfile = $repository->list('Local connection 5')[0];
    check($defaultImport['created'] === 1 && $defaultProfile['username'] === (new \PhpMyAdmin\Config\Settings\Server())->user, 'effective upstream default username');
    rejects(function () use ($importer): void { $importer->import([6 => ['host' => 'localhost', 'user' => 'u', 'ssl' => true, 'ssl_ca_path' => '/synthetic/ca']]); }, InvalidArgumentException::class, 'unrepresentable TLS rejected');

    // Nested metadata + future-secret transaction: abort after metadata succeeds.
    $snapshot = $repository->detail($first['id']);
    rejects(function () use ($db, $repository, $first): void {
        $db->transaction(function (PDO $pdo) use ($repository, $first): void {
            $repository->update($first['id'], ['host' => 'rollback.invalid']);
            $pdo->exec('INSERT INTO nonexistent_secret_table VALUES (1)');
        });
    }, StorageException::class, 'shared transaction failure');
    check($repository->detail($first['id']) === $snapshot, 'shared transaction restores revision metadata');

    $inspect->exec('BEGIN IMMEDIATE');
    try {
        rejects(function () use ($repository, $input): void { $repository->create($input); }, StorageException::class, 'locked SQLite', 'busy');
        check($repository->detail($first['id']) === $snapshot, 'reads survive writer lock');
    } finally {
        $inspect->exec('ROLLBACK');
    }
    check($repository->create($input)['id'] !== '', 'write recovers after lock release');
    $db->transaction(function (PDO $pdo): void { $pdo->exec('PRAGMA query_only = ON'); });
    rejects(function () use ($repository, $input): void { $repository->create($input); }, StorageException::class, 'SQLite readonly');
    // query_only prevents even BEGIN IMMEDIATE. Use an independent connection to verify no partial write.
    $inspect->exec("CREATE TRIGGER fixture_fail_write BEFORE UPDATE ON profiles BEGIN SELECT RAISE(ABORT, 'synthetic secret driver detail'); END");
    $fresh = ProfileDatabase::openConfigured();
    $freshRepository = new ProfileRepository($fresh);
    rejects(function () use ($freshRepository, $first): void { $freshRepository->favorite($first['id'], false); }, StorageException::class, 'write trigger failure');
    check($freshRepository->detail($first['id']) === $snapshot, 'failed write unchanged');
    $inspect->exec('DROP TRIGGER fixture_fail_write');

    $concurrentWorker = $base . '/importer.php';
    file_put_contents($concurrentWorker, '<?php require ' . var_export(dirname(__DIR__, 2) . '/vendor/autoload.php', true)
        . '; $db=\PhpMyAdmin\Local\ProfileDatabase::openConfigured(); echo json_encode((new \PhpMyAdmin\Local\LegacyProfileImporter($db,new \PhpMyAdmin\Local\ProfileRepository($db)))->import([7=>["host"=>"localhost","user"=>"concurrent"]]));');
    $workers = [];
    for ($i = 0; $i < 2; $i++) {
        $process = proc_open([PHP_BINARY, $concurrentWorker], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $workers[] = [$process, $pipes];
    }
    $created = 0; $existing = 0;
    foreach ($workers as [$process, $pipes]) {
        $result = json_decode(stream_get_contents($pipes[1]), true);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        check(proc_close($process) === 0 && is_array($result) && $errors === '', 'concurrent importer process');
        $created += $result['created']; $existing += $result['existing'];
    }
    check($created === 1 && $existing === 1, 'concurrent import unique origin');

    // True process restart with inherited disposable configuration, no network libraries involved.
    $expected = $freshRepository->list();
    $reader = $base . '/reader.php';
    file_put_contents($reader, '<?php require ' . var_export(dirname(__DIR__, 2) . '/vendor/autoload.php', true)
        . '; echo json_encode((new \\PhpMyAdmin\\Local\\ProfileRepository(\\PhpMyAdmin\\Local\\ProfileDatabase::openConfigured()))->list());');
    $output = [];
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($reader), $output, $status);
    check($status === 0 && json_decode(implode("\n", $output), true) === $expected, 'fresh process persistence');
    check(strpos(file_get_contents($file), 'synthetic-plaintext-must-not-store') === false, 'no imported/input plaintext in SQLite');
    check(strpos(json_encode($expected), 'synthetic-ciphertext') === false, 'no ciphertext read projection');
    check($inspect->query('PRAGMA integrity_check')->fetchColumn() === 'ok', 'SQLite integrity');
    $inspect->exec('PRAGMA user_version = 99');
    rejects(function (): void { ProfileDatabase::openConfigured(); }, StorageException::class, 'newer schema rejected');
    $inspect->exec('PRAGMA user_version = 3');
    chmod($file, 0644);
    rejects(function (): void { ProfileDatabase::openConfigured(); }, RuntimeException::class, 'public DB mode rejected');
    chmod($file, 0600);
    unset($freshRepository, $fresh, $repository, $db, $inspect);
    unlink($file);
    symlink($config, $file);
    rejects(function (): void { ProfileDatabase::openConfigured(); }, RuntimeException::class, 'symlink DB rejected');
    unlink($file);
    chmod($base . '/data', 0500);
    rejects(function (): void { ProfileDatabase::openConfigured(); }, RuntimeException::class, 'unwritable directory');
    chmod($base . '/data', 0700);
    check(! file_exists($file), 'no database created on unsafe location');

    // Force a migration DDL collision after CREATE profiles and verify transactional rollback.
    $collision = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    chmod($file, 0600);
    $collision->exec('CREATE TABLE fixture_preserved (value TEXT)');
    $collision->exec("INSERT INTO fixture_preserved VALUES ('preserved')");
    $collision->exec('CREATE TABLE profile_imports (fixture TEXT)');
    rejects(function (): void { ProfileDatabase::openConfigured(); }, StorageException::class, 'migration rollback');
    check((int) $collision->query('PRAGMA user_version')->fetchColumn() === 0, 'failed migration keeps version');
    check((int) $collision->query("SELECT COUNT(*) FROM sqlite_master WHERE name='profiles'")->fetchColumn() === 0, 'failed migration leaves no half schema');
    check($collision->query('SELECT value FROM fixture_preserved')->fetchColumn() === 'preserved', 'failed migration preserves existing data');
    $collision->exec('DROP TABLE profile_imports');
    $migrated = ProfileDatabase::openConfigured();
    check($collision->query('SELECT value FROM fixture_preserved')->fetchColumn() === 'preserved', 'successful migration nondestructive');
    check((int) $collision->query('PRAGMA user_version')->fetchColumn() === 3, 'migration retry succeeds');
    unset($migrated, $collision);
    echo $count . " profile checks passed using disposable SQLite only.\n";
} finally {
    putenv($previous === false ? 'XPHPMYADMIN_LOCAL_CONFIG' : 'XPHPMYADMIN_LOCAL_CONFIG=' . $previous);
    removeTree($base);
}
