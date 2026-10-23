<?php

declare(strict_types=1);

namespace PhpMyAdmin\Local;

final class ConnectionTester
{
    public function testDraft(
        #[\SensitiveParameter]
        array $draft,
        #[\SensitiveParameter]
        string $password
    ): array {
        $diagnostics = new ConnectionDiagnostics();
        $draft = $diagnostics->run('local_validation', static function () use ($draft): array {
            try { return ProfileInput::validate($draft); }
            catch (\InvalidArgumentException $error) { throw new ConnectionFailure('input'); }
        });
        $connection = Transport::open($draft, $password, null, false, MySqlConnector::INITIAL_TIMEOUT, $diagnostics);
        try {
            return $connection->summary() + ['diagnostics' => $diagnostics->rows()];
        } finally {
            $connection->close();
        }
    }
}
