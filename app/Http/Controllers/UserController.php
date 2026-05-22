<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\User\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        return Inertia::render('Users/Index', [
            'users' => $this->userService->list(request()->all()),
            'filters' => request()->only(['search', 'role', 'status', 'sort_by', 'sort_direction']),
            'roles' => $this->userService->getRoles(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create', [
            'roles' => $this->userService->getRoles(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $this->userService->create($request->validated());

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        $user->load([
            'roles',
            'projects' => fn ($q) => $q->withCount('tasks')->orderBy('projects.created_at', 'desc')->limit(5),
            'tasks' => fn ($q) => $q->with('project')->latest()->limit(5),
        ]);

        return Inertia::render('Users/Show', [
            'user' => $user->append(['avatar']),
            'stats' => [
                'total_projects' => $user->projects()->count(),
                'active_projects' => $user->projects()->where('status', 'active')->count(),
                'total_tasks' => $user->tasks()->count(),
                'completed_tasks' => $user->tasks()->where('status', 'done')->count(),
                'in_progress_tasks' => $user->tasks()->where('status', 'in_progress')->count(),
                'total_comments' => $user->comments()->count(),
                'member_since' => $user->created_at?->format('M Y'),
                'last_active' => $user->last_login_at?->diffForHumans(),
            ],
        ]);
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'user' => $user->load('roles')->append(['avatar']),
            'roles' => $this->userService->getRoles(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $this->userService->update($user, $request->validated());

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $this->userService->delete($user);

        return redirect()->route('users.index')
            ->with('success', 'User deactivated successfully.');
    }

    public function restore(int $id): RedirectResponse
    {
        $this->authorize('restore', User::class);

        $this->userService->restore($id);

        return redirect()->route('users.index')
            ->with('success', 'User restored successfully.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $user = $this->userService->toggleActive($user);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "User {$status} successfully.");
    }

    public function uploadAvatar(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $this->userService->uploadAvatar($user, $request->file('avatar'));

        return redirect()->back()
            ->with('success', 'Avatar updated successfully.');
    }

    public function deleteAvatar(User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $this->userService->deleteAvatar($user);

        return redirect()->back()
            ->with('success', 'Avatar removed successfully.');
    }
}
