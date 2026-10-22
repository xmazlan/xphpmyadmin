<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use Throwable;

/** Internal binary encryption only. Never return these envelopes from a profile endpoint. */
final class SecretCipher
{
    public static function encrypt(
        string $binding,
        #[\SensitiveParameter]
        string $password,
        #[\SensitiveParameter]
        string $key
    ): array {
        try {
            $nonce = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
            $ciphertext = sodium_crypto_aead_xchacha20poly1305_ietf_encrypt(
                $password,
                'xphpmyadmin:password:v1:' . $binding,
                $nonce,
                $key
            );

            return ['cipher_version' => 1, 'key_id' => hash('sha256', $key),
                'nonce' => $nonce, 'ciphertext' => $ciphertext];
        } catch (Throwable $error) {
            throw new SecretUnavailable();
        }
    }

    public static function decrypt(
        string $binding,
        #[\SensitiveParameter]
        array $envelope,
        #[\SensitiveParameter]
        string $key
    ): string {
        try {
            if ((int) ($envelope['cipher_version'] ?? 0) !== 1
                || ! is_string($envelope['key_id'] ?? null)
                || ! hash_equals(hash('sha256', $key), $envelope['key_id'])
                || ! is_string($envelope['nonce'] ?? null) || strlen($envelope['nonce']) !== 24
                || ! is_string($envelope['ciphertext'] ?? null) || strlen($envelope['ciphertext']) < 16) {
                throw new SecretUnavailable();
            }
            $password = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt(
                $envelope['ciphertext'],
                'xphpmyadmin:password:v1:' . $binding,
                $envelope['nonce'],
                $key
            );
            if (! is_string($password)) {
                throw new SecretUnavailable();
            }

            return $password;
        } catch (Throwable $error) {
            throw new SecretUnavailable();
        }
    }
}
