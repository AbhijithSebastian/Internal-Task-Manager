<?php

namespace App\Enums;

enum Permission: string
{
    // ─── Users ───
    case USERS_VIEW = 'users.view';
    case USERS_CREATE = 'users.create';
    case USERS_UPDATE = 'users.update';
    case USERS_DELETE = 'users.delete';
    case USERS_RESTORE = 'users.restore';

    // ─── Projects ───
    case PROJECTS_VIEW = 'projects.view';
    case PROJECTS_CREATE = 'projects.create';
    case PROJECTS_UPDATE = 'projects.update';
    case PROJECTS_DELETE = 'projects.delete';
    case PROJECTS_MANAGE_MEMBERS = 'projects.manage-members';

    // ─── Tasks ───
    case TASKS_VIEW = 'tasks.view';
    case TASKS_CREATE = 'tasks.create';
    case TASKS_UPDATE = 'tasks.update';
    case TASKS_DELETE = 'tasks.delete';
    case TASKS_ASSIGN = 'tasks.assign';
    case TASKS_APPROVE = 'tasks.approve';
    case TASKS_REVIEW = 'tasks.review';
    case TASKS_SUBMIT_APPROVAL = 'tasks.submit-approval';

    // ─── Comments ───
    case COMMENTS_CREATE = 'comments.create';
    case COMMENTS_UPDATE = 'comments.update';
    case COMMENTS_DELETE = 'comments.delete';

    // ─── Reports ───
    case REPORTS_VIEW = 'reports.view';
    case REPORTS_EXPORT = 'reports.export';

    // ─── Files ───
    case FILES_UPLOAD = 'files.upload';
    case FILES_DELETE = 'files.delete';

    // ─── Permissions (admin) ───
    case PERMISSIONS_MANAGE = 'permissions.manage';

    public function label(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'View users',
            self::USERS_CREATE => 'Create users',
            self::USERS_UPDATE => 'Update users',
            self::USERS_DELETE => 'Delete users',
            self::USERS_RESTORE => 'Restore users',
            self::PROJECTS_VIEW => 'View projects',
            self::PROJECTS_CREATE => 'Create projects',
            self::PROJECTS_UPDATE => 'Update projects',
            self::PROJECTS_DELETE => 'Delete projects',
            self::PROJECTS_MANAGE_MEMBERS => 'Manage project members',
            self::TASKS_VIEW => 'View tasks',
            self::TASKS_CREATE => 'Create tasks',
            self::TASKS_UPDATE => 'Update tasks',
            self::TASKS_DELETE => 'Delete tasks',
            self::TASKS_ASSIGN => 'Assign tasks',
            self::TASKS_APPROVE => 'Approve tasks',
            self::TASKS_REVIEW => 'Review tasks',
            self::TASKS_SUBMIT_APPROVAL => 'Submit tasks for approval',
            self::COMMENTS_CREATE => 'Create comments',
            self::COMMENTS_UPDATE => 'Update comments',
            self::COMMENTS_DELETE => 'Delete comments',
            self::REPORTS_VIEW => 'View reports',
            self::REPORTS_EXPORT => 'Export reports',
            self::FILES_UPLOAD => 'Upload files',
            self::FILES_DELETE => 'Delete files',
            self::PERMISSIONS_MANAGE => 'Manage permissions',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::USERS_VIEW, self::USERS_CREATE, self::USERS_UPDATE,
            self::USERS_DELETE, self::USERS_RESTORE => 'users',
            self::PROJECTS_VIEW, self::PROJECTS_CREATE, self::PROJECTS_UPDATE,
            self::PROJECTS_DELETE, self::PROJECTS_MANAGE_MEMBERS => 'projects',
            self::TASKS_VIEW, self::TASKS_CREATE, self::TASKS_UPDATE,
            self::TASKS_DELETE, self::TASKS_ASSIGN, self::TASKS_APPROVE,
            self::TASKS_REVIEW, self::TASKS_SUBMIT_APPROVAL => 'tasks',
            self::COMMENTS_CREATE, self::COMMENTS_UPDATE, self::COMMENTS_DELETE => 'comments',
            self::REPORTS_VIEW, self::REPORTS_EXPORT => 'reports',
            self::FILES_UPLOAD, self::FILES_DELETE => 'files',
            self::PERMISSIONS_MANAGE => 'permissions',
        };
    }

    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function grouped(): array
    {
        $groups = [];
        foreach (self::cases() as $permission) {
            $groups[$permission->group()][] = [
                'value' => $permission->value,
                'label' => $permission->label(),
            ];
        }
        return $groups;
    }
}
