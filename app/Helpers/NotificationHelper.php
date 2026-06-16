<?php

namespace App\Helpers;

use App\Models\Task;

class NotificationHelper
{
    public static function formatTaskLink(Task $task): string
    {
        return sprintf(
            '<a href="%s" class="font-medium text-primary-600 hover:underline">%s</a>',
            route('tasks.show', $task),
            e($task->title)
        );
    }

    public static function notificationTypeLabel(string $type): string
    {
        return match ($type) {
            'task_assigned' => __('notifications.types.task_assigned'),
            'task_status_changed' => __('notifications.types.task_status_changed'),
            'mention' => __('notifications.types.mention'),
            default => __('notifications.types.default'),
        };
    }

    public static function getIconForType(string $type): string
    {
        return match ($type) {
            'task_assigned' => 'clipboard-document-check',
            'task_status_changed' => 'arrow-path',
            'mention' => 'at-symbol',
            default => 'bell',
        };
    }
}
