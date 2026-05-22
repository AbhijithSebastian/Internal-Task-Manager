<?php

namespace App\Http\Controllers;

use App\Http\Requests\Integration\StoreIntegrationRequest;
use App\Http\Requests\Integration\UpdateIntegrationRequest;
use App\Models\Integration;
use App\Models\Project;
use App\Services\Integration\IntegrationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    public function __construct(
        private readonly IntegrationService $integrationService,
    ) {}

    public function index(Project $project): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json([
            'integrations' => $this->integrationService->list($project),
            'supported_types' => $this->integrationService->getSupportedTypes(),
        ]);
    }

    public function store(StoreIntegrationRequest $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $this->integrationService->create(
            $project,
            $request->input('type'),
            $request->input('config'),
        );

        return redirect()->back()->with('success', 'Integration added successfully.');
    }

    public function show(Integration $integration): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $integration);

        $handler = $this->integrationService->getTypeInstance($integration->type);

        return response()->json([
            'integration' => [
                'id' => $integration->id,
                'type' => $integration->type,
                'label' => $integration->label,
                'config' => $integration->config,
                'is_active' => $integration->is_active,
                'display' => $handler?->getDisplayData($integration->config) ?? [],
                'form_fields' => $handler?->getFormFields() ?? [],
                'last_synced_at' => $integration->last_synced_at,
            ],
        ]);
    }

    public function update(UpdateIntegrationRequest $request, Integration $integration): RedirectResponse
    {
        $this->authorize('update', $integration);

        $this->integrationService->update($integration, $request->input('config'));

        return redirect()->back()->with('success', 'Integration updated successfully.');
    }

    public function toggle(Integration $integration): RedirectResponse
    {
        $this->authorize('toggle', $integration);

        $this->integrationService->toggle($integration);

        $status = $integration->is_active ? 'enabled' : 'disabled';
        return redirect()->back()->with('success', "Integration {$status} successfully.");
    }

    public function destroy(Integration $integration): RedirectResponse
    {
        $this->authorize('delete', $integration);

        $this->integrationService->delete($integration);

        return redirect()->back()->with('success', 'Integration removed successfully.');
    }

    public function types(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'types' => $this->integrationService->getSupportedTypes(),
        ]);
    }

    public function formFields(string $type): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'fields' => $this->integrationService->getFormFields($type),
        ]);
    }

    public function generateEmailHook(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);

        $project = Project::findOrFail($request->input('project_id'));
        $this->authorize('view', $project);

        $address = \App\Services\Integration\Types\EmailHookIntegration::generateInboundAddress($project->id);

        return response()->json(['inbound_email' => $address]);
    }
}
