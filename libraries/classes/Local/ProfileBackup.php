<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PDO;
use RuntimeException;
use Throwable;

/** CLI-only recovery service. Restores always create a new disabled installation. */
final class ProfileBackup
{
    private static function fail(): void
    {
        throw new RuntimeException('Backup/recovery failed. Check private paths, permissions, snapshot integrity and matching original key. Existing installation was not replaced.');
    }

    private static function newPath(string $path): string
    {
        $parent = dirname($path);
        if ($path === '' || $path[0] !== '/' || basename($path) === '.' || basename($path) === '..'
            || realpath($parent) !== $parent || file_exists($path) || is_link($path)) {
            self::fail();
        }
        $root = realpath(dirname(__DIR__, 3));
        $public = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: $root;
        foreach ([$root, $public === '/' ? $root : $public] as $excluded) {
            if ($path === $excluded || strpos($path, $excluded . '/') === 0) {
                self::fail();
            }
        }
        return $path;
    }

    private static function directory(string $path): void
    {
        if (! @mkdir($path, 0700) || realpath($path) !== $path) {
            self::fail();
        }
    }

    private static function write(string $file, #[\SensitiveParameter] string $contents): void
    {
        $handle = @fopen($file, 'x');
        if ($handle === false) { self::fail(); }
        try {
            if (fwrite($handle, $contents) !== strlen($contents) || ! fflush($handle)
                || (function_exists('fsync') && ! fsync($handle))) { self::fail(); }
        } finally { fclose($handle); }
        Foundation::privateFile($file);
    }

    private static function inspect(string $file, ?string $keyFile): array
    {
        Foundation::privateFile($file);
        $pdo = new PDO('sqlite:' . $file, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $pdo->exec('PRAGMA query_only=ON');
        if ((int) $pdo->query('PRAGMA user_version')->fetchColumn() !== 2
            || $pdo->query('PRAGMA integrity_check')->fetchColumn() !== 'ok'
            || $pdo->query('PRAGMA foreign_key_check')->fetchAll() !== []) { self::fail(); }
        $registered = $pdo->query('SELECT key_id FROM secret_key_registry WHERE id=1')->fetchColumn();
        $key = null;
        try {
            if ($registered !== false) {
                if ($keyFile === null) { self::fail(); }
                Foundation::privateFile($keyFile);
                $key = file_get_contents($keyFile, false, null, 0, 33);
                if (! is_string($key) || strlen($key) !== 32 || ! hash_equals($registered, hash('sha256', $key))) { self::fail(); }
            } elseif ($keyFile !== null) { self::fail(); }
            $rows = $pdo->query('SELECT * FROM profile_secrets');
            foreach ($rows as $row) {
                if ($key === null) { self::fail(); }
                $password = SecretCipher::decrypt('profile:' . $row['profile_id'], $row, $key);
                sodium_memzero($password);
            }
        } finally {
            if (is_string($key)) { sodium_memzero($key); }
        }
        return ['schema' => 2, 'profiles' => (int) $pdo->query('SELECT COUNT(*) FROM profiles')->fetchColumn(),
            'key_id' => $registered === false ? null : $registered];
    }

    /** SQLite VACUUM INTO takes a consistent snapshot, including committed WAL data. */
    public static function backup(string $metadata, string $keys): void
    {
        $created = [];
        $oldMask = umask(0077);
        try {
            Foundation::runtime();
            $config = Foundation::configuration();
            $source = Foundation::privateFile($config['data_dir'] . '/profiles.sqlite');
            self::newPath($metadata); self::newPath($keys);
            if ($metadata === $keys || strpos($metadata . '/', $keys . '/') === 0 || strpos($keys . '/', $metadata . '/') === 0) { self::fail(); }
            self::directory($metadata); $created[] = $metadata;
            self::directory($keys); $created[] = $keys;
            $pdo = new PDO('sqlite:' . $source, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 1]);
            $pdo->exec('PRAGMA busy_timeout=1000');
            $statement = $pdo->prepare('VACUUM INTO :destination');
            $statement->execute([':destination' => $metadata . '/profiles.sqlite']);
            Foundation::privateFile($metadata . '/profiles.sqlite');
            $snapshot = fopen($metadata . '/profiles.sqlite', 'r+b');
            if ($snapshot === false) { self::fail(); }
            try { if (! fsync($snapshot)) { self::fail(); } }
            finally { fclose($snapshot); }
            $keyFile = $config['key_dir'] . '/master.key';
            if (file_exists($keyFile) || is_link($keyFile)) {
                Foundation::privateFile($keyFile);
                $key = file_get_contents($keyFile, false, null, 0, 33);
                try {
                    if (! is_string($key) || strlen($key) !== 32) { self::fail(); }
                    self::write($keys . '/master.key', $key);
                } finally { if (is_string($key)) { sodium_memzero($key); } }
            }
            $hasKey = is_file($keys . '/master.key');
            $info = self::inspect($metadata . '/profiles.sqlite', $hasKey ? $keys . '/master.key' : null);
            self::write($metadata . '/manifest.json', json_encode($info + [
                'format' => 1, 'created_at' => ProfileRepository::now(),
                'database_sha256' => hash_file('sha256', $metadata . '/profiles.sqlite'),
                'key_sha256' => $hasKey ? hash_file('sha256', $keys . '/master.key') : null,
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n");
        } catch (Throwable $error) {
            self::cleanup($created); self::fail();
        } finally { umask($oldMask); }
    }

    public static function restore(string $metadata, string $keys, string $destination): void
    {
        $created = [];
        $oldMask = umask(0077);
        try {
            Foundation::runtime();
            // Do not read active local.json or use its destinations during restore.
            self::newPath($destination);
            Foundation::privateFile($metadata . '/manifest.json');
            $manifest = json_decode(file_get_contents($metadata . '/manifest.json', false, null, 0, 16384), true, 32, JSON_THROW_ON_ERROR);
            if (($manifest['format'] ?? null) !== 1 || ! is_string($manifest['database_sha256'] ?? null)) { self::fail(); }
            Foundation::privateFile($metadata . '/profiles.sqlite');
            if (! hash_equals($manifest['database_sha256'], hash_file('sha256', $metadata . '/profiles.sqlite'))) { self::fail(); }
            $hasKey = ($manifest['key_sha256'] ?? null) !== null;
            if ($hasKey) {
                Foundation::privateFile($keys . '/master.key');
                if (! is_string($manifest['key_sha256']) || ! hash_equals($manifest['key_sha256'], hash_file('sha256', $keys . '/master.key'))) { self::fail(); }
            }
            $info = self::inspect($metadata . '/profiles.sqlite', $hasKey ? $keys . '/master.key' : null);
            foreach ($info as $field => $value) { if (($manifest[$field] ?? null) !== $value) { self::fail(); } }
            self::directory($destination); $created[] = $destination;
            self::directory($destination . '/data'); $created[] = $destination . '/data';
            self::directory($destination . '/keys'); $created[] = $destination . '/keys';
            // Copy only verified snapshot files, never sessions, registry replacements or arbitrary manifest paths.
            self::write($destination . '/data/profiles.sqlite', file_get_contents($metadata . '/profiles.sqlite'));
            if (! hash_equals($manifest['database_sha256'], hash_file('sha256', $destination . '/data/profiles.sqlite'))) { self::fail(); }
            if ($hasKey) {
                $key = file_get_contents($keys . '/master.key', false, null, 0, 33);
                try { self::write($destination . '/keys/master.key', $key); }
                finally { sodium_memzero($key); }
            }
            self::write($destination . '/local.json', json_encode([
                'profiles_enabled' => false, 'data_dir' => $destination . '/data', 'key_dir' => $destination . '/keys',
            ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n");
            self::inspect($destination . '/data/profiles.sqlite', $hasKey ? $destination . '/keys/master.key' : null);
        } catch (Throwable $error) {
            self::cleanup($created); self::fail();
        } finally { umask($oldMask); }
    }

    private static function cleanup(array $created): void
    {
        foreach (array_reverse($created) as $directory) {
            foreach (['profiles.sqlite', 'profiles.sqlite-journal', 'manifest.json', 'master.key', 'local.json'] as $name) {
                if (is_file($directory . '/' . $name)) { @unlink($directory . '/' . $name); }
            }
            @rmdir($directory);
        }
    }
}
