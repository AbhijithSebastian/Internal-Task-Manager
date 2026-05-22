<?php

return [
    // ─── Health Checks ────────────────────────────────────────────────────────
    'health' => [
        'cache_disks' => ['local', 'public', 'attachments'],
        'disk_warning_threshold' => 85,
        'disk_critical_threshold' => 95,
        'queue_failed_warning' => 5,
        'queue_failed_critical' => 20,
    ],

    // ─── Database Backup ──────────────────────────────────────────────────────
    'backup' => [
        'enabled' => env('BACKUP_ENABLED', true),
        'path' => env('BACKUP_PATH', storage_path('app/backups')),
        'retention_days' => env('BACKUP_RETENTION_DAYS', 14),
        'compress' => true,
        'tables_to_exclude' => [
            'sessions',
        ],
    ],

    // ─── Alerts ───────────────────────────────────────────────────────────────
    'alerts' => [
        'email' => env('MONITOR_ALERT_EMAIL', ''),
        'slack_webhook' => env('MONITOR_SLACK_WEBHOOK', ''),
        'failed_jobs_threshold' => 3,
        'disk_threshold' => 85,
        'horizon_downtime_threshold_minutes' => 5,
    ],
];
