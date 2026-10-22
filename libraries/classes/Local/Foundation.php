<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PDO;
use RuntimeException;
use Throwable;

final class Foundation
{
    public static function configPath(): string
    {
        $override = getenv('XPHPMYADMIN_LOCAL_CONFIG');
        if ($override !== false && $override !== '') {
            return $override;
        }
        $account = function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid()) : false;
        $home = $account !== false ? $account['dir'] : getenv('HOME');
        if (! is_string($home) || $home === '') {
            throw new RuntimeException('Private configuration unavailable: configure XPHPMYADMIN_LOCAL_CONFIG.');
        }

        return $home . '/Library/Application Support/xphpmyadmin/local.json';
    }

    private static function privatePath(string $path, bool $directory): string
    {
        $real = realpath($path);
        $root = realpath(dirname(__DIR__, 3));
        $public = realpath($_SERVER['DOCUMENT_ROOT'] ?? '') ?: $root;
        // Herd reports root=/; the actual app root is always excluded below.
        foreach ([$root, $public === '/' ? $root : $public] as $excluded) {
            if ($real !== false && ($real === $excluded || strpos($real, $excluded . '/') === 0)) {
                throw new RuntimeException('Private storage must be outside the application and document root.');
            }
        }
        if ($path === '' || $path[0] !== '/' || $real === false || $real !== rtrim($path, '/')
            || ($directory ? ! is_dir($real) : ! is_file($real))) {
            throw new RuntimeException('Private location missing or unsafe; run the local bootstrap as the PHP account.');
        }
        clearstatcache(true, $real);
        if ((fileperms($real) & 0077) !== 0
            || (fileperms($real) & ($directory ? 0700 : 0600)) !== ($directory ? 0700 : 0600)
            || ! is_readable($real) || ! is_writable($real)
            || (function_exists('posix_geteuid') && fileowner($real) !== posix_geteuid())) {
            throw new RuntimeException('Private location requires owner-only permissions and PHP account read/write access.');
        }

        return $real;
    }

    /** Validate an existing private file without changing its permissions. */
    public static function privateFile(string $path): string
    {
        return self::privatePath($path, false);
    }

    public static function configuration(): array
    {
        $file = self::privatePath(self::configPath(), false);
        $config = json_decode((string) @file_get_contents($file), true);
        if (! is_array($config) || ! isset($config['profiles_enabled'], $config['data_dir'], $config['key_dir'])
            || ! is_bool($config['profiles_enabled']) || ! is_string($config['data_dir']) || ! is_string($config['key_dir'])) {
            throw new RuntimeException('Private configuration invalid; expected profiles_enabled, data_dir and key_dir.');
        }
        $data = self::privatePath($config['data_dir'], true);
        $key = self::privatePath($config['key_dir'], true);
        if ($data === $key || strpos($data, $key . '/') === 0 || strpos($key, $data . '/') === 0) {
            throw new RuntimeException('Data and key locations must be separate directories.');
        }

        return $config;
    }

    public static function runtime(): array
    {
        if (PHP_VERSION_ID < 80200) {
            throw new RuntimeException('Local profile services require PHP 8.2+ for sensitive argument redaction.');
        }
        $sqlite = class_exists(PDO::class) && in_array('sqlite', PDO::getAvailableDrivers(), true);
        $sodium = extension_loaded('sodium') && function_exists('sodium_crypto_secretbox')
            && function_exists('sodium_crypto_secretbox_open') && function_exists('random_bytes')
            && function_exists('sodium_crypto_aead_xchacha20poly1305_ietf_encrypt')
            && function_exists('sodium_crypto_aead_xchacha20poly1305_ietf_decrypt');
        if (! $sqlite || ! $sodium) {
            throw new RuntimeException('Local profiles require ext-pdo_sqlite and ext-sodium in this PHP runtime.');
        }
        try {
            $db = new PDO('sqlite::memory:');
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $sqliteVersion = (string) $db->query('SELECT sqlite_version()')->fetchColumn();
            $key = random_bytes(SODIUM_CRYPTO_SECRETBOX_KEYBYTES);
            $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
            $ciphertext = sodium_crypto_secretbox('runtime-check', $nonce, $key);
            if (sodium_crypto_secretbox_open($ciphertext, $nonce, $key) !== 'runtime-check') {
                throw new RuntimeException();
            }
            sodium_memzero($key);
            $key = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES);
            $nonce = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
            $ciphertext = sodium_crypto_aead_xchacha20poly1305_ietf_encrypt('runtime-check', 'runtime', $nonce, $key);
            if (sodium_crypto_aead_xchacha20poly1305_ietf_decrypt($ciphertext, 'runtime', $nonce, $key) !== 'runtime-check') {
                throw new RuntimeException();
            }
            sodium_memzero($key);
        } catch (Throwable $error) {
            throw new RuntimeException('Local runtime self-check failed; check PDO SQLite and Sodium installation.');
        }

        if (version_compare($sqliteVersion, '3.24.0', '<')) {
            throw new RuntimeException('Local profile services require SQLite 3.24+ for atomic secret updates.');
        }

        return ['php' => PHP_VERSION, 'sapi' => PHP_SAPI, 'pdo_sqlite' => true,
            'sqlite_version' => $sqliteVersion, 'sodium' => true];
    }

    /** Call after Common::run(), before every future profile mutation controller. */
    public static function requireMutation(array $server, array $post, array $session): void
    {
        if (($server['REQUEST_METHOD'] ?? '') !== 'POST') {
            throw new RuntimeException('Profile mutations require POST.');
        }
        $token = $post['token'] ?? null;
        $expected = $session[' PMA_token '] ?? null;
        if (! is_string($token) || ! is_string($expected) || $expected === '' || ! hash_equals($expected, $token)) {
            throw new RuntimeException('Invalid CSRF token.');
        }
    }
}
