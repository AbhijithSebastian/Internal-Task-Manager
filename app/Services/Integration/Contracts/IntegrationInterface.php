<?php

namespace App\Services\Integration\Contracts;

use App\Models\Integration;

interface IntegrationInterface
{
    public function validateConfig(array $config): array;

    public function getDisplayData(array $config): array;

    public function getFormFields(): array;

    public function sync(Integration $integration): void;
}
