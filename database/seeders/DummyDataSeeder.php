<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\Comment;
use App\Enums\ProjectStatus;
use App\Enums\ProjectPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskPriority;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clean existing records (except users & roles)
        DB::statement('SET CONSTRAINTS ALL DEFERRED');
        DB::table('comments')->truncate();
        DB::table('task_user')->truncate();
        DB::table('tasks')->truncate();
        DB::table('project_members')->truncate();
        DB::table('projects')->truncate();
        DB::table('activity_log')->truncate();

        // 2. Fetch existing users
        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super-admin'))->first();
        $pm = User::whereHas('roles', fn($q) => $q->where('name', 'project-manager'))->first();
        $lead = User::whereHas('roles', fn($q) => $q->where('name', 'team-lead'))->first();
        $employees = User::whereHas('roles', fn($q) => $q->where('name', 'employee'))->get();

        if (!$admin || !$pm || !$lead) {
            return;
        }

        // 3. Create active and completed projects
        $projectsData = [
            [
                'name' => 'Internal Task Manager Polish',
                'description' => 'Unifying the UI design system, stabilizing features, adding inline CTAs and dashboard metrics.',
                'status' => ProjectStatus::Active,
                'priority' => ProjectPriority::High,
                'pm_id' => $pm->id,
                'lead_id' => $lead->id,
            ],
            [
                'name' => 'Client Portal Redesign',
                'description' => 'Migrating old Bootstrap portal to modern Tailwind + Vue 3 client dashboard.',
                'status' => ProjectStatus::Active,
                'priority' => ProjectPriority::Medium,
                'pm_id' => $pm->id,
                'lead_id' => $lead->id,
            ],
            [
                'name' => 'API Integration Gateway',
                'description' => 'Building a unified API middleware for payroll, HR systems, and internal timesheets.',
                'status' => ProjectStatus::Completed,
                'priority' => ProjectPriority::High,
                'pm_id' => $pm->id,
                'lead_id' => $lead->id,
            ],
            [
                'name' => 'HR Automated Onboarding',
                'description' => 'Streamlining onboarding pipelines for new hires with automatic calendar and Slack invites.',
                'status' => ProjectStatus::OnHold,
                'priority' => ProjectPriority::Low,
                'pm_id' => $pm->id,
                'lead_id' => $lead->id,
            ],
        ];

        $projects = [];
        foreach ($projectsData as $data) {
            $project = Project::create(array_merge($data, [
                'author_id' => $admin->id,
                'start_date' => now()->subWeeks(4),
                'end_date' => now()->addWeeks(6),
            ]));
            
            // Add PM, Lead, and some employees as project members
            $project->members()->attach([
                $pm->id => ['role' => 'manager'],
                $lead->id => ['role' => 'lead'],
            ]);
            
            // Attach 4 random employees to each project
            $projectEmployees = $employees->random(min(4, $employees->count()));
            foreach ($projectEmployees as $emp) {
                $project->members()->attach($emp->id, ['role' => 'developer']);
            }

            $projects[] = $project;
        }

        // 4. Create tasks for projects
        // Project 0: Internal Task Manager Polish (Active, High Priority)
        $tasksProject0 = [
            [
                'title' => 'Refactor Task Filters Layout to Horizontal',
                'description' => 'Align filter dropdowns horizontally on the index page rather than vertical stacking.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Unify Profile Edit Grid Layout',
                'description' => 'Modify the user edit and profile screens to use a max-6xl two-column responsive grid.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Dashboard Pending Approvals inline CTA',
                'description' => 'Add inline Approve button next to tasks awaiting review for Super Admin/PM roles.',
                'status' => TaskStatus::InReview,
                'requires_approval' => true,
                'approver_id' => $admin->id,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Integrate Current Projects Panel on Dashboard',
                'description' => 'Replace Upcoming Deadlines panel with active projects listing completion progress.',
                'status' => TaskStatus::InReview,
                'requires_approval' => true,
                'approver_id' => $pm->id,
                'priority' => TaskPriority::Medium,
            ],
            [
                'title' => 'Add Bulk Export toolbar to Reports',
                'description' => 'Implement checkboxes on project reports to batch export to CSV/PDF.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::Medium,
            ],
            [
                'title' => 'Fix database ambiguous column in UserController',
                'description' => 'Resolve SQLSTATE ambiguous column id when PM views team member profile.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
            ],
        ];

        // Project 1: Client Portal Redesign
        $tasksProject1 = [
            [
                'title' => 'Design Figma Mockups for Homepage',
                'description' => 'Establish initial layout guidelines, dark mode styles, and brand colors.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Medium,
            ],
            [
                'title' => 'Set up Tailwind config and theme extensions',
                'description' => 'Initialize Tailwind config with primary brand colors and responsive spacing.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Low,
            ],
            [
                'title' => 'Implement Invoice Download PDF view',
                'description' => 'Construct blade layout and wiring to download client statements.',
                'status' => TaskStatus::InReview,
                'requires_approval' => true,
                'approver_id' => $pm->id,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Implement JWT Authentication endpoints',
                'description' => 'Secure client portal routes using API tokens.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Write unit tests for billing controller',
                'description' => 'Cover edge cases for failed invoice downloads and expired sessions.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Low,
            ],
        ];

        // Project 2: API Integration Gateway (Completed)
        $tasksProject2 = [
            [
                'title' => 'Design Database Schema for Sync Logs',
                'description' => 'Store payloads, statuses, and retry counts for payroll synchronization.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Implement OAuth2 integration with HR software',
                'description' => 'Authorize and retrieve team lists dynamically.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
            ],
            [
                'title' => 'Audit security protocols and access scopes',
                'description' => 'Strictly restrict payroll scopes to admin tokens.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::High,
            ],
        ];

        // Log actions under admin
        auth()->login($admin);

        // Seed tasks for Project 0
        foreach ($tasksProject0 as $tData) {
            $task = Task::create(array_merge($tData, [
                'project_id' => $projects[0]->id,
                'author_id' => $lead->id,
                'due_date' => now()->addDays(rand(1, 10)),
                'estimated_hours' => rand(2, 12),
            ]));
            
            // Assign to random project employee
            $assignee = $employees->random();
            $task->assignees()->attach($assignee->id);
            
            // Log some activity
            log_activity($task, 'Task created: ' . $task->title, ['created_by' => $lead->name]);
            if ($task->status === TaskStatus::Done) {
                log_activity($task, 'Task marked as completed', ['completed_by' => $assignee->name]);
            }
        }

        // Seed tasks for Project 1
        foreach ($tasksProject1 as $tData) {
            $task = Task::create(array_merge($tData, [
                'project_id' => $projects[1]->id,
                'author_id' => $pm->id,
                'due_date' => now()->addDays(rand(3, 15)),
                'estimated_hours' => rand(4, 20),
            ]));
            
            $assignee = $employees->random();
            $task->assignees()->attach($assignee->id);
            
            log_activity($task, 'Task created: ' . $task->title, ['created_by' => $pm->name]);
        }

        // Seed tasks for Project 2
        foreach ($tasksProject2 as $tData) {
            $task = Task::create(array_merge($tData, [
                'project_id' => $projects[2]->id,
                'author_id' => $pm->id,
                'due_date' => now()->subDays(rand(1, 10)),
                'estimated_hours' => rand(5, 15),
            ]));
            
            $assignee = $employees->random();
            $task->assignees()->attach($assignee->id);
            
            log_activity($task, 'Task marked as completed', ['completed_by' => $assignee->name]);
        }

        auth()->logout();
    }
}
