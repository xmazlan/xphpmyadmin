<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/vendor/autoload.php';

use PhpMyAdmin\Local\ProfileDatabase;
use PhpMyAdmin\Local\SecretKeyStore;
use PhpMyAdmin\Local\SecretUnavailable;
use PhpMyAdmin\Local\StorageException;

try {
    if (($argc === 2 && $argv[1] === 'init') || ($argc === 3 && $argv[1] === 'restore')) {
        $keys = new SecretKeyStore(ProfileDatabase::openConfigured());
        if ($argv[1] === 'init') {
            $keys->initialize();
        } else {
            $keys->restore($argv[2]);
        }
        echo "Private key verified. No passwords or key material displayed. UI setting unchanged.\n";
    } else {
        fwrite(STDERR, "Usage: php scripts/local-key.php init | restore /absolute/private/key-backup\n");
        exit(1);
    }
} catch (SecretUnavailable $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
} catch (StorageException $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
} catch (Throwable $error) {
    fwrite(STDERR, "Private key operation failed. Check runtime and private storage configuration.\n");
    exit(1);
}
