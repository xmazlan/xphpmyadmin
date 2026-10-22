<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

use PhpMyAdmin\Config;
use PhpMyAdmin\ErrorHandler;
use PhpMyAdmin\Session;
use PhpMyAdmin\Local\ConnectionFailure;
use PhpMyAdmin\Local\ConnectionTestAction;
use PhpMyAdmin\Local\ConnectionTester;
use PhpMyAdmin\Local\MySqlConnector;
use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\ProfilePasswords;
use PhpMyAdmin\Local\ProfileRepository;
use PhpMyAdmin\Local\SecretKeyStore;
use PhpMyAdmin\Local\SessionPasswords;

$count = 0; $logs = '';
function check(bool $condition, string $name): void
{
    global $count;
    if (! $condition) { throw new RuntimeException('Connection check failed: ' . $name); }
    $count++;
}
function fails(string $category, callable $operation): void
{
    global $logs;
    try { $operation(); } catch (ConnectionFailure $error) {
        $logs .= (string) $error;
        check($error->category() === $category, 'expected ' . $category . ', received ' . $error->category() . ' at line ' . debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0]['line'] . ' origin ' . basename($error->getFile()) . ':' . $error->getLine());
        check($error->response()['ok'] === false, 'safe error response');
        return;
    }
    check(false, 'expected failure ' . $category);
}
try {
$cases = json_decode(file_get_contents(getenv('XPM_TEST_CASES')), true);
$draft = ['name' => 'Connection draft', 'host' => '127.0.0.1', 'port' => $cases['mysql_port'],
    'username' => 'xpma_fixture', 'database' => 'fixture_allowed',
    'tls' => ['enabled' => true, 'ca' => $cases['ca']]];
$password = $cases['password'];
$tester = new ConnectionTester(); $connector = new MySqlConnector();
$oldArgs = ini_set('zend.exception_ignore_args', '0');
$oldReport = (new mysqli_driver())->report_mode;
foreach (['mysql_port', 'mariadb_port'] as $port) {
    $target = array_replace($draft, ['port' => $cases[$port]]);
    $result = $tester->testDraft($target, $password);
    check($result === ['ok' => true, 'tls' => true, 'database_selected' => true], 'verified TLS ' . $port);
    $connection = $connector->open($target, $password);
    check($connection->native()->query('SELECT DATABASE()')->fetch_row()[0] === 'fixture_allowed', 'exact initial database');
    $connection->close(); $connection->close();
    try { $connection->native(); check(false, 'closed handle inaccessible'); } catch (RuntimeException $error) { check(true, 'test connection closed'); }
    $plain = array_replace($target, ['tls' => ['enabled' => false]]);
    check($tester->testDraft($plain, $password)['tls'] === false, 'non-TLS explicit ' . $port);
    fails('authentication', function () use ($tester, $target): void { $tester->testDraft($target, 'synthetic-wrong'); });
    foreach (['fixture_forbidden', 'fixture_absent'] as $name) {
        fails('database', function () use ($tester, $target, $name, $password): void { $tester->testDraft(array_replace($target, ['database' => $name]), $password); });
    }
    $mutual = array_replace($target, ['username' => 'xpma_cert', 'tls' => ['ca' => $cases['ca'], 'cert' => $cases['cert'], 'key' => $cases['key']]]);
    check($tester->testDraft($mutual, $password)['tls'], 'mutual TLS ' . $port);
    fails('tls', function () use ($tester, $mutual, $cases, $password): void {
        $mutual['tls']['key'] = $cases['wrong_key']; $tester->testDraft($mutual, $password);
    });
    fails('tls', function () use ($tester, $target, $cases, $password): void {
        $target['tls']['ca'] = $cases['wrong_ca']; $tester->testDraft($target, $password);
    });
}
check(! file_exists($cases['base'] . '/data/profiles.sqlite'), 'draft tests never open profile storage');
$defaultTls = $draft; unset($defaultTls['tls']);
check($tester->testDraft($defaultTls, $password)['tls'], 'default TLS, runtime CA store optional');
$local = $draft; $local['host'] = 'localhost';
check($tester->testDraft($local, $password)['tls'], 'localhost uses requested TCP port and verified loopback SAN');
foreach (['host' => 'mysql://127.0.0.1', 'port' => '3306', 'username' => ''] as $field => $value) {
    fails('input', function () use ($tester, $draft, $field, $value, $password): void { $tester->testDraft(array_replace($draft, [$field => $value]), $password); });
}
fails('tls', function () use ($tester, $draft, $cases, $password): void { $draft['tls']['ca'] = $cases['base'] . '/missing-ca.pem'; $tester->testDraft($draft, $password); });
fails('tls', function () use ($tester, $draft, $cases, $password): void { $tester->testDraft(array_replace($draft, ['port' => $cases['bad_name_port']]), $password); });
fails('tls', function () use ($tester, $draft, $cases, $password): void { $tester->testDraft(array_replace($draft, ['port' => $cases['no_tls_port']]), $password); });
fails('network', function () use ($tester, $draft, $cases, $password): void { $tester->testDraft(array_replace($draft, ['port' => $cases['closed_port']]), $password); });
fails('dns', function () use ($tester, $draft, $password): void { $tester->testDraft(array_replace($draft, ['host' => 'nonexistent-xpma.invalid']), $password); });
$started = microtime(true);
fails('timeout', function () use ($tester, $draft, $cases, $password): void { $tester->testDraft(array_replace($draft, ['port' => $cases['stall_port'], 'tls' => ['enabled' => false]]), $password); });
check(microtime(true) - $started >= 9 && microtime(true) - $started < 14, 'initial handshake timeout 10 seconds');
// Administration query policy remains independent: an 11s read succeeds after opening the same connector.
$connection = $connector->open($draft, $password); $started = microtime(true);
check($connection->native()->query('SELECT SLEEP(11)')->fetch_row()[0] === '0', 'administration query is not limited to handshake timeout');
check(microtime(true) - $started >= 10.5, 'long query actually executed'); $connection->close();
check((new mysqli_driver())->report_mode === $oldReport, 'native report policy restored');

$uninitialized = new ConnectionTestAction();
fails('storage', function () use ($uninitialized, $draft): void {
    $uninitialized->run(['draft' => $draft, 'credential' => ['source' => 'saved', 'profile_id' => '00000000-0000-4000-8000-000000000001', 'revision' => 1]]);
});
check(! file_exists($cases['base'] . '/data/profiles.sqlite'), 'credential read never bootstraps SQLite');
$database = ProfileDatabase::openConfigured(); $profiles = new ProfileRepository($database);
(new SecretKeyStore($database))->initialize();
$profile = (new ProfilePasswords($database))->create($draft, ['action' => 'replace', 'password' => $password]);
$before = $profiles->detail($profile['id']);
$action = new ConnectionTestAction();
$payload = ['draft' => $draft, 'credential' => ['source' => 'saved', 'profile_id' => $profile['id'], 'revision' => 1]];
check($action->run($payload)['ok'], 'saved password for exact target');
foreach (['host' => 'localhost', 'port' => $cases['stall_port'], 'username' => 'different', 'database' => null,
    'tls' => ['enabled' => false]] as $field => $value) {
    fails('input', function () use ($action, $payload, $field, $value): void { $payload['draft'][$field] = $value; $action->run($payload); });
}
fails('input', function () use ($action, $payload): void { $payload['credential']['revision'] = 2; $action->run($payload); });
fails('input', function () use ($action, $draft): void { $action->run(['draft' => $draft, 'credential' => ['source' => 'input']]); });
check($profiles->detail($profile['id']) === $before && count($profiles->list()) === 1, 'test never changes profile or last_used');
$offline = $profiles->create(array_replace($draft, ['host' => 'offline-xpma.invalid', 'name' => 'Save without test', 'tls' => []]));
check($offline['last_used_at'] === null && $offline['host'] === 'offline-xpma.invalid', 'save offline remains independent');
// Prepare a normal phpMyAdmin session in the isolated session directory for endpoint HTTP tests.
define('ROOT_PATH', dirname(__DIR__, 2) . '/'); define('PHPMYADMIN', true);
require ROOT_PATH . 'libraries/constants.php';
$_SERVER['HTTP_HOST'] = '127.0.0.1'; $_SERVER['SCRIPT_NAME'] = '/local-connection-test.php';
$GLOBALS['PMA_PHP_SELF'] = '/local-connection-test.php';
$config = new Config(CONFIG_FILE); $config->set('SessionSavePath', $cases['base'] . '/sessions');
$handler = new ErrorHandler(); Session::setUp($config, $handler);
$_SESSION['fixture_active_target'] = 'unchanged-context-A';
$context = bin2hex(random_bytes(16));
(new SessionPasswords())->put($context, $profile['id'], 1, $password);
$http = ['cookie' => $config->getCookieName('phpMyAdmin') . '=' . session_id(), 'token' => $_SESSION[' PMA_token '],
    'profile_id' => $profile['id'], 'context' => $context];
$sessionId = session_id();
$sessionPayload = ['draft' => $draft, 'credential' => ['source' => 'session', 'profile_id' => $profile['id'], 'revision' => 1, 'context' => $context]];
check($action->run($sessionPayload)['ok'], 'session password test');
session_start();
check($_SESSION['fixture_active_target'] === 'unchanged-context-A', 'active target untouched');
$sessionPayload['draft']['port'] = $cases['stall_port'];
fails('input', function () use ($action, $sessionPayload): void { $action->run($sessionPayload); });
check($_SESSION['fixture_active_target'] === 'unchanged-context-A', 'failed test active target untouched');
session_write_close();
$http['session_id'] = $sessionId;
file_put_contents($cases['base'] . '/http-session.json', json_encode($http)); chmod($cases['base'] . '/http-session.json', 0600);
foreach ([$password, 'synthetic-wrong', file_get_contents($cases['key'])] as $forbidden) {
    check(strpos($logs, $forbidden) === false, 'driver exceptions never leak credentials or client key');
}
ini_set('zend.exception_ignore_args', (string) $oldArgs);
echo $count . " connection checks passed on MySQL/MariaDB/TLS fixtures.\n";

} catch (Throwable $error) {
    $detail = strpos($error->getMessage(), "Connection check failed:") === 0 ? $error->getMessage() : get_class($error) . " in " . basename($error->getFile()) . ":" . $error->getLine();
    fwrite(STDERR, "Connection suite failed: " . $detail . "\n");
    exit(1);
}
