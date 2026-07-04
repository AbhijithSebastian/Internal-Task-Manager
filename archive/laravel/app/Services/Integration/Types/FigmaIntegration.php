<?php

namespace App\Services\Integration\Types;

use App\Models\Integration;
use App\Services\Integration\Contracts\IntegrationInterface;
use Illuminate\Validation\ValidationException;

class FigmaIntegration implements IntegrationInterface
{
    public function validateConfig(array $config): array
    {
        $validated = validator($config, [
            'file_key' => ['required', 'string', 'max:255'],
            'node_id' => ['nullable', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'min:1'],
        ])->validate();

        return $validated;
    }

    public function getDisplayData(array $config): array
    {
        $fileKey = $config['file_key'] ?? '';
        $nodeId = $config['node_id'] ?? null;

        $embedUrl = "https://www.figma.com/embed?embed_host=internal_tool&url="
            . urlencode("https://www.figma.com/file/{$fileKey}");

        if ($nodeId) {
            $embedUrl .= urlencode("?node-id={$nodeId}");
        }

        return [
            'file_key' => $fileKey,
            'node_id' => $nodeId,
            'embed_url' => $embedUrl,
            'file_url' => "https://www.figma.com/file/{$fileKey}",
        ];
    }

    public function getFormFields(): array
    {
        return [
            [
                'key' => 'file_key',
                'label' => 'File Key',
                'type' => 'text',
                'required' => true,
                'placeholder' => 'abc123xyz...',
                'help' => 'The file key from the Figma URL (figma.com/file/FILE_KEY/name)',
            ],
            [
                'key' => 'node_id',
                'label' => 'Node ID',
                'type' => 'text',
                'required' => false,
                'placeholder' => '1:2',
                'help' => 'Specific frame/node to embed (optional)',
            ],
            [
                'key' => 'token',
                'label' => 'Personal Access Token',
                'type' => 'password',
                'required' => false,
                'help' => 'Figma PAT for higher rate limits (optional)',
            ],
        ];
    }

    public function sync(Integration $integration): void
    {
        $integration->update([
            'label' => $integration->config['file_key'] ?? null,
            'last_synced_at' => now(),
        ]);
    }

    public static function parseFileKey(string $url): ?string
    {
        $patterns = [
            '/figma\.com\/file\/([a-zA-Z0-9]+)/',
            '/figma\.com\/proto\/([a-zA-Z0-9]+)/',
            '/figma\.com\/design\/([a-zA-Z0-9]+)/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }
}
