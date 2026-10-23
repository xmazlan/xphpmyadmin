<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

/** Internal JSON POST adapter, called only after local-access/session/CSRF guards. */
final class ConnectionAction
{
    public function run(#[\SensitiveParameter] array $payload): array
    {
        $action = $payload['action'] ?? null;
        $fields = $action === 'connect' ? ['token', 'action', 'profile_id', 'revision', 'credential']
            : ($action === 'disconnect' ? ['token', 'action', 'context'] : ['token', 'action']);
        if (array_diff(array_keys($payload), $fields) !== []) {
            throw new ConnectionFailure('input');
        }
        if ($action === 'logout') {
            ConnectionContexts::logout();
            \PhpMyAdmin\Session::secure();
            return ['ok' => true];
        }
        $contexts = new ConnectionContexts(ProfileDatabase::openExistingConfigured());
        if ($action === 'disconnect' && is_string($payload['context'] ?? null)) {
            $contexts->disconnect($payload['context']);
            return ['ok' => true];
        }
        if ($action !== 'connect' || ! is_string($payload['profile_id'] ?? null)
            || preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D', $payload['profile_id']) !== 1
            || ! is_int($payload['revision'] ?? null) || $payload['revision'] < 1 || ! is_array($payload['credential'] ?? null)) {
            throw new ConnectionFailure('input');
        }
        return $contexts->connect($payload['profile_id'], $payload['revision'], $payload['credential']);
    }
}
