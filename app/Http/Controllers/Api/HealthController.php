<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Monitoring\HealthService;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(HealthService $health): JsonResponse
    {
        $results = $health->checkAll();

        $overall = 'ok';
        $messages = [];

        if (($results['database']['status'] ?? '') !== 'ok') {
            $overall = 'degraded';
            $messages[] = 'Database unreachable';
        }
        if (($results['redis']['status'] ?? '') !== 'ok') {
            $overall = 'degraded';
            $messages[] = 'Redis unreachable';
        }
        if (($results['cache']['status'] ?? '') !== 'ok') {
            $overall = 'degraded';
            $messages[] = 'Cache unavailable';
        }

        if ($overall === 'degraded') {
            $health->logResults($results);
        }

        $statusCode = $overall === 'ok' ? 200 : 503;

        return response()->json([
            'status' => $overall,
            'message' => $overall === 'ok' ? 'All systems operational' : implode('; ', $messages),
            'checks' => $results,
        ], $statusCode);
    }
}
