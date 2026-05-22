<?php

namespace App\Services\Task;

use App\Actions\Task\UpdateTaskStatusAction;
use App\Enums\TaskStatus;
use App\Exceptions\BusinessException;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskApprovedNotification;
use App\Notifications\TaskAssignedNotification;
use App\Notifications\TaskPendingReviewNotification;
use App\Notifications\TaskRejectedNotification;
use App\Notifications\TaskStatusChangedNotification;
use App\Services\BaseService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TaskService extends BaseService
{
    public function __construct(
        private readonly UpdateTaskStatusAction $updateStatusAction,
    ) {}

    protected function model(): string
    {
        return Task::class;
    }

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Task::query()
            ->with(['author', 'assignees', 'project'])
            ->withCount(['comments', 'subtasks', 'dependencies'])
            ->whereNull('parent_id')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->search($s))
            ->when($filters['project_id'] ?? null, fn ($q, $id) => $q->where('project_id', $id))
            ->when($filters['status'] ?? null, fn ($q, $s) => match ($s) {
                'pending' => $q->pending(),
                'overdue' => $q->overdue(),
                'blocked' => $q->blocked(),
                'needs_review' => $q->awaitingApproval(),
                default => $q->where('status', $s),
            })
            ->when($filters['priority'] ?? null, fn ($q, $p) => $q->where('priority', $p))
            ->when($filters['assignee_id'] ?? null, fn ($q, $id) => $q->whereHas('assignees', fn ($q2) => $q2->where('users.id', $id)))
            ->when($filters['author_id'] ?? null, fn ($q, $id) => $q->where('author_id', $id))
            ->when($filters['tag'] ?? null, fn ($q, $t) => $q->byTag($t))
            ->when($filters['overdue'] ?? false, fn ($q) => $q->overdue())
            ->when($filters['trashed'] ?? false, fn ($q) => $q->withTrashed());

        $query = $this->sort(
            $query,
            $filters['sort_by'] ?? 'created_at',
            $filters['sort_direction'] ?? 'desc',
            ['title', 'status', 'priority', 'due_date', 'created_at', 'updated_at'],
        );

        return $this->paginate($query, $filters['per_page'] ?? null);
    }

    public function create(array $data): Task
    {
        return DB::transaction(function () use ($data) {
            $task = Task::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'tags' => $data['tags'] ?? [],
                'due_date' => $data['due_date'] ?? null,
                'estimated_hours' => $data['estimated_hours'] ?? null,
                'project_id' => $data['project_id'],
                'author_id' => auth()->id(),
            ]);

            if (isset($data['dependency_ids']) && !empty($data['dependency_ids'])) {
                $task->dependencies()->attach($data['dependency_ids']);
            }

            $assigneeIds = $data['assignee_ids'] ?? [];
            if (isset($data['assignee_id']) && !empty($data['assignee_id'])) {
                $assigneeIds[] = $data['assignee_id'];
            }
            $assigneeIds = array_unique(array_filter($assigneeIds));

            if (!empty($assigneeIds)) {
                $task->assignees()->attach($assigneeIds);
                
                $task->load('assignees');
                foreach ($task->assignees as $assignee) {
                    if ($assignee->id !== auth()->id()) {
                        $assignee->notify(new TaskAssignedNotification($task, auth()->user()));
                    }
                }
            }

            log_activity($task, 'Task created', [
                'title' => $task->title,
                'project_id' => $task->project_id,
                'priority' => $task->priority?->value,
                'created_by' => auth()->user()?->name,
            ]);

            return $task->load(['author', 'assignees', 'project', 'dependencies']);
        });
    }

    public function update(Task $task, array $data): Task
    {
        return DB::transaction(function () use ($task, $data) {
            if (auth()->check() && auth()->user()->role === \App\Enums\UserRole::Employee) {
                unset($data['due_date']);
            }

            $changed = [];
            $fields = ['title', 'description', 'priority', 'tags', 'due_date', 'estimated_hours', 'requires_approval', 'approver_id', 'employee_eta'];

            foreach ($fields as $field) {
                if (array_key_exists($field, $data) && $task->{$field} != $data[$field]) {
                    $changed[$field] = ['old' => $task->{$field}, 'new' => $data[$field]];
                }
            }

            $oldStatus = $task->status;

            $task->update($data);

            if (isset($data['dependency_ids'])) {
                $task->dependencies()->sync($data['dependency_ids']);
                $changed['dependencies'] = true;
            }

            if (isset($data['assignee_ids']) || isset($data['assignee_id'])) {
                $assigneeIds = $data['assignee_ids'] ?? [];
                if (isset($data['assignee_id'])) {
                    if (!empty($data['assignee_id'])) {
                        $assigneeIds[] = $data['assignee_id'];
                    }
                }
                $assigneeIds = array_unique(array_filter($assigneeIds));

                $oldAssignees = $task->assignees->pluck('id')->toArray();
                $task->assignees()->sync($assigneeIds);
                
                $newAssignees = $task->assignees()->get();
                $newAssigneeIds = $newAssignees->pluck('id')->toArray();
                
                sort($oldAssignees);
                sort($newAssigneeIds);
                
                if ($oldAssignees !== $newAssigneeIds) {
                    $changed['assignees'] = true;
                    $added = array_diff($newAssigneeIds, $oldAssignees);
                    
                    foreach ($newAssignees as $assignee) {
                        if (in_array($assignee->id, $added) && $assignee->id !== auth()->id()) {
                            $assignee->notify(new TaskAssignedNotification($task, auth()->user()));
                        }
                    }
                }
            }

            if (isset($data['status'])) {
                $newStatus = $data['status'] instanceof TaskStatus ? $data['status'] : TaskStatus::from($data['status']);
                $task = $this->updateStatusAction->execute($task, $newStatus);
                if ($oldStatus !== $newStatus) {
                    foreach ($task->assignees as $assignee) {
                        if ($assignee->id !== auth()->id()) {
                            $assignee->notify(new TaskStatusChangedNotification($task, auth()->user()));
                        }
                    }
                }
            }

            if (!empty($changed)) {
                log_activity($task, 'Task updated', [
                    'changes' => $changed,
                    'updated_by' => auth()->user()?->name,
                ]);
            }

            return $task->fresh()->load(['author', 'assignees', 'project', 'dependencies']);
        });
    }

    public function delete(Model|int|string $idOrModel): void
    {
        $task = $idOrModel instanceof Task ? $idOrModel : $this->find($idOrModel);

        DB::transaction(function () use ($task) {
            $task->delete();

            log_activity($task, 'Task deleted', [
                'title' => $task->title,
                'deleted_by' => auth()->user()?->name,
            ]);
        });
    }

    public function updateStatus(Task $task, TaskStatus $status): Task
    {
        return DB::transaction(function () use ($task, $status) {
            $oldStatus = $task->status;
            $task = $this->updateStatusAction->execute($task, $status);

            if ($oldStatus !== $status) {
                foreach ($task->assignees as $assignee) {
                    if ($assignee->id !== auth()->id()) {
                        $assignee->notify(new TaskStatusChangedNotification($task, auth()->user()));
                    }
                }
            }

            return $task->load(['author', 'assignees', 'project', 'dependencies']);
        });
    }

    public function submitForReview(Task $task): Task
    {
        if (!$task->requires_approval) {
            throw new BusinessException(__('tasks.approval_not_required'));
        }

        return DB::transaction(function () use ($task) {
            $task = $this->updateStatusAction->execute($task, TaskStatus::InReview);

            if ($task->approver_id && $task->approver_id !== auth()->id()) {
                $task->approver->notify(new TaskPendingReviewNotification($task, auth()->user()));
            }

            log_activity($task, 'Task submitted for review', [
                'submitted_by' => auth()->user()?->name,
            ]);

            return $task->load(['author', 'assignees', 'approver', 'project']);
        });
    }

    public function approve(Task $task): Task
    {
        return DB::transaction(function () use ($task) {
            $task = $this->updateStatusAction->execute($task, TaskStatus::Approved);
            $task->update(['approved_at' => now(), 'rejection_reason' => null]);

            foreach ($task->assignees as $assignee) {
                if ($assignee->id !== auth()->id()) {
                    $assignee->notify(new TaskApprovedNotification($task, auth()->user()));
                }
            }

            log_activity($task, 'Task approved', [
                'approved_by' => auth()->user()?->name,
            ]);

            return $task->fresh()->load(['author', 'assignees', 'approver', 'project']);
        });
    }

    public function reject(Task $task, string $reason): Task
    {
        return DB::transaction(function () use ($task, $reason) {
            $task = $this->updateStatusAction->execute($task, TaskStatus::InProgress);
            $task->update(['rejection_reason' => $reason]);

            foreach ($task->assignees as $assignee) {
                if ($assignee->id !== auth()->id()) {
                    $assignee->notify(new TaskRejectedNotification($task, auth()->user(), $reason));
                }
            }

            log_activity($task, 'Task rejected', [
                'reason' => $reason,
                'rejected_by' => auth()->user()?->name,
            ]);

            return $task->fresh()->load(['author', 'assignees', 'approver', 'project']);
        });
    }

    public function assign(Task $task, User $user): Task
    {
        return DB::transaction(function () use ($task, $user) {
            if (!$task->assignees()->where('users.id', $user->id)->exists()) {
                $task->assignees()->attach($user->id);
                
                if ($user->id !== auth()->id()) {
                    $user->notify(new TaskAssignedNotification($task, auth()->user()));
                }

                log_activity($task, 'Task assigned', [
                    'new_assignee' => $user->name,
                    'assigned_by' => auth()->user()?->name,
                ]);
            }

            return $task->fresh()->load(['author', 'assignees', 'project']);
        });
    }

    public function addDependency(Task $task, Task $dependency): void
    {
        if ($task->id === $dependency->id) {
            throw new BusinessException(__('tasks.cannot_depend_on_self'));
        }

        if ($task->dependencies()->where('dependency_id', $dependency->id)->exists()) {
            return;
        }

        $task->dependencies()->attach($dependency->id);

        log_activity($task, 'Dependency added', [
            'dependency_title' => $dependency->title,
            'dependency_id' => $dependency->id,
        ]);
    }

    public function removeDependency(Task $task, Task $dependency): void
    {
        $task->dependencies()->detach($dependency->id);

        log_activity($task, 'Dependency removed', [
            'dependency_title' => $dependency->title,
            'dependency_id' => $dependency->id,
        ]);
    }

    public function block(Task $task, string $reason): Task
    {
        return DB::transaction(function () use ($task, $reason) {
            $task->update([
                'status' => TaskStatus::Blocked,
                'blocked_reason' => $reason,
            ]);

            log_activity($task, 'Task blocked', [
                'reason' => $reason,
                'blocked_by' => auth()->user()?->name,
            ]);

            foreach ($task->assignees as $assignee) {
                if ($assignee->id !== auth()->id()) {
                    $assignee->notify(new TaskStatusChangedNotification($task, auth()->user()));
                }
            }

            return $task->fresh()->load(['author', 'assignees', 'project']);
        });
    }

    public function unblock(Task $task): Task
    {
        return DB::transaction(function () use ($task) {
            $task->update([
                'status' => TaskStatus::Todo,
                'blocked_reason' => null,
            ]);

            log_activity($task, 'Task unblocked', [
                'unblocked_by' => auth()->user()?->name,
            ]);

            foreach ($task->assignees as $assignee) {
                if ($assignee->id !== auth()->id()) {
                    $assignee->notify(new TaskStatusChangedNotification($task, auth()->user()));
                }
            }

            return $task->fresh()->load(['author', 'assignees', 'project']);
        });
    }

    public function createSubtask(Task $parent, array $data): Task
    {
        return DB::transaction(function () use ($parent, $data) {
            $subtask = Task::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'due_date' => $data['due_date'] ?? null,
                'estimated_hours' => $data['estimated_hours'] ?? null,
                'project_id' => $parent->project_id,
                'parent_id' => $parent->id,
                'author_id' => auth()->id(),
            ]);

            if (isset($data['assignee_ids'])) {
                $subtask->assignees()->sync($data['assignee_ids']);
                
                foreach ($subtask->assignees as $assignee) {
                    if ($assignee->id !== auth()->id()) {
                        $assignee->notify(new TaskAssignedNotification($subtask, auth()->user()));
                    }
                }
            }

            log_activity($parent, 'Subtask created', [
                'subtask_title' => $subtask->title,
                'subtask_id' => $subtask->id,
                'created_by' => auth()->user()?->name,
            ]);

            return $subtask->load(['author', 'assignees']);
        });
    }

    public function updateSubtask(Task $subtask, array $data): Task
    {
        return DB::transaction(function () use ($subtask, $data) {
            $changed = [];
            $fields = ['title', 'description', 'priority', 'due_date', 'estimated_hours'];

            foreach ($fields as $field) {
                if (array_key_exists($field, $data) && $subtask->{$field} != $data[$field]) {
                    $changed[$field] = ['old' => $subtask->{$field}, 'new' => $data[$field]];
                }
            }

            $subtask->update($data);

            if (isset($data['assignee_ids'])) {
                $oldAssignees = $subtask->assignees->pluck('id')->toArray();
                $subtask->assignees()->sync($data['assignee_ids']);
                
                $newAssignees = $subtask->assignees()->get();
                $newAssigneeIds = $newAssignees->pluck('id')->toArray();
                
                sort($oldAssignees);
                sort($newAssigneeIds);
                
                if ($oldAssignees !== $newAssigneeIds) {
                    $changed['assignees'] = true;
                    $added = array_diff($newAssigneeIds, $oldAssignees);
                    
                    foreach ($newAssignees as $assignee) {
                        if (in_array($assignee->id, $added) && $assignee->id !== auth()->id()) {
                            $assignee->notify(new TaskAssignedNotification($subtask, auth()->user()));
                        }
                    }
                }
            }

            if (!empty($changed)) {
                log_activity($subtask->parent, 'Subtask updated', [
                    'subtask_id' => $subtask->id,
                    'subtask_title' => $subtask->title,
                    'changes' => $changed,
                    'updated_by' => auth()->user()?->name,
                ]);
            }

            return $subtask->fresh()->load(['author', 'assignees']);
        });
    }

    public function deleteSubtask(Task $subtask): void
    {
        DB::transaction(function () use ($subtask) {
            $parent = $subtask->parent;
            $subtask->delete();

            log_activity($parent, 'Subtask deleted', [
                'subtask_title' => $subtask->title,
                'subtask_id' => $subtask->id,
                'deleted_by' => auth()->user()?->name,
            ]);
        });
    }

    public function getProjectTasks(int $projectId, array $filters = []): LengthAwarePaginator
    {
        $filters['project_id'] = $projectId;

        return $this->list($filters);
    }

    public function getAllTags(int $projectId = null): array
    {
        $query = Task::query();

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        return $query->whereNotNull('tags')
            ->get()
            ->pluck('tags')
            ->flatten()
            ->unique()
            ->sort()
            ->values()
            ->toArray();
    }
}
