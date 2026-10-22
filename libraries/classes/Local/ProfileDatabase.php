<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PDO;
use PDOException;
use Throwable;

final class ProfileDatabase
{
    private $pdo;
    private $depth = 0;

    private function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** Internal bootstrap only; this does not enable the profile UI or connect to MySQL. */
    public static function openConfigured(): self
    {
        Foundation::runtime();
        $config = Foundation::configuration();
        $file = $config['data_dir'] . '/profiles.sqlite';
        $oldMask = umask(0077);
        try {
            if (! file_exists($file) && ! is_link($file)) {
                $handle = @fopen($file, 'x');
                if ($handle !== false) {
                    fclose($handle);
                }
            }
            Foundation::privateFile($file);
            foreach (['-journal', '-wal', '-shm'] as $suffix) {
                if (file_exists($file . $suffix) || is_link($file . $suffix)) {
                    Foundation::privateFile($file . $suffix);
                }
            }
            $pdo = new PDO('sqlite:' . $file, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 1,
            ]);
            $pdo->exec('PRAGMA foreign_keys = ON');
            $pdo->exec('PRAGMA busy_timeout = 250');
            $pdo->exec('PRAGMA synchronous = FULL');
            $pdo->exec('PRAGMA secure_delete = ON');
            $database = new self($pdo);
            $database->migrate();

            return $database;
        } catch (PDOException $error) {
            throw StorageException::database($error);
        } finally {
            umask($oldMask);
        }
    }

    private function migrate(): void
    {
        $version = (int) $this->pdo->query('PRAGMA user_version')->fetchColumn();
        if ($version === 2) {
            return;
        }
        if ($version < 0 || $version > 2) {
            throw new StorageException('Profile schema is newer than this application; upgrade the application.');
        }
        $this->transaction(function (PDO $pdo): void {
            $version = (int) $pdo->query('PRAGMA user_version')->fetchColumn();
            if ($version === 2) {
                return;
            }
            if ($version < 0 || $version > 2) {
                throw new StorageException('Unsupported profile schema version.');
            }
            if ($version === 0) {
                $pdo->exec("CREATE TABLE profiles (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL CHECK(length(name) > 0),
                    host TEXT NOT NULL CHECK(length(host) > 0),
                    port INTEGER NOT NULL CHECK(typeof(port) = 'integer' AND port BETWEEN 1 AND 65535),
                    username TEXT NOT NULL CHECK(length(username) > 0),
                    database_name TEXT,
                    environment TEXT NOT NULL CHECK(environment IN ('Local','Staging','Production','Other')),
                    tls_enabled INTEGER NOT NULL CHECK(tls_enabled IN (0,1)),
                    tls_verify INTEGER NOT NULL CHECK(tls_verify = 1),
                    tls_ca TEXT, tls_cert TEXT, tls_key TEXT,
                    favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0,1)),
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_used_at TEXT,
                    connection_revision INTEGER NOT NULL DEFAULT 1 CHECK(connection_revision >= 1)
                )");
                $pdo->exec('CREATE TABLE profile_imports (
                    origin TEXT PRIMARY KEY NOT NULL,
                    profile_id TEXT UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
                    imported_at TEXT NOT NULL
                )');
                $pdo->exec('CREATE INDEX profiles_recent ON profiles(last_used_at DESC, id)');
                $pdo->exec('PRAGMA user_version = 1');
            }
            $pdo->exec('CREATE TABLE secret_key_registry (
                id INTEGER PRIMARY KEY CHECK(id = 1),
                key_id TEXT NOT NULL CHECK(length(key_id) = 64),
                created_at TEXT NOT NULL
            )');
            $pdo->exec('CREATE TABLE profile_secrets (
                profile_id TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                cipher_version INTEGER NOT NULL CHECK(cipher_version = 1),
                key_id TEXT NOT NULL CHECK(length(key_id) = 64),
                nonce BLOB NOT NULL CHECK(length(nonce) = 24),
                ciphertext BLOB NOT NULL CHECK(length(ciphertext) >= 16),
                updated_at TEXT NOT NULL
            )');
            $pdo->exec('PRAGMA user_version = 2');
        });
    }

    /** Shared transaction boundary for metadata and secrets. Nested calls use savepoints. */
    public function transaction(
        #[\SensitiveParameter]
        callable $operation
    )
    {
        $level = $this->depth;
        $savepoint = 'profile_' . $level;
        $started = false;
        $oldMask = umask(0077);
        try {
            $this->pdo->exec($level === 0 ? 'BEGIN IMMEDIATE' : 'SAVEPOINT ' . $savepoint);
            $started = true;
            $this->depth++;
            $result = $operation($this->pdo);
            $this->pdo->exec($level === 0 ? 'COMMIT' : 'RELEASE SAVEPOINT ' . $savepoint);

            return $result;
        } catch (Throwable $error) {
            if ($started) {
                try {
                    $this->pdo->exec($level === 0 ? 'ROLLBACK' : 'ROLLBACK TO SAVEPOINT ' . $savepoint);
                    if ($level !== 0) {
                        $this->pdo->exec('RELEASE SAVEPOINT ' . $savepoint);
                    }
                } catch (PDOException $ignored) {
                    // Preserve a safe original failure. A failed write is never reported as success.
                }
            }
            if ($error instanceof PDOException) {
                throw StorageException::database($error);
            }
            throw $error;
        } finally {
            $this->depth = $level;
            umask($oldMask);
        }
    }

    /** Read-only repository query; all caller input must be bound as parameters. */
    public function rows(string $sql, array $parameters = []): array
    {
        try {
            $statement = $this->pdo->prepare($sql);
            $statement->execute($parameters);

            return $statement->fetchAll();
        } catch (PDOException $error) {
            throw StorageException::database($error);
        }
    }
}
