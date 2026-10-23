<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use Throwable;

/** Opaque capabilities live only in the owning PHP session. No active-target session slot. */
final class ConnectionContexts
{
    private const SLOT = ' xphpmyadmin_contexts ';
    private $profiles;
    private $database;

    public function __construct(ProfileDatabase $database)
    {
        $this->database = $database;
        $this->profiles = new ProfileRepository($database);
    }

    private static function requireSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE || session_id() === '') {
            throw new ConnectionFailure('reconnect');
        }
    }

    public function connect(string $id, int $revision, #[\SensitiveParameter] array $credential): array
    {
        self::requireSession();
        $profile = $this->profiles->detail($id);
        if ($profile === null || $profile['connection_revision'] !== $revision) {
            throw new ConnectionFailure('reconnect');
        }
        $source = $credential['source'] ?? null;
        $fields = $source === 'input' ? ['source', 'password'] : ($source === 'session' ? ['source', 'context'] : ['source']);
        if (array_diff(array_keys($credential), $fields) !== []) {
            throw new ConnectionFailure('input');
        }
        if ($source === 'input' && is_string($credential['password'] ?? null)) {
            $password = $credential['password'];
        } elseif ($source === 'saved') {
            $password = (new ProfilePasswords($this->database))->reveal($id, $revision);
        } elseif ($source === 'session' && is_string($credential['context'] ?? null)) {
            $old = $this->resolve($credential['context']);
            if ($old['profile']['id'] !== $id || $old['profile']['connection_revision'] !== $revision) {
                throw new ConnectionFailure('input');
            }
            $password = (new SessionPasswords())->get($credential['context'], $id, $revision);
        } else {
            throw new ConnectionFailure('input');
        }
        if ($password === null) {
            throw new SecretUnavailable();
        }
        $token = bin2hex(random_bytes(32));
        try {
            $connection = (new MySqlConnector())->open(array_intersect_key($profile, array_flip(ProfileInput::FIELDS)), $password);
            $connection->close();
            // Recheck the revision after network validation, inside the last-used transaction.
            (new SessionPasswords())->put($token, $id, $revision, $password);
            $profile = $this->profiles->recordConnectSuccess($id, $revision);
            $number = ($_SESSION[self::SLOT]['next'] ?? 1000000) + 1;
            $_SESSION[self::SLOT]['next'] = $number;
            $_SESSION[self::SLOT]['labels'][$token] = self::identity($profile);
            $_SESSION[self::SLOT]['entries'][$token] = [
                'profile' => $id, 'revision' => $revision, 'server' => $number, 'expires' => time() + 1440,
                'storage' => $this->database->identity(),
            ];
        } catch (Throwable $error) {
            (new SessionPasswords())->forgetContext($token);
            throw $error;
        } finally {
            sodium_memzero($password);
        }

        return ['ok' => true, 'context' => $token, 'target' => self::identity($profile),
            'url' => 'index.php?' . http_build_query(['route' => '/', 'xpma_context' => $token, 'db' => $profile['database'] ?? ''])];
    }

    public function resolve(string $token): array
    {
        self::requireSession();
        if (preg_match('/^[a-f0-9]{64}$/D', $token) !== 1) {
            throw new ConnectionFailure('reconnect');
        }
        $entry = $_SESSION[self::SLOT]['entries'][$token] ?? null;
        if (! is_array($entry) || ($entry['expires'] ?? 0) <= time()
            || ($entry['storage'] ?? null) !== $this->database->identity()) {
            $this->disconnect($token);
            throw new ConnectionFailure('reconnect');
        }
        $profile = $this->profiles->detail($entry['profile']);
        if ($profile === null || $profile['connection_revision'] !== $entry['revision']) {
            $this->disconnect($token);
            throw new ConnectionFailure('reconnect');
        }
        return ['profile' => $profile, 'server' => $entry['server']];
    }

    public static function identity(array $profile): array
    {
        return array_intersect_key($profile, array_flip(['id', 'name', 'host', 'port', 'username', 'database', 'environment', 'connection_revision']));
    }

    /** Informational only. Revoked capabilities may identify the profile to reconnect. */
    public static function hint(string $token): ?array
    {
        return preg_match('/^[a-f0-9]{64}$/D', $token) === 1
            ? ($_SESSION[self::SLOT]['labels'][$token] ?? null) : null;
    }

    public function availableContext(string $id, int $revision): ?string
    {
        foreach ($_SESSION[self::SLOT]['entries'] ?? [] as $token => $entry) {
            if ($entry['profile'] !== $id || $entry['revision'] !== $revision) {
                continue;
            }
            try {
                $this->resolve($token);
                $password = (new SessionPasswords())->get($token, $id, $revision);
                if ($password !== null) {
                    sodium_memzero($password);
                    return $token;
                }
            } catch (Throwable $ignored) {
                // A missing/expired credential asks the UI for a new password.
            }
        }
        return null;
    }

    public function disconnect(string $token): void
    {
        self::requireSession();
        unset($_SESSION[self::SLOT]['entries'][$token]);
        (new SessionPasswords())->forgetContext($token);
    }

    /** Other sessions are rejected lazily by resolve() before a remote connection. */
    public static function revokeProfile(string $id): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        foreach ($_SESSION[self::SLOT]['entries'] ?? [] as $token => $entry) {
            if ($entry['profile'] === $id) {
                unset($_SESSION[self::SLOT]['entries'][$token]);
            }
        }
        (new SessionPasswords())->forgetProfile($id);
    }

    public static function logout(): void
    {
        unset($_SESSION[self::SLOT]);
        if (isset($_SESSION[' xphpmyadmin_passwords '])) {
            (new SessionPasswords())->clearAll();
        }
    }
}
