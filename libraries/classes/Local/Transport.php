<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

/** Logical profile stays intact; managed endpoints are request-local capabilities. */
final class Transport
{
    public static function open(array $profile, #[\SensitiveParameter] string $password, ?string $context = null, bool $create = false, ?int $timeout = null, ?ConnectionDiagnostics $diagnostics = null): VerifiedConnection
    {
        $diagnostics = $diagnostics ?? new ConnectionDiagnostics();
        if (($profile['method'] ?? 'direct') === 'direct') {
            return $diagnostics->run('mysql_tls_authentication_initial_database', static function () use ($profile, $password, $timeout) { return (new MySqlConnector())->open(array_intersect_key($profile, array_flip(ProfileInput::FIELDS)), $password, $timeout); });
        }
        $database = ProfileDatabase::openExistingConfigured();
        $diagnostics->run('ssh_trust', static function () use ($database, $profile) { return (new SshTrust($database))->require($profile); });
        $tunnels = null;
        $temporary = $context === null;
        $context = $context ?? bin2hex(random_bytes(32));
        try {
            $entry = $diagnostics->run('ssh_authentication_forwarding', static function () use ($create, $temporary, &$tunnels, $database, $profile, $context) { $tunnels = new SshTunnels($database); return $create || $temporary ? $tunnels->start($profile, $context) : $tunnels->resolve($profile, $context); });
            $endpoint = array_intersect_key($profile, array_flip(ProfileInput::FIELDS));
            $endpoint['method'] = 'direct'; $endpoint['ssh'] = null;
            $endpoint['host'] = '127.0.0.1'; $endpoint['port'] = $entry['port'];
            return $diagnostics->run('mysql_tls_authentication_initial_database', static function () use ($endpoint, $password, $timeout) { return (new MySqlConnector())->open($endpoint, $password, $timeout); });
        } finally {
            // MySQL validation consumes the temporary tunnel synchronously. Test owns no later queries.
            if ($temporary && $tunnels !== null) { $tunnels->close($context); }
        }
    }
}
