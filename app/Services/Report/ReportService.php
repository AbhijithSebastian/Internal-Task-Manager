<?php

namespace App\Services\Report;

use App\Enums\TaskStatus;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\Contracts\ReportServiceInterface;
use Illuminate\Support\Collection;

class ReportService implements ReportServiceInterface
{
    public function taskCompletion(array $filters = []): Collection
    {
        $query = Project::query()
            ->withCount(['tasks as total_tasks' => fn ($q) => $q->whereNull('parent_id')])
            ->withCount(['tasks as completed_tasks' => fn ($q) => $q->whereNull('parent_id')->where('status', TaskStatus::Done)])
            ->withCount(['tasks as pending_tasks' => fn ($q) => $q->whereNull('parent_id')->pending()]);

        $this->applyProjectFilter($query, $filters);

        return $query->get()->map(fn ($p) => [
            'project_id' => $p->id,
            'project_name' => $p->name,
            'total_tasks' => $p->total_tasks,
            'completed_tasks' => $p->completed_tasks,
            'pending_tasks' => $p->pending_tasks,
            'completion_rate' => $p->total_tasks > 0
                ? round(($p->completed_tasks / $p->total_tasks) * 100, 1)
                : 0,
        ]);
    }

    public function overdueAnalysis(array $filters = []): Collection
    {
        $query = Task::whereNull('parent_id')
            ->overdue()
            ->with(['project', 'assignees']);

        $this->applyProjectFilter($query, $filters, 'project_id');

        if ($userId = $filters['user_id'] ?? null) {
            $query->whereHas('assignees', fn ($q) => $q->where('users.id', $userId));
        }

        return $query->get()->map(fn ($t) => [
            'task_id' => $t->id,
            'task_title' => $t->title,
            'project_name' => $t->project?->name,
            'assignee_name' => $t->assignees->pluck('name')->implode(', '),
            'due_date' => $t->due_date?->format('Y-m-d'),
            'days_overdue' => now()->startOfDay()->diffInDays($t->due_date),
            'priority' => $t->priority?->value,
            'priority_label' => $t->priority?->label(),
        ])->sortByDesc('days_overdue')->values();
    }

    public function teamProductivity(array $filters = []): Collection
    {
        $query = User::query()->active()
            ->withCount(['tasks as completed_tasks' => fn ($q) => $q
                ->whereNull('parent_id')
                ->where('status', TaskStatus::Done)
                ->when($filters['date_from'] ?? null, fn ($q, $d) => $q->whereDate('tasks.updated_at', '>=', $d))
                ->when($filters['date_to'] ?? null, fn ($q, $d) => $q->whereDate('tasks.updated_at', '<=', $d))
            ]);

        if ($projectIds = $filters['project_ids'] ?? null) {
            $query->whereHas('tasks', fn ($q) => $q->whereIn('project_id', $projectIds));
        }

        if ($userId = $filters['user_id'] ?? null) {
            $query->where('id', $userId);
        }

        return $query->get()
            ->map(fn ($u) => [
                'user_id' => $u->id,
                'user_name' => $u->name,
                'completed_tasks' => $u->completed_tasks,
            ])
            ->filter(fn ($r) => $r['completed_tasks'] > 0)
            ->sortByDesc('completed_tasks')
            ->values();
    }

    public function projectHealth(array $filters = []): Collection
    {
        $query = Project::query()
            ->withCount(['tasks as total_tasks' => fn ($q) => $q->whereNull('parent_id')])
            ->withCount(['tasks as completed_tasks' => fn ($q) => $q->whereNull('parent_id')->where('status', TaskStatus::Done)])
            ->withCount(['tasks as blocked_tasks' => fn ($q) => $q->whereNull('parent_id')->where('status', TaskStatus::Blocked)])
            ->withCount(['tasks as overdue_tasks' => fn ($q) => $q->whereNull('parent_id')->overdue()])
            ->withCount(['tasks as in_progress_tasks' => fn ($q) => $q->whereNull('parent_id')->where('status', TaskStatus::InProgress)]);

        $this->applyProjectFilter($query, $filters);

        return $query->get()->map(fn ($p) => [
            'project_id' => $p->id,
            'project_name' => $p->name,
            'total_tasks' => $p->total_tasks,
            'completed_tasks' => $p->completed_tasks,
            'blocked_tasks' => $p->blocked_tasks,
            'overdue_tasks' => $p->overdue_tasks,
            'in_progress_tasks' => $p->in_progress_tasks,
            'completion_rate' => $p->total_tasks > 0
                ? round(($p->completed_tasks / $p->total_tasks) * 100, 1)
                : 0,
            'health_score' => $this->calculateHealthScore($p),
        ]);
    }

