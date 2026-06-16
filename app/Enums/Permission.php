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
    case USERS_DEACTIVATE = 'users.deactivate';
    case USERS_RESET_PASSWORD = 'users.reset-password';
    case USERS_INVITE = 'users.invite';

    // ─── Projects ───
    case PROJECTS_VIEW = 'projects.view';
    case PROJECTS_CREATE = 'projects.create';
    case PROJECTS_UPDATE = 'projects.update';
    case PROJECTS_DELETE = 'projects.delete';
    case PROJECTS_ARCHIVE = 'projects.archive';
    case PROJECTS_MANAGE_MEMBERS = 'projects.manage-members';
    case PROJECTS_MANAGE_SETTINGS = 'projects.manage-settings';

    // ─── Tasks ───
    case TASKS_VIEW = 'tasks.view';
    case TASKS_CREATE = 'tasks.create';
    case TASKS_UPDATE = 'tasks.update';
    case TASKS_DELETE = 'tasks.delete';
    case TASKS_ASSIGN = 'tasks.assign';
    case TASKS_APPROVE = 'tasks.approve';
    case TASKS_REJECT = 'tasks.reject';
    case TASKS_REVIEW = 'tasks.review';
    case TASKS_CHANGE_STATUS = 'tasks.change-status';
    case TASKS_SUBMIT_APPROVAL = 'tasks.submit-approval';

    // ─── Subtasks ───
    case SUBTASKS_VIEW = 'subtasks.view';
    case SUBTASKS_CREATE = 'subtasks.create';
    case SUBTASKS_UPDATE = 'subtasks.update';
    case SUBTASKS_DELETE = 'subtasks.delete';
    case SUBTASKS_ASSIGN = 'subtasks.assign';
    case SUBTASKS_CHANGE_STATUS = 'subtasks.change-status';
    case SUBTASKS_APPROVE = 'subtasks.approve';

    // ─── Dashboard ───
    case DASHBOARD_VIEW = 'dashboard.view';
    case DASHBOARD_ACTIVITY = 'dashboard.activity';
    case DASHBOARD_NOTIFICATIONS = 'dashboard.notifications';
    case DASHBOARD_ANNOUNCEMENTS = 'dashboard.announcements';

    // ─── Comments ───
    case COMMENTS_VIEW = 'comments.view';
    case COMMENTS_CREATE = 'comments.create';
    case COMMENTS_UPDATE = 'comments.update';
    case COMMENTS_DELETE = 'comments.delete';
    case COMMENTS_ACTIVITY = 'comments.activity';

    // ─── Reports ───
    case REPORTS_VIEW = 'reports.view';
    case REPORTS_GENERATE = 'reports.generate';
    case REPORTS_EXPORT = 'reports.export';
    case REPORTS_DOWNLOAD = 'reports.download';

    // ─── Attachments / Files ───
    case ATTACHMENTS_VIEW = 'attachments.view';
    case ATTACHMENTS_UPLOAD = 'attachments.upload';
    case ATTACHMENTS_DELETE = 'attachments.delete';
    case ATTACHMENTS_DOWNLOAD = 'attachments.download';

    // ─── Announcements ───
    case ANNOUNCEMENTS_VIEW = 'announcements.view';
    case ANNOUNCEMENTS_CREATE = 'announcements.create';
    case ANNOUNCEMENTS_UPDATE = 'announcements.update';
    case ANNOUNCEMENTS_DELETE = 'announcements.delete';
    case ANNOUNCEMENTS_PIN = 'announcements.pin';

    // ─── Notifications ───
    case NOTIFICATIONS_VIEW = 'notifications.view';
    case NOTIFICATIONS_MANAGE = 'notifications.manage';

    // ─── Permissions (admin) ───
    case PERMISSIONS_VIEW = 'permissions.view';
    case PERMISSIONS_MANAGE = 'permissions.manage';

    public function label(): string
    {
        return match ($this) {
            self::USERS_VIEW => 'View users',
            self::USERS_CREATE => 'Create users',
            self::USERS_UPDATE => 'Update users',
            self::USERS_DELETE => 'Delete users',
            self::USERS_RESTORE => 'Restore users',
            self::USERS_DEACTIVATE => 'Deactivate users',
            self::USERS_RESET_PASSWORD => 'Reset user passwords',
            self::USERS_INVITE => 'Invite users',
            self::PROJECTS_VIEW => 'View projects',
            self::PROJECTS_CREATE => 'Create projects',
            self::PROJECTS_UPDATE => 'Update projects',
            self::PROJECTS_DELETE => 'Delete projects',
            self::PROJECTS_ARCHIVE => 'Archive projects',
            self::PROJECTS_MANAGE_MEMBERS => 'Assign project members',
            self::PROJECTS_MANAGE_SETTINGS => 'Manage project settings',
            self::TASKS_VIEW => 'View tasks',
            self::TASKS_CREATE => 'Create tasks',
            self::TASKS_UPDATE => 'Update tasks',
            self::TASKS_DELETE => 'Delete tasks',
            self::TASKS_ASSIGN => 'Assign tasks',
            self::TASKS_APPROVE => 'Approve tasks',
            self::TASKS_REJECT => 'Reject tasks',
            self::TASKS_REVIEW => 'Review tasks',
            self::TASKS_CHANGE_STATUS => 'Change task status',
            self::TASKS_SUBMIT_APPROVAL => 'Submit tasks for approval',
            self::SUBTASKS_VIEW => 'View subtasks',
            self::SUBTASKS_CREATE => 'Create subtasks',
            self::SUBTASKS_UPDATE => 'Update subtasks',
            self::SUBTASKS_DELETE => 'Delete subtasks',
            self::SUBTASKS_ASSIGN => 'Assign subtasks',
            self::SUBTASKS_CHANGE_STATUS => 'Change subtask status',
            self::SUBTASKS_APPROVE => 'Approve subtasks',
            self::DASHBOARD_VIEW => 'View Dashboard',
            self::DASHBOARD_ACTIVITY => 'View team activity',
            self::DASHBOARD_NOTIFICATIONS => 'Dashboard notifications',
            self::DASHBOARD_ANNOUNCEMENTS => 'Dashboard announcements',
            self::COMMENTS_VIEW => 'View comments',
            self::COMMENTS_CREATE => 'Create comments',
            self::COMMENTS_UPDATE => 'Update comments',
            self::COMMENTS_DELETE => 'Delete comments',
            self::COMMENTS_ACTIVITY => 'View activity logs',
            self::REPORTS_VIEW => 'View reports',
            self::REPORTS_GENERATE => 'Generate reports',
            self::REPORTS_EXPORT => 'Export reports',
            self::REPORTS_DOWNLOAD => 'Download reports',
            self::ATTACHMENTS_VIEW => 'View attachments',
            self::ATTACHMENTS_UPLOAD => 'Upload attachments',
            self::ATTACHMENTS_DELETE => 'Delete attachments',
            self::ATTACHMENTS_DOWNLOAD => 'Download attachments',
            self::ANNOUNCEMENTS_VIEW => 'View announcements',
            self::ANNOUNCEMENTS_CREATE => 'Create announcements',
            self::ANNOUNCEMENTS_UPDATE => 'Update announcements',
            self::ANNOUNCEMENTS_DELETE => 'Delete announcements',
            self::ANNOUNCEMENTS_PIN => 'Pin announcements',
            self::NOTIFICATIONS_VIEW => 'View notifications',
            self::NOTIFICATIONS_MANAGE => 'Manage notification settings',
            self::PERMISSIONS_VIEW => 'View permissions',
            self::PERMISSIONS_MANAGE => 'Manage permissions',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::USERS_VIEW, self::USERS_CREATE, self::USERS_UPDATE,
            self::USERS_DELETE, self::USERS_RESTORE, self::USERS_DEACTIVATE,
            self::USERS_RESET_PASSWORD, self::USERS_INVITE => 'users',
            self::PROJECTS_VIEW, self::PROJECTS_CREATE, self::PROJECTS_UPDATE,
            self::PROJECTS_DELETE, self::PROJECTS_ARCHIVE, self::PROJECTS_MANAGE_MEMBERS,
            self::PROJECTS_MANAGE_SETTINGS => 'projects',
            self::TASKS_VIEW, self::TASKS_CREATE, self::TASKS_UPDATE,
            self::TASKS_DELETE, self::TASKS_ASSIGN, self::TASKS_APPROVE,
            self::TASKS_REJECT, self::TASKS_REVIEW, self::TASKS_CHANGE_STATUS,
            self::TASKS_SUBMIT_APPROVAL => 'tasks',
            self::SUBTASKS_VIEW, self::SUBTASKS_CREATE, self::SUBTASKS_UPDATE,
            self::SUBTASKS_DELETE, self::SUBTASKS_ASSIGN, self::SUBTASKS_CHANGE_STATUS,
            self::SUBTASKS_APPROVE => 'subtasks',
            self::DASHBOARD_VIEW, self::DASHBOARD_ACTIVITY,
            self::DASHBOARD_NOTIFICATIONS, self::DASHBOARD_ANNOUNCEMENTS => 'dashboard',
            self::COMMENTS_VIEW, self::COMMENTS_CREATE, self::COMMENTS_UPDATE,
            self::COMMENTS_DELETE, self::COMMENTS_ACTIVITY => 'comments',
            self::REPORTS_VIEW, self::REPORTS_GENERATE,
            self::REPORTS_EXPORT, self::REPORTS_DOWNLOAD => 'reports',
            self::ATTACHMENTS_VIEW, self::ATTACHMENTS_UPLOAD,
            self::ATTACHMENTS_DELETE, self::ATTACHMENTS_DOWNLOAD => 'attachments',
            self::ANNOUNCEMENTS_VIEW, self::ANNOUNCEMENTS_CREATE,
            self::ANNOUNCEMENTS_UPDATE, self::ANNOUNCEMENTS_DELETE,
            self::ANNOUNCEMENTS_PIN => 'announcements',
            self::NOTIFICATIONS_VIEW, self::NOTIFICATIONS_MANAGE => 'notifications',
            self::PERMISSIONS_VIEW, self::PERMISSIONS_MANAGE => 'permissions',
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
