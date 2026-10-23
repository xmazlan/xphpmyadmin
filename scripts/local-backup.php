<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/vendor/autoload.php';

use PhpMyAdmin\Local\ProfileBackup;

try {
    if (($argv[1] ?? '') === 'backup' && count($argv) === 4) {
        ProfileBackup::backup($argv[2], $argv[3]);
        echo "Private metadata/key backup verified. Keep both copies separate and private.\n";
    } elseif (($argv[1] ?? '') === 'restore' && count($argv) === 5) {
        ProfileBackup::restore($argv[2], $argv[3], $argv[4]);
        echo "Recovery verified in a NEW directory. Profiles disabled; active installation unchanged.\n";
    } else {
        fwrite(STDERR, "Usage: php scripts/local-backup.php backup NEW_METADATA_DIR NEW_KEY_DIR\n"
            . "   or: php scripts/local-backup.php restore METADATA_DIR KEY_DIR NEW_PRIVATE_ROOT\nAbsolute private paths outside the document root; existing destinations are never overwritten.\n");
        exit(1);
    }
} catch (Throwable $error) {
    fwrite(STDERR, "Backup/recovery failed. Verify private paths, permissions, SQLite integrity and the matching original key. No active destination was replaced.\n");
    exit(1);
}
