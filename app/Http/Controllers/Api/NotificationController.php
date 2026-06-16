<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    public function unread(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->list($request->user(), [
            'unread_only' => true,
            'per_page' => 5,
        ]);

        return response()->json([
            'data' => $notifications->items(),
            'unread_count' => $this->notificationService->getUnreadCount($request->user()),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $this->notificationService->markAsRead($request->user(), $id);

        return response()->json(['message' => 'Notification marked as read.']);
    }
}
