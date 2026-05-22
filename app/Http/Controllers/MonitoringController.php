<?php

namespace App\Http\Controllers;

use App\Services\Monitoring\HealthService;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function index(HealthService $health): Response
    {
        Gate::authorize('viewHorizon');

        return Inertia::render('Admin/Monitoring');
    }
}
