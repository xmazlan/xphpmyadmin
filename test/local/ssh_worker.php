<?php
// Disposable cross-request worker; never exposed as an application endpoint.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';
try {
    session_id($argv[1]);
    $database = \PhpMyAdmin\Local\ProfileDatabase::openExistingConfigured();
    $profile = (new \PhpMyAdmin\Local\ProfileRepository($database))->detail($argv[2]);
    (new \PhpMyAdmin\Local\SshTunnels($database))->start($profile, $argv[3]);
    echo 'ok';
} catch (Throwable $error) { exit(1); }
