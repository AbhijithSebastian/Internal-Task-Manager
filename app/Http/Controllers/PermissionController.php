<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission as SpatiePermission;
use Spatie\Permission\Models\Role;
use Illuminate\Validation\Rules\Enum;

class PermissionController extends Controller
{
    public function index(): Response
    {
        $this->authorize('view', Permission::class);

        $users = User::with('roles')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_label' => $user->role?->label(),
                'is_active' => $user->is_active ?? true,
                'is_super_admin' => $user->is_super_admin,
                'inherit_role_permissions' => $user->inherit_role_permissions,
            ]);

        return Inertia::render('Permissions/Index', [
            'users' => $users,
            'permissionGroups' => $this->getPermissionGroups(),
        ]);
    }

    public function show(User $user): \Illuminate\Http\JsonResponse
    {
        $this->authorize('manage', Permission::class);

        $rolePermissions = $user->getPermissionsViaRoles()->pluck('name')->toArray();
        $directPermissions = $user->permissions()->pluck('name')->toArray();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_label' => $user->role?->label(),
                'is_active' => $user->is_active ?? true,
                'is_super_admin' => $user->is_super_admin,
                'inherit_role_permissions' => $user->inherit_role_permissions,
            ],
            'role_permissions' => $rolePermissions,
            'direct_permissions' => $directPermissions,
            'effective_permissions' => $user->inherit_role_permissions ? $rolePermissions : $directPermissions,
            'allPermissions' => Permission::grouped(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('manage', Permission::class);

        $validated = $request->validate([
            'inherit_role_permissions' => ['boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', new Enum(Permission::class)],
        ]);

        $inheritRolePermissions = $validated['inherit_role_permissions'] ?? true;

        $user->update(['inherit_role_permissions' => $inheritRolePermissions]);

        if ($inheritRolePermissions) {
            $user->syncPermissions([]);
        } else {
            $selectedPermissions = $validated['permissions'] ?? [];

            $user->syncPermissions($selectedPermissions);

            activity()
                ->performedOn($user)
                ->causedBy(auth()->user())
                ->withProperties([
                    'permissions' => $selectedPermissions,
                    'updated_by' => auth()->user()?->name,
                ])
                ->log('Permissions updated');
        }

        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->back()->with('success', 'Permissions updated successfully.');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $this->authorize('manage', Permission::class);

        $validated = $request->validate([
            'role' => ['required', 'string'],
        ]);

        $role = UserRole::tryFrom($validated['role']);

        if (!$role) {
            return redirect()->back()->with('error', 'Invalid role selected.');
        }

        $user->syncRoles([$role->value]);

        $user->update(['inherit_role_permissions' => true]);

        if ($user->inherit_role_permissions) {
            $user->syncPermissions([]);
        }

        activity()
            ->performedOn($user)
            ->causedBy(auth()->user())
            ->withProperties([
                'role' => $role->value,
                'updated_by' => auth()->user()?->name,
            ])
            ->log('User role updated');

        return redirect()->back()->with('success', 'User role updated successfully.');
    }

    public function roles(): JsonResponse
    {
        $this->authorize('manage', Permission::class);

        $roles = Role::where('guard_name', 'web')->get()->map(fn ($role) => [
            'id' => $role->id,
            'name' => $role->name,
            'label' => UserRole::tryFrom($role->name)?->label() ?? $role->name,
            'permissions' => $role->permissions()->pluck('name'),
        ]);

        return response()->json(['roles' => $roles]);
    }

    public function updateRolePermissions(Request $request, Role $role): RedirectResponse
    {
        $this->authorize('manage', Permission::class);

        $validated = $request->validate([
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        $selectedPermissions = $validated['permissions'] ?? [];

        $role->syncPermissions($selectedPermissions);

        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        activity()
            ->causedBy(auth()->user())
            ->withProperties([
                'role' => $role->name,
                'permissions' => $selectedPermissions,
                'updated_by' => auth()->user()?->name,
            ])
            ->log('Role permissions updated');

        return redirect()->back()->with('success', 'Role permissions updated successfully.');
    }

    private function getPermissionGroups(): array
    {
        $groups = [];
        $groupLabels = [
            'dashboard' => 'Dashboard',
            'projects' => 'Projects',
            'tasks' => 'Tasks',
            'subtasks' => 'Subtasks',
            'users' => 'Users',
            'permissions' => 'Permissions',
            'announcements' => 'Announcements',
            'reports' => 'Reports',
            'attachments' => 'Attachments',
            'comments' => 'Comments & Activities',
            'notifications' => 'Notifications',
        ];

        foreach (Permission::grouped() as $group => $perms) {
            $groups[] = [
                'key' => $group,
                'label' => $groupLabels[$group] ?? ucfirst($group),
                'permissions' => $perms,
            ];
        }

        return $groups;
    }
}
