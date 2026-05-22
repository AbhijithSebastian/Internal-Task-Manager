# Internal Task Manager — Setup Guide

## Prerequisites
- PHP 8.3+
- Composer
- PostgreSQL 15+
- Redis
- Node.js 20+
- npm

## Quick Start

```bash
# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Copy environment
cp .env.example .env

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database (roles, permissions, demo users)
php artisan db:seed

# Storage link
php artisan storage:link

# Start dev servers
npm run dev
php artisan serve

# In separate terminal — queue worker
php artisan horizon

# Login credentials (after seeding):
# Admin:    admin@internaltool.com / password
# PM:       pm@internaltool.com / password
# Lead:     lead@internaltool.com / password
# Employee: employee@internaltool.com / password
```

## Architecture Decisions

### Service Layer
All business logic lives in `app/Services/`. Controllers are thin — they only handle HTTP concerns (validation, authorization, response) and delegate to services.

### Policies
Authorization is centralized in `app/Policies/`. Every model has a corresponding policy. `SuperAdmin` bypasses all checks via the `before()` method.

### Enums
Domain objects use native PHP 8.1 enums (TaskStatus, TaskPriority, UserRole, ProjectStatus) for type safety.

### Observers
Activity logging, notifications, and mention processing happen via observers in `app/Observers/`, keeping models clean.

### Jobs
Heavy operations go through Laravel queues:
- `ProcessCommentMentions` — parses @mentions asynchronously
- `CleanupNotifications` — daily cleanup of old notifications

### Database
PostgreSQL-specific features used:
- `ilike` for case-insensitive search
- Proper foreign key constraints with `cascadeOnDelete` / `nullOnDelete`
- Composite indexes for common query patterns
- UUIDs for notifications table
- `job_batches` table for queue batching

### Frontend
- Inertia.js with Vue 3 for SPA-like experience without API complexity
- Headless UI for accessible modals/dialogs
- Heroicons for consistent iconography
- Tailwind CSS utility classes with a custom component layer
- Toast notifications via vue-toastification

## Module Structure

| Module | Backend | Frontend |
|--------|---------|----------|
| Auth | AuthService, Auth Controllers | Auth/Login, Register |
| Users | UserService, UserPolicy | Users/Index, Create, Edit |
| Projects | ProjectService, ProjectPolicy | Projects/Index, Create, Show, Edit |
| Tasks | TaskService, TaskPolicy | Tasks/Index, Create, Show, Edit |
| Comments | CommentService, CommentPolicy | Inline in Tasks/Show |
| Notifications | NotificationService, 10 classes (database+mail, queued) | Notifications/Index |
| Reports | ReportService, ReportFilterRequest, CSV export | Reports/Index (tabs, filters, export) |
| Profile | ProfileController | Profile/Edit |
| Dashboard | DashboardService, DashboardController | Dashboard/Index + partials per role |
| Subtasks | TaskService (parent_id), TaskPolicy::manageSubtasks | Inline in Tasks/Show |
| Attachments | AttachmentService, AttachmentController, HasAttachments trait | FileUpload, FileList components |
| Approval Workflow | TaskService (submitForReview/approve/reject), 3 notification classes | Inline in Tasks/Show |
| Activity Feed | ActivityService, ActivityController | Activity/Index |
| Integrations | IntegrationService, 3 type handlers, IntegrationController | IntegrationList, GitHubCard, FigmaCard, EmailHookCard |

## Audit & Fix History

### Critical Fixes Applied (May 2026)