    public function workloadDistribution(array $filters = []): Collection
    {
        $query = User::query()->active();

        if ($projectIds = $filters['project_ids'] ?? null) {
            $query->whereHas('tasks', fn ($q) => $q->whereIn('project_id', $projectIds)->whereNull('parent_id'));
        }

        if ($userId = $filters['user_id'] ?? null) {
            $query->where('id', $userId);
        }

        foreach (TaskStatus::cases() as $status) {
            $query->withCount(["tasks as {$status->value}_tasks" => fn ($q) => $q
                ->whereNull('parent_id')
                ->where('status', $status)
                ->when($projectIds ?? null, fn ($q) => $q->whereIn('project_id', $projectIds))
            ]);
        }

        return $query->get()->map(function ($u) {
            $row = ['user_id' => $u->id, 'user_name' => $u->name];
            $total = 0;
            foreach (TaskStatus::cases() as $status) {
                $count = $u->{"{$status->value}_tasks"} ?? 0;
                $row["{$status->value}_tasks"] = $count;
                $total += $count;
            }
            $row['total_tasks'] = $total;
            return $row;
        })->sortByDesc('total_tasks')->values();
    }

    public function weeklySummary(array $filters = []): Collection
    {
        $dateFrom = $filters['date_from'] ?? now()->startOfWeek()->toDateString();
        $dateTo = $filters['date_to'] ?? now()->endOfWeek()->toDateString();

        $taskBase = Task::whereNull('parent_id')
            ->whereBetween('created_at', [$dateFrom, $dateTo]);

        $this->applyProjectFilter($taskBase, $filters, 'project_id');

        $tasksCreated = (clone $taskBase)->count();
        $tasksCompleted = (clone $taskBase)->where('status', TaskStatus::Done)->count();

        $overdueQuery = Task::whereNull('parent_id')->overdue();
        $this->applyProjectFilter($overdueQuery, $filters, 'project_id');
        $tasksOverdue = $overdueQuery->count();

        $commentQuery = Comment::whereBetween('created_at', [$dateFrom, $dateTo]);
        if ($projectIds = $filters['project_ids'] ?? null) {
            $commentQuery->whereIn('project_id', $projectIds);
        }

        return collect([[
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'tasks_created' => $tasksCreated,
            'tasks_completed' => $tasksCompleted,
            'tasks_overdue' => $tasksOverdue,
            'comments_added' => $commentQuery->count(),
        ]]);
    }

    // ── Helpers ──

    private function calculateHealthScore(Project $project): int
    {
        if ($project->total_tasks === 0) {
            return 100;
        }

        $completionWeight = 0.4;
        $blockedWeight = 0.3;
        $overdueWeight = 0.3;

        $completionScore = ($project->completed_tasks / $project->total_tasks) * 100;
        $blockedRatio = $project->blocked_tasks / max($project->total_tasks, 1);
        $overdueRatio = $project->overdue_tasks / max($project->total_tasks, 1);

        $blockedScore = max(0, 100 - ($blockedRatio * 100));
        $overdueScore = max(0, 100 - ($overdueRatio * 100));

        return (int) round(
            ($completionScore * $completionWeight) +
            ($blockedScore * $blockedWeight) +
            ($overdueScore * $overdueWeight)
        );
    }

    private function applyProjectFilter($query, array $filters, string $column = 'id'): void
    {
        if ($projectIds = $filters['project_ids'] ?? null) {
            $query->whereIn($column, $projectIds);
        }

        if ($projectId = $filters['project_id'] ?? null) {
            $query->where($column, $projectId);
        }
    }

    public function meetingLogs(array $filters = []): Collection
    {
        $query = \App\Models\MeetingLog::query()->with('project');

        if ($projectId = $filters['project_id'] ?? null) {
            $query->where('project_id', $projectId);
        } elseif ($projectIds = $filters['project_ids'] ?? null) {
            $query->whereIn('project_id', $projectIds);
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('meeting_date', '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('meeting_date', '<=', $dateTo);
        }

        return $query->latest('meeting_date')->get()->map(fn ($l) => [
            'meeting_id' => $l->id,
            'project_name' => $l->project?->name ?? 'N/A',
            'date' => $l->meeting_date?->format('Y-m-d'),
            'title' => $l->title,
            'attendees' => is_array($l->attendees) ? implode(', ', $l->attendees) : ($l->attendees ?? ''),
            'summary' => $l->summary,
            'decisions_taken' => $l->decisions_taken ?? '',
            'blockers' => $l->blockers ?? '',
            'action_items' => $l->action_items ?? '',
            'notes' => $l->notes ?? '',
        ]);
    }
}
