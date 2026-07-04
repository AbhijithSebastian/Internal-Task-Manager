# Phase C — Data Requirements

> **Status:** Complete
> **Backend:** 95 endpoints across 18 routers (all implemented)
> **Identified Gaps:** 7

---

## 1. API Endpoint Reference by Screen

### S01-S04 — Auth Screens

| Endpoint | Method | Screen | Auth | Request | Response |
|----------|--------|--------|------|---------|----------|
| `/api/v1/auth/login` | POST | S01 | No | `{email, password}` | `{access_token, refresh_token, token_type, user}` |
| `/api/v1/auth/register` | POST | S02 | No | `{name, email, password, password_confirmation}` | `{access_token, refresh_token, token_type, user}` |
| `/api/v1/auth/forgot-password` | POST | S03 | No | `{email}` | `{message}` |
| `/api/v1/auth/reset-password` | POST | S04 | No | `{token, password, password_confirmation}` | `{message}` |

### S05 — Smart Home Dashboard

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| `GET /api/v1/dashboard/stats` | GET | Yes | none | `{my_tasks, due_today, overdue, completed_this_week, ...}` trends |
| `GET /api/v1/dashboard/role-data` | GET | Yes | none | Role-specific KPI data |
| `GET /api/v1/dashboard/projects` | GET | Yes | none | `[{project_id, name, health, progress, pm, due_date}]` |
| `GET /api/v1/dashboard/activities` | GET | Yes | `?limit=5` | `[{user, action, resource, timestamp}]` |
| `GET /api/v1/notifications/count` | GET | Yes | none | `{unread_count}` |
| `GET /api/v1/tasks` | GET | Yes | `?status=today&limit=5` | Paginated tasks |

### S06-S09 — Projects

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/projects` | GET | S06 | `?page=1&per_page=20&status=&health=&search=&sort_by=&sort_order=` |
| `GET /api/v1/projects/search` | GET | S06 | `?q=` |
| `POST /api/v1/projects` | POST | S07 | `{name, description, pm_id, status, priority, start_date, end_date, member_ids}` |
| `GET /api/v1/projects/{id}` | GET | S08 | path param |
| `PUT /api/v1/projects/{id}` | PUT | S09 | `{name, description, status, priority, dates}` |
| `PATCH /api/v1/projects/{id}/status` | PATCH | S09 | `{status}` |
| `PATCH /api/v1/projects/{id}/archive` | PATCH | S09 | none |
| `DELETE /api/v1/projects/{id}` | DELETE | S09 | none |

### S10-S12 — Tasks

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/tasks` | GET | S10 | `?page=1&per_page=20&status=&priority=&assignee_id=&project_id=&due_date=&search=&view=list|board|calendar&sort_by=&sort_order=` |
| `GET /api/v1/tasks/parents` | GET | S10 | `?project_id=` |
| `GET /api/v1/tasks/{id}` | GET | S11 | path param |
| `POST /api/v1/tasks` | POST | S12 | `{title, description, status, priority, assignee_id, project_id, due_date, parent_id}` |
| `PUT /api/v1/tasks/{id}` | PUT | S11 | `{title, description, priority, due_date}` |
| `PATCH /api/v1/tasks/{id}/status` | PATCH | S10/S11 | `{status}` |
| `POST /api/v1/tasks/{id}/assign` | POST | S10/S11 | `{assignee_id}` |
| `POST /api/v1/tasks/{id}/submit-for-review` | POST | S11 | none |
| `POST /api/v1/tasks/{id}/approve` | POST | S11 | none |
| `POST /api/v1/tasks/{id}/reject` | POST | S11 | `{reason}` |
| `POST /api/v1/tasks/{id}/block` | POST | S11 | `{reason}` |
| `POST /api/v1/tasks/{id}/unblock` | POST | S11 | none |
| `POST /api/v1/tasks/{id}/subtasks` | POST | S11 | `{title, assignee_id}` |
| `DELETE /api/v1/tasks/{id}/subtasks/{sid}` | DELETE | S11 | path params |
| `POST /api/v1/tasks/{id}/dependencies` | POST | S11 | `{dependency_id}` |
| `DELETE /api/v1/tasks/{id}/dependencies/{did}` | DELETE | S11 | path params |

