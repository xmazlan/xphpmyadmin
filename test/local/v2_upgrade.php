<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';
use PhpMyAdmin\Local\{ProfileDatabase, ProfileRepository, ProfilePasswords, SecretKeyStore, Foundation, ProfileBackup, StorageException};
if ($argv[1] === 'legacy') {
    spl_autoload_register(static function ($class): void {
        $prefix = 'PhpMyAdmin\\Local\\';
        if (strpos($class,$prefix) === 0) { require getenv('XPM_V1_CODE') . '/' . substr($class,strlen($prefix)) . '.php'; }
    }, true, true);
    $database = ProfileDatabase::openConfigured();
    (new SecretKeyStore($database))->initialize();
    $profile = (new ProfilePasswords($database))->create(['name'=>'synthetic-v1','host'=>'offline.invalid','username'=>'fixture'], ['action'=>'replace','password'=>'synthetic-upgrade-canary']);
    echo "Legacy schema 2 fixture created.\n";
} elseif ($argv[1] === 'upgrade') {
    $config = Foundation::configuration(); $root = dirname($config['data_dir']);
    $pdo = new PDO('sqlite:' . $config['data_dir'] . '/profiles.sqlite');
    $before = [];
    foreach (['profiles','profile_imports','secret_key_registry','profile_secrets'] as $table) { $before[$table] = $pdo->query('SELECT * FROM ' . $table)->fetchAll(PDO::FETCH_ASSOC); }
    $inode = fileinode($config['data_dir'] . '/profiles.sqlite');
    $keyHash = hash_file('sha256',$config['key_dir'] . '/master.key');
    ProfileBackup::backup($root . '/before-metadata',$root . '/before-keys');
    ProfileBackup::restore($root . '/before-metadata',$root . '/before-keys',$root . '/rollback');
    $database = ProfileDatabase::openConfigured();
    foreach ($before as $table=>$rows) {
        $after = $database->rows('SELECT * FROM ' . $table);
        if ($table === 'profiles') { $after = array_map(static function ($row) { unset($row['method'],$row['ssh_json']); return $row; },$after); }
        if ($rows !== $after) { throw new RuntimeException('Migration changed existing data'); }
    }
    $profile = (new ProfileRepository($database))->list()[0];
    if ($profile['method'] !== 'direct' || fileinode($config['data_dir'] . '/profiles.sqlite') !== $inode
        || hash_file('sha256',$config['key_dir'] . '/master.key') !== $keyHash
        || (new ProfilePasswords($database))->reveal($profile['id'],1) !== 'synthetic-upgrade-canary') { throw new RuntimeException('Migration preservation failed'); }
    $snapshots = glob($config['data_dir'] . '/pre-v3-*.sqlite');
    if (count($snapshots) !== 1) { throw new RuntimeException('Migration snapshot missing'); }
    $snapshot = new PDO('sqlite:' . $snapshots[0]);
    if ((int) $snapshot->query('PRAGMA user_version')->fetchColumn() !== 2 || $snapshot->query('PRAGMA integrity_check')->fetchColumn() !== 'ok') { throw new RuntimeException('Migration snapshot invalid'); }
    echo "V2 upgrade: identical profile/import/ciphertext/key-registry rows, file identity/key preserved; verified pre-v3 snapshot and direct defaults passed.\n";
} else {
    spl_autoload_register(static function ($class): void {
        $prefix = 'PhpMyAdmin\\Local\\';
        if (strpos($class,$prefix) === 0) { require getenv('XPM_V1_CODE') . '/' . substr($class,strlen($prefix)) . '.php'; }
    }, true, true);
    $database = ProfileDatabase::openExistingConfigured(); $profile = (new ProfileRepository($database))->list()[0];
    if (Foundation::configuration()['profiles_enabled'] !== false || (new ProfilePasswords($database))->reveal($profile['id'],1) !== 'synthetic-upgrade-canary') { throw new RuntimeException('Legacy rollback failed'); }
    echo "V1 application rollback: actual archived schema-2 code reads disabled restored snapshot and decrypts original secret.\n";
}
