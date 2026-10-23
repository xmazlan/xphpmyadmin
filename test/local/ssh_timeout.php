<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__, 2) . '/vendor/autoload.php';
use PhpMyAdmin\Local\{ProfileDatabase, ProfileRepository, SshTunnels, ConnectionFailure};
session_start();
$database = ProfileDatabase::openExistingConfigured();
$profile = array_values(array_filter((new ProfileRepository($database))->list(), static function ($p) { return $p['method'] === 'ssh'; }))[0];
$tunnels = new SshTunnels($database); $id = bin2hex(random_bytes(32));
try {
    $wrong = $profile; $wrong['ssh']['key'] = getenv('XPM_SSH_UNTRUSTED_KEY');
    try { $tunnels->start($wrong,$id); throw new RuntimeException('Unauthorized identity accepted'); }
    catch (ConnectionFailure $error) { if ($error->category() !== 'ssh_authentication') { throw $error; } }
    $stall = $profile; $stall['ssh']['port'] = (int) $argv[1];
    $database->transaction(function (PDO $pdo) use ($stall, $profile): void {
        $statement = $pdo->prepare('INSERT INTO ssh_trust(host,port,algorithm,public_key,fingerprint,revision,blocked)
            SELECT host,:port,algorithm,public_key,fingerprint,revision,blocked FROM ssh_trust WHERE host=:host AND port=:original');
        $statement->execute([':port'=>$stall['ssh']['port'],':host'=>$profile['ssh']['host'],':original'=>$profile['ssh']['port']]);
    });
    $started = microtime(true);
    try { $tunnels->start($stall,$id); throw new RuntimeException('Stalled SSH accepted'); }
    catch (ConnectionFailure $error) { if ($error->category() !== 'ssh_timeout') { throw $error; } }
    if (microtime(true)-$started > 13) { throw new RuntimeException('Unbounded SSH wait'); }
} finally { $tunnels->close($id); session_destroy(); }
echo "SSH unauthorized key and real stalled-banner timeout: safe categories, bounded wait and cleanup passed.\n";
