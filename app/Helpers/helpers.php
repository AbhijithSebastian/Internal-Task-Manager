<?php

use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\UserRole;

if (!function_exists('user_role')) {
    function user_role(): ?UserRole
    {
        return auth()->user()?->role;
    }
}

if (!function_exists('is_super_admin')) {
    function is_super_admin(): bool
    {
        return auth()->check() && auth()->user()->is_super_admin;
    }
}

if (!function_exists('format_enum_label')) {
    function format_enum_label(string $value): string
    {
        return str_replace('_', ' ', ucwords($value, '_'));
    }
}

if (!function_exists('status_badge_variant')) {
    function status_badge_variant(string $status): string
    {
        return match ($status) {
            TaskStatus::Done->value, ProjectStatus::Active->value => 'success',
            TaskStatus::InProgress->value, TaskStatus::InReview->value => 'warning',
            TaskStatus::Cancelled->value, ProjectStatus::Archived->value => 'danger',
            TaskStatus::Backlog->value, ProjectStatus::Completed->value => 'neutral',
            TaskStatus::Todo->value, ProjectStatus::OnHold->value => 'info',
            default => 'neutral',
        };
    }
}

if (!function_exists('priority_badge_variant')) {
    function priority_badge_variant(string $priority): string
    {
        return match ($priority) {
            TaskPriority::Urgent->value => 'danger',
            TaskPriority::High->value => 'warning',
            TaskPriority::Medium->value => 'info',
            TaskPriority::Low->value => 'neutral',
            default => 'neutral',
        };
    }
}

if (!function_exists('truncate')) {
    function truncate(string $text, int $length = 100): string
    {
        if (mb_strlen($text) <= $length) {
            return $text;
        }

        return mb_substr($text, 0, $length) . '…';
    }
}

if (!function_exists('log_activity')) {
    function log_activity(
        $performedOn,
        string $description,
        array $properties = [],
        ?string $logName = null,
    ): void {
        $activity = activity($logName)
            ->performedOn($performedOn)
            ->withProperties($properties);

        if (auth()->check()) {
            $activity->causedBy(auth()->user());
        }

        $activity->log($description);
    }
}
