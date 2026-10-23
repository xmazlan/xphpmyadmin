<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';
use PhpMyAdmin\Local\{ProfileDatabase, ProfileRepository, SshTrust, SshTunnels, ConnectionFailure, ConnectionContexts, ConnectionTester, Transport, Foundation};
session_start();
$count = 0;
function check(bool $ok, string $label): void { global $count; if (! $ok) { throw new RuntimeException($label); } $count++; }
$cases = json_decode(file_get_contents($argv[1]), true);
$database = ProfileDatabase::openExistingConfigured(); $profiles = new ProfileRepository($database); $contexts = new ConnectionContexts($database);
try {
    foreach ($cases['ports'] as $port) {
        $profile = $profiles->create(['name' => 'synthetic database', 'host' => '127.0.0.1', 'port' => $port,
            'username' => 'xpma_fixture', 'database' => 'fixture_allowed', 'tls' => ['enabled' => false], 'method' => 'ssh',
            'ssh' => ['host' => '127.0.0.1', 'port' => (int) getenv('XPM_SSH_PORT'), 'username' => getenv('XPM_SSH_USER'), 'key' => getenv('XPM_SSH_KEY')]]);
        $draft = array_intersect_key($profile, array_flip(\PhpMyAdmin\Local\ProfileInput::FIELDS));
        $test = (new ConnectionTester())->testDraft($draft, $cases['password']);
        check($test['ok'] && count($test['diagnostics']) === 4, 'temporary SSH/database test');
        check(glob(Foundation::configuration()['data_dir'] . '/ssh/*.json') === [] && $profiles->detail($profile['id'])['last_used_at'] === null, 'test cleans up and preserves usage');
        $tokens = [];
        for ($i = 0; $i < 2; $i++) {
            $result = $contexts->connect($profile['id'], 1, ['source' => 'input', 'password' => $cases['password']]);
            $tokens[] = $result['context'];
            $resolved = $contexts->resolve($result['context']);
            $connection = Transport::open($resolved['profile'], $cases['password'], $result['context']);
            $sentinel = $connection->native()->query('SELECT value FROM sentinel WHERE id=1')->fetch_row()[0];
            check($sentinel === ($port === $cases['ports'][0] ? 'unchanged-mysql' : 'unchanged-mariadb'), 'exact target sentinel');
            $connection->close();
        }
        $contexts->disconnect($tokens[0]);
        check($contexts->resolve($tokens[1])['profile']['id'] === $profile['id'], 'disconnect leaves sibling tab');
        ConnectionContexts::logout();
        check(glob(Foundation::configuration()['data_dir'] . '/ssh/*.json') === [], 'logout cleans all masters');
        try { (new ConnectionTester())->testDraft($draft, 'synthetic-wrong'); throw new RuntimeException('Expected authentication failure'); }
        catch (ConnectionFailure $error) { check($error->category() === 'authentication' && $error->response()['diagnostics'][3]['status'] === 'failed', 'actual MySQL auth diagnostic'); }
        check(glob(Foundation::configuration()['data_dir'] . '/ssh/*.json') === [], 'failed test cleans tunnel');
    }
    (new \PhpMyAdmin\Local\SecretKeyStore($database))->initialize();
    $saved = (new \PhpMyAdmin\Local\ProfilePasswords($database))->create($draft, ['action' => 'replace', 'password' => $cases['password']]);
    $before = $profiles->list();
    $trustBefore = $database->rows('SELECT * FROM ssh_trust ORDER BY host,port');
    $secretsBefore = $database->rows('SELECT * FROM profile_secrets ORDER BY profile_id');
    $config = Foundation::configuration(); $root = dirname($config['data_dir']);
    \PhpMyAdmin\Local\ProfileBackup::backup($root . '/backup-metadata', $root . '/backup-keys');
    \PhpMyAdmin\Local\ProfileBackup::restore($root . '/backup-metadata', $root . '/backup-keys', $root . '/restored');
    $restoredConfig = json_decode(file_get_contents($root . '/restored/local.json'), true);
    check($restoredConfig['profiles_enabled'] === false && ! is_dir($root . '/restored/data/ssh'), 'restore disabled without process/session registry');
    $originalConfig = Foundation::configPath();
    putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $root . '/restored/local.json');
    try {
        $restored = ProfileDatabase::openExistingConfigured();
        check((new ProfileRepository($restored))->list() === $before && $restored->identity() !== $database->identity(), 'SSH metadata restored with new store identity');
        check($restored->rows('SELECT * FROM ssh_trust ORDER BY host,port') === $trustBefore, 'trust restored');
        check($restored->rows('SELECT * FROM profile_secrets ORDER BY profile_id') === $secretsBefore, 'ciphertext preserved');
        check((new \PhpMyAdmin\Local\ProfilePasswords($restored))->reveal($saved['id'], 1) === $cases['password'], 'saved secret decrypts after SSH metadata recovery');
    } finally { putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $originalConfig); }
    check(array_values(array_diff(scandir($root . '/backup-keys'), ['.','..'])) === ['master.key'], 'no private SSH identity copied into backup');
    echo $count . " SSH MySQL/MariaDB sentinel/context/diagnostic checks passed.\n";
} finally { ConnectionContexts::logout(); session_destroy(); }
