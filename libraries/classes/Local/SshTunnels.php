<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use Throwable;

/** One private OpenSSH master per capability; never attach by PID or TCP port. */
final class SshTunnels
{
    private $database;
    private $directory;
    public function __construct(ProfileDatabase $database)
    {
        $this->database = $database;
        $this->directory = Foundation::configuration()['data_dir'] . '/ssh';
        if (! file_exists($this->directory) && ! is_link($this->directory)) { @mkdir($this->directory, 0700); }
        clearstatcache(true, $this->directory);
        if (is_link($this->directory) || ! is_dir($this->directory) || realpath($this->directory) !== $this->directory
            || (fileperms($this->directory) & 0077) !== 0
            || (function_exists('posix_geteuid') && fileowner($this->directory) !== posix_geteuid())
            || strlen($this->directory) > 78) { throw new ConnectionFailure('ssh_prerequisite'); }
    }

    private static function binding(array $profile): array
    {
        return array_intersect_key($profile, array_flip(['host', 'port', 'username', 'database', 'tls', 'method', 'ssh', 'id', 'connection_revision']));
    }

    private function locked(callable $operation)
    {
        $path = $this->directory . '/lock';
        $mask = umask(0077);
        try {
            if (is_link($path)) { throw new ConnectionFailure('ssh_prerequisite'); }
            $file = @fopen($path, 'c+');
            if ($file === false) { throw new ConnectionFailure('ssh_prerequisite'); }
            Foundation::privateFile($path);
            if (! flock($file, LOCK_EX)) { fclose($file); throw new ConnectionFailure('ssh_prerequisite'); }
            try { return $operation(); }
            finally { flock($file, LOCK_UN); fclose($file); }
        } finally { umask($mask); }
    }

    private function path(string $id): string
    {
        if (preg_match('/^[a-f0-9]{64}$/D', $id) !== 1) { throw new ConnectionFailure('input'); }
        return $this->directory . '/' . $id . '.json';
    }

    private function read(string $id): ?array
    {
        $path = $this->path($id);
        if (! file_exists($path) && ! is_link($path) && ! file_exists($path . '.owner')) { return null; }
        if (file_exists($path) || is_link($path)) { Foundation::privateFile($path); }
        try { $entry = is_file($path) ? json_decode(file_get_contents($path), true, 32, JSON_THROW_ON_ERROR) : null; }
        catch (Throwable $error) { $entry = null; }
        $valid = function ($value) use ($id): bool {
            return is_array($value) && ($value['id'] ?? null) === $id
                && ($value['socket'] ?? null) === $this->directory . '/' . substr($id, 0, 16) . '.sock'
                && ($value['known'] ?? null) === $this->directory . '/' . $id . '.hosts'
                && is_int($value['port'] ?? null) && $value['port'] >= 1 && $value['port'] <= 65535
                && is_int($value['expires'] ?? null) && is_string($value['owner'] ?? null)
                && is_string($value['storage'] ?? null) && is_int($value['trust_revision'] ?? null)
                && is_array($value['profile'] ?? null);
        };
        $receiptPath = $path . '.owner';
        if (! file_exists($receiptPath) && ! is_link($receiptPath)) {
            // Never use a listener without its independent ownership receipt.
            if (! $valid($entry)) { throw new ConnectionFailure('tunnel_lost'); }
            $entry['expires'] = 0;
            return $entry;
        }
        Foundation::privateFile($receiptPath);
        try { $receipt = json_decode(file_get_contents($receiptPath), true, 32, JSON_THROW_ON_ERROR); }
        catch (Throwable $error) { throw new ConnectionFailure('tunnel_lost'); }
        if (! $valid($receipt)) { throw new ConnectionFailure('tunnel_lost'); }
        $binding = static function (array $value): array { unset($value['expires']); return $value; };
        if (! $valid($entry) || $binding($entry) !== $binding($receipt)) {
            // A changed port/target is corruption too, even when JSON still parses.
            $entry = $receipt;
            $entry['expires'] = 0;
        }
        return $entry;
    }

    private function write(array $entry): void
    {
        $path = $this->path($entry['id']); $temp = $path . '.tmp';
        if (is_file($temp) && ! is_link($temp)) { Foundation::privateFile($temp); unlink($temp); }
        if (is_link($temp)) { throw new ConnectionFailure('ssh_prerequisite'); }
        $file = @fopen($temp, 'x');
        if ($file === false) { throw new ConnectionFailure('ssh_prerequisite'); }
        try {
            $json = json_encode($entry, JSON_THROW_ON_ERROR);
            if (fwrite($file, $json) !== strlen($json) || ! fflush($file) || ! fsync($file)) { throw new ConnectionFailure('ssh_prerequisite'); }
        } finally { fclose($file); }
        if (! rename($temp, $path)) { throw new ConnectionFailure('ssh_prerequisite'); }
    }

