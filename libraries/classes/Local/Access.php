<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

final class Access
{
    /** Forwarded headers are deliberately unsupported: Herd uses FastCGI, not a trusted HTTP proxy. */
    public static function allows(array $server): bool
    {
        $address = $server['REMOTE_ADDR'] ?? '';
        $packed = @inet_pton($address);
        $loopback = $packed !== false && (
            (strlen($packed) === 4 && ord($packed[0]) === 127)
            || $packed === inet_pton('::1')
        );
        if (! $loopback) {
            return false;
        }
        foreach (array_keys($server) as $name) {
            if ($name === 'HTTP_FORWARDED' || strpos($name, 'HTTP_X_FORWARDED_') === 0
                || $name === 'HTTP_X_REAL_IP') {
                return false;
            }
        }

        return true;
    }
}
