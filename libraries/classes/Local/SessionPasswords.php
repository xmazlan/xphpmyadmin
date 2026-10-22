<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;
use RuntimeException;

/** Server-side PHP-session storage only. Call after phpMyAdmin Session::setUp(). */
final class SessionPasswords
{
    private const SLOT = ' xphpmyadmin_passwords ';
    private $ttl;

    public function __construct(int $ttl = 1440)
    {
        if (PHP_VERSION_ID < 80200 || ! extension_loaded('sodium')
            || ! function_exists('sodium_crypto_aead_xchacha20poly1305_ietf_encrypt')
            || ! function_exists('sodium_crypto_aead_xchacha20poly1305_ietf_decrypt')) {
            throw new RuntimeException('Temporary passwords require PHP 8.2+ and native Sodium AEAD.');
        }
        if ($ttl < 1 || $ttl > 86400) {
            throw new InvalidArgumentException('Temporary password lifetime must be between 1 and 86400 seconds.');
        }
        $this->ttl = $ttl;
    }

    private static function identity(string $context, string $profile, int $revision): void
    {
        if (preg_match('/^[A-Za-z0-9_-]{32,128}$/D', $context) !== 1
            || preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D', $profile) !== 1
            || $revision < 1) {
            throw new InvalidArgumentException('Invalid temporary password context.');
        }
    }

    private static function binding(string $context, string $profile, int $revision): string
    {
        return 'session:' . $context . ':' . $profile . ':' . $revision;
    }

    public function put(
        string $context,
        string $profile,
        int $revision,
        #[\SensitiveParameter]
        string $password
    ): void {
        self::identity($context, $profile, $revision);
        if (session_status() !== PHP_SESSION_ACTIVE || session_id() === '') {
            throw new RuntimeException('An active server-side session is required.');
        }
        if (strlen($password) > 65536) {
            throw new InvalidArgumentException('Temporary password is too long.');
        }
        $state = $_SESSION[self::SLOT] ?? null;
        if ($state === null) {
            $state = ['key' => random_bytes(32), 'contexts' => []];
        }
        if (! is_array($state) || ! is_string($state['key'] ?? null) || strlen($state['key']) !== 32
            || ! is_array($state['contexts'] ?? null)) {
            throw new SecretUnavailable();
        }
        $state['contexts'][$context] = [
            'profile' => $profile, 'revision' => $revision, 'expires_at' => time() + $this->ttl,
            'envelope' => SecretCipher::encrypt(self::binding($context, $profile, $revision), $password, $state['key']),
        ];
        $_SESSION[self::SLOT] = $state;
    }

    /** Internal connection use only; never pass this return value to a profile response. */
    public function get(string $context, string $profile, int $revision): ?string
    {
        self::identity($context, $profile, $revision);
        if (session_status() !== PHP_SESSION_ACTIVE || session_id() === '') {
            return null;
        }
        $state = $_SESSION[self::SLOT] ?? null;
        if ($state === null) {
            return null;
        }
        if (! is_array($state) || ! is_string($state['key'] ?? null) || strlen($state['key']) !== 32
            || ! is_array($state['contexts'] ?? null)) {
            throw new SecretUnavailable();
        }
        $entry = $state['contexts'][$context] ?? null;
        if ($entry === null) {
            return null;
        }
        if (! is_array($entry) || ! is_int($entry['expires_at'] ?? null)) {
            throw new SecretUnavailable();
        }
        if ($entry['expires_at'] <= time()) {
            $this->forgetContext($context);
            return null;
        }
        if (($entry['profile'] ?? null) !== $profile || ($entry['revision'] ?? null) !== $revision) {
            return null;
        }
        if (! is_array($entry['envelope'] ?? null)) {
            throw new SecretUnavailable();
        }

        return SecretCipher::decrypt(self::binding($context, $profile, $revision), $entry['envelope'], $state['key']);
    }

    /** Disconnect hook for Brief 05. Never affects another context. */
    public function forgetContext(string $context): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        unset($_SESSION[self::SLOT]['contexts'][$context]);
        $this->removeEmptyState();
    }

    /** Profile deletion/revocation hook for all contexts in the current session. */
    public function forgetProfile(string $profile): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        foreach ($_SESSION[self::SLOT]['contexts'] ?? [] as $context => $entry) {
            if (($entry['profile'] ?? null) === $profile) {
                unset($_SESSION[self::SLOT]['contexts'][$context]);
            }
        }
        $this->removeEmptyState();
    }

    private function removeEmptyState(): void
    {
        if (empty($_SESSION[self::SLOT]['contexts'])) {
            $this->clearAll();
        }
    }

    /** Logout hook: call before session_unset()/session_destroy(). Does not start a session. */
    public function clearAll(): void
    {
        if (is_string($_SESSION[self::SLOT]['key'] ?? null)) {
            sodium_memzero($_SESSION[self::SLOT]['key']);
        }
        unset($_SESSION[self::SLOT]);
    }
}
