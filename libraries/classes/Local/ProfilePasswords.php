<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;
use PDO;
use RuntimeException;

/** Trusted internal service; its reveal method is never a list/detail response. */
final class ProfilePasswords
{
    private $database;
    private $profiles;
    private $keys;

    public function __construct(ProfileDatabase $database)
    {
        $this->database = $database;
        $this->profiles = new ProfileRepository($database);
        $this->keys = new SecretKeyStore($database);
    }

    private static function change(
        #[\SensitiveParameter]
        array $change
    ): array {
        if (array_diff(array_keys($change), ['action', 'password']) !== []) {
            throw new InvalidArgumentException('Unsupported password operation field.');
        }
        $action = array_key_exists('action', $change) ? $change['action'] : 'keep';
        if (! in_array($action, ['keep', 'replace', 'remove'], true)) {
            throw new InvalidArgumentException('Password action must be keep, replace or remove.');
        }
        if ($action === 'replace') {
            if (! array_key_exists('password', $change) || ! is_string($change['password']) || strlen($change['password']) > 65536) {
                throw new InvalidArgumentException('Explicit replacement requires a password string of at most 65536 bytes.');
            }
        } elseif (array_key_exists('password', $change)) {
            throw new InvalidArgumentException('Keep/remove must not include a password field.');
        }

        return $change + ['action' => $action];
    }

    public function create(
        #[\SensitiveParameter]
        array $metadata,
        #[\SensitiveParameter]
        array $change = []
    ): array {
        $change = self::change($change);

        return $this->database->transaction(function (PDO $pdo) use ($metadata, $change): array {
            $profile = $this->profiles->create($metadata);
            $this->apply($pdo, $profile['id'], $change);

            return $this->profiles->detail($profile['id']);
        });
    }

    public function update(
        string $id,
        #[\SensitiveParameter]
        array $metadata,
        #[\SensitiveParameter]
        array $change = []
    ): array {
        $change = self::change($change);

        return $this->database->transaction(function (PDO $pdo) use ($id, $metadata, $change): array {
            $this->profiles->update($id, $metadata);
            $this->apply($pdo, $id, $change);

            return $this->profiles->detail($id);
        });
    }

    private function apply(
        PDO $pdo,
        string $id,
        #[\SensitiveParameter]
        array $change
    ): void {
        if ($change['action'] === 'keep') {
            return;
        }
        if ($change['action'] === 'remove') {
            $statement = $pdo->prepare('DELETE FROM profile_secrets WHERE profile_id=:id');
            $statement->execute([':id' => $id]);
            return;
        }
        $key = $this->keys->load();
        try {
            $envelope = SecretCipher::encrypt('profile:' . $id, $change['password'], $key);
        } finally {
            sodium_memzero($key);
        }
        $statement = $pdo->prepare('INSERT INTO profile_secrets
            (profile_id, cipher_version, key_id, nonce, ciphertext, updated_at)
            VALUES (:id, 1, :key_id, :nonce, :ciphertext, :updated)
            ON CONFLICT(profile_id) DO UPDATE SET cipher_version=excluded.cipher_version,
            key_id=excluded.key_id, nonce=excluded.nonce, ciphertext=excluded.ciphertext, updated_at=excluded.updated_at');
        $statement->bindValue(':id', $id);
        $statement->bindValue(':key_id', $envelope['key_id']);
        $statement->bindValue(':nonce', $envelope['nonce'], PDO::PARAM_LOB);
        $statement->bindValue(':ciphertext', $envelope['ciphertext'], PDO::PARAM_LOB);
        $statement->bindValue(':updated', ProfileRepository::now());
        $statement->execute();
    }

    /** Only for Connect after server-side context validation; never serialize this return value. */
    public function reveal(string $id, int $expectedRevision): ?string
    {
        return $this->database->transaction(function (PDO $pdo) use ($id, $expectedRevision): ?string {
            $profile = $this->profiles->detail($id);
            if ($profile === null || $expectedRevision < 1 || $profile['connection_revision'] !== $expectedRevision) {
                throw new RuntimeException('Profile connection context is invalid; reconnect.');
            }
            $statement = $pdo->prepare('SELECT cipher_version, key_id, nonce, ciphertext FROM profile_secrets WHERE profile_id=:id');
            $statement->execute([':id' => $id]);
            $envelope = $statement->fetch();
            if ($envelope === false) {
                return null;
            }
            $key = $this->keys->load();
            try {
                return SecretCipher::decrypt('profile:' . $id, $envelope, $key);
            } finally {
                sodium_memzero($key);
            }
        });
    }
}
