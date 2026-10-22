<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use PDOException;
use RuntimeException;

final class StorageException extends RuntimeException
{
    public static function database(PDOException $error): self
    {
        $code = isset($error->errorInfo[1]) ? ((int) $error->errorInfo[1] & 255) : 0;
        if ($code === 5 || $code === 6) {
            return new self('Profile storage is busy; retry the operation.');
        }

        // Never expose the SQLite path, SQL, bound parameters, or a chained driver exception.
        return new self('Profile storage operation failed; check private storage permissions and available space.');
    }
}
