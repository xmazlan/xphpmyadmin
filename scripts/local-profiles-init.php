<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/vendor/autoload.php';

use PhpMyAdmin\Local\LegacyProfileImporter;
use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\ProfileRepository;
use PhpMyAdmin\Local\StorageException;

// This explicit CLI bootstrap prepares metadata without enabling the UI or contacting a server.
try {
    $database = ProfileDatabase::openConfigured();
    $profiles = new ProfileRepository($database);
    // The trusted PHP configuration is evaluated in a local scope. Suppress accidental output.
    // Like phpMyAdmin itself, this trusts the existing config file as executable PHP.
    $servers = (static function (): array {
        $cfg = [];
        $i = 0;
        ob_start();
        set_error_handler(static function (): void {
            throw new RuntimeException('Legacy configuration could not be loaded.');
        });
        try {
            require dirname(__DIR__) . '/config.inc.php';
            return $cfg['Servers'] ?? [];
        } finally {
            restore_error_handler();
            ob_end_clean();
        }
    })();
    $result = (new LegacyProfileImporter($database, $profiles))->import($servers);
    unset($servers);
    echo 'Profile schema ready. Imported: ' . $result['created'] . '; previously handled: '
        . $result['existing'] . '; nonlocal skipped: ' . $result['skipped'] . ". UI setting unchanged.\n";
} catch (StorageException $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
} catch (Throwable $error) {
    // Loading user PHP can throw arbitrary errors containing secrets; never echo its message.
    fwrite(STDERR, "Profile initialization failed. Verify runtime, private storage, and supported local configuration.\n");
    exit(1);
}
