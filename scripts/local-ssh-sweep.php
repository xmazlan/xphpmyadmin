<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/vendor/autoload.php';
try {
    $database = \PhpMyAdmin\Local\ProfileDatabase::openExistingConfigured();
    (new \PhpMyAdmin\Local\SshTunnels($database))->sweep();
    echo "SSH lease sweep complete.\n";
} catch (Throwable $error) {
    fwrite(STDERR, "SSH lease sweep failed; inspect private registry and runtime prerequisites.\n"); exit(1);
}
