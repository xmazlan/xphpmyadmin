<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';

use PhpMyAdmin\Local\ConnectionContexts;
use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\ProfileRepository;
use PhpMyAdmin\Local\SessionPasswords;

$count = 0;
function check(bool $ok, string $label): void {
    global $count;
    if (! $ok) { throw new RuntimeException('Context check failed: ' . $label); }
    $count++;
}
function rejects(callable $fn): void {
    try { $fn(); } catch (Throwable $error) { check(true, 'rejected'); return; }
    check(false, 'must reject');
}
try {
    $cases = json_decode(file_get_contents(getenv('XPM_TEST_CASES')), true);
    $http = json_decode(file_get_contents($cases['base'] . '/http-session.json'), true);
    session_save_path($cases['base'] . '/sessions'); session_id($http['session_id']); session_start();
    $db = ProfileDatabase::openExistingConfigured(); $profiles = new ProfileRepository($db);
    $service = new ConnectionContexts($db);
    $draft = ['name' => 'Tab A', 'host' => '127.0.0.1', 'port' => $cases['mysql_port'],
        'username' => 'xpma_fixture', 'database' => 'fixture_allowed', 'tls' => ['ca' => $cases['ca']]];
    $a = $profiles->create($draft);
    $b = $profiles->create(array_replace($draft, ['name' => 'Tab B', 'port' => $cases['mariadb_port']]));
    $credential = ['source' => 'input', 'password' => $cases['password']];
    $tabA = $service->connect($a['id'], 1, $credential);
    $tabB = $service->connect($b['id'], 1, $credential);
    check($profiles->detail($a['id'])['last_used_at'] !== null && $profiles->detail($b['id'])['last_used_at'] !== null, 'success records last used');
    check($tabA['context'] !== $tabB['context'], 'distinct opaque contexts');
    check($service->resolve($tabA['context'])['server'] !== $service->resolve($tabB['context'])['server'], 'separate phpMyAdmin cache identities');
    check(count($profiles->list()) === 4, 'connect never creates profiles');
    $before = $profiles->detail($b['id'])['last_used_at'];
    rejects(function () use ($service, $b) { $service->connect($b['id'], 1, ['source' => 'input', 'password' => 'wrong-synthetic']); });
    check($profiles->detail($b['id'])['last_used_at'] === $before, 'failed connect preserves last used');
    check($service->resolve($tabA['context'])['profile']['port'] === $cases['mysql_port'], 'failed B leaves A');
    rejects(function () use ($service) { $service->resolve(str_repeat('f', 64)); });
    rejects(function () use ($service) { $service->resolve(''); });
    $state = $_SESSION; $_SESSION = [];
    rejects(function () use ($service, $tabA) { $service->resolve($tabA['context']); });
    $_SESSION = $state;
    $copy = $service->connect($a['id'], 1, ['source' => 'session', 'context' => $tabA['context']]);
    check($service->resolve($copy['context'])['profile']['id'] === $a['id'], 'reconnect session credential');
    $_SESSION[' xphpmyadmin_contexts ']['entries'][$copy['context']]['expires'] = time() - 1;
    rejects(function () use ($service, $copy) { $service->resolve($copy['context']); });
    $service->disconnect($copy['context']);
    check((new SessionPasswords())->get($copy['context'], $a['id'], 1) === null, 'disconnect clears only its password');
    check($service->resolve($tabA['context'])['profile']['id'] === $a['id'], 'other A context preserved');
    $profiles->update($a['id'], ['name' => 'Renamed A']);
    check($service->resolve($tabA['context'])['profile']['name'] === 'Renamed A', 'label edit keeps context');
    $profiles->update($a['id'], ['port' => $cases['mariadb_port']]);
    rejects(function () use ($service, $tabA) { $service->resolve($tabA['context']); });
    check((new SessionPasswords())->get($tabA['context'], $a['id'], 1) === null, 'revision rejection clears credential');
    $profiles->delete($b['id']);
    rejects(function () use ($service, $tabB) { $service->resolve($tabB['context']); });
    $current = $service->connect($a['id'], 2, $credential);
    ConnectionContexts::logout();
    rejects(function () use ($service, $current) { $service->resolve($current['context']); });
    check((new SessionPasswords())->get($current['context'], $a['id'], 2) === null, 'logout clears all passwords');
    // A recovered copy has identical profile IDs/revisions but must not revive an old session capability.
    $oldStoreContext = $service->connect($a['id'], 2, $credential);
    \PhpMyAdmin\Local\ProfileBackup::backup($cases['base'] . '/restore-meta', $cases['base'] . '/restore-keys');
    \PhpMyAdmin\Local\ProfileBackup::restore($cases['base'] . '/restore-meta', $cases['base'] . '/restore-keys', $cases['base'] . '/restored-context-store');
    $originalConfig = getenv('XPHPMYADMIN_LOCAL_CONFIG');
    putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $cases['base'] . '/restored-context-store/local.json');
    try {
        $recovered = ProfileDatabase::openExistingConfigured();
        check($recovered->identity() !== $db->identity(), 'recovered storage has distinct capability binding');
        $recoveredContexts = new ConnectionContexts($recovered);
        rejects(function () use ($recoveredContexts, $oldStoreContext) { $recoveredContexts->resolve($oldStoreContext['context']); });
        check((new SessionPasswords())->get($oldStoreContext['context'], $a['id'], 2) === null, 'restore rejection clears old temporary credential');
    } finally { putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $originalConfig); }
    // Fresh A/B capabilities for HTTP multi-tab browse/SQL/import/export checks.
    $a = $profiles->update($a['id'], ['port' => $cases['mysql_port']]);
    $b = $profiles->create(array_replace($draft, ['name' => 'HTTP Tab B', 'port' => $cases['mariadb_port']]));
    $http['a'] = $service->connect($a['id'], $a['connection_revision'], $credential);
    $http['b'] = $service->connect($b['id'], 1, $credential);
    $http['a_profile'] = $a['id']; $http['b_profile'] = $b['id'];
    file_put_contents($cases['base'] . '/http-contexts.json', json_encode($http));
    chmod($cases['base'] . '/http-contexts.json', 0600);
    session_write_close();
    echo $count . " context lifecycle checks passed.\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Context suite failed in ' . basename($error->getFile()) . ':' . $error->getLine() . "\n"); exit(1);
}
