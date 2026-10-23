<?php

declare(strict_types=1);
namespace PhpMyAdmin\Local {
    // Force real bind collisions while production still uses its normal allocator.
    function stream_socket_get_name($socket, bool $remote) {
        if (($GLOBALS['fixture_collisions'] ?? 0) > 0) {
            $GLOBALS['fixture_collisions']--;
            return '127.0.0.1:' . $GLOBALS['fixture_occupied_port'];
        }
        return \stream_socket_get_name($socket, $remote);
    }
}
namespace {
require dirname(__DIR__, 2) . '/vendor/autoload.php';
use PhpMyAdmin\Local\{ProfileDatabase, ProfileRepository, SshTrust, SshTunnels, ConnectionFailure, ProfileInput, Foundation};
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
session_start();
$count = 0;
function check(bool $ok, string $label): void { global $count; if (! $ok) { throw new RuntimeException($label); } $count++; }
function fails(string $category, callable $operation): void {
    try { $operation(); } catch (ConnectionFailure $error) { check($error->category() === $category, 'category ' . $category . ' received ' . $error->category()); return; }
    throw new RuntimeException('Missing failure ' . $category);
}
$db = ProfileDatabase::openConfigured(); $profiles = new ProfileRepository($db);
$profile = $profiles->create(['name' => 'synthetic SSH', 'host' => '127.0.0.1', 'port' => 9, 'username' => 'synthetic',
    'tls' => ['enabled' => false], 'method' => 'ssh', 'ssh' => ['host' => '127.0.0.1', 'port' => (int) getenv('XPM_SSH_PORT'),
    'username' => getenv('XPM_SSH_USER'), 'key' => getenv('XPM_SSH_KEY')]]);
$trust = new SshTrust($db); $tunnels = new SshTunnels($db); $ids = [];
try {
    fails('ssh_unknown', function () use ($trust, $profile) { $trust->require($profile); });
    $candidate = $trust->inspect($profile)['candidate'];
    check($candidate['status'] === 'unknown' && strpos($candidate['fingerprint'], 'SHA256:') === 0, 'untrusted candidate');
    $trust->approve($profile, $candidate['nonce'], false);
    fails('reconnect', function () use ($trust, $profile, $candidate) { $trust->approve($profile, $candidate['nonce'], false); });
    check($trust->inspect($profile)['candidate']['status'] === 'trusted', 'explicit trust');
    for ($i = 0; $i < 2; $i++) {
        $id = bin2hex(random_bytes(32)); $ids[] = $id;
        $entry = $tunnels->start($profile, $id);
        check($entry['port'] > 0 && $tunnels->resolve($profile, $id)['port'] === $entry['port'], 'master resolves');
        $listeners = shell_exec('/usr/sbin/lsof -nP -iTCP:' . $entry['port'] . ' -sTCP:LISTEN 2>/dev/null');
        check(is_string($listeners) && strpos($listeners, '127.0.0.1:') !== false && strpos($listeners, '*:') === false, 'loopback-only listener');
    }
    $workers = [];
    for ($i = 0; $i < 2; $i++) {
        $id = bin2hex(random_bytes(32)); $ids[] = $id;
        $process = proc_open([PHP_BINARY, __DIR__ . '/ssh_worker.php', session_id(), $profile['id'], $id],
            [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['file', '/dev/null', 'w']], $pipes);
        $workers[] = [$process, $pipes[1], $id];
    }
    foreach ($workers as [$process, $pipe, $id]) {
        check(stream_get_contents($pipe) === 'ok', 'concurrent worker starts'); fclose($pipe);
        check(proc_close($process) === 0 && $tunnels->resolve($profile, $id)['port'] > 0, 'master survives worker exit');
    }
    check($tunnels->resolve($profile, $ids[0])['port'] !== $tunnels->resolve($profile, $ids[1])['port'], 'separate context listeners');
    $tunnels->close($ids[0]); $tunnels->close($ids[0]);
    fails('tunnel_lost', function () use ($tunnels, $profile, $ids) { $tunnels->resolve($profile, $ids[0]); });
    check($tunnels->resolve($profile, $ids[1])['port'] > 0, 'second context survives');
    $tunnels->sweep($profile['id']);
    check(glob(Foundation::configuration()['data_dir'] . '/ssh/*.json') === [], 'profile revoke cleanup');
    $id = bin2hex(random_bytes(32)); $ids[] = $id; $entry = $tunnels->start($profile, $id);
    $path = Foundation::configuration()['data_dir'] . '/ssh/' . $id . '.json';
    $entry['expires'] = time() - 1; file_put_contents($path, json_encode($entry));
    $tunnels->sweep(); check(! file_exists($path), 'expired lease swept');
    $id = bin2hex(random_bytes(32)); $ids[] = $id; $entry = $tunnels->start($profile, $id);
    $exit = \PhpMyAdmin\Local\SshProcess::run(['/usr/bin/ssh','-F','/dev/null','-S',$entry['socket'],'-O','exit','localhost']);
    usleep(100000);
    fails('tunnel_lost', function () use ($tunnels, $profile, $id) { $tunnels->resolve($profile, $id); });
    check(glob(Foundation::configuration()['data_dir'] . '/ssh/*.json') === [], 'dead master discarded without restart');
    $id = bin2hex(random_bytes(32)); $ids[] = $id; $entry = $tunnels->start($profile, $id);
    $master = \PhpMyAdmin\Local\SshProcess::run(['/usr/bin/ssh','-F','/dev/null','-S',$entry['socket'],'-O','check','localhost']);
    check(preg_match('/pid=([0-9]+)/', $master['err'], $pid) === 1, 'owned master protocol returns PID');
    posix_kill((int) $pid[1], 9); usleep(100000);
    fails('tunnel_lost', function () use ($tunnels, $profile, $id) { $tunnels->resolve($profile, $id); });
    check(! file_exists($entry['socket']), 'crashed master stale socket cleaned without PID-based cleanup');
    foreach (['broken', 'missing', 'wrong-port'] as $corruption) {
        $id = bin2hex(random_bytes(32)); $ids[] = $id; $entry = $tunnels->start($profile, $id);
        $path = Foundation::configuration()['data_dir'] . '/ssh/' . $id . '.json';
        if ($corruption === 'broken') { file_put_contents($path, '{broken'); } elseif ($corruption === 'missing') { unlink($path); } else { $entry['port'] = $entry['port'] === 3306 ? 3307 : 3306; file_put_contents($path, json_encode($entry)); }
        $tunnels->sweep(); check(! file_exists($path) && ! file_exists($path . '.owner'), 'ownership receipt recovers ' . $corruption . ' registry');
    }
    $draft = array_intersect_key($profile, array_flip(ProfileInput::FIELDS));
    foreach ([['host' => '-oProxyCommand=evil'], ['username' => '-root'], ['port' => '22'], ['key' => '/missing/private/key']] as $patch) {
        $invalid = $draft; $invalid['ssh'] = array_replace($invalid['ssh'], $patch);
        try { ProfileInput::validate($invalid); throw new RuntimeException('Invalid SSH input accepted'); }
        catch (\InvalidArgumentException $error) { check(true, 'invalid SSH parameters rejected'); }
    }
    chmod(getenv('XPM_SSH_KEY'), 0644);
    try { ProfileInput::validate($draft); throw new RuntimeException('Broad key permissions accepted'); }
    catch (\InvalidArgumentException $error) { check(true, 'private key permission requirement'); }
    finally { chmod(getenv('XPM_SSH_KEY'), 0600); }
    $occupied = stream_socket_server('tcp://127.0.0.1:0');
    $GLOBALS['fixture_occupied_port'] = (int) substr(strrchr(stream_socket_get_name($occupied, false), ':'), 1);
    $GLOBALS['fixture_collisions'] = 2;
    $id = bin2hex(random_bytes(32)); $ids[] = $id;
    $entry = $tunnels->start($profile, $id);
    check($GLOBALS['fixture_collisions'] === 0 && $entry['port'] !== $GLOBALS['fixture_occupied_port'], 'real bind collision retries twice then succeeds');
    $tunnels->close($id);
    $GLOBALS['fixture_collisions'] = 3;
    $id = bin2hex(random_bytes(32)); $ids[] = $id;
    fails('forwarding', function () use ($tunnels, $profile, $id) { $tunnels->start($profile, $id); });
    check($GLOBALS['fixture_collisions'] === 0, 'bind collision retry bounded to three');
    fclose($occupied);
    $id = bin2hex(random_bytes(32)); $ids[] = $id; $entry = $tunnels->start($profile, $id);
    $path = Foundation::configuration()['data_dir'] . '/ssh/' . $id . '.json';
    $entry['expires'] = time() - 1; file_put_contents($path, json_encode($entry));
    $process = proc_open([PHP_BINARY, dirname(__DIR__, 2) . '/scripts/local-ssh-sweep.php'],
        [0 => ['file','/dev/null','r'], 1 => ['pipe','w'], 2 => ['file','/dev/null','w']], $pipes);
    check(strpos(stream_get_contents($pipes[1]), 'complete') !== false, 'CLI sweep executed'); fclose($pipes[1]);
    check(proc_close($process) === 0 && ! file_exists($path), 'CLI sweep cleans expired master after request exit');
    $tls = $profile; $tls['tls']['enabled'] = true;
    fails('tls_tunnel', function () use ($tunnels, $tls) { $tunnels->start($tls, bin2hex(random_bytes(32))); });
    echo $count . " SSH process/trust checks passed using disposable system sshd.\n";
} finally { foreach ($ids as $id) { $tunnels->close($id); } session_destroy(); }

}
