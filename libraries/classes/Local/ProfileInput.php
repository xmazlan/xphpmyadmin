<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;

final class ProfileInput
{
    public const FIELDS = ['name', 'host', 'port', 'username', 'database', 'environment', 'tls', 'favorite', 'method', 'ssh'];

    private static function text($value, string $field, int $limit, bool $nullable = false): ?string
    {
        if ($nullable && ($value === null || $value === '')) {
            return null;
        }
        if (! is_string($value) || strlen($value) > $limit || preg_match('//u', $value) !== 1
            || preg_match('/[\x00-\x1f\x7f]/', $value)) {
            throw new InvalidArgumentException('Invalid profile field: ' . $field . '.');
        }
        $value = trim($value);
        if ($value === '') {
            if ($nullable) {
                return null;
            }
            throw new InvalidArgumentException('Required profile field: ' . $field . '.');
        }

        return $value;
    }

    private static function flag($value, string $field): bool
    {
        if (! is_bool($value)) {
            throw new InvalidArgumentException('Profile field must be boolean: ' . $field . '.');
        }

        return $value;
    }

    public static function validate(
        #[\SensitiveParameter]
        array $input
    ): array
    {
        if (array_diff(array_keys($input), self::FIELDS) !== []) {
            throw new InvalidArgumentException('Unsupported profile field. Passwords are not metadata.');
        }
        $result = [];
        $result['name'] = self::text($input['name'] ?? null, 'name', 255);
        $host = self::text($input['host'] ?? null, 'host', 253);
        $dns = rtrim($host, '.');
        if (filter_var($host, FILTER_VALIDATE_IP) === false
            && (preg_match('/^[0-9.]+$/D', $host)
                || preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/iD', $dns) !== 1)) {
            throw new InvalidArgumentException('Host must be an IP address or hostname, without URL, port or commands.');
        }
        $result['host'] = $host;
        $port = array_key_exists('port', $input) ? $input['port'] : 3306;
        if (! is_int($port) || $port < 1 || $port > 65535) {
            throw new InvalidArgumentException('Port must be an integer between 1 and 65535.');
        }
        $result['port'] = $port;
        $result['username'] = self::text($input['username'] ?? null, 'username', 128);
        $result['database'] = self::text($input['database'] ?? null, 'database', 64, true);
        $environment = array_key_exists('environment', $input) ? $input['environment'] : 'Other';
        if (! in_array($environment, ['Local', 'Staging', 'Production', 'Other'], true)) {
            throw new InvalidArgumentException('Invalid profile environment.');
        }
        $result['environment'] = $environment;
        $tls = array_key_exists('tls', $input) ? $input['tls'] : [];
        if (! is_array($tls) || array_diff(array_keys($tls), ['enabled', 'verify', 'ca', 'cert', 'key']) !== []) {
            throw new InvalidArgumentException('Invalid TLS metadata.');
        }
        $result['tls'] = [
            'enabled' => self::flag(array_key_exists('enabled', $tls) ? $tls['enabled'] : true, 'tls.enabled'),
            'verify' => self::flag(array_key_exists('verify', $tls) ? $tls['verify'] : true, 'tls.verify'),
        ];
        if (! $result['tls']['verify']) {
            throw new InvalidArgumentException('TLS certificate verification must remain enabled.');
        }
        foreach (['ca', 'cert', 'key'] as $field) {
            $path = self::text($tls[$field] ?? null, 'tls.' . $field, 4096, true);
            if ($path !== null && $path[0] !== '/') {
                throw new InvalidArgumentException('TLS file references must be absolute local paths.');
            }
            $result['tls'][$field] = $path;
        }
        if (($result['tls']['cert'] === null) !== ($result['tls']['key'] === null)) {
            throw new InvalidArgumentException('TLS client certificate and key must be specified together.');
        }
        $method = $input['method'] ?? 'direct';
        if (! in_array($method, ['direct', 'ssh'], true)) {
            throw new InvalidArgumentException('Invalid connection method.');
        }
        $result['method'] = $method;
        $result['ssh'] = null;
        if ($method === 'ssh') {
            $ssh = $input['ssh'] ?? null;
            if (! is_array($ssh) || array_diff(array_keys($ssh), ['host', 'port', 'username', 'key']) !== []) {
                throw new InvalidArgumentException('Invalid SSH metadata.');
            }
            $sshHost = self::text($ssh['host'] ?? null, 'ssh.host', 253);
            if (filter_var($sshHost, FILTER_VALIDATE_IP) === false
                && preg_match('/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/iD', $sshHost) !== 1) {
                throw new InvalidArgumentException('Invalid SSH hostname.');
            }
            $sshUser = self::text($ssh['username'] ?? null, 'ssh.username', 128);
            if (preg_match('/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/D', $sshUser) !== 1) {
                throw new InvalidArgumentException('Invalid SSH username.');
            }
            $sshPort = $ssh['port'] ?? 22;
            if (! is_int($sshPort) || $sshPort < 1 || $sshPort > 65535) {
                throw new InvalidArgumentException('Invalid SSH port.');
            }
            $key = self::text($ssh['key'] ?? null, 'ssh.key', 4096);
            clearstatcache(true, $key);
            if (strpos($key, '%') !== false || $key[0] !== '/' || is_link($key) || ! is_file($key) || ! is_readable($key)
                || (fileperms($key) & 0077) !== 0
                || (function_exists('posix_geteuid') && fileowner($key) !== posix_geteuid())) {
                throw new InvalidArgumentException('SSH key must be a readable private local file.');
            }
            $result['ssh'] = ['host' => strtolower($sshHost), 'port' => $sshPort, 'username' => $sshUser, 'key' => $key];
        } elseif (($input['ssh'] ?? null) !== null) {
            throw new InvalidArgumentException('Direct profiles cannot contain SSH options.');
        }
        $result['favorite'] = self::flag(array_key_exists('favorite', $input) ? $input['favorite'] : false, 'favorite');

        return $result;
    }
}
