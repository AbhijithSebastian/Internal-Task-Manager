<?php

namespace App\Http\Controllers;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Models\User;
use App\Services\Attachment\AttachmentService;
use App\Services\Integration\IntegrationService;
use App\Services\Project\ProjectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly AttachmentService $attachmentService,
        private readonly IntegrationService $integrationService,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Project::class);

        return Inertia::render('Projects/Index', [
            'projects' => $this->projectService->list(request()->all()),
            'filters' => request()->only(['search', 'status', 'priority', 'pm_id', 'lead_id', 'sort_by', 'sort_direction']),
            'users' => User::active()->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('Projects/Create', [
            'users' => User::active()->get(['id', 'name']),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $this->authorize('create', Project::class);

        $this->projectService->create($request->validated());

        return redirect()->route('projects.index')
            ->with('success', 'Project created successfully.');
    }

    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'author',
            'members',
            'projectManager',
            'teamLead',
            'tasks' => fn ($q) => $q->whereNull('parent_id')->with(['assignees', 'author'])->latest(),
            'milestones',
        ])->loadCount([
            'members',
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
        ]);

        $project->attachments = $this->attachmentService->getAttachments($project);

        $board = $this->projectService->getBoardData($project);
        $timeline = $this->projectService->getTimelineData($project);
        $integrations = $this->integrationService->list($project);
        $availableTypes = $this->integrationService->getSupportedTypes();

        $meetingLogs = $project->meetingLogs()->with('author')->orderBy('meeting_date', 'desc')->get();

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'board' => $board,
            'timeline' => $timeline,
            'integrations' => $integrations,
            'available_integration_types' => $availableTypes,
            'meeting_logs' => $meetingLogs,
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('Projects/Edit', [
            'project' => $project->load(['author', 'members', 'projectManager', 'teamLead']),
            'users' => User::active()->get(['id', 'name']),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $this->projectService->update($project, $request->validated());

        return redirect()->route('projects.index')
            ->with('success', 'Project updated successfully.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);

        $this->projectService->delete($project);

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    public function archive(Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $this->projectService->archive($project);

        return redirect()->back()
            ->with('success', 'Project archived successfully.');
    }

    public function restore(int $id): RedirectResponse
    {
        $this->authorize('restore', Project::class);

        $this->projectService->restore($id);

        return redirect()->route('projects.index')
            ->with('success', 'Project restored successfully.');
    }

    public function updateStatus(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . collect(ProjectStatus::cases())->pluck('value')->implode(',')],
        ]);

        $status = ProjectStatus::from($validated['status']);
        $this->projectService->updateStatus($project, $status);

        return redirect()->back()
            ->with('success', 'Project status updated successfully.');
    }

    public function members(Project $project): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json($this->projectService->getMembers($project));
    }

    public function addMember(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('manageMembers', $project);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['sometimes', 'string', 'in:member,manager'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $this->projectService->addMember($project, $user, $validated['role'] ?? 'member');

        return redirect()->back()->with('success', 'Member added successfully.');
    }

    public function updateMemberRole(Request $request, Project $project, User $user): RedirectResponse
    {
        $this->authorize('manageMembers', $project);

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:member,manager'],
        ]);

        $this->projectService->updateMemberRole($project, $user, $validated['role']);

        return redirect()->back()->with('success', 'Member role updated successfully.');
    }

    public function removeMember(Project $project, User $user): RedirectResponse
    {
        $this->authorize('manageMembers', $project);

        $this->projectService->removeMember($project, $user);

        return redirect()->back()->with('success', 'Member removed successfully.');
    }
}
