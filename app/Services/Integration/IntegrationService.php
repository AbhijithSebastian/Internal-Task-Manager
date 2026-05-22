<?php

namespace App\Services\Integration;

use App\Models\Integration;
use App\Models\Project;
use App\Services\Integration\Contracts\IntegrationInterface;
use App\Services\Integration\Types\EmailHookIntegration;
use App\Services\Integration\Types\FigmaIntegration;
use App\Services\Integration\Types\GitHubIntegration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IntegrationService
{
    private const TYPE_MAP = [
        'github' => GitHubIntegration::class,
        'figma' => FigmaIntegration::class,
        'email_hook' => EmailHookIntegration::class,
    ];

    public function resolveType(string $type): IntegrationInterface
    {
        $class = self::TYPE_MAP[$type] ?? null;

        if (!$class) {
            throw ValidationException::withMessages([
                'type' => "Unsupported integration type: {$type}.",
            ]);
        }

        return app($class);
    }

    public function getTypeInstance(string $type): ?IntegrationInterface
    {
        try {
            return $this->resolveType($type);
        } catch (ValidationException) {
            return null;
        }
    }

    public function list(Project $project): array
    {
        $integrations = $project->integrations()->active()->get();

        return $integrations->map(function (Integration $integration) {
            $handler = $this->getTypeInstance($integration->type);
            $displayData = $handler?->getDisplayData($integration->config) ?? [];

            return [
                'id' => $integration->id,
                'type' => $integration->type,
                'label' => $integration->label,
                'config' => $integration->config,
                'is_active' => $integration->is_active,
                'display' => $displayData,
                'last_synced_at' => $integration->last_synced_at?->diffForHumans(),
                'created_at' => $integration->created_at->diffForHumans(),
            ];
        })->values()->toArray();
    }

    public function create(Project $project, string $type, array $config): Integration
    {
        return DB::transaction(function () use ($project, $type, $config) {
            if ($project->integrations()->byType($type)->exists()) {
                throw ValidationException::withMessages([
                    'type' => "An integration of type '{$type}' already exists for this project.",
                ]);
            }

            $handler = $this->resolveType($type);
            $validated = $handler->validateConfig($config);

            $integration = $project->integrations()->create([
                'type' => $type,
                'label' => $validated['repo'] ?? $validated['file_key'] ?? $validated['inbound_email'] ?? $type,
                'config' => $validated,
                'is_active' => true,
            ]);

            $handler->sync($integration);

            log_activity($project, "Integration added: {$type}", [
                'type' => $type,
                'added_by' => auth()->user()?->name,
            ]);

            return $integration;
        });
    }

    public function update(Integration $integration, array $config): Integration
    {
        return DB::transaction(function () use ($integration, $config) {
            $handler = $this->resolveType($integration->type);
            $validated = $handler->validateConfig($config);

            $integration->update([
                'config' => $validated,
                'label' => $validated['repo'] ?? $validated['file_key'] ?? $validated['inbound_email'] ?? $integration->label,
            ]);

            $handler->sync($integration);

            log_activity($integration->project, "Integration updated: {$integration->type}", [
                'type' => $integration->type,
                'updated_by' => auth()->user()?->name,
            ]);

            return $integration;
        });
    }

    public function toggle(Integration $integration): Integration
    {
        $integration->update(['is_active' => !$integration->is_active]);

        $action = $integration->is_active ? 'enabled' : 'disabled';
        log_activity($integration->project, "Integration {$action}: {$integration->type}", [
            'type' => $integration->type,
            'changed_by' => auth()->user()?->name,
        ]);

        return $integration;
    }

    public function delete(Integration $integration): void
    {
        DB::transaction(function () use ($integration) {
            $project = $integration->project;
            $type = $integration->type;

            $integration->delete();

            log_activity($project, "Integration removed: {$type}", [
                'type' => $type,
                'removed_by' => auth()->user()?->name,
            ]);
        });
    }

    public function sync(Integration $integration): void
    {
        $handler = $this->resolveType($integration->type);
        $handler->sync($integration);
    }

    public function getFormFields(string $type): array
    {
        $handler = $this->getTypeInstance($type);
        return $handler?->getFormFields() ?? [];
    }

    public function getDisplayData(Integration $integration): array
    {
        $handler = $this->getTypeInstance($integration->type);
        return $handler?->getDisplayData($integration->config) ?? [];
    }

    public function getSupportedTypes(): array
    {
        return [
            'github' => [
                'label' => 'GitHub',
                'description' => 'Link a repository to view commits, PRs, and repo stats.',
                'icon' => 'code-bracket',
            ],
            'figma' => [
                'label' => 'Figma',
                'description' => 'Embed Figma files and frames directly in the project.',
                'icon' => 'paint-brush',
            ],
            'email_hook' => [
                'label' => 'Email Hook',
                'description' => 'Receive emails that auto-create tasks and comments.',
                'icon' => 'envelope',
            ],
        ];
    }
}
