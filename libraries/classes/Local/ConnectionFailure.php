<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use RuntimeException;

final class ConnectionFailure extends RuntimeException
{
    private const MESSAGES = [
        'input' => 'Connection parameters are invalid. Check required fields, port, and TLS options.',
        'dns' => 'Database hostname could not be resolved.',
        'network' => 'Database server could not be reached or the connection was interrupted.',
        'timeout' => 'The initial database connection timed out. Check the address and network.',
        'authentication' => 'Database authentication failed. Check the account and password.',
        'database' => 'The initial database does not exist or this account cannot access it.',
        'tls' => 'Verified TLS failed. Check server identity, CA, and the client certificate/key pair.',
        'storage' => 'Local credentials or storage are unavailable. Enter the password again or check private storage.',
    ];
    private $category;

    public function __construct(string $category)
    {
        $this->category = isset(self::MESSAGES[$category]) ? $category : 'network';
        parent::__construct(self::MESSAGES[$this->category]);
    }

    public function category(): string
    {
        return $this->category;
    }

    public function response(): array
    {
        return ['ok' => false, 'error' => ['category' => $this->category, 'message' => $this->getMessage()]];
    }
}
