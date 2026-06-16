<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\FailedJobAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CheckFailedJobs extends Command
{
    protected $signature = 'queue:check-failed
        {--threshold= : Override the failed job alert threshold}';

    protected $description = 'Check for failed jobs and send alerts if threshold exceeded';

    public function handle(): int
    {
        $threshold = (int) ($this->option('threshold') ?? config('monitoring.alerts.failed_jobs_threshold', 3));

        $failed = DB::table('failed_jobs')->get();
        $count = $failed->count();

        if ($count === 0) {
            return self::SUCCESS;
        }

        $recent = $failed->sortByDesc('failed_at')->take(10)->map(function ($job) {
            $payload = json_decode($job->payload, true);
            $class = data_get($payload, 'displayName', 'Unknown');
            $exception = $this->shortException($job->exception);

            return [
                'class' => $class,
                'exception' => $exception,
                'failed_at' => $job->failed_at,
            ];
        })->values()->toArray();

        $this->components->warn("Found {$count} failed job(s)");

        if ($count >= $threshold) {
            $this->components->task('Sending alerts', function () use ($count, $recent) {
                $this->sendAlerts($count, $recent);
            });
        }

        return self::SUCCESS;
    }

    private function sendAlerts(int $count, array $recent): void
    {
        $notification = new FailedJobAlert($count, $recent);

        // Email alert to configured address
        $alertEmail = config('monitoring.alerts.email');
        if ($alertEmail) {
            Notification::route('mail', $alertEmail)
                ->notify($notification);
        }

        // Database notification for all super-admins
        $superAdmins = User::role('super-admin')->get();
        if ($superAdmins->isNotEmpty()) {
            Notification::send($superAdmins, $notification);
        }
    }

    private function shortException(string $exception): string
    {
        $lines = explode("\n", $exception);
        $first = $lines[0] ?? '';

        return str($first)->limit(120)->toString();
    }
}
