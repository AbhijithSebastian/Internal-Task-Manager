<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Http\Requests\Report\ReportFilterRequest;
use App\Models\Project;
use App\Models\User;
use App\Services\Contracts\ReportServiceInterface;
use App\Services\Report\SimpleXlsxWriter;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportServiceInterface $reportService
    ) {}

    public function index(ReportFilterRequest $request): Response
    {
        $this->authorize(Permission::REPORTS_VIEW->value);

        $filters = $this->resolveFilters($request);

        return Inertia::render('Reports/Index', [
            'reports' => [
                'task_completion' => $this->reportService->taskCompletion($filters),
                'overdue_analysis' => $this->reportService->overdueAnalysis($filters),
                'team_productivity' => $this->reportService->teamProductivity($filters),
                'project_health' => $this->reportService->projectHealth($filters),
                'workload_distribution' => $this->reportService->workloadDistribution($filters),
                'weekly_summary' => $this->reportService->weeklySummary($filters),
                'meeting_logs' => $this->reportService->meetingLogs($filters),
            ],
            'filters' => $request->only(['tab', 'project_id', 'user_id', 'date_from', 'date_to']),
            'available_projects' => $this->getAvailableProjects(),
            'available_users' => User::active()->get(['id', 'name']),
        ]);
    }

    public function export(ReportFilterRequest $request): StreamedResponse|\Illuminate\Http\Response
    {
        $this->authorize(Permission::REPORTS_EXPORT->value);

        $filters = $this->resolveFilters($request);
        $type = $request->input('tab', 'task_completion');
        $format = $request->input('format', 'csv');

        $data = match ($type) {
            'task_completion' => $this->reportService->taskCompletion($filters),
            'overdue_analysis' => $this->reportService->overdueAnalysis($filters),
            'team_productivity' => $this->reportService->teamProductivity($filters),
            'project_health' => $this->reportService->projectHealth($filters),
            'workload_distribution' => $this->reportService->workloadDistribution($filters),
            'weekly_summary' => $this->reportService->weeklySummary($filters),
            'meeting_logs' => $this->reportService->meetingLogs($filters),
            default => $this->reportService->taskCompletion($filters),
        };

        return match ($format) {
            'xlsx' => $this->exportXlsx($data, $type),
            'html' => $this->exportHtml($data, $type),
            'pdf' => $this->exportPdf($data, $type),
            default => $this->exportCsv($data, $type),
        };
    }

    public function projectPreview(Project $project): \Illuminate\Http\JsonResponse
    {
        $this->authorize(Permission::REPORTS_VIEW->value);

        $project->load(['projectManager', 'teamLead', 'members']);

        $totalTasks = $project->tasks()->whereNull('parent_id')->count();
        $completedTasks = $project->tasks()->whereNull('parent_id')->where('status', TaskStatus::Done->value)->count();
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        $statusCounts = $project->tasks()
            ->whereNull('parent_id')
            ->select('status', \DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $tasksSummary = [];
        foreach (TaskStatus::cases() as $status) {
            $tasksSummary[$status->value] = $statusCounts[$status->value] ?? 0;
        }

        $teamSummary = $project->members->map(fn ($m) => [
            'name' => $m->name,
            'role' => $m->pivot->role,
            'avatar' => $m->avatar,
            'assigned_tasks_count' => $project->tasks()->whereNull('parent_id')->whereHas('assignees', fn ($q) => $q->where('users.id', $m->id))->count(),
        ]);

        $upcomingDeadlines = $project->tasks()
            ->whereNull('parent_id')
            ->whereNotNull('due_date')
            ->where('status', '!=', TaskStatus::Done->value)
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get(['id', 'title', 'due_date', 'status', 'priority'])
            ->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'due_date' => $t->due_date?->format('Y-m-d'),
                'status' => $t->status,
                'priority' => $t->priority?->value,
            ]);

        // Health Score
        $blockedTasks = $project->tasks()->whereNull('parent_id')->where('status', TaskStatus::Blocked->value)->count();
        $overdueTasks = $project->tasks()->whereNull('parent_id')->overdue()->count();
        $inProgressTasks = $project->tasks()->whereNull('parent_id')->where('status', TaskStatus::InProgress->value)->count();

        $healthScore = 100;
        if ($totalTasks > 0) {
            $completionWeight = 0.4;
            $blockedWeight = 0.3;
            $overdueWeight = 0.3;

            $completionScore = ($completedTasks / $totalTasks) * 100;
            $blockedRatio = $blockedTasks / $totalTasks;
            $overdueRatio = $overdueTasks / $totalTasks;

            $blockedScore = max(0, 100 - ($blockedRatio * 100));
            $overdueScore = max(0, 100 - ($overdueRatio * 100));

            $healthScore = (int) round(
                ($completionScore * $completionWeight) +
                ($blockedScore * $blockedWeight) +
                ($overdueScore * $overdueWeight)
            );
        }

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'status' => $project->status_label,
                'priority' => $project->priority_label,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
                'pm' => $project->projectManager?->name,
                'lead' => $project->teamLead?->name,
            ],
            'progress_summary' => [
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'completion_rate' => $completionRate,
            ],
            'tasks_summary' => $tasksSummary,
            'team_summary' => $teamSummary,
            'deadlines' => $upcomingDeadlines,
            'health_score' => $healthScore,
        ]);
    }

    private function exportCsv(iterable $data, string $type): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $type . '-report.csv"',
        ];

        $callback = function () use ($data, $type) {
            $file = fopen('php://output', 'w');
            $this->writeCsvHeaders($file, $type);
            foreach ($data as $row) {
                fputcsv($file, (array) $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportXlsx(iterable $data, string $type): StreamedResponse
    {
        $writer = new SimpleXlsxWriter;
        $writer->setHeaders($this->getColumnHeaders($type));
        $writer->addRows($data);

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $type . '-report.xlsx"',
        ];

        return response()->stream(function () use ($writer) {
            $writer->toStream(function ($fp) {
                fpassthru($fp);
            });
        }, 200, $headers);
    }

    private function exportHtml(iterable $data, string $type): \Illuminate\Http\Response
    {
        $rows = iterator_to_array($data);
        $headers = $this->getColumnHeaders($type);
        $title = match ($type) {
            'task_completion' => 'Task Completion Report',
            'overdue_analysis' => 'Overdue Analysis Report',
            'team_productivity' => 'Team Productivity Report',
            'project_health' => 'Project Health Report',
            'workload_distribution' => 'Workload Distribution Report',
            'weekly_summary' => 'Weekly Summary Report',
            default => 'Report',
        };

        $html = view('reports.export', [
            'title' => $title,
            'headers' => $headers,
            'rows' => $rows,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Content-Disposition' => 'inline; filename="' . $type . '-report.html"',
        ]);
    }

    private function exportPdf(iterable $data, string $type): \Illuminate\Http\Response
    {
        try {
            if (!class_exists(\Dompdf\Dompdf::class)) {
                throw new \RuntimeException('Dompdf is not installed.');
            }

            $rows = iterator_to_array($data);
            $headers = $this->getColumnHeaders($type);
            $title = match ($type) {
                'task_completion' => 'Task Completion Report',
                'overdue_analysis' => 'Overdue Analysis Report',
                'team_productivity' => 'Team Productivity Report',
                'project_health' => 'Project Health Report',
                'workload_distribution' => 'Workload Distribution Report',
                'weekly_summary' => 'Weekly Summary Report',
                default => 'Report',
            };

            $html = view('reports.export', [
                'title' => $title,
                'headers' => $headers,
                'rows' => $rows,
                'generated_at' => now()->format('Y-m-d H:i:s'),
            ])->render();

            $dompdf = new \Dompdf\Dompdf([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
            ]);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'landscape');
            $dompdf->render();

            return response($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $type . '-report.pdf"',
            ]);
        } catch (\Throwable $e) {
            logger()->error('PDF export failed, falling back to HTML export: ' . $e->getMessage());
            return $this->exportHtml($data, $type);
        }
    }

    // ── Private ──

    private function getColumnHeaders(string $type): array
    {
        return match ($type) {
            'task_completion' => ['Project', 'Total Tasks', 'Completed', 'Pending', 'Completion Rate (%)'],
            'overdue_analysis' => ['Task', 'Project', 'Assignee', 'Due Date', 'Days Overdue', 'Priority'],
            'team_productivity' => ['User', 'Completed Tasks'],
            'project_health' => ['Project', 'Total', 'Completed', 'Blocked', 'Overdue', 'In Progress', 'Completion Rate (%)', 'Health Score'],
            'workload_distribution' => ['User'] + collect(TaskStatus::cases())->map(fn ($s) => $s->label())->toArray() + ['Total'],
            'weekly_summary' => ['Date From', 'Date To', 'Tasks Created', 'Tasks Completed', 'Tasks Overdue', 'Comments Added'],
            'meeting_logs' => ['Project', 'Date', 'Title', 'Attendees', 'Summary', 'Decisions Taken', 'Blockers', 'Action Items', 'Notes'],
            default => ['Key', 'Value'],
        };
    }

    private function resolveFilters(ReportFilterRequest $request): array
    {
        $user = Auth::user();
        $filters = $request->validated();

        $allowedProjectIds = match ($user->role) {
            UserRole::SuperAdmin => null,
            UserRole::ProjectManager => Project::where('pm_id', $user->id)->pluck('id')->toArray(),
            UserRole::TeamLead => Project::where('lead_id', $user->id)->pluck('id')->toArray(),
            UserRole::Employee => $user->projects()->pluck('project_id')->toArray(),
            default => null,
        };

        if (isset($filters['project_ids'])) {
            if ($allowedProjectIds !== null) {
                $filters['project_ids'] = array_intersect($filters['project_ids'], $allowedProjectIds);
            }
        } elseif ($allowedProjectIds !== null) {
            $filters['project_ids'] = $allowedProjectIds;
        }

        if ($user->role === UserRole::Employee && !isset($filters['user_id'])) {
            $filters['user_id'] = $user->id;
        }

        return $filters;
    }

    private function getAvailableProjects(): \Illuminate\Support\Collection
    {
        $user = Auth::user();

        return match ($user->role) {
            UserRole::SuperAdmin => Project::all(['id', 'name']),
            UserRole::ProjectManager => Project::where('pm_id', $user->id)->get(['id', 'name']),
            UserRole::TeamLead => Project::where('lead_id', $user->id)->get(['id', 'name']),
            UserRole::Employee => $user->projects()->get(['id', 'name']),
            default => Project::all(['id', 'name']),
        };
    }

    private function writeCsvHeaders($file, string $type): void
    {
        fputcsv($file, $this->getColumnHeaders($type));
    }
}