### Comments & Attachments

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/comments` | GET | S11 | `?task_id=&page=1&per_page=20` |
| `POST /api/v1/comments` | POST | S11 | `{content, task_id, parent_id}` |
| `PUT /api/v1/comments/{id}` | PUT | S11 | `{content}` |
| `DELETE /api/v1/comments/{id}` | DELETE | S11 | none |
| `GET /api/v1/attachments` | GET | S11 | `?task_id=&project_id=` |
| `POST /api/v1/attachments/upload` | POST | S11 | multipart file + `{entity_type, entity_id}` |
| `GET /api/v1/attachments/download/{id}` | GET | S11 | path param |
| `DELETE /api/v1/attachments/{id}` | DELETE | S11 | none |

### S13 — Calendar

| Endpoint | Method | Request Params |
|----------|--------|----------------|
| `GET /api/v1/tasks` | GET | `?date_from=&date_to=&assignee_id=` |
| `GET /api/v1/meetings` | GET | `?date_from=&date_to=&organizer_id=` |
| `GET /api/v1/milestones` | GET | `?date_from=&date_to=` |

### S14 — Milestones

| Endpoint | Method | Request Params |
|----------|--------|----------------|
| `GET /api/v1/milestones` | GET | `?page=&per_page=&project_id=&status=&date_from=&date_to=` |
| `GET /api/v1/milestones/{id}` | GET | path param |
| `POST /api/v1/milestones` | POST | `{name, description, due_date, project_id, status}` |
| `PUT /api/v1/milestones/{id}` | PUT | `{name, description, due_date, status}` |
| `DELETE /api/v1/milestones/{id}` | DELETE | none |

### S15-S18 — People / Users

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/users` | GET | S15 | `?page=1&per_page=20&role=&department=&status=&search=&sort_by=` |
| `GET /api/v1/users/search` | GET | S15 | `?q=` |
| `GET /api/v1/users/{id}` | GET | S16 | path param |
| `POST /api/v1/users` | POST | S17 | `{name, email, password, role_id, department, title}` |
| `PUT /api/v1/users/{id}` | PUT | S18 | `{name, email, role_id, department, title}` |
| `DELETE /api/v1/users/{id}` | DELETE | S18 | none |
| `POST /api/v1/users/{id}/toggle-active` | POST | S18 | none |
| `POST /api/v1/users/{id}/restore` | POST | S18 | none |
| `GET /api/v1/permissions/users/{id}` | GET | S18 | path param |
| `PUT /api/v1/permissions/users/{id}/role` | PUT | S18 | `{role_id}` |

### S19-S21 — Meetings

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/meetings` | GET | S19 | `?page=&per_page=&date_from=&date_to=&organizer_id=&project_id=&search=` |
| `GET /api/v1/meetings/{id}` | GET | S20 | path param |
| `POST /api/v1/meetings` | POST | S21 | `{title, description, date, start_time, duration, location, agenda, attendee_ids, project_id}` |
| `PUT /api/v1/meetings/{id}` | PUT | S20 | update fields |
| `DELETE /api/v1/meetings/{id}` | DELETE | S20 | none |

### S22-S24 — Announcements

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/announcements` | GET | S22 | `?page=&per_page=&author_id=&priority=&date_from=&date_to=&search=` |
| `POST /api/v1/announcements` | POST | S24 | `{title, content, audience, priority, is_pinned}` |
| `PUT /api/v1/announcements/{id}` | PUT | S23 | update fields |
| `DELETE /api/v1/announcements/{id}` | DELETE | S23 | none |

### S25 — Notifications

| Endpoint | Method | Request Params |
|----------|--------|----------------|
| `GET /api/v1/notifications` | GET | `?page=1&per_page=20&category=all|unread|mentions|approvals` |
| `GET /api/v1/notifications/count` | GET | none |
| `PATCH /api/v1/notifications/{id}/read` | PATCH | none |
| `POST /api/v1/notifications/read-all` | POST | none |

