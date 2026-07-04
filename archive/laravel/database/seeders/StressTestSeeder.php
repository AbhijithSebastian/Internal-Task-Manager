<?php

namespace Database\Seeders;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\User;
use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class StressTestSeeder extends Seeder
{
    private array $roleIds = [];

    private array $userIds = [];

    private array $projectIds = [];

    private array $taskIds = [];

    private array $userIdByRole = [];

    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            $this->command->error('Stress test seeder can only run in local/testing environment.');
            return;
        }

        $this->command->warn('Starting stress test data generation... This may take a while.');

        $faker = Faker::create();
        DB::disableQueryLog();

        $this->cleanExistingData();
        $this->seedRoles();
        $this->seedUsers($faker);
        $this->seedProjects($faker);
        $this->seedProjectMembers();
        $this->seedMilestones($faker);
        $this->seedParentTasks($faker);
        $this->seedSubtasks($faker);
        $this->seedTaskAssignments();
        $this->seedTaskDependencies();
        $this->seedAnnouncements($faker);
        $this->seedComments($faker);
        $this->seedMentions($faker);
        $this->seedNotifications($faker);
        $this->seedMedia($faker);
        $this->seedMeetingLogs($faker);
        $this->seedIntegrations($faker);

        $this->command->info('Stress test data seeded successfully!');
    }

    private function cleanExistingData(): void
    {
        $this->command->info('Cleaning existing data...');

        // Delete in reverse-dependency order for PostgreSQL compatibility
        $tables = [
            'notifications',
            'mentions',
            'comments',
            'task_dependencies',
            'task_user',
            'tasks',
            'meeting_logs',
            'milestones',
            'integrations',
            'project_members',
            'media',
            'announcements',
            'activity_log',
            'model_has_roles',
            'model_has_permissions',
            'projects',
        ];

        foreach ($tables as $table) {
            DB::table($table)->delete();
        }

        User::query()->forceDelete();
    }

    private function seedRoles(): void
    {
        $this->command->info('Seeding roles...');

        $roles = Role::pluck('id', 'name')->toArray();

        $this->roleIds = [
            'super-admin' => $roles[UserRole::SuperAdmin->value] ?? null,
            'project-manager' => $roles[UserRole::ProjectManager->value] ?? null,
            'team-lead' => $roles[UserRole::TeamLead->value] ?? null,
            'employee' => $roles[UserRole::Employee->value] ?? null,
        ];

        foreach ($this->roleIds as $role => $id) {
            if ($id === null) {
                $this->roleIds[$role] = DB::table('roles')->insertGetId([
                    'name' => $role,
                    'guard_name' => 'web',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedUsers($faker): void
    {
        $this->command->info('Seeding 100 users...');

        $password = Hash::make('password');
        $now = now();
        $users = [];
        $roleAssignments = [];
        $userRoleMap = [];

        $roleDistribution = [
            'super-admin' => 3,
            'project-manager' => 7,
            'team-lead' => 15,
            'employee' => 75,
        ];

        $firstNames = [
            'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
            'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
            'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
            'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
            'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
            'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
            'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
            'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
            'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
            'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
            'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
            'Frank', 'Rachel', 'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Catherine',
            'Dennis', 'Maria',
        ];

        $lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
            'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
            'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
            'Carter', 'Roberts',
        ];

        $domains = ['company.com', 'corp.net', 'tech.io', 'business.org', 'enterprise.co'];
        $jobTitles = [
            'Software Engineer', 'Senior Developer', 'Product Designer', 'UX Researcher',
            'DevOps Engineer', 'QA Engineer', 'Data Analyst', 'Technical Writer',
            'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Systems Architect',
            'Security Engineer', 'Mobile Developer', 'Database Administrator', 'Cloud Engineer',
            'Scrum Master', 'Product Owner', 'Business Analyst', 'Project Coordinator',
            'Engineering Manager', 'Design Lead', 'Tech Lead', 'Staff Engineer',
            'Principal Engineer', 'VP of Engineering', 'CTO', 'CEO', 'COO', 'CFO',
            'HR Manager', 'Operations Manager', 'Marketing Manager', 'Sales Director',
            'Customer Success Manager', 'Support Engineer', 'Solutions Architect',
            'Data Engineer', 'ML Engineer', 'Infrastructure Engineer',
        ];

        $usedEmails = [];
        $idx = 0;

        foreach ($roleDistribution as $roleName => $count) {
            for ($i = 0; $i < $count; $i++) {
                $firstName = $firstNames[$idx % count($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];
                $name = "{$firstName} {$lastName}";
                $email = strtolower("{$firstName}.{$lastName}." . rand(1, 999) . '@' . $domains[array_rand($domains)]);

                while (in_array($email, $usedEmails)) {
                    $email = strtolower("{$firstName}.{$lastName}." . rand(1, 999) . '@' . $domains[array_rand($domains)]);
                }
                $usedEmails[] = $email;

                $users[] = [
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                    'job_title' => $jobTitles[array_rand($jobTitles)],
                    'phone' => '+' . rand(1, 99) . ' ' . rand(100, 999) . ' ' . rand(100, 999) . ' ' . rand(1000, 9999),
                    'avatar_url' => null,
                    'is_active' => true,
                    'email_verified_at' => $now,
                    'last_login_at' => $faker->dateTimeBetween('-30 days', 'now'),
                    'last_login_ip' => long2ip(rand(0, 4294967295)),
                    'inherit_role_permissions' => true,
                    'remember_token' => Str::random(10),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $userRoleMap[] = ['role' => $roleName, 'index' => $idx];
                $idx++;
            }
        }

        $chunks = array_chunk($users, 50);
        foreach ($chunks as $chunk) {
            DB::table('users')->insert($chunk);
        }

        $this->userIds = DB::table('users')->pluck('id')->toArray();

        $superAdminRoleId = $this->roleIds['super-admin'];
        $pmRoleId = $this->roleIds['project-manager'];
        $teamLeadRoleId = $this->roleIds['team-lead'];
        $employeeRoleId = $this->roleIds['employee'];

        $roleInserts = [];
        foreach ($userRoleMap as $map) {
            $userId = $this->userIds[$map['index']];
            $roleId = match ($map['role']) {
                'super-admin' => $superAdminRoleId,
                'project-manager' => $pmRoleId,
                'team-lead' => $teamLeadRoleId,
                'employee' => $employeeRoleId,
                default => $employeeRoleId,
            };
            $roleInserts[] = [
                'role_id' => $roleId,
                'model_type' => User::class,
                'model_id' => $userId,
            ];

            $this->userIdByRole[$map['role']][] = $userId;
        }

        foreach (array_chunk($roleInserts, 100) as $chunk) {
            DB::table('model_has_roles')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($this->userIds) . ' users with roles.');
    }

    private function seedProjects($faker): void
    {
        $this->command->info('Seeding 500 projects...');

        $projectNames = [
            'Customer Portal Redesign', 'Internal Dashboard Revamp', 'Mobile App v2',
            'API Gateway Integration', 'Data Pipeline Optimization', 'Legacy Migration',
            'Payment System Overhaul', 'Notification Service', 'Search Engine Upgrade',
            'Analytics Platform', 'User Authentication Module', 'Content Management System',
            'Email Template Builder', 'Reporting Engine', 'Invoice Generation System',
            'Chat Integration Service', 'File Storage Solution', 'Cache Layer Implementation',
            'Database Sharding Strategy', 'Load Balancer Configuration', 'CI/CD Pipeline',
            'Monitoring Dashboard', 'Alerting System', 'Backup Recovery Plan',
            'Security Audit Tool', 'Compliance Tracker', 'Employee Onboarding Portal',
            'Performance Tuning Suite', 'A/B Testing Framework', 'Feature Flag Service',
            'WebSocket Gateway', 'GraphQL API Layer', 'Microservices Orchestration',
            'Container Orchestration', 'Serverless Functions Platform', 'Edge CDN Setup',
            'SSO Implementation', 'Role-Based Access Control', 'Audit Log System',
            'Rate Limiting Service', 'Webhook Dispatcher', 'Queue Management System',
            'Scheduled Task Runner', 'Export/Import Engine', 'Template Rendering Service',
            'Form Builder Application', 'Workflow Automation Engine', 'Document Signing Solution',
            'Video Conferencing Integration', 'Team Collaboration Hub',
        ];

        $projectAdjectives = [
            'Enhanced', 'Streamlined', 'Unified', 'Scalable', 'Secure', 'Optimized',
            'Modernized', 'Automated', 'Decoupled', 'Resilient', 'Fault-Tolerant',
            'High-Performance', 'Enterprise', 'Cloud-Native', 'Distributed',
        ];

        $statuses = [ProjectStatus::Active->value, ProjectStatus::Active->value, ProjectStatus::Active->value, ProjectStatus::OnHold->value, ProjectStatus::Completed->value, ProjectStatus::Archived->value];
        $priorities = [ProjectPriority::Low->value, ProjectPriority::Medium->value, ProjectPriority::Medium->value, ProjectPriority::High->value, ProjectPriority::High->value, ProjectPriority::Urgent->value];
        $allUserIds = $this->userIds;
        $pmIds = $this->userIdByRole['project-manager'] ?? $allUserIds;
        $leadIds = $this->userIdByRole['team-lead'] ?? $allUserIds;
        $projects = [];

        $now = Carbon::now();

        for ($i = 0; $i < 500; $i++) {
            $baseName = $projectNames[array_rand($projectNames)];
            $adj = $projectAdjectives[array_rand($projectAdjectives)];
            $suffix = $faker->boolean(30) ? ' ' . $faker->year() : '';

            $startDate = Carbon::instance($faker->dateTimeBetween('-6 months', '+1 month'));
            $duration = rand(30, 180);
            $endDate = (clone $startDate)->addDays($duration);

            $slug = Str::slug($baseName . '-' . $adj . '-' . rand(100, 999));
            $authorId = $allUserIds[array_rand($allUserIds)];

            $projects[] = [
                'name' => "{$baseName} - {$adj}{$suffix}",
                'description' => $faker->paragraph(rand(3, 6)),
                'status' => $statuses[array_rand($statuses)],
                'priority' => $priorities[array_rand($priorities)],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'author_id' => $authorId,
                'pm_id' => $pmIds[array_rand($pmIds)],
                'lead_id' => $leadIds[array_rand($leadIds)],
                'figma_url' => 'https://www.figma.com/file/' . Str::random(12) . '/' . $slug,
                'github_url' => 'https://github.com/company/' . $slug,
                'docs_url' => 'https://docs.google.com/document/d/' . Str::random(20),
                'meeting_url' => 'https://meet.google.com/' . Str::random(3) . '-' . Str::random(4) . '-' . Str::random(3),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($projects, 100) as $chunk) {
            DB::table('projects')->insert($chunk);
        }

        $this->projectIds = DB::table('projects')->pluck('id')->toArray();
        $this->command->info('Seeded ' . count($this->projectIds) . ' projects.');
    }

    private function seedProjectMembers(): void
    {
        $this->command->info('Seeding project members...');

        $allUserIds = $this->userIds;
        $pmUserIds = $this->userIdByRole['project-manager'] ?? [];
        $leadUserIds = $this->userIdByRole['team-lead'] ?? [];
        $employeeUserIds = $this->userIdByRole['employee'] ?? [];
        $superAdminIds = $this->userIdByRole['super-admin'] ?? [];

        $pivotRoles = ['manager', 'lead', 'developer', 'viewer'];
        $members = [];

        foreach ($this->projectIds as $projectId) {
            $memberCount = rand(3, 10);
            $addedUserIds = [];

            if (!empty($superAdminIds)) {
                $members[] = [
                    'project_id' => $projectId,
                    'user_id' => $superAdminIds[array_rand($superAdminIds)],
                    'role' => 'viewer',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $addedUserIds[] = end($members)['user_id'];
            }

            if (!empty($pmUserIds)) {
                $pmId = $pmUserIds[array_rand($pmUserIds)];
                $members[] = [
                    'project_id' => $projectId,
                    'user_id' => $pmId,
                    'role' => 'manager',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $addedUserIds[] = $pmId;
            }

            if (!empty($leadUserIds)) {
                $leadId = $leadUserIds[array_rand($leadUserIds)];
                $members[] = [
                    'project_id' => $projectId,
                    'user_id' => $leadId,
                    'role' => 'lead',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $addedUserIds[] = $leadId;
            }

            $pool = array_values(array_diff($employeeUserIds, $addedUserIds));
            shuffle($pool);
            $toAdd = min($memberCount - count($addedUserIds), count($pool), 7);

            for ($i = 0; $i < $toAdd; $i++) {
                $members[] = [
                    'project_id' => $projectId,
                    'user_id' => $pool[$i],
                    'role' => $pivotRoles[array_rand($pivotRoles)],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($members, 500) as $chunk) {
            DB::table('project_members')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($members) . ' project members.');
    }

    private function seedMilestones($faker): void
    {
        $this->command->info('Seeding milestones...');

        $milestoneNames = [
            'Sprint 1 Completion', 'MVP Release', 'Beta Launch', 'Design Freeze',
            'Code Freeze', 'QA Phase 1', 'User Acceptance Testing', 'Staging Deployment',
            'Production Release', 'Post-Launch Review', 'Architecture Review',
            'Database Migration', 'API Version 1', 'Mobile Beta', 'Security Audit',
            'Performance Benchmark', 'Documentation Complete', 'Integration Testing',
            'Load Testing', 'UI/UX Handoff',
        ];

        $statuses = ['pending', 'in_progress', 'completed', 'at_risk', 'cancelled'];
        $allUserIds = $this->userIds;
        $now = Carbon::now();

        $projectDates = DB::table('projects')->select('id', 'start_date', 'end_date')->get()->keyBy('id')->toArray();

        $milestones = [];

        foreach ($this->projectIds as $projectId) {
            $count = rand(1, 4);
            $pDates = $projectDates[$projectId] ?? null;
            $projectStart = $pDates ? Carbon::parse($pDates->start_date) : $now->subMonth();
            $projectEnd = $pDates ? Carbon::parse($pDates->end_date) : $now->addMonth();

            for ($i = 0; $i < $count; $i++) {
                $dueDate = Carbon::instance($faker->dateTimeBetween($projectStart->toDateTimeString(), $projectEnd->toDateTimeString()));
                $status = $statuses[array_rand($statuses)];
                $completedAt = $status === 'completed' ? Carbon::instance($faker->dateTimeBetween($projectStart->toDateTimeString(), $dueDate->toDateTimeString())) : null;

                $milestones[] = [
                    'name' => $milestoneNames[array_rand($milestoneNames)] . ' #' . ($i + 1),
                    'description' => $faker->paragraph(2),
                    'due_date' => $dueDate,
                    'completed_at' => $completedAt,
                    'status' => $status,
                    'project_id' => $projectId,
                    'author_id' => $allUserIds[array_rand($allUserIds)],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($milestones, 200) as $chunk) {
            DB::table('milestones')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($milestones) . ' milestones.');
    }

    private function seedParentTasks($faker): void
    {
        $this->command->info('Seeding 5,000 parent tasks...');

        $taskVerbs = [
            'Implement', 'Refactor', 'Optimize', 'Fix', 'Add', 'Remove', 'Update',
            'Migrate', 'Integrate', 'Configure', 'Build', 'Design', 'Test', 'Deploy',
            'Document', 'Review', 'Audit', 'Restructure', 'Consolidate', 'Standardize',
        ];

        $taskNouns = [
            'authentication flow', 'database schema', 'API endpoint', 'frontend component',
            'notification system', 'search functionality', 'file upload handler',
            'email template', 'dashboard widget', 'report generator', 'caching layer',
            'error handling middleware', 'validation rules', 'migration script',
            'unit tests', 'integration tests', 'deployment pipeline', 'monitoring alert',
            'backup strategy', 'rate limiter', 'webhook handler', 'queue worker',
            'scheduled task', 'export feature', 'import process', 'bulk action',
            'permission check', 'audit trail', 'data sync', 'real-time update',
            'drag-and-drop interface', 'modal dialog', 'form wizard', 'chart visualization',
            'table sorting', 'filter system', 'search bar', 'pagination control',
            'breadcrumb navigation', 'sidebar menu', 'notification badge', 'tooltip component',
            'dropdown selector', 'date picker', 'file manager', 'image cropper',
            'rich text editor', 'color picker', 'progress indicator', 'stepper component',
        ];

        $allUserIds = $this->userIds;
        $projectIds = $this->projectIds;
        $statuses = [TaskStatus::Backlog->value, TaskStatus::Todo->value, TaskStatus::InProgress->value, TaskStatus::InReview->value, TaskStatus::Done->value, TaskStatus::Cancelled->value, TaskStatus::Blocked->value, TaskStatus::Approved->value];
        $priorities = [TaskPriority::Low->value, TaskPriority::Medium->value, TaskPriority::Medium->value, TaskPriority::High->value, TaskPriority::High->value, TaskPriority::Urgent->value];
        $tagPool = ['frontend', 'backend', 'design', 'devops', 'testing', 'documentation', 'bug', 'enhancement', 'feature', 'refactoring', 'urgent', 'security', 'performance', 'accessibility', 'mobile', 'api', 'database', 'ui', 'infrastructure', 'compliance'];
        $now = Carbon::now();
        $tasks = [];

        for ($i = 0; $i < 5000; $i++) {
            $projectId = $projectIds[array_rand($projectIds)];
            $authorId = $allUserIds[array_rand($allUserIds)];
            $status = $statuses[array_rand($statuses)];
            $requiresApproval = $status === TaskStatus::InReview->value && $faker->boolean(60);
            $approverId = $requiresApproval ? $allUserIds[array_rand($allUserIds)] : null;
            $blockedReason = $status === TaskStatus::Blocked->value ? $faker->sentence(8) : null;

            $tagCount = rand(1, 4);
            $tags = [];
            $selectedKeys = array_rand($tagPool, min($tagCount, count($tagPool)));
            if (!is_array($selectedKeys)) {
                $selectedKeys = [$selectedKeys];
            }
            foreach ($selectedKeys as $key) {
                $tags[] = $tagPool[$key];
            }

            $dueDate = Carbon::instance($faker->dateTimeBetween('-2 weeks', '+4 weeks'));
            $estimatedHours = $faker->randomFloat(1, 0.5, 80);

            $tasks[] = [
                'title' => $taskVerbs[array_rand($taskVerbs)] . ' ' . $taskNouns[array_rand($taskNouns)],
                'description' => $faker->paragraph(rand(2, 5)),
                'status' => $status,
                'priority' => $priorities[array_rand($priorities)],
                'tags' => json_encode($tags),
                'blocked_reason' => $blockedReason,
                'due_date' => $dueDate,
                'employee_eta' => $faker->boolean(50) ? Carbon::instance($faker->dateTimeBetween('-1 week', '+3 weeks')) : null,
                'estimated_hours' => $estimatedHours,
                'project_id' => $projectId,
                'author_id' => $authorId,
                'parent_id' => null,
                'requires_approval' => $requiresApproval,
                'approver_id' => $approverId,
                'rejection_reason' => null,
                'approved_at' => $status === TaskStatus::Approved->value ? Carbon::instance($faker->dateTimeBetween('-1 week', 'now')) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($tasks, 500) as $chunk) {
            DB::table('tasks')->insert($chunk);
        }

        $this->taskIds = DB::table('tasks')->whereNull('parent_id')->pluck('id')->toArray();
        $this->command->info('Seeded ' . count($this->taskIds) . ' parent tasks.');
    }

    private function seedSubtasks($faker): void
    {
        $this->command->info('Seeding 20,000 subtasks...');

        if (empty($this->taskIds)) {
            $this->command->error('No parent tasks found for subtasks.');
            return;
        }

        $allUserIds = $this->userIds;
        $statuses = [TaskStatus::Backlog->value, TaskStatus::Todo->value, TaskStatus::InProgress->value, TaskStatus::Done->value, TaskStatus::Blocked->value];
        $priorities = [TaskPriority::Low->value, TaskPriority::Medium->value, TaskPriority::High->value, TaskPriority::Urgent->value];
        $now = Carbon::now();

        $taskProjectMap = DB::table('tasks')->whereIn('id', $this->taskIds)->pluck('project_id', 'id')->toArray();

        $subtasks = [];

        $subtaskNames = [
            'Set up environment', 'Write unit tests', 'Create migration', 'Update configuration',
            'Add validation', 'Implement error handling', 'Refactor method', 'Add logging',
            'Update documentation', 'Create API contract', 'Design component', 'Review PR',
            'Run tests', 'Deploy to staging', 'QA verification', 'Performance check',
            'Security scan', 'Code review', 'UX testing', 'Accessibility audit',
            'Database indexing', 'Cache warming', 'Load testing', 'Smoke testing',
            'Regression testing', 'Schema validation', 'Data migration', 'Seed data',
            'Create mock data', 'Build UI component', 'Style adjustments', 'Responsive fix',
            'Browser testing', 'Cross-browser fix', 'Animation polish', 'Edge case handling',
            'Input sanitization', 'Query optimization', 'Memory profiling', 'Error tracking setup',
        ];

        $this->command->info('Generating 20,000 subtasks in batches of 1000...');

        for ($batch = 0; $batch < 20; $batch++) {
            $subtasks = [];

            for ($i = 0; $i < 1000; $i++) {
                $parentId = $this->taskIds[array_rand($this->taskIds)];
                $projectId = $taskProjectMap[$parentId] ?? $this->projectIds[array_rand($this->projectIds)];
                $authorId = $allUserIds[array_rand($allUserIds)];
                $status = $statuses[array_rand($statuses)];

                $subtasks[] = [
                    'title' => $subtaskNames[array_rand($subtaskNames)],
                    'description' => $faker->sentence(rand(6, 15)),
                    'status' => $status,
                    'priority' => $priorities[array_rand($priorities)],
                    'tags' => json_encode(['subtask']),
                    'blocked_reason' => $status === TaskStatus::Blocked->value ? $faker->sentence(6) : null,
                    'due_date' => Carbon::instance($faker->dateTimeBetween('-1 week', '+2 weeks')),
                    'employee_eta' => $faker->boolean(30) ? Carbon::instance($faker->dateTimeBetween('-1 week', '+1 week')) : null,
                    'estimated_hours' => $faker->randomFloat(1, 0.25, 24),
                    'project_id' => $projectId,
                    'author_id' => $authorId,
                    'parent_id' => $parentId,
                    'requires_approval' => false,
                    'approver_id' => null,
                    'rejection_reason' => null,
                    'approved_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('tasks')->insert($subtasks);
            unset($subtasks);
            $this->command->info('  Batch ' . ($batch + 1) . '/20 complete.');

            if (($batch + 1) % 5 === 0) {
                gc_collect_cycles();
            }
        }

        $this->command->info('Seeded 20,000 subtasks.');
    }

    private function seedTaskAssignments(): void
    {
        $this->command->info('Seeding task assignments...');

        $allTaskIds = DB::table('tasks')->pluck('id')->toArray();
        $employeeIds = $this->userIdByRole['employee'] ?? $this->userIds;

        $assignments = [];
        foreach ($allTaskIds as $taskId) {
            $assigneeCount = rand(1, 3);
            $selectedIds = (array) array_rand(array_flip($employeeIds), min($assigneeCount, count($employeeIds)));
            foreach ((array) $selectedIds as $userId) {
                $assignments[] = [
                    'task_id' => $taskId,
                    'user_id' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($assignments, 1000) as $chunk) {
            DB::table('task_user')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($assignments) . ' task assignments.');
    }

    private function seedTaskDependencies(): void
    {
        $this->command->info('Seeding task dependencies...');

        $parentTaskIds = DB::table('tasks')->whereNull('parent_id')->pluck('id')->toArray();
        if (count($parentTaskIds) < 2) {
            return;
        }

        $depInserts = [];
        $existing = [];
        $maxDeps = min(2000, count($parentTaskIds) * 2);

        for ($i = 0; $i < $maxDeps; $i++) {
            $taskId = $parentTaskIds[array_rand($parentTaskIds)];
            $depId = $parentTaskIds[array_rand($parentTaskIds)];

            if ($taskId === $depId) {
                continue;
            }

            $key = "{$taskId}-{$depId}";
            $reverseKey = "{$depId}-{$taskId}";
            if (isset($existing[$key]) || isset($existing[$reverseKey])) {
                continue;
            }

            $existing[$key] = true;
            $depInserts[] = [
                'task_id' => $taskId,
                'dependency_id' => $depId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($depInserts, 500) as $chunk) {
            DB::table('task_dependencies')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($depInserts) . ' task dependencies.');
    }

    private function seedAnnouncements($faker): void
    {
        $this->command->info('Seeding 100 announcements...');

        $titles = [
            'Platform Maintenance Scheduled', 'New Feature Release: Dark Mode',
            'Q2 OKR Updates', 'Team Building Event Announcement',
            'Security Policy Update', 'Onboarding Process Changes',
            'Holiday Schedule Reminder', 'New Hire Welcome: Engineering Team',
            'Performance Review Timeline', 'Company All-Hands Meeting',
            'Updated Coding Standards', 'New Integration Partners',
            'Infrastructure Upgrade Notice', 'Bug Bounty Program Launch',
            'Design System v2 Release', 'Data Retention Policy Update',
            'Remote Work Policy Guidelines', 'Quarterly Roadmap Reveal',
            'Tool Migration Announcement', 'Team Offsite Planning',
        ];

        $allUserIds = $this->userIds;
        $priorities = ['low', 'medium', 'high', 'urgent'];
        $statuses = ['published', 'draft', 'archived'];
        $now = Carbon::now();
        $announcements = [];

        for ($i = 0; $i < 100; $i++) {
            $status = $statuses[array_rand($statuses)];
            $publishedAt = $status === 'published' ? Carbon::instance($faker->dateTimeBetween('-30 days', '+7 days')) : null;

            $announcements[] = [
                'title' => $titles[array_rand($titles)] . ' (' . ($i + 1) . ')',
                'content' => $faker->paragraphs(rand(3, 6), true),
                'priority' => $priorities[array_rand($priorities)],
                'status' => $status,
                'author_id' => $allUserIds[array_rand($allUserIds)],
                'published_at' => $publishedAt,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('announcements')->insert($announcements);
        $this->command->info('Seeded 100 announcements.');
    }

    private function seedComments($faker): void
    {
        $this->command->info('Seeding 5,000 comments...');

        $allUserIds = $this->userIds;
        $allTaskIds = DB::table('tasks')->pluck('id')->toArray();
        $projectIds = $this->projectIds;

        if (empty($allTaskIds)) {
            $this->command->error('No tasks found for comments.');
            return;
        }

        $taskProjectMap = DB::table('tasks')->pluck('project_id', 'id')->toArray();

        $commentTemplates = [
            'I have completed the initial implementation. Please review when you get a chance.',
            'This is blocked by {issue} in the dependency. Need the API team to unblock first.',
            'Great work on this! I noticed a few edge cases we should address: {details}',
            'Can we schedule a quick sync to discuss the approach? I have some concerns about {aspect}.',
            'Updated the PR with the requested changes. Ready for another review.',
            'The latest deployment fixed the issue. Closing this out.',
            '@mention could you take a look at this when you have a moment?',
            'I think we should split this into smaller tasks. It\'s getting too complex.',
            'Tested this locally and everything looks good. Deploying to staging.',
            'Found a regression in {area}. Reopening this task.',
            'The documentation has been updated to reflect the new changes.',
            'Let\'s prioritize this for the next sprint. It\'s been pending for too long.',
            'I\'ve added the necessary unit tests. Coverage is now at {percent}%.',
            'The design mockups have been updated in Figma. Check the latest version.',
            'Need input from the design team on the color scheme before proceeding.',
            'This is ready for QA. Test cases have been documented.',
            'The performance benchmark shows a {percent}% improvement with this change.',
            'Merged to main. Thanks everyone for the reviews!',
            'Could we add more logging here? It will help with debugging in production.',
            'The database migration ran successfully on staging. Ready for production.',
        ];

        $now = Carbon::now();
        $comments = [];

        for ($i = 0; $i < 5000; $i++) {
            $taskId = $allTaskIds[array_rand($allTaskIds)];
            $authorId = $allUserIds[array_rand($allUserIds)];
            $projectId = $taskProjectMap[$taskId] ?? $projectIds[array_rand($projectIds)];

            $template = $commentTemplates[array_rand($commentTemplates)];
            $body = str_replace(
                ['{issue}', '{details}', '{aspect}', '{area}', '{percent}'],
                [$faker->word(), $faker->sentence(5), $faker->word(), $faker->word(), (string) rand(70, 99)],
                $template
            );

            $comments[] = [
                'body' => $body,
                'task_id' => $taskId,
                'author_id' => $authorId,
                'project_id' => $projectId,
                'parent_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($comments, 500) as $chunk) {
            DB::table('comments')->insert($chunk);
        }

        $this->command->info('Seeded 5,000 comments.');
    }

    private function seedMentions($faker): void
    {
        $this->command->info('Seeding mentions...');

        $allUserIds = $this->userIds;
        $commentIds = DB::table('comments')->pluck('id')->toArray();

        if (empty($commentIds)) {
            return;
        }

        $mentions = [];

        $selectedComments = array_rand(array_flip($commentIds), min(500, count($commentIds)));
        foreach ((array) $selectedComments as $commentId) {
            $mentionedUserIds = (array) array_rand(array_flip($allUserIds), rand(1, 3));
            foreach ((array) $mentionedUserIds as $userId) {
                $mentions[] = [
                    'user_id' => $userId,
                    'mentionable_id' => $commentId,
                    'mentionable_type' => 'App\Models\Comment',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($mentions, 200) as $chunk) {
            DB::table('mentions')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($mentions) . ' mentions.');
    }

    private function seedNotifications($faker): void
    {
        $this->command->info('Seeding 10,000 notifications...');

        $allUserIds = $this->userIds;
        $notificationTypes = [
            'App\Notifications\TaskAssigned',
            'App\Notifications\TaskCompleted',
            'App\Notifications\TaskApproved',
            'App\Notifications\CommentAdded',
            'App\Notifications\MentionNotification',
            'App\Notifications\ProjectUpdate',
            'App\Notifications\DeadlineReminder',
            'App\Notifications\StatusChange',
            'App\Notifications\ApprovalRequested',
            'App\Notifications\AnnouncementPublished',
        ];

        $notifications = [];

        for ($i = 0; $i < 10000; $i++) {
            $userId = $allUserIds[array_rand($allUserIds)];
            $readAt = $faker->boolean(60) ? Carbon::instance($faker->dateTimeBetween('-14 days', 'now')) : null;

            $notifications[] = [
                'id' => (string) Str::uuid(),
                'type' => $notificationTypes[array_rand($notificationTypes)],
                'notifiable_type' => 'App\Models\User',
                'notifiable_id' => $userId,
                'data' => json_encode([
                    'message' => $faker->sentence(6),
                    'action_url' => $faker->boolean(70) ? '/' . $faker->word() . '/' . rand(1, 5000) : null,
                    'actor_id' => $allUserIds[array_rand($allUserIds)],
                ]),
                'read_at' => $readAt,
                'created_at' => Carbon::instance($faker->dateTimeBetween('-30 days', 'now')),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($notifications, 1000) as $chunk) {
            DB::table('notifications')->insert($chunk);
        }

        $this->command->info('Seeded 10,000 notifications.');
    }

    private function seedMedia($faker): void
    {
        $this->command->info('Seeding media attachments...');

        $allUserIds = $this->userIds;
        $allTaskIds = DB::table('tasks')->pluck('id')->toArray();
        $allProjectIds = $this->projectIds;
        $allCommentIds = DB::table('comments')->pluck('id')->toArray();

        $modelTypes = [];
        foreach ($allTaskIds as $id) {
            $modelTypes[] = ['type' => 'App\Models\Task', 'id' => $id];
        }
        foreach ($allProjectIds as $id) {
            $modelTypes[] = ['type' => 'App\Models\Project', 'id' => $id];
        }
        foreach ($allCommentIds as $id) {
            $modelTypes[] = ['type' => 'App\Models\Comment', 'id' => $id];
        }
        foreach ($allUserIds as $id) {
            $modelTypes[] = ['type' => 'App\Models\User', 'id' => $id];
        }

        if (empty($modelTypes)) {
            return;
        }

        $fileNames = [
            'report-q1-2026.pdf', 'screenshot-dashboard.png', 'mockup-v2.fig',
            'architecture-diagram.png', 'api-specification.yaml', 'database-schema.sql',
            'deployment-guide.pdf', 'test-results.xml', 'user-manual.docx',
            'style-guide.pdf', 'logo.svg', 'banner.png', 'favicon.ico',
            'presentation.pptx', 'spreadsheet.xlsx', 'notes.txt', 'config.json',
            'dump.sql', 'backup.zip', 'requirements.pdf',
        ];

        $mimeTypes = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'fig' => 'application/octet-stream',
            'yaml' => 'text/yaml',
            'sql' => 'text/plain',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt' => 'text/plain',
            'json' => 'application/json',
            'zip' => 'application/zip',
            'xml' => 'text/xml',
        ];

        $collections = ['attachments', 'files', 'avatars', 'screenshots', 'documents'];
        $media = [];

        $count = min(200, count($modelTypes));

        for ($i = 0; $i < $count; $i++) {
            $model = $modelTypes[array_rand($modelTypes)];
            $fileName = $fileNames[array_rand($fileNames)];
            $ext = pathinfo($fileName, PATHINFO_EXTENSION);
            $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
            $size = rand(1024, 10485760);

            $media[] = [
                'model_type' => $model['type'],
                'model_id' => $model['id'],
                'uuid' => (string) Str::uuid(),
                'collection_name' => $collections[array_rand($collections)],
                'name' => pathinfo($fileName, PATHINFO_FILENAME),
                'file_name' => $fileName,
                'mime_type' => $mimeType,
                'disk' => 'public',
                'conversions_disk' => 'public',
                'size' => $size,
                'manipulations' => '[]',
                'custom_properties' => '[]',
                'generated_conversions' => '[]',
                'responsive_images' => '[]',
                'order_column' => $i + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($media, 100) as $chunk) {
            DB::table('media')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($media) . ' media attachments.');
    }

    private function seedMeetingLogs($faker): void
    {
        $this->command->info('Seeding meeting logs...');

        $allUserIds = $this->userIds;
        $projectIds = $this->projectIds;

        $meetingLogs = [];
        foreach ($projectIds as $projectId) {
            $count = rand(0, 3);
            for ($i = 0; $i < $count; $i++) {
                $attendeeCount = rand(2, 8);
                $attendeeIds = (array) array_rand(array_flip($allUserIds), min($attendeeCount, count($allUserIds)));

                $meetingLogs[] = [
                    'project_id' => $projectId,
                    'author_id' => $allUserIds[array_rand($allUserIds)],
                    'title' => 'Sprint ' . $faker->word() . ' - ' . $faker->sentence(3),
                    'meeting_date' => Carbon::instance($faker->dateTimeBetween('-3 months', 'now')),
                    'attendees' => json_encode(array_values((array) $attendeeIds)),
                    'summary' => $faker->paragraph(3),
                    'decisions_taken' => $faker->paragraph(2),
                    'blockers' => $faker->boolean(50) ? $faker->paragraph(1) : null,
                    'action_items' => $faker->boolean(70) ? json_encode([$faker->sentence(5), $faker->sentence(6), $faker->sentence(4)]) : null,
                    'notes' => $faker->boolean(40) ? $faker->paragraph(4) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($meetingLogs, 100) as $chunk) {
            DB::table('meeting_logs')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($meetingLogs) . ' meeting logs.');
    }

    private function seedIntegrations($faker): void
    {
        $this->command->info('Seeding integrations...');

        $projectIds = $this->projectIds;
        $integrationTypes = ['slack', 'github', 'gitlab', 'jira', 'asana', 'trello', 'notion', 'linear', 'clickup', 'monday'];
        $integrations = [];

        foreach ($projectIds as $projectId) {
            $count = rand(1, 3);
            $usedTypes = [];

            for ($i = 0; $i < $count; $i++) {
                $type = $integrationTypes[array_rand($integrationTypes)];
                while (in_array($type, $usedTypes)) {
                    $type = $integrationTypes[array_rand($integrationTypes)];
                }
                $usedTypes[] = $type;

                $integrations[] = [
                    'project_id' => $projectId,
                    'type' => $type,
                    'label' => ucfirst($type) . ' Integration',
                    'config' => json_encode([
                        'webhook_url' => 'https://hooks.' . $type . '.com/' . Str::random(20),
                        'api_key_prefix' => substr(Str::random(8), 0, 4) . '...',
                        'enabled' => $faker->boolean(80),
                    ]),
                    'is_active' => $faker->boolean(80),
                    'last_synced_at' => $faker->boolean(70) ? Carbon::instance($faker->dateTimeBetween('-7 days', 'now')) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        foreach (array_chunk($integrations, 200) as $chunk) {
            DB::table('integrations')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($integrations) . ' integrations.');
    }
}
