<?php

declare(strict_types=1);

require_once __DIR__ . '/classes/Local/Access.php';

if (PHP_SAPI !== 'cli' && ! \PhpMyAdmin\Local\Access::allows($_SERVER)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    exit('Local access only. Forwarded requests are not supported.');
}