    private function control(array $entry, string $operation): bool
    {
        clearstatcache(true, $entry['socket']);
        if (@filetype($entry['socket']) !== 'socket' || is_link($entry['socket'])
            || (fileperms($entry['socket']) & 0077) !== 0
            || (function_exists('posix_geteuid') && fileowner($entry['socket']) !== posix_geteuid())) { return false; }
        $result = SshProcess::run(['/usr/bin/ssh', '-F', '/dev/null', '-S', $entry['socket'], '-O', $operation, 'localhost'], 3);
        return $result['code'] === 0;
    }

    private function stop(array $entry): void
    {
        // Only issue exit after the private control protocol proves this master is alive.
        if ($this->control($entry, 'check')) {
            if (! $this->control($entry, 'exit')) { throw new ConnectionFailure('tunnel_lost'); }
        } elseif (@filetype($entry['socket']) === 'socket') {
            // A crashed master may leave its Unix socket inode. Only remove it after
            // the kernel confirms refusal, never merely because control check failed.
            $probe = @stream_socket_client('unix://' . $entry['socket'], $errno, $message, 1);
            if (is_resource($probe)) { fclose($probe); throw new ConnectionFailure('tunnel_lost'); }
            if (! in_array($errno, [61, 111], true) || is_link($entry['socket'])
                || (fileperms($entry['socket']) & 0077) !== 0
                || (function_exists('posix_geteuid') && fileowner($entry['socket']) !== posix_geteuid())) {
                throw new ConnectionFailure('tunnel_lost');
            }
            unlink($entry['socket']);
        }
        foreach ([$entry['known'], $this->path($entry['id']) . '.owner', $this->path($entry['id'])] as $path) {
            if (is_file($path) && ! is_link($path)) { unlink($path); }
        }
    }

    public function start(array $profile, string $id): array
    {
        if ($profile['tls']['enabled']) { throw new ConnectionFailure('tls_tunnel'); }
        try { return $this->locked(function () use ($profile, $id): array {
            if ($this->read($id) !== null) { throw new ConnectionFailure('tunnel_lost'); }
            $trust = (new SshTrust($this->database))->require($profile);
            $ssh = $profile['ssh'];
            $entry = ['id' => $id, 'owner' => hash('sha256', session_id()), 'storage' => $this->database->identity(),
                'profile' => self::binding($profile), 'trust_revision' => (int) $trust['revision'], 'expires' => time() + 1440,
                'socket' => $this->directory . '/' . substr($id, 0, 16) . '.sock',
                'known' => $this->directory . '/' . $id . '.hosts', 'port' => 1];
            if (file_exists($entry['socket']) || is_link($entry['socket'])) { throw new ConnectionFailure('tunnel_lost'); }
            $known = @fopen($entry['known'], 'x');
            if ($known === false) { throw new ConnectionFailure('ssh_prerequisite'); }
            $host = '[' . $ssh['host'] . ']:' . $ssh['port'];
            try { fwrite($known, $host . ' ' . $trust['algorithm'] . ' ' . $trust['public_key'] . "\n"); fflush($known); fsync($known); }
            finally { fclose($known); }
            try {
                for ($attempt = 0; $attempt < 3; $attempt++) {
                    $listener = @stream_socket_server('tcp://127.0.0.1:0', $errno, $message);
                    if ($listener === false) { throw new ConnectionFailure('forwarding'); }
                    $entry['port'] = (int) substr(strrchr(stream_socket_get_name($listener, false), ':'), 1);
                    fclose($listener);
                    // Persist ownership before launching, so interrupted requests remain sweepable.
                    $this->write($entry);
                    $receipt = $this->path($id) . '.owner';
                    if (file_exists($receipt) && ! is_link($receipt)) { unlink($receipt); }
                    $ownership = @fopen($receipt, 'x');
                    if ($ownership === false) { throw new ConnectionFailure('ssh_prerequisite'); }
                    try { fwrite($ownership, json_encode($entry, JSON_THROW_ON_ERROR)); fflush($ownership); fsync($ownership); }
                    finally { fclose($ownership); }
                    $target = strpos($profile['host'], ':') === false ? $profile['host'] : '[' . $profile['host'] . ']';
                    $arguments = ['/usr/bin/ssh', '-F', '/dev/null', '-f', '-N', '-M', '-n', '-T', '-a', '-x',
                        '-S', $entry['socket'], '-i', $ssh['key'], '-p', (string) $ssh['port'], '-l', $ssh['username'],
                        '-L', '127.0.0.1:' . $entry['port'] . ':' . $target . ':' . $profile['port']];
                    foreach (['BatchMode=yes', 'PasswordAuthentication=no', 'KbdInteractiveAuthentication=no',
                        'PreferredAuthentications=publickey', 'IdentitiesOnly=yes', 'StrictHostKeyChecking=yes',
                        'UserKnownHostsFile="' . str_replace(['\\', '"', '%'], ['\\\\', '\"', '%%'], $entry['known']) . '"', 'GlobalKnownHostsFile=/dev/null', 'UpdateHostKeys=no',
                        'HostKeyAlias=' . $host, 'ExitOnForwardFailure=yes', 'ConnectTimeout=10', 'ConnectionAttempts=1',
                        'ServerAliveInterval=30', 'ServerAliveCountMax=2', 'ControlPersist=no',
                        'ForwardAgent=no', 'PermitLocalCommand=no', 'LogLevel=ERROR'] as $option) {
                        $arguments[] = '-o'; $arguments[] = $option;
                    }
                    $arguments[] = $ssh['host'];
                    $result = SshProcess::run($arguments);
                    if ($result['code'] === 0 && $this->control($entry, 'check')) { return $entry; }
                    if (preg_match('/REMOTE HOST IDENTIFICATION HAS CHANGED|Host key verification failed/i', $result['err'])) { throw new ConnectionFailure('ssh_changed'); }
                    if (stripos($result['err'], 'Address already in use') !== false) { continue; }
                    if (stripos($result['err'], 'timed out') !== false) { throw new ConnectionFailure('ssh_timeout'); }
                    if (preg_match('/Permission denied|Load key|sign_and_send_pubkey/i', $result['err'])) { throw new ConnectionFailure('ssh_authentication'); }
                    throw new ConnectionFailure('forwarding');
                }
                throw new ConnectionFailure('forwarding');
            } catch (Throwable $error) {
                $this->stop($entry);
                throw $error;
            }
        }); } catch (ConnectionFailure $error) {
            // Revoke after releasing the registry lock; revocation itself takes that lock.
            if ($error->category() === 'ssh_changed') { (new SshTrust($this->database))->blockChanged($profile['ssh']); }
            throw $error;
        }
    }

