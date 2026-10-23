<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use RuntimeException;

final class ConnectionFailure extends RuntimeException
{
    private const MESSAGES = [
        'ssh_prerequisite' => 'OpenSSH, private storage, key or agent is unavailable to this PHP runtime. Configure Herd FPM and retry.',
        'ssh_unknown' => 'SSH host key is not trusted. Inspect and verify its fingerprint independently before approval.',
        'ssh_changed' => 'SSH host key changed. Review the old and new fingerprints before explicitly replacing trust.',
        'ssh_authentication' => 'SSH authentication failed. Check the local key and load encrypted keys into the PHP-accessible agent.',
        'ssh_timeout' => 'SSH connection timed out. Check the SSH address and network.',
        'forwarding' => 'SSH forwarding could not be established. Check the remote database address and retry.',
        'tunnel_lost' => 'SSH tunnel is unavailable. Reconnect explicitly; interrupted queries are not replayed.',
        'tls_tunnel' => 'This mysqli driver cannot set a separate TLS peer hostname. Verified TLS over SSH is blocked. Use direct TLS or explicitly select non-TLS where appropriate.',
        'reconnect' => 'Connection context is unavailable, expired, or changed. Reconnect using the current profile.',
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
    private $diagnostics;

    public function __construct(string $category)
    {
        $this->category = isset(self::MESSAGES[$category]) ? $category : 'network';
        parent::__construct(self::MESSAGES[$this->category]);
    }

    public function category(): string
    {
        return $this->category;
    }

    public function withDiagnostics(array $rows): void { $this->diagnostics = $rows; }

    public function response(): array
    {
        return ['ok' => false, 'diagnostics' => $this->diagnostics ?? [], 'error' => ['category' => $this->category, 'message' => $this->getMessage()]];
    }
}
