<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PhpMyAdmin\Config;
use Throwable;

/** Request-local bridge. Never obtains a target from cookies, profile IDs, or last selected server. */
final class ProfileRequest
{
    private static $token;
    private static $contexts;
    private static $target;
    private static $connections = [];

    public static function token(): ?string
    {
        return self::$token;
    }

    public static function target(): ?array
    {
        return self::$target;
    }

    public static function bootstrap(Config $config, array $query, array $body): void
    {
        try {
            $enabled = Foundation::configuration()['profiles_enabled'];
            $hasContext = array_key_exists('xpma_context', $query) || array_key_exists('xpma_context', $body);
            if (! $enabled && ! $hasContext) {
                return;
            }
            if (! $enabled) {
                throw new \RuntimeException();
            }
            if (! $hasContext && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET'
                && ($query['route'] ?? '/') === '/' && array_diff(array_keys($query), ['route']) === []) {
                header('Location: local-connections.php', true, 303);
                exit;
            }
            $token = $body['xpma_context'] ?? $query['xpma_context'] ?? null;
            if (! is_string($token) || (isset($query['xpma_context'], $body['xpma_context']) && $query['xpma_context'] !== $body['xpma_context'])) {
                throw new \RuntimeException();
            }
            self::$contexts = new ConnectionContexts(ProfileDatabase::openExistingConfigured());
            $resolved = self::$contexts->resolve($token);
            // Validate the temporary credential before phpMyAdmin runs any database code.
            $profile = $resolved['profile'];
            $password = (new SessionPasswords())->get($token, $profile['id'], $profile['connection_revision']);
            if ($password === null) {
                self::$contexts->disconnect($token);
                throw new \RuntimeException();
            }
            sodium_memzero($password);
            header('Referrer-Policy: no-referrer');
            header('Cache-Control: no-store');
            self::$token = $token;
            self::$target = ConnectionContexts::identity($profile);
            // Fresh defaults; never inherit a legacy controluser, socket, storage DB or init command.
            $config->settings['Servers'] = [$resolved['server'] => [
                'host' => $profile['host'], 'port' => $profile['port'], 'user' => $profile['username'],
                'password' => '', 'auth_type' => 'config', 'verbose' => $profile['name'],
                'AllowNoPassword' => true, 'ssl' => $profile['tls']['enabled'],
                'ssl_verify' => true, 'ssl_ca' => $profile['tls']['ca'],
                'ssl_cert' => $profile['tls']['cert'], 'ssl_key' => $profile['tls']['key'],
            ]];
            $config->settings['ZeroConf'] = false;
            $config->settings['ServerDefault'] = $resolved['server'];
            $_REQUEST['server'] = (string) $resolved['server'];
        } catch (Throwable $error) {
            self::reject();
        }
    }

    public static function open(): \mysqli
    {
        try {
            $resolved = self::$contexts->resolve(self::$token);
            $profile = $resolved['profile'];
            $password = (new SessionPasswords())->get(self::$token, $profile['id'], $profile['connection_revision']);
            if ($password === null) {
                throw new \RuntimeException();
            }
            try {
                $connection = Transport::open($profile, $password, self::$token);
                self::$connections[] = $connection; // Keep ownership until request shutdown.
                return $connection->native();
            } finally {
                sodium_memzero($password);
            }
        } catch (Throwable $error) {
            self::reject();
        }
    }

    private static function reject(): void
    {
        http_response_code(409);
        header('Cache-Control: no-store');
        $token = $_POST['xpma_context'] ?? $_GET['xpma_context'] ?? '';
        $token = is_string($token) && preg_match('/^[a-f0-9]{64}$/D', $token) === 1 ? $token : '';
        $hint = ConnectionContexts::hint($token);
        $url = 'local-connections.php' . ($token === '' ? '' : '?xpma_context=' . rawurlencode($token));
        $message = 'Konteks koneksi tidak tersedia atau berubah. Hubungkan kembali melalui pengelola koneksi.';
        if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'text/html') !== false && empty($_REQUEST['ajax_request'])) {
            header('Content-Type: text/html; charset=utf-8');
            $name = htmlspecialchars($hint === null ? '' : $hint['name'] . ' — ' . $hint['host'] . ':' . $hint['port'], ENT_QUOTES, 'UTF-8');
            $link = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
            exit('<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
                . '<title>Hubungkan kembali · phpMyAdmin</title><link rel="stylesheet" href="themes/pmahomme/css/theme.css">'
                . '<main class="container p-4"><h1>Hubungkan kembali</h1><p>' . $name . '</p><p>' . $message . '</p>'
                . '<a class="btn btn-primary" href="' . $link . '">Buka Koneksi</a></main></html>');
        }
        header('Content-Type: application/json; charset=utf-8');
        exit(json_encode(['ok' => false, 'error' => ['category' => 'reconnect', 'message' => $message],
            'target' => $hint, 'connections_url' => $url]));
    }
}
