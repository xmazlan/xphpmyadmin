<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use RuntimeException;

final class SecretUnavailable extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Saved password is unavailable. Enter the password again or explicitly restore the original key.');
    }
}
