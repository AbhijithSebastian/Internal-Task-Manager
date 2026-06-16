-- PostgreSQL Schema for Internal Task Manager
-- This is a reference DDL. Actual migrations use Alembic.

-- Enums
CREATE TYPE user_role AS ENUM ('super-admin', 'project-manager', 'team-lead', 'employee');
CREATE TYPE project_status AS ENUM ('active', 'on_hold', 'completed', 'archived');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE project_member_role AS ENUM ('owner', 'manager', 'lead', 'developer', 'member');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'approved', 'done', 'cancelled', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE announcement_status AS ENUM ('draft', 'published');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'at_risk', 'completed', 'cancelled');

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    inherit_role_permissions BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: user_roles
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Junction: user_permissions
CREATE TABLE user_permissions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Junction: role_permissions
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'active',
    priority project_priority NOT NULL DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    pm_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    figma_url VARCHAR(2048),
    github_url VARCHAR(2048),
    docs_url VARCHAR(2048),
    meeting_url VARCHAR(2048),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_author ON projects(author_id);
CREATE INDEX idx_projects_pm ON projects(pm_id);
CREATE INDEX idx_projects_lead ON projects(lead_id);

-- Project Members
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role project_member_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- Tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'backlog',
    priority task_priority NOT NULL DEFAULT 'medium',
    tags JSONB,
    blocked_reason TEXT,
    due_date DATE,
    employee_eta DATE,
    estimated_hours NUMERIC(8,2),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_author ON tasks(author_id);
CREATE INDEX idx_tasks_approver ON tasks(approver_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);

-- Task Assignees
CREATE TABLE task_assignees (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id);

-- Task Dependencies
CREATE TABLE task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, dependency_id)
);
CREATE INDEX idx_task_dep_dep ON task_dependencies(dependency_id);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Mentions
CREATE TABLE mentions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mentions_user ON mentions(user_id);
CREATE INDEX idx_mentions_comment ON mentions(comment_id);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- Activity Log
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    log_name VARCHAR(255),
    description TEXT NOT NULL,
    subject_type VARCHAR(255),
    subject_id INTEGER,
    causer_type VARCHAR(255),
    causer_id INTEGER,
    properties JSONB,
    event VARCHAR(255),
    batch_uuid UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_log_name ON activity_log(log_name);
CREATE INDEX idx_activity_log_subject ON activity_log(subject_type, subject_id);
CREATE INDEX idx_activity_log_causer ON activity_log(causer_type, causer_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- Attachments
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    model_type VARCHAR(255) NOT NULL,
    model_id INTEGER NOT NULL,
    collection_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255),
    disk VARCHAR(255) NOT NULL DEFAULT 'local',
    size BIGINT NOT NULL DEFAULT 0,
    manipulations JSONB NOT NULL DEFAULT '{}',
    custom_properties JSONB NOT NULL DEFAULT '{}',
    order_column INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attachments_model ON attachments(model_type, model_id);
CREATE INDEX idx_attachments_collection ON attachments(collection_name);
CREATE INDEX idx_attachments_order ON attachments(order_column);

-- Announcements
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    priority announcement_priority NOT NULL DEFAULT 'medium',
    status announcement_status NOT NULL DEFAULT 'published',
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_published ON announcements(published_at);

-- Milestones
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    due_date DATE,
    completed_at DATE,
    status milestone_status NOT NULL DEFAULT 'pending',
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);

-- Integrations
CREATE TABLE integrations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, type)
);
CREATE INDEX idx_integrations_active ON integrations(is_active);

-- Meeting Logs
CREATE TABLE meeting_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    attendees JSONB,
    summary TEXT NOT NULL,
    decisions_taken TEXT,
    blockers TEXT,
    action_items TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_meeting_logs_project ON meeting_logs(project_id);
