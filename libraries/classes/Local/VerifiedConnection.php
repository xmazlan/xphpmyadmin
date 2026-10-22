<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use mysqli;
use RuntimeException;
use Throwable;

/** Ownership of an already-verified connection. Do not serialize the native handle. */
final class VerifiedConnection
{
    private $handle;
    private $tls;
    private $databaseSelected;

    public function __construct(mysqli $handle, bool $tls, bool $databaseSelected)
    {
        $this->handle = $handle;
        $this->tls = $tls;
        $this->databaseSelected = $databaseSelected;
    }

    public function native(): mysqli
    {
        if ($this->handle === null) {
            throw new RuntimeException('Database connection is closed.');
        }

        return $this->handle;
    }

    public function summary(): array
    {
        return ['ok' => true, 'tls' => $this->tls, 'database_selected' => $this->databaseSelected];
    }

    public function close(): void
    {
        if ($this->handle !== null) {
            try {
                @$this->handle->close();
            } catch (Throwable $ignored) {
                // A closed/lost connection must not expose a raw driver error during cleanup.
            } finally {
                $this->handle = null;
            }
        }
    }

    public function __destruct()
    {
        $this->close();
    }

    public function __debugInfo(): array
    {
        return ['tls' => $this->tls, 'database_selected' => $this->databaseSelected, 'closed' => $this->handle === null];
    }
}
