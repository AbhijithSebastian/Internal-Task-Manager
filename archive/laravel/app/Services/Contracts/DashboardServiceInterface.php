<?php

namespace App\Services\Contracts;

use App\Models\User;

interface DashboardServiceInterface
{
    public function getStats(User $user): array;
    public function getRoleSpecificData(User $user): array;
    public function getCurrentProjects(User $user): \Illuminate\Database\Eloquent\Collection;
    public function getRecentActivities(User $user, int $limit = 10): \Illuminate\Database\Eloquent\Collection;
}
