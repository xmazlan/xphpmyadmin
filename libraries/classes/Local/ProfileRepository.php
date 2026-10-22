<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use PDO;
use RuntimeException;

final class ProfileRepository
{
    private const SELECT = 'SELECT p.id, p.name, p.host, p.port, p.username, p.database_name,
        p.environment, p.tls_enabled, p.tls_verify, p.tls_ca, p.tls_cert, p.tls_key,
        p.favorite, p.created_at, p.updated_at, p.last_used_at, p.connection_revision,
        EXISTS(SELECT 1 FROM profile_secrets s WHERE s.profile_id = p.id) AS has_saved_password,
        i.origin FROM profiles p LEFT JOIN profile_imports i ON i.profile_id = p.id';
    private const CONNECTION_FIELDS = ['host', 'port', 'username', 'database', 'tls'];
    private $database;

    public function __construct(ProfileDatabase $database)
    {
        $this->database = $database;
    }

    public static function now(): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.u\Z');
    }

    private static function id(string $id): void
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D', $id) !== 1) {
            throw new InvalidArgumentException('Invalid profile ID.');
        }
    }

    private static function newId(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 15) | 64);
        $bytes[8] = chr((ord($bytes[8]) & 63) | 128);
        $hex = bin2hex($bytes);

        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
            . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
    }

    private static function hydrate(array $row): array
    {
        // Explicit projection: secret material must never leak through list/detail.
        return [
            'id' => $row['id'], 'name' => $row['name'], 'host' => $row['host'],
            'port' => (int) $row['port'], 'username' => $row['username'],
            'database' => $row['database_name'], 'environment' => $row['environment'],
            'tls' => ['enabled' => (bool) $row['tls_enabled'], 'verify' => (bool) $row['tls_verify'],
                'ca' => $row['tls_ca'], 'cert' => $row['tls_cert'], 'key' => $row['tls_key']],
            'favorite' => (bool) $row['favorite'], 'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'], 'last_used_at' => $row['last_used_at'],
            'connection_revision' => (int) $row['connection_revision'], 'origin' => $row['origin'],
            'has_saved_password' => (bool) $row['has_saved_password'],
        ];
    }

    private static function parameters(array $input): array
    {
        return [
            ':name' => $input['name'], ':host' => $input['host'], ':port' => $input['port'],
            ':username' => $input['username'], ':database_name' => $input['database'],
            ':environment' => $input['environment'], ':tls_enabled' => (int) $input['tls']['enabled'],
            ':tls_verify' => (int) $input['tls']['verify'], ':tls_ca' => $input['tls']['ca'],
            ':tls_cert' => $input['tls']['cert'], ':tls_key' => $input['tls']['key'],
            ':favorite' => (int) $input['favorite'],
        ];
    }

    public function detail(string $id): ?array
    {
        self::id($id);
        $rows = $this->database->rows(self::SELECT . ' WHERE p.id = :id', [':id' => $id]);

        return $rows === [] ? null : self::hydrate($rows[0]);
    }

    private function requireProfile(string $id): array
    {
        $profile = $this->detail($id);
        if ($profile === null) {
            throw new RuntimeException('Profile not found.');
        }

        return $profile;
    }

    public function list(string $search = '', bool $favoritesOnly = false, string $order = 'recent'): array
    {
        if (strlen($search) > 512 || preg_match('//u', $search) !== 1) {
            throw new InvalidArgumentException('Invalid profile search.');
        }
        $orders = [
            'recent' => '(p.last_used_at IS NULL) ASC, p.last_used_at DESC, p.created_at ASC, p.id ASC',
            'name' => 'p.name COLLATE NOCASE ASC, p.id ASC',
        ];
        if (! isset($orders[$order])) {
            throw new InvalidArgumentException('Invalid profile sort order.');
        }
        $sql = self::SELECT . ' WHERE 1 = 1';
        $parameters = [];
        if ($search !== '') {
            $sql .= " AND (p.name LIKE :search ESCAPE '\' OR p.host LIKE :search ESCAPE '\'
                OR p.username LIKE :search ESCAPE '\')";
            $parameters[':search'] = '%' . strtr($search, ['\\' => '\\\\', '%' => '\\%', '_' => '\\_']) . '%';
        }
        if ($favoritesOnly) {
            $sql .= ' AND p.favorite = 1';
        }

        return array_map([self::class, 'hydrate'], $this->database->rows($sql . ' ORDER BY ' . $orders[$order], $parameters));
    }

    public function create(
        #[\SensitiveParameter]
        array $input
    ): array
    {
        $input = ProfileInput::validate($input);

        return $this->database->transaction(function (PDO $pdo) use ($input): array {
            $id = self::newId();
            $now = self::now();
            $parameters = self::parameters($input) + [':id' => $id, ':created_at' => $now, ':updated_at' => $now];
            $statement = $pdo->prepare('INSERT INTO profiles
                (id, name, host, port, username, database_name, environment,
                tls_enabled, tls_verify, tls_ca, tls_cert, tls_key, favorite, created_at, updated_at)
                VALUES (:id, :name, :host, :port, :username, :database_name, :environment,
                :tls_enabled, :tls_verify, :tls_ca, :tls_cert, :tls_key, :favorite, :created_at, :updated_at)');
            $statement->execute($parameters);

            return $this->requireProfile($id);
        });
    }

    /** Partial update; omitted fields are preserved. Explicit null clears optional fields. */
    public function update(
        string $id,
        #[\SensitiveParameter]
        array $patch
    ): array
    {
        self::id($id);
        if (array_diff(array_keys($patch), ProfileInput::FIELDS) !== []) {
            throw new InvalidArgumentException('Unsupported profile field. Passwords are not metadata.');
        }

        return $this->database->transaction(function (PDO $pdo) use ($id, $patch): array {
            $old = $this->requireProfile($id);
            $editable = array_intersect_key($old, array_flip(ProfileInput::FIELDS));
            if (isset($patch['tls']) && is_array($patch['tls'])) {
                $patch['tls'] = array_replace($old['tls'], $patch['tls']);
            }
            $input = ProfileInput::validate(array_replace($editable, $patch));
            if ($input === $editable) {
                return $old;
            }
            $revision = $old['connection_revision'];
            foreach (self::CONNECTION_FIELDS as $field) {
                if ($input[$field] !== $old[$field]) {
                    $revision++;
                    break;
                }
            }
            $statement = $pdo->prepare('UPDATE profiles SET name=:name, host=:host, port=:port,
                username=:username, database_name=:database_name, environment=:environment,
                tls_enabled=:tls_enabled, tls_verify=:tls_verify, tls_ca=:tls_ca, tls_cert=:tls_cert,
                tls_key=:tls_key, favorite=:favorite, updated_at=:updated_at,
                connection_revision=:revision WHERE id=:id');
            $statement->execute(self::parameters($input) + [
                ':updated_at' => self::now(), ':revision' => $revision, ':id' => $id,
            ]);

            return $this->requireProfile($id);
        });
    }

    public function favorite(string $id, bool $favorite): array
    {
        return $this->update($id, ['favorite' => $favorite]);
    }

    /** Only the future successful Connect flow may call this; Test/failure must never call it. */
    public function recordConnectSuccess(string $id, int $expectedRevision): array
    {
        return $this->database->transaction(function (PDO $pdo) use ($id, $expectedRevision): array {
            $profile = $this->requireProfile($id);
            if ($expectedRevision < 1 || $profile['connection_revision'] !== $expectedRevision) {
                throw new RuntimeException('Profile connection parameters changed; reconnect using the current revision.');
            }
            $statement = $pdo->prepare('UPDATE profiles SET last_used_at=:used WHERE id=:id');
            $statement->execute([':used' => self::now(), ':id' => $id]);

            return $this->requireProfile($id);
        });
    }

    public function delete(string $id): void
    {
        self::id($id);
        $this->database->transaction(function (PDO $pdo) use ($id): void {
            $this->requireProfile($id);
            // profile_secrets cascades on this same SQLite connection.
            $statement = $pdo->prepare('DELETE FROM profiles WHERE id=:id');
            $statement->execute([':id' => $id]);
            // profile_imports keeps the origin with profile_id=NULL: deletion is never auto-reimported.
        });
    }
}
