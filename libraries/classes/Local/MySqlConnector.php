<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;
use mysqli_driver;
use Throwable;

/** Shared transport for Test now and Connect in Brief 05. No profile/session writes. */
final class MySqlConnector
{
    public const INITIAL_TIMEOUT = 10;

    private static function tlsFiles(array $tls): void
    {
        if (! $tls['enabled']) {
            return;
        }
        foreach (['ca', 'cert', 'key'] as $field) {
            if ($tls[$field] !== null && (! is_file($tls[$field]) || ! is_readable($tls[$field]))) {
                throw new ConnectionFailure('tls');
            }
        }
        if ($tls['cert'] !== null) {
            $certificate = @openssl_x509_read('file://' . $tls['cert']);
            $key = @openssl_pkey_get_private('file://' . $tls['key']);
            if ($certificate === false || $key === false || ! @openssl_x509_check_private_key($certificate, $key)) {
                throw new ConnectionFailure('tls');
            }
        }
    }

    private static function flags(
        #[\SensitiveParameter]
        string $message,
        array $warnings
    ): array {
        $warnings['dns'] = $warnings['dns'] || preg_match('/getaddrinfo|php_network_getaddresses|name resolution|unknown host/i', $message) === 1;
        $warnings['tls'] = $warnings['tls'] || preg_match('/SSL|TLS|certificate|private key|secure connection/i', $message) === 1;
        $warnings['timeout'] = $warnings['timeout'] || preg_match('/timed? out|timeout/i', $message) === 1;

        return $warnings;
    }

    private static function failure(int $code, array $warnings, float $elapsed): ConnectionFailure
    {
        if (in_array($code, [1044, 1049], true)) {
            return new ConnectionFailure('database');
        }
        if (in_array($code, [1045, 1251, 1524, 1698, 2054], true) || ($code === 2061 && ! $warnings['tls'])) {
            return new ConnectionFailure('authentication');
        }

        if ($warnings['timeout'] || ($elapsed >= self::INITIAL_TIMEOUT - 0.5 && in_array($code, [2002, 2006, 2013, 2026], true))) {
            return new ConnectionFailure('timeout');
        }
        if ($warnings['dns'] || $code === 2005) {
            return new ConnectionFailure('dns');
        }
        if ($warnings['tls'] || in_array($code, [2001, 2026, 3159, 9002], true)) {
            return new ConnectionFailure('tls');
        }

        return new ConnectionFailure('network');
    }

    public function open(
        #[\SensitiveParameter]
        array $draft,
        #[\SensitiveParameter]
        string $password,
        ?int $readTimeout = null
    ): VerifiedConnection {
        try {
            $profile = ProfileInput::validate($draft);
        } catch (InvalidArgumentException $error) {
            throw new ConnectionFailure('input');
        }
        if ($profile['method'] !== 'direct') { throw new ConnectionFailure('input'); }
        if (strlen($password) > 65536 || ($readTimeout !== null && ($readTimeout < 1 || $readTimeout > 86400))) {
            throw new ConnectionFailure('input');
        }
        if (! extension_loaded('mysqli') || ! extension_loaded('openssl')) {
            throw new ConnectionFailure('storage');
        }
        $oldReport = (new mysqli_driver())->report_mode;
        $warnings = ['dns' => false, 'tls' => false, 'timeout' => false];
        // Keep native warnings out of responses/logs; retain only classification bits.
        set_error_handler(static function (
            int $severity,
            #[\SensitiveParameter]
            string $message
        ) use (&$warnings): bool {
            if (($severity & (E_WARNING | E_USER_WARNING)) !== 0) {
                $warnings = self::flags($message, $warnings);
            }
            return true;
        });
        $handle = null;
        $transferred = false;
        $started = microtime(true);
        try {
            mysqli_report(MYSQLI_REPORT_OFF);
            self::tlsFiles($profile['tls']);
            $handle = mysqli_init();
            if ($handle === false) {
                throw new ConnectionFailure('storage');
            }
            foreach ([MYSQLI_OPT_CONNECT_TIMEOUT => self::INITIAL_TIMEOUT,
                MYSQLI_OPT_LOCAL_INFILE => 0, MYSQLI_SET_CHARSET_NAME => 'utf8mb4'] as $option => $value) {
                if (! $handle->options($option, $value)) {
                    throw new ConnectionFailure('storage');
                }
            }
            // Test owns a short-lived handle with a bounded read timeout. Administration
            // keeps its own runtime read policy; mysqli cannot reliably reset the live socket.
            if ($readTimeout !== null && ! $handle->options(MYSQLI_OPT_READ_TIMEOUT, $readTimeout)) {
                throw new ConnectionFailure('storage');
            }
            $flags = 0;
            if ($profile['tls']['enabled']) {
                if (! $handle->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, 1)
                    || ! $handle->ssl_set($profile['tls']['key'], $profile['tls']['cert'], $profile['tls']['ca'], null, null)) {
                    throw new ConnectionFailure('tls');
                }
                $flags = MYSQLI_CLIENT_SSL;
            }
            // This product uses TCP, never the php.ini/default Unix socket or persistent p: hosts.
            $host = strtolower(rtrim($profile['host'], '.')) === 'localhost' ? '127.0.0.1' : $profile['host'];
            if (! $handle->real_connect($host, $profile['username'], $password, '', $profile['port'], '', $flags)) {
                $code = mysqli_connect_errno();
                if ($profile['tls']['enabled'] && in_array($code, [2006, 2013], true)) {
                    $warnings['tls'] = true;
                }
                throw self::failure($code, self::flags((string) mysqli_connect_error(), $warnings), microtime(true) - $started);
            }
            $status = $handle->query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
            if ($status === false) {
                throw self::failure($handle->errno, self::flags($handle->error, $warnings), microtime(true) - $started);
            }
            $row = $status->fetch_row();
            $status->free();
            $tls = is_array($row) && is_string($row[1] ?? null) && $row[1] !== '';
            if ($profile['tls']['enabled'] && ! $tls) {
                throw new ConnectionFailure('tls');
            }
            // Initial DB is selected only after TLS is verified, never silently omitted on failure.
            if ($profile['database'] !== null && ! $handle->select_db($profile['database'])) {
                throw self::failure($handle->errno, self::flags($handle->error, $warnings), microtime(true) - $started);
            }
            $connection = new VerifiedConnection($handle, $tls, $profile['database'] !== null);
            $transferred = true;

            return $connection;
        } catch (ConnectionFailure $error) {
            throw $error;
        } catch (Throwable $error) {
            throw new ConnectionFailure('network');
        } finally {
            if (! $transferred && $handle) {
                try {
                    @$handle->close();
                } catch (Throwable $ignored) {
                }
            }
            restore_error_handler();
            mysqli_report($oldReport);
        }
    }
}
