<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';
use PhpMyAdmin\Local\{ProfileDatabase, ProfileRepository, SshTunnels, ConnectionFailure, ProfileInput};
session_start();
$database = ProfileDatabase::openExistingConfigured();
$profile = array_values(array_filter((new ProfileRepository($database))->list(), static function ($p) { return $p['method'] === 'ssh'; }))[0];
$profile['ssh']['key'] = getenv('XPM_SSH_KEY');
ProfileInput::validate(array_intersect_key($profile, array_flip(ProfileInput::FIELDS)));
$tunnels = new SshTunnels($database); $id = bin2hex(random_bytes(32));
try {
    try {
        $tunnels->start($profile, $id);
        if ($argv[1] === 'missing') { throw new RuntimeException('Encrypted key opened without agent'); }
        $tunnels->resolve($profile, $id);
    } catch (ConnectionFailure $error) {
        if ($argv[1] !== 'missing' || $error->category() !== 'ssh_authentication') { throw $error; }
    }
} finally { $tunnels->close($id); session_destroy(); }
echo 'Encrypted SSH identity: agent ' . $argv[1] . " passed without interactive prompt.\n";
