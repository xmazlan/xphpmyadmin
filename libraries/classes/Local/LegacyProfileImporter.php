<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;
use PhpMyAdmin\Config\Settings\Server;
use PDO;

final class LegacyProfileImporter
{
    private $database;
    private $profiles;

    public function __construct(ProfileDatabase $database, ProfileRepository $profiles)
    {
        $this->database = $database;
        $this->profiles = $profiles;
    }

    /** Accept the already-loaded $cfg['Servers']; never serialize or log the original configuration. */
    public function import(
        #[\SensitiveParameter]
        array $servers
    ): array
    {
        return $this->database->transaction(function (PDO $pdo) use ($servers): array {
            $counts = ['created' => 0, 'existing' => 0, 'skipped' => 0];
            foreach ($servers as $index => $server) {
                if (! is_int($index) || $index < 1 || ! is_array($server)) {
                    throw new InvalidArgumentException('Invalid legacy server configuration.');
                }
                $origin = 'legacy-config:server:' . $index;
                $statement = $pdo->prepare('SELECT origin FROM profile_imports WHERE origin=:origin');
                $statement->execute([':origin' => $origin]);
                if ($statement->fetchColumn() !== false) {
                    $counts['existing']++;
                    continue;
                }
                $host = $server['host'] ?? 'localhost';
                if (! is_string($host) || ! self::localHost($host)) {
                    $counts['skipped']++;
                    continue;
                }
                // The profile model has no Unix socket transport; do not silently change the target.
                if (! empty($server['socket']) || ($server['connect_type'] ?? 'tcp') === 'socket') {
                    throw new InvalidArgumentException('Legacy Unix socket connections require a supported TCP configuration before import.');
                }
                if (! empty($server['ssl']) && (! empty($server['ssl_ca_path']) || ! empty($server['ssl_ciphers']))) {
                    throw new InvalidArgumentException('Legacy TLS directory or cipher restrictions cannot be represented by this profile schema.');
                }
                // Match phpMyAdmin defaults without constructing a server object from credentials.
                $defaults = new Server();
                $port = $server['port'] ?? $defaults->port;
                if ($port === '') {
                    $port = 3306;
                } elseif (is_string($port) && preg_match('/^[0-9]{1,5}$/D', $port) === 1) {
                    $port = (int) $port;
                }
                $profile = $this->profiles->create([
                    'name' => ! empty($server['verbose']) ? $server['verbose'] : 'Local connection ' . $index,
                    'host' => $host, 'port' => $port, 'username' => $server['user'] ?? $defaults->user,
                    // only_db is an access restriction, not an initial database selection.
                    'database' => null, 'environment' => 'Local',
                    'tls' => ['enabled' => (bool) ($server['ssl'] ?? false),
                        'verify' => $server['ssl_verify'] ?? true, 'ca' => $server['ssl_ca'] ?? null,
                        'cert' => $server['ssl_cert'] ?? null, 'key' => $server['ssl_key'] ?? null],
                ]);
                $statement = $pdo->prepare('INSERT INTO profile_imports (origin, profile_id, imported_at)
                    VALUES (:origin, :profile_id, :imported_at)');
                $statement->execute([':origin' => $origin, ':profile_id' => $profile['id'],
                    ':imported_at' => ProfileRepository::now()]);
                $counts['created']++;
            }

            return $counts;
        });
    }

    private static function localHost(string $host): bool
    {
        if (strtolower(rtrim($host, '.')) === 'localhost') {
            return true;
        }
        $packed = @inet_pton($host);

        return $packed !== false && ((strlen($packed) === 4 && ord($packed[0]) === 127)
            || $packed === inet_pton('::1'));
    }
}
