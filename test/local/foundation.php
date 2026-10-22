<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__, 2) . '/libraries/classes/Local/Access.php';
require_once dirname(__DIR__, 2) . '/libraries/classes/Local/Foundation.php';

use PhpMyAdmin\Local\Access;
use PhpMyAdmin\Local\Foundation;

$count = 0;
function check(bool $ok): void
{
    global $count;
    if (! $ok) {
        throw new RuntimeException('Check failed: ' . ($count + 1));
    }
    $count++;
}
function rejects(callable $action): void
{
    try {
        $action();
    } catch (RuntimeException $error) {
        check(true);
        return;
    }
    check(false);
}
foreach (['127.0.0.1', '127.10.2.3', '::1', '0:0:0:0:0:0:0:1'] as $ip) {
    check(Access::allows(['REMOTE_ADDR' => $ip]));
}
foreach (['192.168.1.2', '10.0.0.1', '::', '::ffff:192.168.1.2', '', 'localhost'] as $ip) {
    check(! Access::allows(['REMOTE_ADDR' => $ip]));
    check(! Access::allows(['REMOTE_ADDR' => $ip, 'HTTP_X_FORWARDED_FOR' => '127.0.0.1']));
}
foreach (['HTTP_FORWARDED', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED_HOST', 'HTTP_X_REAL_IP'] as $header) {
    check(! Access::allows(['REMOTE_ADDR' => '127.0.0.1', $header => '127.0.0.1']));
}
Foundation::requireMutation(['REQUEST_METHOD' => 'POST'], ['token' => 'synthetic'], [' PMA_token ' => 'synthetic']);
check(true);
rejects(function () { Foundation::requireMutation(['REQUEST_METHOD' => 'GET'], ['token' => 'synthetic'], [' PMA_token ' => 'synthetic']); });
foreach ([[], ['token' => 'bad'], ['token' => ['synthetic']], ['token' => '']] as $post) {
    rejects(function () use ($post) { Foundation::requireMutation(['REQUEST_METHOD' => 'POST'], $post, [' PMA_token ' => 'synthetic']); });
}
check(Foundation::runtime()['pdo_sqlite']);
$old = getenv('XPHPMYADMIN_LOCAL_CONFIG');
$base = realpath(sys_get_temp_dir()) . '/xpma-test-' . bin2hex(random_bytes(8));
mkdir($base, 0700); mkdir($base . '/data', 0700); mkdir($base . '/keys', 0700);
$file = $base . '/local.json';
putenv('XPHPMYADMIN_LOCAL_CONFIG=' . $file);
$config = ['profiles_enabled' => false, 'data_dir' => $base . '/data', 'key_dir' => $base . '/keys'];
$write = function (array $config) use ($file): void { file_put_contents($file, json_encode($config)); chmod($file, 0600); };
try {
    rejects(function () { Foundation::configuration(); });
    $write($config); check(Foundation::configuration() === $config);
    chmod($base . '/data', 0500);
    // A directory without owner write permission must fail even for privileged test users.
    rejects(function () { Foundation::configuration(); });
    chmod($base . '/data', 0700);
    chmod($file, 0644); rejects(function () { Foundation::configuration(); }); chmod($file, 0600);
    $write(array_merge($config, ['key_dir' => $base . '/data'])); rejects(function () { Foundation::configuration(); });
    $write(array_merge($config, ['data_dir' => dirname(__DIR__, 2)])); rejects(function () { Foundation::configuration(); });
    symlink(dirname(__DIR__, 2), $base . '/link');
    $write(array_merge($config, ['data_dir' => $base . '/link'])); rejects(function () { Foundation::configuration(); });
    unlink($base . '/link');
    file_put_contents($file, 'invalid'); rejects(function () { Foundation::configuration(); });
} finally {
    putenv($old === false ? 'XPHPMYADMIN_LOCAL_CONFIG' : 'XPHPMYADMIN_LOCAL_CONFIG=' . $old);
    unlink($file); rmdir($base . '/data'); rmdir($base . '/keys'); rmdir($base);
}
echo $count . " foundation checks passed. No user database accessed.\n";
