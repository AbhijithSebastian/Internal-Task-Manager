<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    public static function formatDate(null|string|\DateTimeInterface $date, string $format = 'M d, Y'): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)->format($format);
    }

    public static function formatDateTime(null|string|\DateTimeInterface $date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)->format('M d, Y g:i A');
    }

    public static function formatForHumans(null|string|\DateTimeInterface $date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)->diffForHumans();
    }

    public static function daysUntil(null|string|\DateTimeInterface $date): ?int
    {
        if (!$date) {
            return null;
        }

        return (int) Carbon::now()->startOfDay()->diffInDays(
            Carbon::parse($date)->startOfDay(),
            false
        );
    }

    public static function getDateRange(string $period): array
    {
        return match ($period) {
            'week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            'quarter' => [Carbon::now()->startOfQuarter(), Carbon::now()->endOfQuarter()],
            'year' => [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()],
            default => [Carbon::now()->subWeek(), Carbon::now()],
        };
    }
}
