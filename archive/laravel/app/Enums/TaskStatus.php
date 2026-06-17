<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Backlog = 'backlog';
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Done = 'done';
    case Cancelled = 'cancelled';
    case Blocked = 'blocked';

    public function label(): string
    {
        return match ($this) {
            self::Backlog => 'Backlog',
            self::Todo => 'To Do',
            self::InProgress => 'In Progress',
            self::InReview => 'In Review',
            self::Approved => 'Approved',
            self::Done => 'Done',
            self::Cancelled => 'Cancelled',
            self::Blocked => 'Blocked',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Backlog => 'neutral',
            self::Todo => 'info',
            self::InProgress => 'warning',
            self::InReview => 'warning',
            self::Approved => 'success',
            self::Done => 'success',
            self::Cancelled => 'danger',
            self::Blocked => 'danger',
        };
    }
}
