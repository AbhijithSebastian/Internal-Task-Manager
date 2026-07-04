<?php

namespace App\Http\Controllers;

use App\Services\Notification\NotificationService;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Notifications/Index', [
            'notifications' => $this->notificationService->list(auth()->user(), request()->all()),
        ]);
    }

    public function markAsRead(string $id): \Illuminate\Http\RedirectResponse
    {
        $this->notificationService->markAsRead(auth()->user(), $id);

        return redirect()->back();
    }

    public function markAllAsRead(): \Illuminate\Http\RedirectResponse
    {
        $this->notificationService->markAllAsRead(auth()->user());

        return redirect()->back()->with('success', 'All notifications marked as read.');
    }
}
