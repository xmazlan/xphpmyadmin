<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';
use PhpMyAdmin\Local\{ProfileDatabase, ProfileRepository, SshTrust, ConnectionFailure};
session_start();
$database = ProfileDatabase::openExistingConfigured();
$profile = array_values(array_filter((new ProfileRepository($database))->list(), static function ($p) { return $p['method'] === 'ssh'; }))[0];
$trust = new SshTrust($database);
$tunnels = new \PhpMyAdmin\Local\SshTunnels($database);
try { $tunnels->start($profile, bin2hex(random_bytes(32))); throw new RuntimeException('Strict host-key checking accepted changed key'); }
catch (ConnectionFailure $error) { if ($error->category() !== 'ssh_changed') { throw $error; } }
if ((int) $trust->get($profile['ssh'])['blocked'] !== 1) { throw new RuntimeException('OpenSSH-detected key change did not revoke trust'); }
$candidate = $trust->inspect($profile)['candidate'];
if ($candidate['status'] !== 'changed' || $candidate['old_fingerprint'] === $candidate['fingerprint']) { throw new RuntimeException('Changed key was not detected'); }
try { $trust->require($profile); throw new RuntimeException('Changed trust accepted'); }
catch (ConnectionFailure $error) { if ($error->category() !== 'ssh_changed') { throw $error; } }
try { $trust->approve($profile, $candidate['nonce'], false); throw new RuntimeException('Replacement action required'); }
catch (ConnectionFailure $error) { if ($error->category() !== 'ssh_changed') { throw $error; } }
$candidate = $trust->inspect($profile)['candidate'];
$trust->approve($profile, $candidate['nonce'], true);
if ($trust->inspect($profile)['candidate']['status'] !== 'trusted') { throw new RuntimeException('Explicit replacement failed'); }
session_destroy();
echo "Changed SSH key: old/new fingerprints, fail-closed trust, explicit replacement passed.\n";
