<?php

declare(strict_types=1);

require_once __DIR__ . '/libraries/local-access.php';
require_once __DIR__ . '/libraries/classes/Local/Foundation.php';

if (PHP_SAPI !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
        http_response_code(405);
        header('Allow: GET');
        exit('{"ok":false,"error":"Diagnostics require GET."}');
    }
}
try {
    $runtime = \PhpMyAdmin\Local\Foundation::runtime();
    $config = \PhpMyAdmin\Local\Foundation::configuration();
    echo json_encode(['ok' => true, 'runtime' => $runtime, 'private_storage' => true,
        'profiles_enabled' => $config['profiles_enabled']], JSON_PRETTY_PRINT) . "\n";
} catch (\RuntimeException $error) {
    if (PHP_SAPI !== 'cli') {
        http_response_code(503);
    }
    echo json_encode(['ok' => false, 'error' => $error->getMessage()]) . "\n";
    if (PHP_SAPI === 'cli') {
        exit(1);
    }
}
