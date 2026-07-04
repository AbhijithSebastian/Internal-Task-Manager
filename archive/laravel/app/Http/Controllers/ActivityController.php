<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\Activity\ActivityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __construct(
        private readonly ActivityService $activityService
    ) {}

    public function index(): Response
    {
        $user = auth()->user();

        $projectIds = $user->projects()->pluck('projects.id');

        return Inertia::render('Activity/Index', [
            'activities' => $this->activityService->feed(
                array_merge(request()->all(), ['project_id' => $projectIds->toArray()])
            ),
            'filters' => request()->only(['type', 'user_id']),
        ]);
    }

    public function task(Task $task): Response
    {
        $this->authorize('view', $task);

        return Inertia::render('Activity/Index', [
            'activities' => $this->activityService->forTask($task->id, request()->all()),
            'task' => $task->load(['project']),
            'filters' => request()->only(['type']),
        ]);
    }
}
