<?php

namespace App\Console\Commands;

use App\Services\Monitoring\HealthService;
use Illuminate\Console\Command;

class MonitorHealth extends Command
{
    protected $signature = 'monitor:health
        {--format=table : Output format (table|json|log)}
        {--fail-on-error : Exit with non-zero if any check fails}';

    protected $description = 'Run all health checks and report results';

    public function handle(HealthService $health): int
    {
        $results = $health->checkAll();
        $format = $this->option('format');

        if ($format === 'json') {
            $this->line(json_encode($results, JSON_PRETTY_PRINT));
            return self::SUCCESS;
        }

        if ($format === 'log') {
            $health->logResults($results);
            $this->info('Results written to log.');
            return self::SUCCESS;
        }

        // ─── Table output ──────────────────────────────────────────────────────
        $this->components->twoColumnDetail('<fg=cyan>Health Check</>', now()->toIso8601String());

        // Database
        $db = $results['database'];
        $dbStatus = $db['status'] === 'ok' ? '<fg=green>OK</>' : '<fg=red>FAIL</>';
        $this->components->twoColumnDetail('Database', $dbStatus);
        $this->components->twoColumnDetail('  › Latency', ($db['latency_ms'] ?? '?') . ' ms');
        $this->components->twoColumnDetail('  › Connections', $db['active_connections'] ?? '?');

        // Redis
        $redis = $results['redis'];
        $rStatus = $redis['status'] === 'ok' ? '<fg=green>OK</>' : '<fg=red>FAIL</>';
        $this->components->twoColumnDetail('Redis', $rStatus);
        $this->components->twoColumnDetail('  › Latency', ($redis['latency_ms'] ?? '?') . ' ms');
        $this->components->twoColumnDetail('  › Memory', $redis['used_memory'] ?? '?');

        // Cache
        $cache = $results['cache'];
        $cStatus = $cache['status'] === 'ok' ? '<fg=green>OK</>' : '<fg=red>FAIL</>';
        $this->components->twoColumnDetail('Cache', $cStatus);
        $this->components->twoColumnDetail('  › Driver', $cache['driver'] ?? '?');

        // Queue
        $queue = $results['queue'];
        $qStatus = match ($queue['status'] ?? '') {
            'ok' => '<fg=green>OK</>',
            'warning' => '<fg=yellow>WARN</>',
            default => '<fg=red>FAIL</>',
        };
        $this->components->twoColumnDetail('Queue', $qStatus);
        $this->components->twoColumnDetail('  › Horizon', $queue['horizon'] ?? '?');
        $this->components->twoColumnDetail('  › Pending', $queue['pending_jobs'] ?? 0);
        $this->components->twoColumnDetail('  › Failed', $queue['failed_jobs'] ?? 0);

        // Disks
        foreach (($results['disks'] ?? []) as $disk => $info) {
            $dStatus = match ($info['status'] ?? '') {
                'ok' => '<fg=green>OK</>',
                'warning' => '<fg=yellow>WARN</>',
                'critical' => '<fg=red>CRIT</>',
                default => '<fg=yellow>?</>',
            };
            $this->components->twoColumnDetail("Disk: {$disk}", $dStatus);
            $this->components->twoColumnDetail('  › Usage', "{$info['used_percent']}% ({$info['used_gb']}GB / {$info['total_gb']}GB)");
            $this->components->twoColumnDetail('  › Files', $info['files'] ?? 0);
        }

        // App
        $app = $results['app'];
        $this->line('');
        $this->components->twoColumnDetail('Environment', $app['env']);
        $this->components->twoColumnDetail('PHP', $app['php_version']);
        $this->components->twoColumnDetail('Laravel', $app['laravel_version']);
        $this->components->twoColumnDetail('Maintenance', $app['maintenance'] ? '<fg=yellow>YES</>' : '<fg=green>NO</>');

        $hasFailures = $db['status'] !== 'ok' || $redis['status'] !== 'ok' || $cache['status'] !== 'ok';

        if ($hasFailures && $this->option('fail-on-error')) {
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
