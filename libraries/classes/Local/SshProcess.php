<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

/** Bounded argv-only execution. Output stays internal and is never logged. */
final class SshProcess
{
    public static function run(array $arguments, int $timeout = 12): array
    {
        if (! function_exists('proc_open') || ! is_executable($arguments[0])) {
            throw new ConnectionFailure('ssh_prerequisite');
        }
        // An app-private override lets Herd use the existing login agent without
        // exporting signing access to every PHP site in the shared FPM pool.
        $configuration = Foundation::configuration();
        $agent = $configuration['ssh_agent_socket'] ?? getenv('SSH_AUTH_SOCK');
        $environment = ['PATH' => '/usr/bin:/bin', 'LANG' => 'C', 'LC_ALL' => 'C'];
        if (is_string($agent) && $agent !== '' && $agent[0] === '/' && strlen($agent) < 1024
            && ! preg_match('/[\x00-\x1f\x7f]/', $agent) && @filetype($agent) === 'socket'
            && (! function_exists('posix_geteuid') || fileowner($agent) === posix_geteuid())) {
            $environment['SSH_AUTH_SOCK'] = $agent;
        }
        $process = @proc_open($arguments, [0 => ['file', '/dev/null', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, null, $environment, ['bypass_shell' => true]);
        if (! is_resource($process)) { throw new ConnectionFailure('ssh_prerequisite'); }
        foreach ($pipes as $pipe) { stream_set_blocking($pipe, false); }
        $output = ['', '']; $start = microtime(true); $timedOut = false;
        try {
            do {
                foreach ([1, 2] as $index) {
                    $chunk = stream_get_contents($pipes[$index]);
                    if (strlen($output[$index - 1]) < 65536) { $output[$index - 1] .= substr($chunk, 0, 65536 - strlen($output[$index - 1])); }
                }
                $status = proc_get_status($process);
                if (! $status['running']) { break; }
                if (microtime(true) - $start > $timeout) { $timedOut = true; proc_terminate($process, 9); break; }
                usleep(20000);
            } while (true);
            foreach ([1, 2] as $index) { $output[$index - 1] .= substr((string) stream_get_contents($pipes[$index]), 0, 65536 - strlen($output[$index - 1])); }
        } finally {
            foreach ($pipes as $pipe) { fclose($pipe); }
            $closed = proc_close($process);
        }
        if ($timedOut) { throw new ConnectionFailure('ssh_timeout'); }
        return ['code' => $status['exitcode'] >= 0 ? $status['exitcode'] : $closed, 'out' => $output[0], 'err' => $output[1]];
    }
}
