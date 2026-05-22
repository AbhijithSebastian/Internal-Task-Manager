<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FailedJobAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $failedCount,
        public array $recentFailures = [],
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (config('monitoring.alerts.email')) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject("[{$this->failedCount}] Failed Jobs — " . config('app.name'))
            ->greeting('Job Failure Alert')
            ->line("There are currently {$this->failedCount} failed jobs in the queue.");

        if (!empty($this->recentFailures)) {
            $message->line('Recent failures:');
            foreach ($this->recentFailures as $failure) {
                $message->line("- {$failure['class']}: {$failure['exception']}");
            }
        }

        return $message->action('View Failed Jobs', url('/horizon'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'failed_jobs_alert',
            'failed_count' => $this->failedCount,
            'recent_failures' => $this->recentFailures,
            'severity' => $this->failedCount > 10 ? 'critical' : 'warning',
        ];
    }
}
