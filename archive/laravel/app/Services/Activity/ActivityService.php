<?php

namespace App\Services\Activity;

use App\Models\Activity;
use App\Models\User;
use App\Services\Core\BaseService;
use Illuminate\Pagination\LengthAwarePaginator;

class ActivityService extends BaseService
{
    protected function model(): string
    {
        return Activity::class;
    }

    public function feed(array $filters = []): LengthAwarePaginator
    {
        $query = Activity::query()
            ->with(['subject', 'causer'])
            ->latest();

        $projectIds = $filters['project_id'] ?? null;
        if ($projectIds) {
            $projectIds = is_array($projectIds) ? $projectIds : [$projectIds];
            $query->where(function ($q) use ($projectIds) {
                $q->where(function ($q) use ($projectIds) {
                    $q->where('subject_type', (new \App\Models\Project)->getMorphClass())
                      ->whereIn('subject_id', $projectIds);
                })->orWhere(function ($q) use ($projectIds) {
                    $q->whereHasMorph('subject', [\App\Models\Task::class], function ($q) use ($projectIds) {
                        $q->whereIn('project_id', $projectIds);
                    });
                })->orWhere(function ($q) use ($projectIds) {
                    $q->whereHasMorph('subject', [\App\Models\Comment::class], function ($q) use ($projectIds) {
                        $q->whereHas('task', fn ($q) => $q->whereIn('project_id', $projectIds));
                    });
                });
            });
        }

        if ($type = $filters['type'] ?? null) {
            $query->where('description', 'ilike', "%{$type}%");
        }

        if ($userId = $filters['user_id'] ?? null) {
            $query->where('causer_id', $userId)
                  ->where('causer_type', (new User)->getMorphClass());
        }

        return $this->paginate($query, $filters['per_page'] ?? 25);
    }

    public function forTask(int $taskId, array $filters = []): LengthAwarePaginator
    {
        $query = Activity::query()
            ->with(['causer'])
            ->where(function ($q) use ($taskId) {
                $q->where(function ($q) use ($taskId) {
                    $q->where('subject_type', (new \App\Models\Task)->getMorphClass())
                      ->where('subject_id', $taskId);
                })->orWhere(function ($q) use ($taskId) {
                    $q->where('subject_type', (new \App\Models\Comment)->getMorphClass())
                      ->whereHasMorph('subject', [\App\Models\Comment::class], fn ($q) => $q->where('task_id', $taskId));
                });
            })
            ->latest();

        return $this->paginate($query, $filters['per_page'] ?? 20);
    }
}
