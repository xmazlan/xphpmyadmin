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
        $connection = (new MySqlConnector())->open($draft, $password, MySqlConnector::INITIAL_TIMEOUT);
        try {
            return $connection->summary();
        } finally {
            $connection->close();
        }
    }
}
