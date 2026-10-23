<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

final class ConnectionDiagnostics
{
    private $rows = [];
    public const STAGES = ['local_validation', 'ssh_trust', 'ssh_authentication_forwarding', 'mysql_tls_authentication_initial_database'];
    public function run(string $stage, callable $operation)
    {
        $start = hrtime(true);
        try {
            $result = $operation();
            $this->rows[$stage] = ['stage' => $stage, 'status' => 'passed', 'duration_ms' => round((hrtime(true) - $start) / 1000000, 2), 'code' => 'ok'];
            return $result;
        } catch (ConnectionFailure $error) {
            $this->rows[$stage] = ['stage' => $stage, 'status' => 'failed', 'duration_ms' => round((hrtime(true) - $start) / 1000000, 2), 'code' => $error->category()];
            $error->withDiagnostics($this->rows());
            throw $error;
        }
    }
    public function rows(): array
    {
        $rows = [];
        foreach (self::STAGES as $stage) {
            $rows[] = $this->rows[$stage] ?? ['stage' => $stage, 'status' => 'skipped', 'duration_ms' => 0, 'code' => 'not_run'];
        }
        return $rows;
    }
}
