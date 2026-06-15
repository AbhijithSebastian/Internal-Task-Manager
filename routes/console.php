<?php

use Illuminate\Support\Facades\Schedule;

// ─── Housekeeping ─────────────────────────────────────────────────────────────

Schedule::command('model:prune', ['--model' => [Spatie\Activitylog\Models\Activity::class]])
    ->daily()
    ->withoutOverlapping()
    ->onOneServer();

Schedule::job(new App\Jobs\CleanupNotifications)
    ->daily()
    ->withoutOverlapping()
    ->onOneServer();

// ─── Task Reminders ───────────────────────────────────────────────────────────

Schedule::command('tasks:send-due-reminders')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->onOneServer();

// ─── Horizon Metrics ──────────────────────────────────────────────────────────

Schedule::command('horizon:snapshot')
    ->everyFiveMinutes()
    ->withoutOverlapping();

// ─── Monitoring ───────────────────────────────────────────────────────────────

Schedule::command('monitor:health --format=log')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();

Schedule::command('queue:check-failed')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();

// ─── Database Backup ──────────────────────────────────────────────────────────

Schedule::command('backup:database')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();

Schedule::command('backup:database')
    ->weeklyOn(0, '03:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->runInBackground();
