<?php

namespace App\Services\User;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\BaseService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService
{
    protected function model(): string
    {
        return User::class;
    }

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = User::query()
            ->with('roles')
            ->withCount(['tasks', 'projects'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->search($s))
            ->when($filters['role'] ?? null, fn ($q, $r) => $q->role($r))
            ->when($filters['status'] ?? null, function ($q, $status) {
                match ($status) {
                    'active' => $q->active(),
                    'inactive' => $q->where('is_active', false),
                    'trashed' => $q->onlyTrashed(),
                    default => null,
                };
            })
            ->when(filled($filters['trashed'] ?? null), fn ($q) => $q->withTrashed());

        $query = $this->sort(
            $query,
            $filters['sort_by'] ?? 'created_at',
            $filters['sort_direction'] ?? 'desc',
            ['name', 'email', 'created_at', 'last_login_at'],
        );

        return $this->paginate($query, $filters['per_page'] ?? null);
    }

    public function get(int $id): User
    {
        $user = User::with('roles')
            ->withCount(['tasks', 'projects', 'authoredTasks', 'comments'])
            ->withTrashed()
            ->findOrFail($id);

        return $user;
    }

    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $data['password'] = Hash::make($data['password']);

            $role = $data['role'] ?? null;
            unset($data['role']);

            $user = User::create($data);

            if ($role) {
                $user->syncRoles([$role]);
            }

            log_activity($user, 'User created', [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
            ]);

            return $user->load('roles');
        });
    }

    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $changed = [];

            foreach (['name', 'email', 'job_title', 'phone', 'is_active'] as $field) {
                if (array_key_exists($field, $data) && $user->{$field} !== $data[$field]) {
                    $changed[$field] = ['old' => $user->{$field}, 'new' => $data[$field]];
                }
            }

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            $role = $data['role'] ?? null;
            unset($data['role']);

            $user->update($data);

            if ($role) {
                $oldRole = $user->roles->first()?->name;
                $user->syncRoles([$role]);
                $changed['role'] = ['old' => $oldRole, 'new' => $role];
            }

            if (!empty($changed)) {
                log_activity($user, 'User updated', [
                    'changes' => $changed,
                    'updated_by' => auth()->user()?->name,
                ]);
            }

            return $user->fresh()->load('roles');
        });
    }

    public function delete(Model|int|string $idOrModel): void
    {
        $user = $idOrModel instanceof User ? $idOrModel : $this->find($idOrModel);

        DB::transaction(function () use ($user) {
            $user->update(['is_active' => false]);
            $user->delete();

            log_activity($user, 'User deactivated', [
                'name' => $user->name,
                'email' => $user->email,
                'deactivated_by' => auth()->user()?->name,
            ]);
        });
    }

    public function restore(int $userId): User
    {
        return DB::transaction(function () use ($userId) {
            $user = User::withTrashed()->findOrFail($userId);
            $user->restore();

            log_activity($user, 'User restored', [
                'name' => $user->name,
                'email' => $user->email,
                'restored_by' => auth()->user()?->name,
            ]);

            return $user->load('roles');
        });
    }

    public function toggleActive(User $user): User
    {
        return DB::transaction(function () use ($user) {
            $newStatus = !$user->is_active;
            $user->update(['is_active' => $newStatus]);

            $action = $newStatus ? 'activated' : 'deactivated';

            log_activity($user, "User {$action}", [
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $newStatus,
                'changed_by' => auth()->user()?->name,
            ]);

            return $user->fresh()->load('roles');
        });
    }

    public function uploadAvatar(User $user, UploadedFile $file): User
    {
        abort_unless($file->isValid(), 422, 'Invalid file upload.');

        $fileSize = $file->getSize();
        $fileName = $file->getClientOriginalName();

        $user->addMedia($file)
            ->toMediaCollection('avatar');

        log_activity($user, 'Avatar updated', [
            'file_name' => $fileName,
            'file_size' => $fileSize,
        ]);

        return $user->fresh();
    }

    public function deleteAvatar(User $user): User
    {
        $user->clearMediaCollection('avatar');

        log_activity($user, 'Avatar removed');

        return $user->fresh();
    }

    public function getRoles(): array
    {
        return collect(UserRole::cases())->map(fn ($role) => [
            'value' => $role->value,
            'label' => $role->label(),
        ])->toArray();
    }
}
