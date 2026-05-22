<?php

use Illuminate\Contracts\Console\Kernel;
use App\Models\User;
use App\Models\Task;
use App\Models\Project;
use App\Services\Task\TaskService;
use App\Services\User\UserService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Enums\UserRole;
use App\Enums\TaskStatus;
use App\Http\Controllers\ReportController;
use App\Http\Requests\Report\ReportFilterRequest;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$failed = false;

function assertCheck($name, $assertion) {
    global $failed;
    if ($assertion) {
        echo "✅ PASS: {$name}\n";
    } else {
        echo "❌ FAIL: {$name}\n";
        $failed = true;
    }
}

echo "=== Running Real App Validation ===\n\n";

// -------------------------------------------------------------
// Check 1: Role Resolution & N+1 Prevention
// -------------------------------------------------------------
echo "--- Check 1: Role Resolution & N+1 Prevention ---\n";
DB::enableQueryLog();

// 1.1 Serialization N+1 Check
DB::flushQueryLog();
$users = User::limit(5)->get();
foreach ($users as $u) {
    // Access serialized array
    $arr = $u->toArray();
}
$queries = DB::getQueryLog();
$rolesQueries = array_filter($queries, function($q) {
    return str_contains($q['query'], 'roles') || str_contains($q['query'], 'model_has_roles');
});

assertCheck(
    "No roles table queries were run during User serialization (N+1 query prevention)",
    count($rolesQueries) === 0
);

// 1.2 Lazy loading in policy/backend contexts
DB::flushQueryLog();
$singleUser = User::first();
if ($singleUser) {
    $role = $singleUser->role; // should trigger lazy loading if roles relation is not loaded
    $queriesAfter = DB::getQueryLog();
    $rolesQueriesAfter = array_filter($queriesAfter, function($q) {
        return str_contains($q['query'], 'roles') || str_contains($q['query'], 'model_has_roles');
    });
    assertCheck(
        "Roles query is lazy-loaded successfully in backend context",
        count($rolesQueriesAfter) > 0
    );
} else {
    echo "⚠️ Warning: No users found to perform backend context lazy-loading check.\n";
}


// -------------------------------------------------------------
// Check 2: Employee ETA and Deadline Isolation
// -------------------------------------------------------------
echo "\n--- Check 2: Employee ETA and Deadline Isolation ---\n";

// Find or create an employee
$employee = User::whereHas('roles', function($q) {
    $q->where('name', UserRole::Employee->value);
})->first();

if (!$employee) {
    // Seed/Create a temporary employee
    $employee = User::create([
        'name' => 'Temp Employee',
        'email' => 'temp_employee_' . uniqid() . '@internaltool.com',
        'password' => bcrypt('password'),
        'is_active' => true,
    ]);
    $employee->assignRole(UserRole::Employee->value);
}

// Find a project and task
$project = Project::first() ?? Project::create([
    'name' => 'Validation Project',
    'description' => 'A project for validation',
    'status' => 'active',
]);

$task = Task::create([
    'title' => 'Validation Task',
    'project_id' => $project->id,
    'due_date' => '2026-12-31',
    'employee_eta' => null,
    'status' => TaskStatus::Todo->value,
    'author_id' => $employee->id,
]);

// Act as employee
Auth::login($employee);

$taskService = app(TaskService::class);
try {
    $updatedTask = $taskService->update($task, [
        'due_date' => '2027-01-15', // Employee trying to overwrite project deadline
        'employee_eta' => '2026-12-15', // Employee setting their own ETA
    ]);

    assertCheck(
        "Employee cannot overwrite project deadline (due_date remains unchanged)",
        $updatedTask->due_date->format('Y-m-d') === '2026-12-31'
    );

    assertCheck(
        "Employee ETA is successfully updated to the assignee's estimate",
        $updatedTask->employee_eta->format('Y-m-d') === '2026-12-15'
    );
} catch (\Throwable $e) {
    assertCheck("Employee update transaction threw exception: " . $e->getMessage(), false);
}


// -------------------------------------------------------------
// Check 3: User Deactivation/Soft Delete
// -------------------------------------------------------------
echo "\n--- Check 3: User Deactivation / Soft Delete ---\n";

$tempUser = User::create([
    'name' => 'Deletable User',
    'email' => 'delete_' . uniqid() . '@internaltool.com',
    'password' => bcrypt('password'),
    'is_active' => true,
]);

$userService = app(UserService::class);
$userService->delete($tempUser);

$deletedUser = User::withTrashed()->find($tempUser->id);

assertCheck(
    "User deactivation sets is_active to false",
    $deletedUser->is_active === false
);

assertCheck(
    "User deactivation soft deletes the model (deleted_at is set)",
    $deletedUser->deleted_at !== null
);


// -------------------------------------------------------------
// Check 4: PDF Export & Fallback
// -------------------------------------------------------------
echo "\n--- Check 4: PDF Export & Fallback ---\n";

// Authenticate as PM/Admin who can view/export reports
$admin = User::whereHas('roles', function($q) {
    $q->where('name', UserRole::SuperAdmin->value);
})->first();

if ($admin) {
    Auth::login($admin);
    
    // Simulate Request
    $request = ReportFilterRequest::create(route('reports.export'), 'GET', [
        'tab' => 'task_completion',
        'format' => 'pdf',
    ]);
    $request->setContainer(app());
    $request->validateResolved();
    
    // Bind mock request
    app()->instance('request', $request);
    
    try {
        $controller = app(ReportController::class);
        $response = $controller->export($request);
        
        $contentType = $response->headers->get('Content-Type');
        echo "Response Content-Type: {$contentType}\n";
        
        $isPdf = str_contains($contentType, 'application/pdf');
        $isHtml = str_contains($contentType, 'text/html');
        
        assertCheck(
            "PDF Export request returned a successful response with PDF or HTML print fallback",
            ($isPdf || $isHtml) && $response->getStatusCode() === 200
        );
        
        if ($isPdf) {
            echo "ℹ️ Result: Exported successfully as PDF via Dompdf.\n";
        } else {
            echo "ℹ️ Result: Fallback HTML print page returned successfully.\n";
        }
    } catch (\Throwable $e) {
        assertCheck("PDF Export call threw exception: " . $e->getMessage(), false);
    }
} else {
    echo "⚠️ Warning: No super admin user found to perform PDF export check.\n";
}

// Clean up test task/project
$task->forceDelete();

echo "\n===================================\n";
if ($failed) {
    echo "❌ SOME VALIDATION CHECKS FAILED.\n";
    exit(1);
} else {
    echo "🎉 ALL VALIDATION CHECKS PASSED!\n";
    exit(0);
}