### S26 — Activity

| Endpoint | Method | Request Params |
|----------|--------|----------------|
| `GET /api/v1/activity` | GET | `?page=&per_page=&user_id=&action=&resource_type=&date_from=&date_to=&search=` |

### S27-S32 — Analytics

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/reports` | GET | S27 | `?date_from=&date_to=&project_id=&type=` |
| `GET /api/v1/reports/export` | GET | S32 | `?type=health|velocity|workload|trends&format=csv|pdf&date_from=&date_to=&columns=` |
| `GET /api/v1/reports/project/{id}/preview` | GET | S28 | path param |

### S33-S36 — Roles & Permissions

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/roles` | GET | S33 | `?page=&per_page=` |
| `GET /api/v1/roles/{id}` | GET | S34 | path param |
| `GET /api/v1/roles/{id}/permissions` | GET | S34 | path param |
| `PUT /api/v1/roles/{id}/permissions` | PUT | S34 | `{permissions: [{resource, action, granted}]}` |
| `GET /api/v1/permissions/users/{id}` | GET | S36 | path param |
| `PUT /api/v1/permissions/users/{id}` | PUT | S36 | `{permissions: [...]}` |

### S37-S39 — Integrations

| Endpoint | Method | Screen | Request Params |
|----------|--------|--------|----------------|
| `GET /api/v1/integrations` | GET | S37 | `?page=&per_page=` |
| `GET /api/v1/integrations/{id}` | GET | S38 | path param |
| `POST /api/v1/integrations` | POST | S39 | `{name, type, config}` |
| `PUT /api/v1/integrations/{id}` | PUT | S38 | update fields |
| `DELETE /api/v1/integrations/{id}` | DELETE | S38 | none |
| `POST /api/v1/integrations/{id}/sync` | POST | S38 | none |

### S40-S44 — Settings

| Endpoint | Method | Screen | Request |
|----------|--------|--------|---------|
| `GET /api/v1/auth/me` | GET | S40 | none |
| `PUT /api/v1/users/{id}` | PUT | S40 | `{name, bio, department, title}` |
| `POST /api/v1/auth/forgot-password` | POST | S41 | `{email}` (password change flow) |
| — | — | S42 | **BACKEND GAP** — no workspace settings endpoints |
| — | — | S43 | **BACKEND GAP** — no notification preference endpoints |
| — | — | S44 | **BACKEND GAP** — no appearance settings (client-side only OK) |

### S45-S47 — System

No API dependencies. 404, Error Boundary, Onboarding are client-side only.

---

## 2. Pagination Standard

All list endpoints follow this pattern:

```
Request:
  ?page=1
  &per_page=20        (default: 20, max: 100)
  &sort_by=created_at (field name)
  &sort_order=desc    (asc | desc)

Response:
  {
    "items": [...],
    "total": 142,
    "page": 1,
    "per_page": 20,
    "pages": 8,
    "next": "/api/v1/resource?page=2&per_page=20",
    "prev": null
  }
```

---

## 3. Filtering Standard

Filters use query parameters on GET list endpoints:

```
# Status filter (single or multi)
?status=todo,in-progress

# Date range
?date_from=2025-01-01&date_to=2025-12-31

# Preset date ranges (handled client-side, sent as date_from/date_to)
?due_date=today        → client resolves to date_from=today&date_to=today
?due_date=overdue      → client resolves to date_to=yesterday

# Relationship filters
?assignee_id=uuid
?project_id=uuid

# Search
?search=query+string
```

**Client responsibility:** Transform preset date ranges into date_from/date_to before sending.

---

## 4. Search Standard

| Feature | Detail |
|---------|--------|
| Endpoint | `GET /api/v1/search?q=query` |
| Response | `{ projects: [...], tasks: [...], users: [...], meetings: [...] }` grouped |
| Debounce | 300ms client-side before sending request |
| Min chars | 2 (no search before 2 chars) |
| Empty | Return empty groups, not 404 |
| Scoping | Results scoped by user permissions (users see only what they can access) |

---

## 5. Identified Backend Gaps

