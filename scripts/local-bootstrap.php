<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/libraries/classes/Local/Foundation.php';

use PhpMyAdmin\Local\Foundation;

try {
    Foundation::runtime();
    $file = Foundation::configPath();
    if (file_exists($file) || is_link($file)) {
        Foundation::configuration();
        echo "Private bootstrap already configured; no files changed.\n";
        exit;
    }
    $base = dirname($file);
    $root = realpath(dirname(__DIR__));
    if ($base[0] !== '/' || strpos($base . '/', $root . '/') === 0 || strpos($base, '..') !== false) {
        throw new RuntimeException('Bootstrap location must be absolute and outside the application.');
    }
    $oldMask = umask(0077);
    try {
        foreach ([$base, $base . '/data', $base . '/keys'] as $dir) {
            if (! is_dir($dir) && ! @mkdir($dir, 0700, true)) {
                throw new RuntimeException('Private bootstrap cannot create storage; check PHP account permissions.');
            }
            if (realpath($dir) !== $dir || (fileperms($dir) & 0077) !== 0 || ! is_writable($dir)) {
                throw new RuntimeException('Private bootstrap requires canonical owner-only writable directories.');
            }
        }
        $config = ['profiles_enabled' => false, 'data_dir' => $base . '/data', 'key_dir' => $base . '/keys'];
        $handle = @fopen($file, 'x');
        if ($handle === false) {
            throw new RuntimeException('Cannot create private configuration; existing files are never overwritten.');
        }
        $json = json_encode($config, JSON_PRETTY_PRINT) . "\n";
        $written = fwrite($handle, $json);
        fclose($handle);
        if ($written !== strlen($json)) {
            throw new RuntimeException('Private configuration write incomplete; inspect it before retrying.');
        }
    } finally {
        umask($oldMask);
    }
    Foundation::configuration();
    echo "Private bootstrap verified. Profiles disabled; no database or encryption key created.\n";
} catch (RuntimeException $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
}
