<?php

namespace App\Services\Dashboard;

use App\Enums\ProjectStatus;
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

        $now = now();
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        $prevWeekStart = $now->copy()->subWeek()->startOfWeek();
        $prevWeekEnd = $now->copy()->subWeek()->endOfWeek();

        $activeProjects = Project::whereIn('id', $projectIds)->where('status', 'active');
        $tasksDueThisWeek = Task::whereIn('project_id', $projectIds)
            ->whereNull('parent_id')
            ->whereBetween('due_date', [$weekStart, $weekEnd]);
        $inReviewTasks = Task::whereIn('project_id', $projectIds)
            ->where('status', TaskStatus::InReview)->whereNull('parent_id');
        // Previous week values for trends
        $prevActiveProjects = Project::whereIn('id', $projectIds)->where('status', 'active')
            ->where('created_at', '<=', $prevWeekEnd);
        $prevTasksDueThisWeek = Task::whereIn('project_id', $projectIds)
            ->whereNull('parent_id')
            ->whereBetween('due_date', [$prevWeekStart, $prevWeekEnd]);
        $prevInReviewTasks = Task::whereIn('project_id', $projectIds)
            ->where('status', TaskStatus::InReview)->whereNull('parent_id')
            ->where('created_at', '<=', $prevWeekEnd);

        return [
            'active_projects' => $activeProjects->count(),
            'tasks_due_this_week' => $tasksDueThisWeek->count(),
            'pending_reviews' => $inReviewTasks->count(),
            'trends' => [
                'active_projects' => $this->calculateTrend($prevActiveProjects->count(), $activeProjects->count()),
                'tasks_due_this_week' => $this->calculateTrend($prevTasksDueThisWeek->count(), $tasksDueThisWeek->count()),
                'pending_reviews' => $this->calculateTrend($prevInReviewTasks->count(), $inReviewTasks->count()),
            ],
        ];
    }

    private function calculateTrend(int $previous, int $current): int
    {
        if ($previous === 0) {
            return $current > 0 ? 100 : 0;
        }
        return (int) round((($current - $previous) / $previous) * 100);
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
            'pending_approvals' => Task::whereIn('project_id', $projectIds)
                ->where('requires_approval', true)
                ->where('status', TaskStatus::InReview)
                ->with('project', 'assignees', 'author')
                ->latest()
                ->limit(10)
                ->get(),
            'workload' => User::whereHas('projects', fn ($q) => $q->whereIn('project_id', $projectIds))
                ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()])
                ->get(),
        ];
    }

    private function getTeamLeadData(User $user): array
    {
        $projectIds = Project::where('lead_id', $user->id)->pluck('id');

        return [
            'team_workload' => User::whereHas('projects', fn ($q) => $q->whereIn('project_id', $projectIds))
                ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()])
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
            'tasks_over_time' => \DB::table('tasks')
                ->whereNull('parent_id')
                ->where('created_at', '>=', now()->subMonth())
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
            'team_workload' => User::active()
                ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()])
                ->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'pending_tasks' => (int) $u->pending_tasks]),
            'pending_approvals' => Task::where('requires_approval', true)
                ->where('status', TaskStatus::InReview)
                ->with('project', 'assignees', 'author')
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }

    public function getCurrentProjects(User $user): \Illuminate\Database\Eloquent\Collection
    {
        if ($user->is_super_admin) {
            return Project::active()
                ->with(['projectManager'])
                ->withCount([
                    'tasks',
                    'tasks as completed_tasks_count' => fn ($q) => $q->where('status', TaskStatus::Done)
                ])
                ->orderBy('name')
                ->limit(10)
                ->get();
        }

        return Project::active()
            ->where(function ($query) use ($user) {
                $query->whereHas('members', fn ($q) => $q->where('users.id', $user->id))
                    ->orWhere('pm_id', $user->id)
                    ->orWhere('lead_id', $user->id);
            })
            ->with(['projectManager'])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', TaskStatus::Done)
            ])
            ->orderBy('name')
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
