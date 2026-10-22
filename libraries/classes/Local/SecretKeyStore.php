<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PDO;
use Throwable;

final class SecretKeyStore
{
    private $database;

    public function __construct(ProfileDatabase $database)
    {
        $this->database = $database;
    }

    private static function path(): string
    {
        return Foundation::configuration()['key_dir'] . '/master.key';
    }

    private static function read(string $file): string
    {
        try {
            Foundation::privateFile($file);
            // Bounded read: never load arbitrary large files into the key buffer.
            $key = @file_get_contents($file, false, null, 0, 33);
            if (! is_string($key) || strlen($key) !== 32) {
                throw new SecretUnavailable();
            }

            return $key;
        } catch (Throwable $error) {
            throw new SecretUnavailable();
        }
    }

    private static function publish(
        string $file,
        #[\SensitiveParameter]
        string $key,
        bool $replace
    ): void {
        $temporary = dirname($file) . '/.key-' . bin2hex(random_bytes(16));
        $oldMask = umask(0077);
        try {
            $handle = @fopen($temporary, 'x');
            if ($handle === false) {
                throw new SecretUnavailable();
            }
            try {
                if (fwrite($handle, $key) !== 32 || ! fflush($handle)
                    || (function_exists('fsync') && ! fsync($handle))) {
                    throw new SecretUnavailable();
                }
            } finally {
                fclose($handle);
            }
            // Atomic publication: neither readers nor another initializer see a partial key.
            if ($replace ? ! @rename($temporary, $file) : ! @link($temporary, $file)) {
                throw new SecretUnavailable();
            }
        } finally {
            if (is_file($temporary)) {
                @unlink($temporary);
            }
            umask($oldMask);
        }
    }

    /** Explicit administrative bootstrap only. Never called by list/read/save/decrypt. */
    public function initialize(): void
    {
        $this->database->transaction(function (PDO $pdo): void {
            $registered = $pdo->query('SELECT key_id FROM secret_key_registry WHERE id=1')->fetchColumn();
            $file = self::path();
            if ($registered !== false) {
                $key = self::read($file);
                try {
                    if (! hash_equals($registered, hash('sha256', $key))) {
                        throw new SecretUnavailable();
                    }
                } finally {
                    sodium_memzero($key);
                }
                return;
            }
            if ((int) $pdo->query('SELECT COUNT(*) FROM profile_secrets')->fetchColumn() !== 0) {
                throw new SecretUnavailable();
            }
            // If a crash published the file before the registry committed, explicit init can register it.
            $key = (file_exists($file) || is_link($file)) ? self::read($file) : random_bytes(32);
            try {
                if (! file_exists($file) && ! is_link($file)) {
                    self::publish($file, $key, false);
                }
                $statement = $pdo->prepare('INSERT INTO secret_key_registry (id, key_id, created_at) VALUES (1, :key_id, :created)');
                $statement->execute([':key_id' => hash('sha256', $key), ':created' => ProfileRepository::now()]);
            } finally {
                sodium_memzero($key);
            }
        });
    }

    /** Internal connection service only; caller must hold the database transaction lock. */
    public function load(): string
    {
        $rows = $this->database->rows('SELECT key_id FROM secret_key_registry WHERE id=1');
        if ($rows === []) {
            throw new SecretUnavailable();
        }
        $key = self::read(self::path());
        if (! hash_equals($rows[0]['key_id'], hash('sha256', $key))) {
            sodium_memzero($key);
            throw new SecretUnavailable();
        }

        return $key;
    }

    /** Explicit recovery: only the key matching the existing registry can replace the file. */
    public function restore(string $backup): void
    {
        $this->database->transaction(function (PDO $pdo) use ($backup): void {
            $registered = $pdo->query('SELECT key_id FROM secret_key_registry WHERE id=1')->fetchColumn();
            $key = self::read($backup);
            try {
                if ($registered === false || ! hash_equals($registered, hash('sha256', $key))) {
                    throw new SecretUnavailable();
                }
                $file = self::path();
                if (file_exists($file) || is_link($file)) {
                    Foundation::privateFile($file);
                }
                self::publish($file, $key, true);
                // No registry/ciphertext is modified. One corrupt row cannot destroy other profiles.
            } finally {
                sodium_memzero($key);
            }
        });
    }
}