    public function resolve(array $profile, string $id): array
    {
        return $this->locked(function () use ($profile, $id): array {
            $entry = $this->read($id);
            $trust = (new SshTrust($this->database))->require($profile);
            if ($entry === null || $entry['owner'] !== hash('sha256', session_id())
                || $entry['storage'] !== $this->database->identity() || $entry['expires'] <= time()
                || $entry['profile'] !== self::binding($profile) || $entry['trust_revision'] !== (int) $trust['revision']
                || ! $this->control($entry, 'check')) {
                if ($entry !== null) { $this->stop($entry); }
                throw new ConnectionFailure('tunnel_lost');
            }
            $entry['expires'] = time() + 1440; $this->write($entry);
            return $entry;
        });
    }

    public function close(string $id): void
    {
        $this->locked(function () use ($id): void { $entry = $this->read($id); if ($entry !== null) { $this->stop($entry); } });
    }

    public function sweep(?string $profileId = null, ?string $owner = null): void
    {
        $this->locked(function () use ($profileId, $owner): void {
            $paths = array_unique(array_merge(glob($this->directory . '/*.json'), array_map(static function ($path) { return substr($path, 0, -6); }, glob($this->directory . '/*.json.owner'))));
            foreach ($paths as $path) {
                $id = basename($path, '.json');
                $entry = $this->read($id);
                $current = isset($entry['profile']['id']) ? (new ProfileRepository($this->database))->detail($entry['profile']['id']) : null;
                $trust = $current !== null && $current['method'] === 'ssh' ? (new SshTrust($this->database))->get($current['ssh']) : null;
                if ($entry['expires'] <= time() || $entry['storage'] !== $this->database->identity()
                    || (isset($entry['profile']['id']) && ($current === null || $current['connection_revision'] !== $entry['profile']['connection_revision']
                        || (int) ($trust['revision'] ?? 0) !== $entry['trust_revision']))
                    || ($profileId !== null && ($entry['profile']['id'] ?? null) === $profileId)
                    || ($owner !== null && $entry['owner'] === $owner)) { $this->stop($entry); }
            }
        });
    }
}