| # | Issue | Fix |
|---|-------|-----|
| C1 | XSS in comment rendering — `renderMentions()` used `v-html` on unsanitized body | Added `DOMPurify.sanitize()` before regex replacement in `Tasks/Show.vue:609` |
| C2 | Duplicate notifications — `TaskObserver` + `TaskService` both sent the same `TaskAssignedNotification` and `TaskStatusChangedNotification` | Removed notification calls from `TaskObserver::created()` and `TaskObserver::updating()`. Notifications now originate from `TaskService` only. |
| C3 | N+1 from `$appends` — `Task.php` and `Project.php` each fired 4-5 extra COUNT queries on every serialization | Removed query-heavy accessors from `$appends`. Accessors now check for `withCount` data first. Added `loadCount` to `TaskController::show()` and `ProjectController::show()`. |
| C4 | Broken registration — `invite_tokens` table referenced in validation doesn't exist | Removed `invite_token` validation from `RegisterRequest`. Registration is admin-only for internal tool. Register route and Vue page removed. |
| C5 | `User::notifications()` referenced `Notification::class` (class doesn't exist) with wrong `HasMany` instead of `MorphMany` | Removed broken custom method. The `Notifiable` trait provides the correct `morphMany(DatabaseNotification::class, 'notifiable')`. |
| C6 | Email verification not enforced — `User` model doesn't implement `MustVerifyEmail`, so the `verified` middleware always passed | Removed email verification entirely (unnecessary for internal tool). Removed `EnsureEmailIsVerified` middleware, `verified` middleware alias, verification routes/controllers, and `VerifyEmail.vue` page. |

### High Priority Fixes Applied

| # | Issue | Fix |
|---|-------|-----|
| H1 | `cascadeOnDelete` on `author_id` FKs to soft-deletable `users` table | Created migration `0004_01_01_000005_fix_author_id_foreign_keys.php` to change `author_id` FK on `projects`, `tasks`, `comments` to `nullOnDelete` |
| H2 | `IntegrationPolicy` didn't extend `BasePolicy` — no SuperAdmin bypass | Changed to `extends BasePolicy` to inherit the `before()` SuperAdmin bypass |
| H3 | No policy registered for `Integration` model | Added `Integration::class => IntegrationPolicy::class` to `AuthServiceProvider::$policies` |
| H4 | `generateEmailHook()` had no authorization | Added `$this->authorize('view', $project)` before generating email hook |
| H5 | Forgot password revealed user existence | Removed `exists:users,email` validation rule. Generic error message regardless of email existence. |
| H6 | Activity log migration missing `event` and `batch_uuid` columns | Created migration `0004_01_01_000004_add_event_and_batch_uuid_to_activity_log.php` |
| H7 | No `withoutOverlapping()` on scheduled commands | Added to all 5 scheduled commands in `routes/console.php` |
| H8 | No `onOneServer()` on scheduled commands | Added to daily commands for multi-server safety |
| H9 | No `.env.testing` file created | Created `.env.testing` with `testing` env, `array` cache/session, `sync` queue, dedicated `internal_tool_testing` DB |
| H10 | `HasAuthor::author()` didn't include soft-deleted users | Added `->withTrashed()` to the relationship |
| H11 | `ReportController` had no explicit authorization | Added `$this->authorize(Permission::REPORTS_VIEW->value)` and `$this->authorize(Permission::REPORTS_EXPORT->value)` |

### Architecture Cleanup

| Change | Reason |
|--------|--------|
| Removed public registration routes and controller | Internal tool — users created by admins only |
| Removed email verification routes, middleware, Vue page | Unnecessary for admin-created internal users |
| Removed broken `User::notifications()` method | `Notifiable` trait provides correct implementation |
| Fixed `ProcessCommentMentions` to pass `$commentId` (int) instead of full `Comment` model | Prevents serialization issues in queue |
| Added chunking to `CleanupNotifications` job | Prevents long-running delete queries |
| Added bounds to notification pagination (5-100) | Prevents arbitrarily large page size requests |
| Fixed `vue-toastification` from `^1.7` to `2.0.0-rc.5` | v1.x targets Vue 2 (imports `import Vue from 'vue'` — breaks Vite build). v2.0.0-rc.5 works with Vue 3. |
| Removed `Register.vue` and `VerifyEmail.vue` | No longer referenced by any route |
| All 5 scheduled commands now use `withoutOverlapping()` + `onOneServer()` | Prevents duplicate execution |

### Commands to Run
```bash
cp .env.example .env                      # Create environment
php artisan key:generate                   # Generate APP_KEY
php artisan migrate --force                # Run ALL migrations including fixes (3 new: H6, H1, P1)
php artisan db:seed                        # Seed demo data
npm install                                # Install frontend deps (DOMPurify added)
npm run build                              # Build production assets
```

### Security Hardening Applied (May 2026)

| # | Issue | Fix |
|---|-------|------|
| S1 | **CRITICAL: `HandleInertiaRequests` crashes all auth requests** — `$user->hasVerifiedEmail()` called on User model that doesn't implement `MustVerifyEmail` interface. Every authenticated page load threw `BadMethodCallException`. | Removed `email_verified` line from shared Inertia data. The method doesn't exist on the model. |
| S2 | **CRITICAL: Duplicate exception handler** — Both `app/Exceptions/Handler.php` and `bootstrap/app.php->withExceptions()` registered conflicting exception renderers (Laravel 11 uses bootstrap config as primary). | Deleted `app/Exceptions/Handler.php`. All exception handling now flows through `bootstrap/app.php` exclusively. |
| S3 | **Orphaned middleware** — `EnsureEmailIsVerified.php` remained on disk after email verification was removed (C6). | Deleted `EnsureEmailIsVerified.php`. Zero references remain in code. |
| S4 | **HIGH: Pagination `v-html` injection vector** — `Pagination.vue:26` used `v-html="link.label"` rendering raw HTML. While Laravel's paginator generates safe labels, user-controlled page/sort params aren't validated before they reach the paginator. | Changed to `{{ link.label }}` text interpolation. |
| S5 | **MEDIUM: Direct attachment URL bypass** — `public/storage/attachments` symlink exposed all uploaded files directly via the web, bypassing the authorized `attachments.serve` route. | Removed `public_path('storage/attachments')` symlink from `config/filesystems.php`. Files only accessible through authorized controller methods. |
| S6 | **MEDIUM: Console error leakage** — `IntegrationForm.vue` logged fetch failures to `console.error`, potentially leaking structure/URL info. | Replaced with silent catch block. |
| S7 | **LOW: Orphaned `'resent'` flash key** — Leftover from removed email verification system. | Removed from `HandleInertiaRequests::share()`. |
| S8 | **LOW: Missing production env guidance** — `SESSION_SECURE_COOKIE` not documented in `.env.example`. | Added `SESSION_SECURE_COOKIE=false` to `.env.example` with clear comment. |
| S9 | **LOW: Unused Meilisearch keys** — Leftover config in `.env.example` for a service not installed. | Removed `MEILISEARCH_HOST` and `MEILISEARCH_KEY` from `.env.example`. |

### Remaining Issues Fixed (May 2026, Session 2)

| # | Issue | Fix |
|---|-------|------|
| S10 | **CRITICAL: `CommentController::replies()` renders non-existent `Comments/Replies.vue`** — active route `GET comments/{comment}/replies` crashed with 500 | Removed the `replies()` method from `CommentController` and the `comments.replies` route from `web.php`. The route was never used from the frontend (zero references in Vue/JS). |
| S11 | **CRITICAL: `DashboardService::getEmployeeData()` calls `withMorph()`** — method does not exist in Laravel 11.53.1. Crashed employee dashboard, project show, task show, and user profile for Employee role | Replaced `->withMorph('mentionable', [Comment::class])` with `->with('mentionable')`. Cleaner and available in all Laravel 11 versions. |
| S12 | **HIGH: `Tasks/Show.vue:7` accesses `task.project.id` without optional chaining** — would crash if project is somehow null | Added optional chaining: `task.project?.id` and `task.project?.name` |
| S13 | **MEDIUM: Orphaned auth controllers on disk with active routes removed** — `EmailVerificationPromptController`, `EmailVerificationNotificationController`, `VerifyEmailController`, `RegisteredUserController` all had `use` statements for non-existent services or referenced `hasVerifiedEmail()` on User model (no `MustVerifyEmail` interface) | Deleted all 4 controller files from `app/Http/Controllers/Auth/`. |
| S14 | **MEDIUM: `AuthService` dead methods** — `verifyEmail()` and `resendVerificationEmail()` called `hasVerifiedEmail()`, `markEmailAsVerified()`, `sendEmailVerificationNotification()` — none used by any active route | Removed both methods from `AuthService`. The `ensureNotRateLimited` helper remains (still used by login and password reset). |
| S15 | **MEDIUM: `EventServiceProvider` registered `SendEmailVerificationNotification` listener** — references `Registered` event never dispatched (registration is disabled) | Removed the `$listen` array entirely and cleaned up unused imports. |
| S16 | **MEDIUM: Dead `setting()` helper function** referenced non-existent `App\Services\Settings\SettingsService` class — would crash if ever called | Removed the dead `setting()` function from `app/Helpers/helpers.php`. |
| S17 | **LOW: Orphaned `RegisterRequest` validation class** — no active routes use it | Deleted `app/Http/Requests/Auth/RegisterRequest.php`. |

### Routes Verified (All 200 — All Roles)

After all fixes, every role (Admin, PM, Lead, Employee) returns HTTP 200 on all 18 routes:
`/dashboard`, `/projects`, `/projects/create`, `/projects/{id}`, `/projects/{id}/edit`, `/tasks`, `/tasks/create`, `/tasks/{id}`, `/tasks/{id}/edit`, `/users`, `/users/create`, `/users/{id}`, `/users/{id}/edit`, `/notifications`, `/activity`, `/reports`, `/profile`, `/monitoring`

### Commands to Run After This Session
```bash
# No new migrations needed (all fixes are code-only)
php artisan optimize:clear    # Clear any cached routes/config
```

### Performance Optimization Applied (May 2026)

| # | Issue | Fix |
|---|-------|------|
| P1 | Missing DB indexes on `tasks.author_id`, `tasks.approver_id`, `comments.project_id`, `notifications.type`, `integrations.is_active` — all used in queries without index support | Created migration `0005_01_01_000000_add_performance_indexes.php` adding indexes on all 5 columns |
| P2 | `getAdminData` called `reportService->projectHealth()` (5 withCounts/project) but only used 2 fields — wasteful on every admin dashboard load | Inlined a lightweight query with only `total_tasks + completed_tasks` directly in `DashboardService::getAdminData()` |
| P3 | `status_distribution` did 8 individual COUNT queries (one per TaskStatus case) on every admin dashboard load | Consolidated into single `GROUP BY status` query with `pluck('count', 'status')` — 1 query instead of 8 |
| P4 | `config/horizon.php` referenced `'verified'` middleware that was removed in C6 — would 403 all Horizon access | Removed `'verified'` from Horizon middleware array |
| P5 | `DashboardService` constructor injected `ReportServiceInterface` but no longer used after P2 — dead dependency | Removed `$reportService` property and constructor parameter |
| P6 | `AppServiceProvider` imported `App\Services\Dashboard\ReportService` — class doesn't exist at that namespace | Removed wrong import |

### Manual Check: Performance
1. Verify admin dashboard loads without error (P2, P3)
2. Verify Horizon is accessible at `/horizon` (P4)
3. Run `EXPLAIN ANALYZE` on dashboard queries — should show index scans on `tasks.author_id`, `tasks.approver_id`, `comments.project_id`

## Test Suite

### Setup
```bash
# 1. Create test database (PostgreSQL)
createdb internal_tool_testing

# 2. Generate test APP_KEY (if not set)
php artisan key:generate --env=testing

# 3. Run tests
php artisan test
# or
./vendor/bin/phpunit
```

### Architecture
- **Base class**: `tests/TestCase.php` — seeds all 4 roles + 22 permissions in `setUp()`, creates reusable test users (`$this->superAdmin`, `$this->projectManager`, `$this->teamLead`, `$this->employee`)
- **Helper methods**: `actingAsSuperAdmin()`, `actingAsProjectManager()`, `actingAsTeamLead()`, `actingAsEmployee()`, `createProjectWithMembers($ownerRole = 'owner')`
- **Database**: `RefreshDatabase` trait on base class — each test gets a fresh, migrated, seeded database
- **Factories**: `UserFactory`, `ProjectFactory`, `TaskFactory`, `CommentFactory`, `IntegrationFactory`

### Test Structure
- All tests run against PostgreSQL (no SQLite in-memory — ensures real FK/index behavior)
- Queue: `sync` (notifications fire synchronously)
- Cache/Session: `array` (non-persistent)
- Mail: `array` (intercepted, not sent)
- Storage: `fake('attachments')` in `AttachmentTest::setUp()`
- Notifications: `Notification::fake()` in `NotificationTest::setUp()`

### Coverage by Module

| Module | File | Tests | Key Coverage |
|--------|------|-------|-------------|
| Authentication | `AuthenticationTest.php` | 17 | Login, logout, throttle, forgot/reset password, guest redirect |
| RBAC | `RBACTest.php` | 22 | Employee denied create/approve/manage, TL scoped, PM full, SA bypass |
| Projects | `ProjectTest.php` | 15 | CRUD, archive, member add/remove/role, status update, validation, auth |
| Tasks | `TaskTest.php` | 21 | CRUD, assign, status transitions, block/unblock, dependencies, validation, auth |
| Subtasks | `SubtaskTest.php` | 8 | Create, update, delete, inheritance, authorization |
| Comments | `CommentTest.php` | 13 | CRUD, replies, mentions, **XSS (3 tests: script, img, bold)** |
| Approvals | `ApprovalTest.php` | 11 | Submit/approve/reject, unauthorized access, validation |
| Notifications | `NotificationTest.php` | 11 | Single-notification guarantee (no dupes), correct triggers for each event |
| Attachments | `AttachmentTest.php` | 11 | Valid upload, invalid MIME (exe/php/html), oversize, auth, delete |
| Reports | `ReportTest.php` | 12 | View/export access per role, filtering by project/user/date/tab |
| Search | `SearchTest.php` | 14 | User name/email, project name/description, task title/tag, scope, empty |

### Test Count
- **Total test files**: 12 (9 new + 3 existing)
- **Total test methods**: ~165 (155 new + 10 existing)

### CI Considerations
- Requires PostgreSQL 15+ with `internal_tool_testing` database
- Configure `.env.testing` with local DB credentials
- No Redis dependency in tests (queue=sync, cache=array)
- No S3 dependency — `fake()` storage is used

## Production Deployment

### Prerequisites (Server)
- PHP 8.3+ with extensions: `pdo_pgsql`, `mbstring`, `xml`, `curl`, `gd`, `redis`
- Composer 2.x
- PostgreSQL 15+
- Redis 7+
- Node.js 20+ and npm
- Supervisor (for Horizon)
- Nginx or Apache
- Cron

### Files Provided
| File | Purpose |
|------|---------|
| `.env.production` | Production env template with secure defaults |
| `deploy.sh` | Automated deployment script (idempotent) |
| `supervisor-horizon.conf` | Supervisor config for Horizon daemon |

### Deployment Checklist

#### 1. Server Setup
- [ ] Install PHP 8.3+ with required extensions
- [ ] Install Composer 2.x
- [ ] Install PostgreSQL 15+ and create database
- [ ] Install Redis 7+
- [ ] Install Node.js 20+ and npm
- [ ] Install Supervisor
- [ ] Install Nginx (or Apache)
- [ ] Configure web server to point to `public/` directory
- [ ] Ensure `public/` is the document root

#### 2. Application Setup
- [ ] Clone repository to server
- [ ] Copy `.env.production` to `.env`: `cp .env.production .env`
- [ ] Generate app key: `php artisan key:generate`
- [ ] Configure `.env` with production values (database, Redis, mail, domain)

#### 3. Environment Configuration
- [ ] `APP_ENV=production` — must be production
- [ ] `APP_DEBUG=false` — MUST be false
- [ ] `APP_URL` — set to canonical production URL (https://...)
- [ ] `SESSION_SECURE_COOKIE=true` — REQUIRED for HTTPS
- [ ] `SESSION_DOMAIN` — set to your domain (e.g. `.example.com` with leading dot)
- [ ] `DB_SSLMODE=require` — for production database connections
- [ ] `LOG_LEVEL=error` — production logging level
- [ ] `LOG_STACK=daily` — rotate logs daily
- [ ] `MAIL_MAILER` — set to `smtp`, `ses`, `mailgun`, or `postmark`
- [ ] `SANCTUM_STATEFUL_DOMAINS` — set to production domain
- [ ] Database credentials (DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
- [ ] Redis credentials (REDIS_HOST, REDIS_PASSWORD)
- [ ] Horizon prefix (optional — uses `internal_tool_horizon:` by default)

#### 4. Build & Migrate
- [ ] Install PHP deps (no dev): `composer install --no-dev --optimize-autoloader`
- [ ] Install JS deps: `npm ci --no-audit --no-fund`
- [ ] Build assets: `npm run build`
- [ ] Run migrations: `php artisan migrate --force`
- [ ] (Optional) Seed database: `php artisan db:seed`
- [ ] Create storage symlink: `php artisan storage:link`

#### 5. Cache
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] `php artisan view:cache`
- [ ] `php artisan event:cache`

#### 6. Queue (Horizon + Supervisor)
- [ ] Copy `supervisor-horizon.conf` to `/etc/supervisor/conf.d/horizon.conf`
- [ ] Update the `command` path and `user` in the config
- [ ] Run: `sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start horizon:*`
- [ ] Verify: `sudo supervisorctl status`

#### 7. Scheduler (Cron)
- [ ] Add to crontab: `* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1`
- [ ] Verify: `crontab -l | grep artisan`

#### 8. Storage Permissions
- [ ] `chmod -R 775 storage bootstrap/cache`
- [ ] `chown -R www-data:www-data storage bootstrap/cache` (or your web server user)

#### 9. Post-Deploy Verification
- [ ] Visit `/up` health check endpoint — should return 200
- [ ] Login as admin user
- [ ] Verify Inertia pages render (no SSR errors in console)
- [ ] Submit a test comment with XSS payload (`<img src=x onerror=alert(1)>`) — must show as escaped text
- [ ] Create a task assigned to another user — verify 1 notification (not 2)
- [ ] Verify forgot password returns generic message for unknown emails
- [ ] Verify Horizon dashboard at `/horizon` (admin only)
- [ ] Verify file upload and download in task attachments
- [ ] Check `storage/logs/laravel.log` for errors

#### 10. Monitoring (Optional)
- [ ] Configure Sentry DSN in `.env` for error tracking
- [ ] Set up server monitoring (CPU, memory, disk, PostgreSQL, Redis)
- [ ] Configure log rotation (daily rotation is already set via `LOG_STACK=daily`)
- [ ] Set up database backups (pg_dump)

### Automated Deployment

Use the provided `deploy.sh` script for automated deployments:

```bash
# First-time setup only
cp .env.production .env
php artisan key:generate
# ... manually configure .env ...

# Every deployment
./deploy.sh
```

The script handles: maintenance mode, composer install, npm ci, asset build,
storage setup, config/route/view/event caching, migrations, and Horizon restart.

### Cron Configuration

```bash
# Run scheduler every minute
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

This triggers these scheduled tasks:
| Time | Command | Description |
|------|---------|-------------|
| Daily (00:00) | `model:prune` | Prunes old activity log entries |
| Daily (00:00) | `notifications:clean` | Cleans old notifications |
| Daily (08:00) | `tasks:send-due-reminders` | Due-date reminder emails |
| Daily (09:00) | `tasks:send-overdue` | Overdue task notifications |
| Every 5 min | `horizon:snapshot` | Horizon metrics snapshot |

### Horizon (Supervisor)

Horizon manages 3 queues: `default`, `notifications`, `media`.

Production supervisor config (in `supervisor-horizon.conf`):
```ini
[program:horizon]
process_name=%(program_name)s
command=php /path/to/project/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/project/storage/logs/horizon.log
stopwaitsecs=3600
stopasgroup=true
killasgroup=true
```

### Nginx Configuration Template

Create `/etc/nginx/sites-available/internal-tool`:

```nginx
server {
    listen 443 ssl http2;
    server_name internal-tool.example.com;

    root /path/to/project/public;
    index index.php;

    # SSL (use Let's Encrypt / certbot)
    ssl_certificate     /etc/letsencrypt/live/internal-tool.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/internal-tool.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "same-origin" always;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_vary on;

    # Upload size (matches media-library max)
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt { access_log off; log_not_found off; }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }

    # Long-lived asset cache
    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security: block access to storage (files served via authorized controller)
    location ^~ /storage/ {
        internal;
    }
}
```

### Health Check (Monitoring)

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/up` | GET | Laravel built-in (returns 200 if app booted) | None |
| `/api/health` | GET | Full health check (JSON) | None |
| `/monitoring` | GET | Admin monitoring dashboard (Inertia SPA) | Auth |
| `/horizon` | GET | Queue monitoring (Horizon) | Super-admin only |

The `/api/health` endpoint returns a JSON response with:
- Database connectivity + latency + active connections
- Redis ping + memory + uptime
- Cache read/write verification
- Queue status (Horizon running?, pending/failed job counts)
- Disk usage per mount (local, public, attachments) with file counts
- App metadata (env, PHP version, debug mode, maintenance mode)

```bash
# Example health check response
curl https://internal-tool.example.com/api/health
# HTTP 200: {"status":"ok","message":"All systems operational","checks":{...}}
# HTTP 503: {"status":"degraded","message":"Database unreachable","checks":{...}}
```

### Monitoring Commands

| Command | Description | Schedule |
|---------|-------------|----------|
| `monitor:health --format=table` | Run all checks, output table | Manual |
| `monitor:health --format=json` | Run all checks, output JSON | Manual |
| `monitor:health --format=log` | Run checks, log results | Every 5 min |
| `backup:database` | pg_dump with gzip + rotation | Daily 02:00 |
| `backup:restore {file}` | Restore DB from .sql or .sql.gz | Manual |

### Database Backup Strategy

The backup command (`backup:database`) performs:
1. **Full PostgreSQL dump** — `pg_dump` with `--no-owner --no-acl` (portable across servers)
2. **Gzip compression** — reduces dump size by 5-10x
3. **Rotation** — backups older than `BACKUP_RETENTION_DAYS` (default: 14) are purged
4. **Scheduling** — daily at 02:00, plus a weekly backup on Sunday at 03:00

```bash
# Manual backup
php artisan backup:database

# Custom location
php artisan backup:database --path=/var/backups --keep=30

# Restore from backup
php artisan backup:restore storage/app/backups/internal_tool_2026-05-21_0200.sql.gz
```

**Backup files stored at:** `BACKUP_PATH` (default: `storage/app/backups/`)
**Naming convention:** `{database}_{YYYY-MM-DD_HHmm}.sql.gz`

### Restore Strategy

```bash
# 1. List available backups
ls -lh storage/app/backups/

# 2. Restore (with confirmation prompt)
php artisan backup:restore storage/app/backups/internal_tool_2026-05-21_0200.sql.gz

# 3. Force restore (skip prompt)
php artisan backup:restore --force storage/app/backups/internal_tool_2026-05-21_0200.sql.gz

# 4. Verify after restore
php artisan monitor:health --format=table
php artisan migrate:status
```

**Pre-restore checklist:**
- [ ] Notify users of downtime
- [ ] Enable maintenance mode: `php artisan down`
- [ ] Verify backup file exists and is not corrupted: `gunzip -t file.sql.gz`
- [ ] Run restore
- [ ] Verify data integrity
- [ ] Disable maintenance mode: `php artisan up`

### Log Retention

| Log | Location | Retention | Rotation |
|-----|----------|-----------|----------|
| Laravel app logs | `storage/logs/laravel.log` | 30 days | Daily (`LOG_STACK=daily`) |
| Horizon logs | `storage/logs/horizon.log` | 5 files @ 10MB | Supervisor-managed |
| PHP-FPM logs | `/var/log/php8.3-fpm.log` | OS-managed | OS-managed |
| Nginx access/error | `/var/log/nginx/` | OS-managed | OS-managed |

### Alerting Strategy (Optional)

For a small internal deployment, monitoring is intentionally **passive** (log-based + dashboard). To enable active alerting:

#### Option 1: Email Alerts
```bash
# .env
MONITOR_ALERT_EMAIL=ops@example.com
```
Failed job alerts are sent to this address via `FailedJobAlert` notification.

#### Option 2: Sentry (Error Tracking)
```bash
# 1. Install
composer require sentry/sentry-laravel

# 2. Configure DSN
# .env
SENTRY_LARAVEL_DSN=https://xxx@xxx.ingest.us.sentry.io/xxxxxx

# 3. Verify
php artisan sentry:test
```

#### Option 3: External Uptime Monitoring
Point an external monitor (UptimeRobot, Checkly, StatusCake) at:
```
https://internal-tool.example.com/api/health
```
It will receive HTTP 200 on success, HTTP 503 on failure.

### Scheduled Tasks Summary

| Time | Command | Description |
|------|---------|-------------|
| Every 5 min | `horizon:snapshot` | Horizon metrics snapshot |
| Every 5 min | `monitor:health --format=log` | Run health checks, log results |
| Daily 00:00 | `model:prune` | Prune old activity log entries |
| Daily 00:00 | `notifications:clean` | Clean old notifications |
| Daily 02:00 | `backup:database` | Database backup (daily) |
| Daily 08:00 | `tasks:send-due-reminders` | Due-date reminder emails |
| Daily 09:00 | `tasks:send-overdue` | Overdue task notifications |
| Sunday 03:00 | `backup:database` | Database backup (weekly, retained longer) |

### Maintenance Mode

```bash
# Enable (with retry header for JS redirect)
php artisan down --retry=30

# Disable
php artisan up

# Check status
php artisan about
```

