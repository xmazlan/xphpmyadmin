<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PDO;

/** Public host keys are metadata; private identities are never copied into the store. */
final class SshTrust
{
    private $database;
    public function __construct(ProfileDatabase $database) { $this->database = $database; }

    public function get(array $ssh): ?array
    {
        $rows = $this->database->rows('SELECT * FROM ssh_trust WHERE host=:host AND port=:port', [':host' => $ssh['host'], ':port' => $ssh['port']]);
        return $rows[0] ?? null;
    }

    public function require(array $profile): array
    {
        $trust = $this->get($profile['ssh']);
        if ($trust === null) { throw new ConnectionFailure('ssh_unknown'); }
        if ((int) $trust['blocked'] !== 0) { throw new ConnectionFailure('ssh_changed'); }
        return $trust;
    }

    public function blockChanged(array $ssh): void
    {
        $old = $this->get($ssh);
        if ($old === null || (int) $old['blocked'] !== 0) { return; }
        $this->database->transaction(function (PDO $pdo) use ($ssh): void {
            $statement = $pdo->prepare('UPDATE ssh_trust SET blocked=1,revision=revision+1 WHERE host=:host AND port=:port AND blocked=0');
            $statement->execute([':host'=>$ssh['host'], ':port'=>$ssh['port']]);
        });
        foreach ((new ProfileRepository($this->database))->list() as $affected) {
            if ($affected['method'] === 'ssh' && $affected['ssh']['host'] === $ssh['host'] && $affected['ssh']['port'] === $ssh['port']) {
                ConnectionContexts::revokeProfile($affected['id']);
            }
        }
    }

    public function inspect(array $profile): array
    {
        if ($profile['method'] !== 'ssh') { throw new ConnectionFailure('input'); }
        $ssh = $profile['ssh'];
        $result = SshProcess::run(['/usr/bin/ssh-keyscan', '-T', '10', '-p', (string) $ssh['port'], '-t', 'ed25519,ecdsa,rsa', $ssh['host']]);
        $old = $this->get($ssh);
        $candidates = [];
        foreach (explode("\n", $result['out']) as $line) {
            $parts = preg_split('/\s+/', trim($line));
            if (count($parts) !== 3 || ! in_array($parts[1], ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ssh-rsa'], true)) { continue; }
            $binary = base64_decode($parts[2], true);
            if ($binary === false || strlen($binary) < 32 || strlen($binary) > 16384) { continue; }
            $candidates[$parts[1]] = ['algorithm' => $parts[1], 'public_key' => $parts[2],
                'fingerprint' => 'SHA256:' . rtrim(base64_encode(hash('sha256', $binary, true)), '=')];

        }
        $candidate = null;
        foreach (array_unique([$old['algorithm'] ?? 'ssh-ed25519', 'ssh-ed25519', 'ecdsa-sha2-nistp256', 'ssh-rsa']) as $algorithm) {
            if (isset($candidates[$algorithm])) { $candidate = $candidates[$algorithm]; break; }
        }
        if ($candidate === null) { throw new ConnectionFailure('ssh_timeout'); }
        if ($old !== null && $old['fingerprint'] !== $candidate['fingerprint'] && (int) $old['blocked'] === 0) {
            $this->database->transaction(function (PDO $pdo) use ($ssh): void {
                $statement = $pdo->prepare('UPDATE ssh_trust SET blocked=1, revision=revision+1 WHERE host=:host AND port=:port');
                $statement->execute([':host' => $ssh['host'], ':port' => $ssh['port']]);
            });
            foreach ((new ProfileRepository($this->database))->list() as $affected) {
                if ($affected['method'] === 'ssh' && $affected['ssh']['host'] === $ssh['host'] && $affected['ssh']['port'] === $ssh['port']) { ConnectionContexts::revokeProfile($affected['id']); }
            }
            $old = $this->get($ssh);
        }
        $nonce = bin2hex(random_bytes(32));
        $_SESSION[' xpma_ssh_candidate '] = ['nonce' => $nonce, 'profile' => $profile['id'],
            'revision' => $profile['connection_revision'], 'ssh' => $ssh, 'candidate' => $candidate,
            'old_revision' => (int) ($old['revision'] ?? 0), 'expires' => time() + 300];
        return ['ok' => true, 'candidate' => ['nonce' => $nonce, 'host' => $ssh['host'], 'port' => $ssh['port'],
            'algorithm' => $candidate['algorithm'], 'fingerprint' => $candidate['fingerprint'],
            'old_fingerprint' => $old['fingerprint'] ?? null,
            'status' => $old === null ? 'unknown' : ($old['fingerprint'] === $candidate['fingerprint'] && (int) $old['blocked'] === 0 ? 'trusted' : 'changed')]];
    }

    public function approve(array $profile, string $nonce, bool $replace): array
    {
        $pending = $_SESSION[' xpma_ssh_candidate '] ?? null;
        unset($_SESSION[' xpma_ssh_candidate ']);
        if (! is_array($pending) || ! hash_equals($pending['nonce'], $nonce) || $pending['expires'] <= time()
            || $pending['profile'] !== $profile['id'] || $pending['revision'] !== $profile['connection_revision']
            || $pending['ssh'] !== $profile['ssh']) { throw new ConnectionFailure('reconnect'); }
        return $this->database->transaction(function (PDO $pdo) use ($profile, $pending, $replace): array {
            $old = $this->get($profile['ssh']);
            if ((int) ($old['revision'] ?? 0) !== $pending['old_revision']) { throw new ConnectionFailure('reconnect'); }
            $candidate = $pending['candidate'];
            if ($old !== null && ($old['fingerprint'] !== $candidate['fingerprint'] || (int) $old['blocked'] !== 0) && ! $replace) { throw new ConnectionFailure('ssh_changed'); }
            if ($old !== null && $old['fingerprint'] === $candidate['fingerprint'] && (int) $old['blocked'] === 0) { return ['ok' => true]; }
            $statement = $pdo->prepare('INSERT INTO ssh_trust(host,port,algorithm,public_key,fingerprint,revision)
                VALUES(:host,:port,:algorithm,:key,:fingerprint,:revision)
                ON CONFLICT(host,port) DO UPDATE SET algorithm=excluded.algorithm,public_key=excluded.public_key,fingerprint=excluded.fingerprint,revision=excluded.revision,blocked=0');
            $statement->execute([':host' => $profile['ssh']['host'], ':port' => $profile['ssh']['port'],
                ':algorithm' => $candidate['algorithm'], ':key' => $candidate['public_key'],
                ':fingerprint' => $candidate['fingerprint'], ':revision' => $pending['old_revision'] + 1]);
            foreach ((new ProfileRepository($this->database))->list() as $affected) {
                if ($affected['method'] === 'ssh' && $affected['ssh']['host'] === $profile['ssh']['host'] && $affected['ssh']['port'] === $profile['ssh']['port']) {
                    ConnectionContexts::revokeProfile($affected['id']);
                }
            }
            return ['ok' => true];
        });
    }
}
