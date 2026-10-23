<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

use InvalidArgumentException;
use Throwable;

/** POST adapter. Caller must enforce local access, feature flag, session and CSRF first. */
final class ConnectionTestAction
{
    public function run(#[\SensitiveParameter] array $payload): array
    {
        $started = hrtime(true);
        try { return $this->execute($payload); }
        catch (ConnectionFailure $error) {
            if ($error->response()['diagnostics'] === []) {
                $rows = [];
                foreach (ConnectionDiagnostics::STAGES as $stage) {
                    $local = $stage === 'local_validation';
                    $rows[] = ['stage' => $stage, 'status' => $local ? 'failed' : 'skipped',
                        'duration_ms' => $local ? round((hrtime(true) - $started) / 1000000, 2) : 0,
                        'code' => $local ? $error->category() : 'not_run'];
                }
                $error->withDiagnostics($rows);
            }
            throw $error;
        }
    }

    private function execute(
        #[\SensitiveParameter]
        array $payload
    ): array {
        if (array_diff(array_keys($payload), ['token', 'draft', 'credential']) !== []
            || ! is_array($payload['draft'] ?? null) || ! is_array($payload['credential'] ?? null)) {
            throw new ConnectionFailure('input');
        }
        try {
            $draft = ProfileInput::validate($payload['draft']);
            $credential = $payload['credential'];
            $source = $credential['source'] ?? null;
            if ($source === 'input') {
                if (array_diff(array_keys($credential), ['source', 'password']) !== []
                    || ! is_string($credential['password'] ?? null) || strlen($credential['password']) > 65536) {
                    throw new ConnectionFailure('input');
                }
                $password = $credential['password'];
            } elseif ($source === 'saved' || $source === 'session') {
                $fields = $source === 'saved' ? ['source', 'profile_id', 'revision'] : ['source', 'profile_id', 'revision', 'context'];
                if (array_diff(array_keys($credential), $fields) !== []
                    || ! is_string($credential['profile_id'] ?? null) || ! is_int($credential['revision'] ?? null)
                    || ($source === 'session' && ! is_string($credential['context'] ?? null))) {
                    throw new ConnectionFailure('input');
                }
                $database = ProfileDatabase::openExistingConfigured();
                $profile = (new ProfileRepository($database))->detail($credential['profile_id']);
                if ($profile === null || $profile['connection_revision'] !== $credential['revision']) {
                    throw new ConnectionFailure('input');
                }
                // Never forward an existing credential to an edited/unrelated draft target.
                foreach (['host', 'port', 'username', 'database', 'tls', 'method', 'ssh'] as $field) {
                    if ($profile[$field] !== $draft[$field]) {
                        throw new ConnectionFailure('input');
                    }
                }
                $password = $source === 'saved'
                    ? (new ProfilePasswords($database))->reveal($profile['id'], $credential['revision'])
                    : (new SessionPasswords())->get($credential['context'], $profile['id'], $credential['revision']);
                if ($password === null) {
                    throw new ConnectionFailure('storage');
                }
            } else {
                throw new ConnectionFailure('input');
            }
        } catch (ConnectionFailure $error) {
            throw $error;
        } catch (InvalidArgumentException $error) {
            throw new ConnectionFailure('input');
        } catch (Throwable $error) {
            throw new ConnectionFailure('storage');
        }
        // Release PHP's session lock before any network wait; no active server variable is changed.
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        try {
            return (new ConnectionTester())->testDraft($draft, $password);
        } finally {
            sodium_memzero($password);
        }
    }
}
