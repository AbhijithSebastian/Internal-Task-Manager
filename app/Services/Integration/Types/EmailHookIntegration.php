<?php

namespace App\Services\Integration\Types;

use App\Models\Integration;
use App\Services\Integration\Contracts\IntegrationInterface;

class EmailHookIntegration implements IntegrationInterface
{
    public function validateConfig(array $config): array
    {
        return validator($config, [
            'inbound_email' => ['required', 'email', 'max:255'],
            'forward_to' => ['nullable', 'email', 'max:255'],
            'create_tasks' => ['boolean'],
            'default_assignee_id' => ['nullable', 'exists:users,id'],
        ])->validate();
    }

    public function getDisplayData(array $config): array
    {
        return [
            'inbound_email' => $config['inbound_email'] ?? '',
            'forward_to' => $config['forward_to'] ?? null,
            'create_tasks' => $config['create_tasks'] ?? true,
            'default_assignee_id' => $config['default_assignee_id'] ?? null,
        ];
    }

    public function getFormFields(): array
    {
        return [
            [
                'key' => 'inbound_email',
                'label' => 'Inbound Email',
                'type' => 'email',
                'required' => true,
                'help' => 'Email address that forwards to this project',
            ],
            [
                'key' => 'forward_to',
                'label' => 'Forward To',
                'type' => 'email',
                'required' => false,
                'help' => 'Forward incoming emails to this address (optional)',
            ],
            [
                'key' => 'create_tasks',
                'label' => 'Auto-create Tasks',
                'type' => 'checkbox',
                'required' => false,
                'help' => 'Automatically create tasks from incoming emails',
            ],
        ];
    }

    public function sync(Integration $integration): void
    {
        $integration->update([
            'label' => $integration->config['inbound_email'] ?? null,
            'last_synced_at' => now(),
        ]);
    }

    public static function generateInboundAddress(int $projectId): string
    {
        $hash = substr(md5($projectId . config('app.key')), 0, 12);
        return "project-{$projectId}-{$hash}@" . config('mail.hook_domain', 'inbound.internal-tool.local');
    }
}
