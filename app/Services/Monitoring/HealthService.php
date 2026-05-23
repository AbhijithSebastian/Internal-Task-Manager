<?php

namespace App\Services\Monitoring;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class HealthService
{
    public function checkAll(): array
    {
        return [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
            'disks' => $this->checkDisks(),
            'app' => $this->checkApp(),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    public function checkDatabase(): array
    {
        $start = microtime(true);
        try {
            DB::connection()->getPdo();
            $dbName = DB::connection()->getDatabaseName();
            $latency = (microtime(true) - $start) * 1000;

            $connectionCount = DB::select('SELECT count(*) as count FROM pg_stat_activity WHERE state = \'active\'');
            $activeConnections = (int) ($connectionCount[0]->count ?? 0);

            return [
                'status' => 'ok',
                'latency_ms' => round($latency, 2),
                'database' => $dbName,
                'active_connections' => $activeConnections,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function checkRedis(): array
    {
        try {
            $start = microtime(true);
            $ping = Redis::connection()->ping();
            $latency = (microtime(true) - $start) * 1000;

            $info = Redis::connection()->info();
            $usedMemory = $info['used_memory_human'] ?? 'unknown';
            $uptime = $info['uptime_in_seconds'] ?? 0;

            return [
                'status' => $ping ? 'ok' : 'error',
                'latency_ms' => round($latency, 2),
                'used_memory' => $usedMemory,
                'uptime_seconds' => (int) $uptime,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function checkCache(): array
    {
        $key = 'health:ping_' . str()->random(8);
        $value = time();

        try {
            Cache::put($key, $value, 1);
            $retrieved = Cache::get($key);
            Cache::forget($key);

            return [
                'status' => $retrieved === $value ? 'ok' : 'error',
                'driver' => config('cache.default'),
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function checkQueue(): array
    {
        try {
            $failed = DB::table('failed_jobs')->count();
            $pending = DB::table('jobs')->count();

            $horizonRunning = Cache::store('redis')->has('horizon:supervisor-1');
$horizonStatus = $horizonRunning ? 'running' : 'stopped';

            return [
                'status' => $horizonRunning ? 'ok' : 'warning',
                'driver' => config('queue.default'),
                'failed_jobs' => $failed,
                'pending_jobs' => $pending,
                'horizon' => $horizonStatus,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function checkDisks(): array
    {
        $disks = config('monitoring.health.cache_disks', ['local', 'public', 'attachments']);
        $warningThreshold = config('monitoring.health.disk_warning_threshold', 85);
        $criticalThreshold = config('monitoring.health.disk_critical_threshold', 95);
        $results = [];

        foreach ($disks as $diskName) {
            try {
                $disk = \Illuminate\Support\Facades\Storage::disk($diskName);
                $path = $disk->path('/');

                if (!is_dir($path)) {
                    $results[$diskName] = [
                        'status' => 'unknown',
                        'error' => 'Directory does not exist',
                    ];
                    continue;
                }

                $total = disk_total_space($path);
                $free = disk_free_space($path);
                $used = $total - $free;
                $usedPercent = $total > 0 ? round(($used / $total) * 100, 1) : 0;

                $status = 'ok';
                if ($usedPercent >= $criticalThreshold) {
                    $status = 'critical';
                } elseif ($usedPercent >= $warningThreshold) {
                    $status = 'warning';
                }

                $fileCount = $this->countFiles($path);

                $results[$diskName] = [
                    'status' => $status,
                    'path' => $path,
                    'total_gb' => round($total / 1073741824, 2),
                    'used_gb' => round($used / 1073741824, 2),
                    'free_gb' => round($free / 1073741824, 2),
                    'used_percent' => $usedPercent,
                    'files' => $fileCount,
                ];
            } catch (\Throwable $e) {
                $results[$diskName] = [
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    public function checkApp(): array
    {
        $composerPath = base_path('composer.json');
        $version = 'unknown';

        if (file_exists($composerPath)) {
            $composer = json_decode(file_get_contents($composerPath), true);
            $version = $composer['version'] ?? '1.0.0';
        }

        return [
            'env' => app()->environment(),
            'debug' => config('app.debug'),
            'version' => $version,
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'timezone' => config('app.timezone'),
            'maintenance' => app()->isDownForMaintenance(),
        ];
    }

    public function toMetricTags(): array
    {
        return [
            'app' => config('app.name'),
            'env' => app()->environment(),
            'host' => gethostname(),
        ];
    }

    public function logResults(array $results): void
    {
        $allOk = true;
        $issues = [];

        if (($results['database']['status'] ?? '') !== 'ok') {
            $allOk = false;
            $issues[] = 'database';
        }

        if (($results['redis']['status'] ?? '') !== 'ok') {
            $allOk = false;
            $issues[] = 'redis';
        }

        if (($results['cache']['status'] ?? '') !== 'ok') {
            $allOk = false;
            $issues[] = 'cache';
        }

        if (!empty($results['queue']['failed_jobs'])) {
            Log::warning('Failed jobs detected', [
                'count' => $results['queue']['failed_jobs'],
            ]);
        }

        foreach (($results['disks'] ?? []) as $disk => $info) {
            if (($info['status'] ?? '') === 'critical') {
                $allOk = false;
                $issues[] = "disk:{$disk}";
                Log::critical("Disk {$disk} is critically full", [
                    'used_percent' => $info['used_percent'],
                    'free_gb' => $info['free_gb'],
                ]);
            } elseif (($info['status'] ?? '') === 'warning') {
                Log::warning("Disk {$disk} usage is high", [
                    'used_percent' => $info['used_percent'],
                ]);
            }
        }

        if (!$allOk) {
            Log::error('Health check failed', [
                'issues' => $issues,
                'results' => $results,
            ]);
        } else {
            Log::info('Health check passed');
        }
    }

    private function countFiles(string $path): int
    {
        if (!is_dir($path)) {
            return 0;
        }

        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $count++;
            }
        }

        return $count;
    }
}
