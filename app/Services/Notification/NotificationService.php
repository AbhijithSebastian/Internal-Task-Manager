<?php

namespace App\Services\Notification;

use App\Models\User;
use App\Services\BaseService;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Pagination\LengthAwarePaginator;

class NotificationService extends BaseService
{
    protected function model(): string
    {
        return DatabaseNotification::class;
    }

    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = $user->notifications()
            ->when($filters['type'] ?? null, fn ($q, $t) => $q->where('type', $t))
            ->when($filters['unread_only'] ?? false, fn ($q) => $q->whereNull('read_at'));

        $query = $query->orderBy('created_at', 'desc');

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 5), 100);
        return $this->paginate($query, $perPage);
    }

    public function markAsRead(User $user, string $notificationId): void
    {
        $notification = $user->notifications()->findOrFail($notificationId);
        $notification->markAsRead();
    }

    public function markAllAsRead(User $user): void
    {
        $user->unreadNotifications->markAsRead();
    }

    public function getUnreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }
}
