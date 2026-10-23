<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;

/** Local UI adapter. HTTP caller owns session, loopback, feature and CSRF guards. */
final class ProfileAction
{
    public function run(#[\SensitiveParameter] array $payload): array
    {
        $action = $payload['action'] ?? null;
        $allowed = [
            'ssh_inspect' => ['id', 'revision'],
            'ssh_approve' => ['id', 'revision', 'nonce', 'replace'],
            'list' => ['search', 'favorites', 'order'],
            'create' => ['draft', 'password'],
            'update' => ['id', 'revision', 'draft', 'password'],
            'favorite' => ['id', 'favorite'],
            'delete' => ['id', 'revision'],
        ];
        if (! is_string($action) || ! isset($allowed[$action])
            || array_diff(array_keys($payload), array_merge(['token', 'action'], $allowed[$action])) !== []) {
            throw new InvalidArgumentException('Invalid profile action.');
        }
        $database = ProfileDatabase::openExistingConfigured();
        $profiles = new ProfileRepository($database);
        if ($action === 'list') {
            if (! is_string($payload['search'] ?? '') || ! is_bool($payload['favorites'] ?? false)
                || ! is_string($payload['order'] ?? 'recent')) {
                throw new InvalidArgumentException('Invalid list parameters.');
            }
            $items = $profiles->list($payload['search'] ?? '', $payload['favorites'] ?? false, $payload['order'] ?? 'recent');
            $contexts = new ConnectionContexts($database);
            foreach ($items as &$profile) {
                $profile['session_context'] = $contexts->availableContext($profile['id'], $profile['connection_revision']);
            }
            unset($profile);
            return ['ok' => true, 'profiles' => $items];
        }
        if ($action === 'create') {
            if (! is_array($payload['draft'] ?? null) || ! is_array($payload['password'] ?? [])) {
                throw new InvalidArgumentException('Invalid profile input.');
            }
            return ['ok' => true, 'profile' => (new ProfilePasswords($database))->create($payload['draft'], $payload['password'] ?? [])];
        }
        if (! is_string($payload['id'] ?? null)) {
            throw new InvalidArgumentException('Invalid profile ID.');
        }
        if ($action === 'favorite') {
            if (! is_bool($payload['favorite'] ?? null)) {
                throw new InvalidArgumentException('Invalid favorite value.');
            }
            return ['ok' => true, 'profile' => $profiles->favorite($payload['id'], $payload['favorite'])];
        }
        // Revision is checked atomically with save/delete, never against a browser snapshot alone.
        return $database->transaction(function () use ($profiles, $database, $payload, $action): array {
            $profile = $profiles->detail($payload['id']);
            if ($profile === null || ! is_int($payload['revision'] ?? null)
                || $profile['connection_revision'] !== $payload['revision']) {
                throw new ConnectionFailure('reconnect');
            }
            if ($action === 'ssh_inspect') { return (new SshTrust($database))->inspect($profile); }
            if ($action === 'ssh_approve') {
                if (! is_string($payload['nonce'] ?? null) || ! is_bool($payload['replace'] ?? null)) { throw new ConnectionFailure('input'); }
                return (new SshTrust($database))->approve($profile, $payload['nonce'], $payload['replace']);
            }
            if ($action === 'delete') {
                $profiles->delete($payload['id']);
                return ['ok' => true];
            }
            if (! is_array($payload['draft'] ?? null) || ! is_array($payload['password'] ?? [])) {
                throw new InvalidArgumentException('Invalid profile input.');
            }
            return ['ok' => true, 'profile' => (new ProfilePasswords($database))->update(
                $payload['id'], $payload['draft'], $payload['password'] ?? []
            )];
        });
    }
}
