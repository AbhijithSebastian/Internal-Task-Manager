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

        $commentQuery = Comment::whereBetween('created_at', [$dateFrom, $dateTo]);
        if ($projectIds = $filters['project_ids'] ?? null) {
            $commentQuery->whereIn('project_id', $projectIds);
        }

        return collect([[
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'tasks_created' => $tasksCreated,
            'tasks_completed' => $tasksCompleted,
            'comments_added' => $commentQuery->count(),
        ]]);
    }

    // ── Helpers ──

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
        $query = \App\Models\MeetingLog::query()->with(['project', 'author']);

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
            'author_name' => $l->author?->name,
        ]);
    }
}
