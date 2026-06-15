<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\Attachment\AttachmentService;
use App\Services\Comment\CommentService;
use App\Services\Task\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(
        private readonly TaskService $taskService,
        private readonly CommentService $commentService,
        private readonly AttachmentService $attachmentService,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Task::class);

        $user = auth()->user();
        $tab = request('tab', 'all');

        $stats = [
            'total' => Task::query()->whereHas('project', fn($q) => $q->byMember($user->id))->whereNull('parent_id')->count(),
            'my_tasks' => Task::query()->whereHas('assignees', fn($q) => $q->where('users.id', $user->id))->whereNull('parent_id')->count(),
            'my_subtasks' => Task::query()->whereNotNull('parent_id')->whereHas('assignees', fn($q) => $q->where('users.id', $user->id))->count(),
            'blocked' => Task::query()->whereHas('project', fn($q) => $q->byMember($user->id))->whereNull('parent_id')->blocked()->count(),
        ];

        $filters = request()->only(['search', 'status', 'priority', 'project_id', 'assignee_id', 'tag', 'sort_by', 'sort_direction', 'tab']);

        if ($tab === 'my-subtasks') {
            $tasks = $this->taskService->listMySubtasks($user->id, $filters);
        } else {
            $tasks = $this->taskService->list($filters);
        }

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $filters,
            'projects' => $user->hasRole('super-admin')
                ? Project::get(['id', 'name'])
                : $user->projects()->get(['id', 'name']),
            'tags' => $this->taskService->getAllTags(),
            'members' => User::active()->get(['id', 'name']),
            'stats' => $stats,
            'userRole' => $user->getRoleNames()->first() ?? 'employee',
        ]);
    }

    public function create(): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        $user = auth()->user();
        $projects = $user->hasRole('super-admin')
            ? Project::active()->get(['id', 'name'])
            : $user->projects()->active()->get(['id', 'name']);

        if ($projects->isEmpty()) {
            return redirect()->route('tasks.index')
                ->with('error', 'You need to be part of a project to create tasks.');
        }

        return Inertia::render('Tasks/Create', [
            'projects' => $projects,
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $project = Project::findOrFail($request->project_id);
        $this->authorize('create', [Task::class, $project]);

        $data = $request->validated();
        $subtasksData = $data['subtasks'] ?? [];
        unset($data['subtasks']);

        $task = $this->taskService->create($data);

        if (!empty($subtasksData)) {
            foreach ($subtasksData as $subtaskData) {
                $this->taskService->createSubtask($task, $subtaskData);
            }
        }

        return redirect()->route('tasks.index')
            ->with('success', 'Task created successfully.');
    }

    public function show(Task $task): Response
    {
        $this->authorize('view', $task);

        $task->load([
            'author',
            'assignees',
            'approver',
            'project',
            'dependencies' => fn ($q) => $q->with(['assignees']),
            'dependents' => fn ($q) => $q->with(['assignees']),
            'subtasks' => fn ($q) => $q->with(['assignees', 'author']),
        ])->loadCount([
            'subtasks',
            'subtasks as completed_subtask_count' => fn ($q) => $q->where('status', \App\Enums\TaskStatus::Done),
        ]);

        $projectMembers = $task->project ? $task->project->members()->get(['id', 'name']) : collect();
        $availableDependencies = $task->project ? $task->project->tasks()
            ->whereNull('parent_id')
            ->where('id', '!=', $task->id)
            ->get(['id', 'title']) : collect();

        $task->attachments = $this->attachmentService->getAttachments($task);

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'comments' => $this->commentService->list($task, request()->all()),
            'project_members' => $projectMembers,
            'available_dependencies' => $availableDependencies,
        ]);
    }

    public function edit(Task $task): Response
    {
        $this->authorize('update', $task);

        $task->load(['author', 'assignees', 'approver', 'project', 'dependencies', 'subtasks' => fn ($q) => $q->with(['assignees'])]);

        $projectMembers = $task->project ? $task->project->members()->get(['id', 'name']) : collect();
        $availableDependencies = $task->project ? $task->project->tasks()
            ->whereNull('parent_id')
            ->where('id', '!=', $task->id)
            ->get(['id', 'title']) : collect();

        $user = auth()->user();
        $projects = $user->hasRole('super-admin')
            ? Project::get(['id', 'name'])
            : $user->projects()->get(['id', 'name']);

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'projects' => $projects,
            'project_members' => $projectMembers,
            'available_dependencies' => $availableDependencies,
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $this->taskService->update($task, $request->validated());

        return redirect()->route('tasks.index')
            ->with('success', 'Task updated successfully.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        $this->taskService->delete($task);

        return redirect()->route('tasks.index')
            ->with('success', 'Task deleted successfully.');
    }

    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . collect(TaskStatus::cases())->pluck('value')->implode(',')],
        ]);

        $this->taskService->updateStatus($task, TaskStatus::from($validated['status']));

        return redirect()->back()->with('success', 'Task status updated.');
    }

    public function assign(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('assign', $task);

        $validated = $request->validate([
            'assignee_id' => ['nullable', 'required_without:assignee_ids', 'exists:users,id'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
        ]);

        if ($request->has('assignee_ids')) {
            $this->taskService->update($task, ['assignee_ids' => $validated['assignee_ids'] ?? []]);
        } else {
            $user = User::findOrFail($validated['assignee_id']);
            $this->taskService->assign($task, $user);
        }

        return redirect()->back()->with('success', 'Task assigned successfully.');
    }

    public function addDependency(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'dependency_id' => ['required', 'exists:tasks,id'],
        ]);

        $dependency = Task::findOrFail($validated['dependency_id']);
        $this->taskService->addDependency($task, $dependency);

        return redirect()->back()->with('success', 'Dependency added.');
    }

    public function removeDependency(Task $task, Task $dependency): RedirectResponse
    {
        $this->authorize('update', $task);

        $this->taskService->removeDependency($task, $dependency);

        return redirect()->back()->with('success', 'Dependency removed.');
    }

    public function submitForReview(Task $task): RedirectResponse
    {
        $this->authorize('submitForApproval', $task);

        $this->taskService->submitForReview($task);

        return redirect()->back()->with('success', 'Task submitted for review.');
    }

    public function approveTask(Task $task): RedirectResponse
    {
        $this->authorize('approve', $task);

        $this->taskService->approve($task);

        return redirect()->back()->with('success', 'Task approved.');
    }

    public function rejectTask(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('approve', $task);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->taskService->reject($task, $validated['rejection_reason']);

        return redirect()->back()->with('success', 'Task rejected.');
    }

    public function block(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'blocked_reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->taskService->block($task, $validated['blocked_reason']);

        return redirect()->back()->with('success', 'Task blocked.');
    }

    public function unblock(Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $this->taskService->unblock($task);

        return redirect()->back()->with('success', 'Task unblocked.');
    }

    public function createSubtask(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'due_date' => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:999'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if (isset($validated['assignee_id']) && !isset($validated['assignee_ids'])) {
            $validated['assignee_ids'] = [$validated['assignee_id']];
        }

        $this->taskService->createSubtask($task, $validated);

        return redirect()->back()->with('success', 'Subtask created.');
    }

    public function updateSubtask(Request $request, Task $task, Task $subtask): RedirectResponse
    {
        $this->authorize('update', $subtask);

        if ($subtask->parent_id !== $task->id) {
            abort(404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'due_date' => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:999'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['exists:users,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if (isset($validated['assignee_id']) && !isset($validated['assignee_ids'])) {
            $validated['assignee_ids'] = [$validated['assignee_id']];
        }

        $this->taskService->updateSubtask($subtask, $validated);

        return redirect()->back()->with('success', 'Subtask updated.');
    }

    public function deleteSubtask(Task $task, Task $subtask): RedirectResponse
    {
        $this->authorize('delete', $subtask);

        if ($subtask->parent_id !== $task->id) {
            abort(404);
        }

        $this->taskService->deleteSubtask($subtask);

        return redirect()->back()->with('success', 'Subtask deleted.');
    }

    public function bulkDeleteSubtasks(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'subtask_ids' => ['required', 'array', 'min:1'],
            'subtask_ids.*' => ['integer', 'exists:tasks,id,parent_id,' . $task->id],
        ]);

        Task::whereIn('id', $validated['subtask_ids'])
            ->where('parent_id', $task->id)
            ->delete();

        return redirect()->back()->with('success', 'Completed subtasks deleted.');
    }

    public function parentTasks(Request $request): JsonResponse
    {
        $projectId = $request->input('project_id');
        $user = $request->user();

        $tasks = Task::whereNull('parent_id')
            ->when($projectId, fn ($q) => $q->where('project_id', $projectId))
            ->whereHas('project', fn ($q) => $q->byMember($user->id))
            ->orderBy('title')
            ->get(['id', 'title', 'project_id']);

        return response()->json(['tasks' => $tasks]);
    }
}
