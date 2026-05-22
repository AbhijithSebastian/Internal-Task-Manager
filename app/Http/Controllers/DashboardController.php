<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Dashboard/Index', [
            'stats' => $this->dashboardService->getStats($user),
            'role_data' => $this->dashboardService->getRoleSpecificData($user),
            'upcoming_deadlines' => $this->dashboardService->getUpcomingDeadlines($user),
            'recent_activities' => $this->dashboardService->getRecentActivities($user),
        ]);
    }
}
