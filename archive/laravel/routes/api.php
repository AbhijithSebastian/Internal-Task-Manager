<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\NotificationController as ApiNotificationController;
use App\Http\Controllers\Api\SearchController;

// ─── Public health check (no auth — for uptime monitors) ─────────────────────
Route::get('health', HealthController::class)->name('api.health');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('notifications/unread', [ApiNotificationController::class, 'unread'])->name('api.notifications.unread');
    Route::post('notifications/{id}/mark-read', [ApiNotificationController::class, 'markAsRead'])->name('api.notifications.mark-read');

    Route::get('search', [SearchController::class, 'search'])->name('api.search');

    Route::get('users/search', [SearchController::class, 'users'])->name('api.users.search');
    Route::get('projects/search', [SearchController::class, 'projects'])->name('api.projects.search');
});
