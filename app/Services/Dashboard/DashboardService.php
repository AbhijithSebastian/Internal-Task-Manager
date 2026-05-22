<?php

namespace App\Services\Dashboard;

use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\Comment;
use App\Models\Mention;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class DashboardService
{

    public function getStats(User $user): array
    {
        $projectIds = $user->projects()->pluck('projects.id');

        return [
            'active_projects' => Project::whereIn('id', $projectIds)
                ->where('status', 'active')->count(),
            'total_tasks' => Task::whereIn('project_id', $projectIds)
                ->whereNull('parent_id')->count(),
            'assigned_tasks' => Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
                ->whereNull('parent_id')->count(),
            'completed_tasks' => Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
                ->where('status', TaskStatus::Done)->whereNull('parent_id')->count(),
            'overdue_tasks' => Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
                ->overdue()->whereNull('parent_id')->count(),
            'in_review_tasks' => Task::whereIn('project_id', $projectIds)
                ->where('status', TaskStatus::InReview)->whereNull('parent_id')->count(),
        ];
    }

    public function getRoleSpecificData(User $user): array
    {
        return match ($user->role) {
            UserRole::Employee => $this->getEmployeeData($user),
            UserRole::ProjectManager => $this->getPmData($user),
            UserRole::TeamLead => $this->getTeamLeadData($user),
            UserRole::SuperAdmin => $this->getAdminData($user),
            default => $this->getEmployeeData($user),
        };
    }

    private function getEmployeeData(User $user): array
    {
        return [
            'my_tasks' => Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
                ->whereNull('parent_id')
                ->pending()
                ->with('project')
                ->orderBy('due_date')
                ->limit(10)
                ->get(),
            'overdue_tasks' => Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
                ->whereNull('parent_id')
                ->overdue()
                ->with('project')
                ->orderBy('due_date')
                ->limit(10)
                ->get(),
            'mentions' => Mention::where('user_id', $user->id)
                ->with('mentionable')
                ->latest()
                ->limit(5)
                ->get(),
            'pending_approvals' => Task::where('author_id', $user->id)
                ->where('requires_approval', true)
                ->where('status', TaskStatus::InReview)
                ->with('project', 'approver')
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    private function getPmData(User $user): array
    {
        $projectIds = Project::where('pm_id', $user->id)->pluck('id');

        return [
            'active_projects' => Project::whereIn('id', $projectIds)
                ->active()
                ->withCount(['tasks as total_tasks' => fn ($q) => $q->whereNull('parent_id')])
                ->withCount(['tasks as completed_tasks' => fn ($q) => $q->whereNull('parent_id')->where('status', TaskStatus::Done)])
                ->get(),
            'delayed_tasks' => Task::whereIn('project_id', $projectIds)
                ->whereNull('parent_id')
                ->overdue()
                ->with('project', 'assignees')
                ->orderBy('due_date')
                ->limit(10)
                ->get(),
            'pending_approvals' => Task::whereIn('project_id', $projectIds)
                ->where('requires_approval', true)
                ->where('status', TaskStatus::InReview)
                ->with('project', 'assignees', 'author')
                ->latest()
                ->limit(10)
                ->get(),
            'workload' => User::whereHas('projects', fn ($q) => $q->whereIn('project_id', $projectIds))
                ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()])
                ->withCount(['tasks as overdue_tasks' => fn ($q) => $q->whereNull('parent_id')->overdue()])
                ->get(),
        ];
    }

    private function getTeamLeadData(User $user): array
    {
        $projectIds = Project::where('lead_id', $user->id)->pluck('id');

        return [
            'team_workload' => User::whereHas('projects', fn ($q) => $q->whereIn('project_id', $projectIds))
                ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()])
                ->withCount(['tasks as overdue_tasks' => fn ($q) => $q->whereNull('parent_id')->overdue()])
                ->get(),
            'review_tasks' => Task::whereIn('project_id', $projectIds)
                ->where('status', TaskStatus::InReview)
                ->with('project', 'assignees')
                ->latest()
                ->limit(10)
                ->get(),
            'blocked_tasks' => Task::whereIn('project_id', $projectIds)
                ->where('status', TaskStatus::Blocked)
                ->with('project', 'assignees')
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    private function getAdminData(User $user): array
    {
        $projectProgress = Project::withCount([
            'tasks as total_tasks' => fn ($q) => $q->whereNull('parent_id'),
            'tasks as completed_tasks' => fn ($q) => $q->whereNull('parent_id')->where('status', TaskStatus::Done),
        ])->get()->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'total_tasks' => (int) $p->total_tasks,
            'completed_tasks' => (int) $p->completed_tasks,
            'completion_rate' => $p->total_tasks > 0
                ? round(($p->completed_tasks / $p->total_tasks) * 100, 1)
                : 0,
        ]);

        $statusCounts = Task::whereNull('parent_id')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'project_progress' => $projectProgress,
            'status_distribution' => collect(TaskStatus::cases())->map(fn ($s) => [
                'status' => $s->value,
                'label' => $s->label(),
                'count' => (int) ($statusCounts[$s->value] ?? 0),
            ])->values(),
            'tasks_over_time' => Task::whereNull('parent_id')
                ->where('created_at', '>=', now()->subMonth())
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
            'team_workload' => User::active()
                ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()])
                ->withCount(['tasks as overdue_tasks' => fn ($q) => $q->whereNull('parent_id')->overdue()])
                ->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'pending_tasks' => (int) $u->pending_tasks, 'overdue_tasks' => (int) $u->overdue_tasks]),
        ];
    }

    public function getUpcomingDeadlines(User $user, int $days = 7): \Illuminate\Database\Eloquent\Collection
    {
        return Task::whereHas('assignees', fn ($q) => $q->where('users.id', $user->id))
            ->whereNull('parent_id')
            ->whereBetween('due_date', [now(), now()->addDays($days)])
            ->whereNotIn('status', [TaskStatus::Done, TaskStatus::Cancelled])
            ->with(['project'])
            ->orderBy('due_date')
            ->limit(10)
            ->get();
    }

    public function getRecentActivities(User $user, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        $projectIds = $user->projects()->pluck('projects.id');

        return \Spatie\Activitylog\Models\Activity::whereIn('subject_id', function ($query) use ($projectIds) {
            $query->select('id')->from('tasks')->whereIn('project_id', $projectIds);
        })
            ->where('subject_type', (new \App\Models\Task)->getMorphClass())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
