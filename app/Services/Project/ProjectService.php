<?php

namespace App\Services\Project;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectAssignedNotification;
use App\Services\BaseService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProjectService extends BaseService
{
    protected function model(): string
    {
        return Project::class;
    }

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Project::query()
            ->with(['author', 'members', 'projectManager', 'teamLead'])
            ->withCount(['tasks', 'members'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->search($s))
            ->when($filters['status'] ?? null, fn ($q, $s) => match ($s) {
                'active' => $q->active(),
                'archived' => $q->archived(),
                default => $q->where('status', $s),
            })
            ->when($filters['priority'] ?? null, fn ($q, $p) => $q->where('priority', $p))
            ->when($filters['member_id'] ?? null, fn ($q, $id) => $q->byMember($id))
            ->when($filters['pm_id'] ?? null, fn ($q, $id) => $q->where('pm_id', $id))
            ->when($filters['lead_id'] ?? null, fn ($q, $id) => $q->where('lead_id', $id))
            ->when($filters['trashed'] ?? false, fn ($q) => $q->withTrashed());

        $query = $this->sort(
            $query,
            $filters['sort_by'] ?? 'created_at',
            $filters['sort_direction'] ?? 'desc',
            ['name', 'status', 'priority', 'start_date', 'end_date', 'created_at'],
        );

        return $this->paginate($query, $filters['per_page'] ?? null);
    }

    public function get(int $id): Project
    {
        return Project::with([
            'author',
            'members',
            'projectManager',
            'teamLead',
            'tasks' => fn ($q) => $q->whereNull('parent_id')->with(['assignees', 'author'])->latest(),
        ])
            ->withCount(['tasks', 'members'])
            ->withTrashed()
            ->findOrFail($id);
    }

    public function create(array $data): Project
    {
        return DB::transaction(function () use ($data) {
            $project = Project::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'pm_id' => $data['pm_id'] ?? null,
                'lead_id' => $data['lead_id'] ?? null,
                'figma_url' => $data['figma_url'] ?? null,
                'github_url' => $data['github_url'] ?? null,
                'docs_url' => $data['docs_url'] ?? null,
                'meeting_url' => $data['meeting_url'] ?? null,
                'author_id' => auth()->id(),
            ]);

            $project->members()->attach(auth()->id(), ['role' => 'owner']);

            if (isset($data['member_ids'])) {
                $members = collect($data['member_ids'])->mapWithKeys(fn ($id) => [$id => ['role' => 'member']]);
                $project->members()->syncWithoutDetaching($members);
            }

            $this->notifyAssignment($project, $data['pm_id'] ?? null, 'Project Manager');
            $this->notifyAssignment($project, $data['lead_id'] ?? null, 'Team Lead');

            log_activity($project, 'Project created', [
                'name' => $project->name,
                'priority' => $project->priority,
                'created_by' => auth()->user()?->name,
            ]);

            return $project->load(['author', 'members', 'projectManager', 'teamLead']);
        });
    }

    public function update(Project $project, array $data): Project
    {
        return DB::transaction(function () use ($project, $data) {
            $changed = [];

            foreach (['name', 'description', 'status', 'priority', 'start_date', 'end_date',
                'figma_url', 'github_url', 'docs_url', 'meeting_url', 'pm_id', 'lead_id'] as $field) {
                if (array_key_exists($field, $data) && $project->{$field} != $data[$field]) {
                    $changed[$field] = ['old' => $project->{$field}, 'new' => $data[$field]];
                }
            }

            $oldStatus = $project->status;
            $oldPmId = $project->pm_id;
            $oldLeadId = $project->lead_id;

            $project->update($data);

            if ($project->pm_id && $project->pm_id !== $oldPmId) {
                $pm = User::find($project->pm_id);
                if ($pm) {
                    $pm->notify(new ProjectAssignedNotification($project, 'Project Manager', auth()->user()));
                }
            }

            if ($project->lead_id && $project->lead_id !== $oldLeadId) {
                $lead = User::find($project->lead_id);
                if ($lead) {
                    $lead->notify(new ProjectAssignedNotification($project, 'Team Lead', auth()->user()));
                }
            }

            if ($oldStatus !== $project->status) {
                log_activity($project, 'Project status changed', [
                    'old_status' => $oldStatus?->value,
                    'new_status' => $project->status?->value,
                    'changed_by' => auth()->user()?->name,
                ]);
            }

            if (!empty($changed)) {
                log_activity($project, 'Project updated', [
                    'changes' => $changed,
                    'updated_by' => auth()->user()?->name,
                ]);
            }

            return $project->fresh()->load(['author', 'members', 'projectManager', 'teamLead']);
        });
    }

    public function delete(Model|int|string $idOrModel): void
    {
        $project = $idOrModel instanceof Project ? $idOrModel : $this->find($idOrModel);

        DB::transaction(function () use ($project) {
            $project->delete();

            log_activity($project, 'Project deleted', [
                'name' => $project->name,
                'deleted_by' => auth()->user()?->name,
            ]);
        });
    }

    public function archive(Project $project): Project
    {
        return DB::transaction(function () use ($project) {
            $project->update(['status' => ProjectStatus::Archived]);

            log_activity($project, 'Project archived', [
                'archived_by' => auth()->user()?->name,
            ]);

            return $project->fresh()->load(['author', 'members', 'projectManager', 'teamLead']);
        });
    }

    public function restore(int $projectId): Project
    {
        return DB::transaction(function () use ($projectId) {
            $project = Project::withTrashed()->findOrFail($projectId);
            $project->restore();

            log_activity($project, 'Project restored', [
                'name' => $project->name,
                'restored_by' => auth()->user()?->name,
            ]);

            return $project->load('author', 'members');
        });
    }

    public function updateStatus(Project $project, ProjectStatus $status): Project
    {
        return DB::transaction(function () use ($project, $status) {
            $oldStatus = $project->status;
            $project->update(['status' => $status]);

            log_activity($project, 'Project status changed', [
                'old' => $oldStatus?->value,
                'new' => $status->value,
                'changed_by' => auth()->user()?->name,
            ]);

            return $project->fresh()->load(['author', 'members', 'projectManager', 'teamLead']);
        });
    }

    public function getMembers(Project $project): \Illuminate\Support\Collection
    {
        return $project->members()->withPivot('role')->get();
    }

    public function addMember(Project $project, User $user, string $role = 'member'): void
    {
        DB::transaction(function () use ($project, $user, $role) {
            $project->members()->syncWithoutDetaching([$user->id => ['role' => $role]]);

            log_activity($project, 'Member added', [
                'member' => $user->name,
                'role' => $role,
                'added_by' => auth()->user()?->name,
            ]);
        });
    }

    public function updateMemberRole(Project $project, User $user, string $role): void
    {
        DB::transaction(function () use ($project, $user, $role) {
            $oldRole = $project->members()->where('user_id', $user->id)->first()?->pivot->role;
            $project->members()->updateExistingPivot($user->id, ['role' => $role]);

            log_activity($project, 'Member role updated', [
                'member' => $user->name,
                'old_role' => $oldRole,
                'new_role' => $role,
                'updated_by' => auth()->user()?->name,
            ]);
        });
    }

    public function removeMember(Project $project, User $user): void
    {
        DB::transaction(function () use ($project, $user) {
            $project->members()->detach($user->id);

            log_activity($project, 'Member removed', [
                'member' => $user->name,
                'removed_by' => auth()->user()?->name,
            ]);
        });
    }

    public function getBoardData(Project $project): array
    {
        $statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
        $tasks = $project->tasks()
            ->whereNull('parent_id')
            ->with(['assignees', 'author'])
            ->get();

        $columns = [];
        foreach ($statuses as $status) {
            $columns[$status] = $tasks->filter(fn ($t) => $t->status === $status)->values();
        }

        return $columns;
    }

    public function getTimelineData(Project $project): array
    {
        $tasks = $project->tasks()
            ->whereNull('parent_id')
            ->with(['assignees'])
            ->orderBy('due_date')
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'created_at']);

        $upcoming = $tasks->filter(fn ($t) => $t->due_date && $t->due_date >= now()->startOfDay())->values();
        $overdue = $tasks->filter(fn ($t) => $t->due_date && $t->due_date < now()->startOfDay() && $t->status !== 'done')->values();
        $completed = $tasks->filter(fn ($t) => $t->status === 'done')->values();

        return [
            'upcoming' => $upcoming,
            'overdue' => $overdue,
            'completed' => $completed,
        ];
    }

    private function notifyAssignment(Project $project, ?int $userId, string $role): void
    {
        if (!$userId) {
            return;
        }

        $user = User::find($userId);
        if ($user) {
            $user->notify(new ProjectAssignedNotification($project, $role, auth()->user()));
        }
    }
}
