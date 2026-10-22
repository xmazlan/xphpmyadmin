<?php

declare(strict_types=1);

require_once __DIR__ . '/libraries/local-access.php';
require_once __DIR__ . '/vendor/autoload.php';

use PhpMyAdmin\Config;
use PhpMyAdmin\ErrorHandler;
use PhpMyAdmin\Local\ConnectionFailure;
use PhpMyAdmin\Local\ConnectionTestAction;
use PhpMyAdmin\Local\Foundation;
use PhpMyAdmin\Session;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('{"ok":false,"error":{"category":"method","message":"Use POST with a JSON body."}}');
}
try {
    if (! Foundation::configuration()['profiles_enabled']) {
        http_response_code(404);
        exit('{"ok":false,"error":{"category":"disabled","message":"Local profile features are disabled."}}');
    }
    Foundation::runtime();
    if (($_SERVER['QUERY_STRING'] ?? '') !== ''
        || strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        throw new ConnectionFailure('input');
    }
    $raw = file_get_contents('php://input', false, null, 0, 524289);
    if (! is_string($raw) || strlen($raw) > 524288) {
        throw new ConnectionFailure('input');
    }
    try {
        $payload = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (Throwable $error) {
        throw new ConnectionFailure('input');
    }
    unset($raw);
    if (! is_array($payload)) {
        throw new ConnectionFailure('input');
    }
    // Only load configuration and the existing session machinery, never Common::run()/legacy authentication.
    define('ROOT_PATH', __DIR__ . DIRECTORY_SEPARATOR);
    define('PHPMYADMIN', true);
    require_once ROOT_PATH . 'libraries/constants.php';
    $GLOBALS['PMA_PHP_SELF'] = (string) ($_SERVER['SCRIPT_NAME'] ?? '/local-connection-test.php');
    $handler = new ErrorHandler();
    set_error_handler(static function (): bool { throw new ConnectionFailure('storage'); });
    $config = new Config(CONFIG_FILE);
    if ($config->errorConfigFile) {
        throw new ConnectionFailure('storage');
    }
    Session::setUp($config, $handler);
    // Session::setUp sets its own cache limiter; secret-adjacent responses must remain uncached.
    header('Cache-Control: no-store');
    header('Pragma: no-cache');
    unset($handler);
    try {
        Foundation::requireMutation($_SERVER, $payload, $_SESSION);
    } catch (Throwable $error) {
        http_response_code(403);
        exit('{"ok":false,"error":{"category":"csrf","message":"Invalid CSRF token."}}');
    }
    echo json_encode((new ConnectionTestAction())->run($payload), JSON_THROW_ON_ERROR) . "\n";
} catch (ConnectionFailure $error) {
    header('Cache-Control: no-store');
    http_response_code($error->category() === 'input' ? 422 : ($error->category() === 'timeout' ? 504 : ($error->category() === 'storage' ? 503 : 502)));
    echo json_encode($error->response()) . "\n";
} catch (Throwable $error) {
    header('Cache-Control: no-store');
    http_response_code(503);
    echo json_encode((new ConnectionFailure('storage'))->response()) . "\n";
}