### Gap 1: Workspace Settings Endpoints (S42)
Missing `GET/PUT /api/v1/settings/workspace`. Needed for workspace name, logo, defaults.
**Workaround:** Store in a settings table (new model). Add router.

### Gap 2: Notification Preference Endpoints (S43)
Missing `GET/PUT /api/v1/settings/notifications`. Needed for per-user notification toggles.
**Workaround:** Add notification_preferences table + router.

### Gap 3: Self-Service Password Change (S41)
No dedicated password change endpoint. Current `forgot-password` flow requires email token.
**Need:** `POST /api/v1/auth/change-password` with `{current_password, new_password, new_password_confirmation}` + auth.

### Gap 4: Role CRUD (S35)
Missing `POST /api/v1/roles/create` and `DELETE /api/v1/roles/{id}`. Only update-permissions and GET exist.
**Need:** Full CRUD on roles.

### Gap 5: Role Listing for Dropdowns (S17, S35)
`GET /api/v1/roles` exists but needs `permissions.view` permission. For user create/edit, the role picker should be available to users with `users.create` permission as well.
**Need:** Relax permission or add a public roles endpoint.

### Gap 6: Dashboard Aggregation Endpoints (S05)
Dashboard endpoints exist but may not return all required data per role variant.
**Need:** Verify role-scoped aggregation endpoints return: my tasks count, due today, overdue, completed this week, team tasks (TL), pending review (TL), active projects (PM), project health (PM/Exec), etc.

### Gap 7: Bulk Task Operations (S10)
No endpoint for bulk status change, bulk assign, or bulk delete.
**Need:** `POST /api/v1/tasks/bulk` with `{task_ids: [...], action: "status|assign|delete", value: "..."}`.

---

## 6. Permission Standard

### Permission Checks by Screen

| Screen | Permission Required | Fallback Behavior |
|--------|-------------------|-------------------|
| S01-S04 | None (public) | — |
| S05 | None (authenticated) | Login redirect |
| S06 | `projects.list` | Redirect to dashboard, toast |
| S07 | `projects.create` | 403 inline banner |
| S08 | `projects.read` | 403 inline banner |
| S09 | `projects.update` / `projects.delete` | Settings tab hidden for non-authorized |
| S10 | None (view) / `tasks.create` for create | Data scoped by role |
| S11 | None (view) | 403 if not assignee/watcher/member |
| S12 | `tasks.create` | 403 inline banner |
| S13-S16 | None (authenticated) | Data scoped |
| S17-S18 | `users.create/update/delete` | 403, admin section hidden |
| S19-S24 | None (authenticated) | Data scoped |
| S25 | None (authenticated) | Own notifications only (enforced server-side) |
| S26 | None (authenticated) | — |
| S27-S32 | `reports.view` | Redirect to dashboard |
| S33-S36 | `permissions.view` / `permissions.manage` | 403, admin section hidden |
| S37-S39 | None (authenticated) | Admin section hidden for non-admin |
| S40-S41 | None (authenticated) | Own data only |
| S42 | `settings.update` | Redirect |
| S43-S44 | None (authenticated) | Own preferences |

---

## 7. Data Consistency Rules

### Task Status State Machine

```
Todo ──→ In Progress ──→ In Review ──→ Done
  ↑           ↑              │
  └───────────┴──── Changes Requested
                              │
                              └──→ In Progress
```

### Health Score Calculation

Health % = `(completed_tasks / total_tasks * 0.4) + (1 - overdue_ratio) * 0.3 + (on_track_milestones / total_milestones) * 0.3`

### Color Coding Consistency

| Entity | Success | Warning | Danger | Info |
|--------|---------|---------|--------|------|
| Task Status | Done | In Progress, In Review | Overdue | Todo |
| Health | On Track (80%+) | At Risk (40-79%) | Critical (<40%) | Not Rated |
| Priority | — | Medium, High | Critical | Low |
| Meeting | Confirmed | Tentative | Cancelled | — |
| Integration | Active | Warning | Error | Inactive |
| User | Active | — | Inactive | Pending |

---

*End of Phase C — 95 Endpoints Catalogued, 7 Backend Gaps Identified*
