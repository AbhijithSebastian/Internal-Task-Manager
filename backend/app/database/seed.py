from sqlalchemy.orm import Session
from app.core.security import get_password_hash
import app.database.models  # noqa: ensure all models are registered
from app.users.models import User
from app.roles.models import Role
from app.permissions.models import Permission


PERMISSION_DEFS = [
    # Users
    {"name": "users.view", "group": "users", "label": "View users"},
    {"name": "users.create", "group": "users", "label": "Create users"},
    {"name": "users.update", "group": "users", "label": "Update users"},
    {"name": "users.delete", "group": "users", "label": "Delete users"},
    {"name": "users.restore", "group": "users", "label": "Restore users"},
    {"name": "users.deactivate", "group": "users", "label": "Deactivate users"},
    {"name": "users.reset-password", "group": "users", "label": "Reset user passwords"},
    {"name": "users.invite", "group": "users", "label": "Invite users"},
    # Projects
    {"name": "projects.view", "group": "projects", "label": "View projects"},
    {"name": "projects.create", "group": "projects", "label": "Create projects"},
    {"name": "projects.update", "group": "projects", "label": "Update projects"},
    {"name": "projects.delete", "group": "projects", "label": "Delete projects"},
    {"name": "projects.archive", "group": "projects", "label": "Archive projects"},
    {"name": "projects.manage-members", "group": "projects", "label": "Manage project members"},
    {"name": "projects.manage-settings", "group": "projects", "label": "Manage project settings"},
    # Tasks
    {"name": "tasks.view", "group": "tasks", "label": "View tasks"},
    {"name": "tasks.create", "group": "tasks", "label": "Create tasks"},
    {"name": "tasks.update", "group": "tasks", "label": "Update tasks"},
    {"name": "tasks.delete", "group": "tasks", "label": "Delete tasks"},
    {"name": "tasks.assign", "group": "tasks", "label": "Assign tasks"},
    {"name": "tasks.approve", "group": "tasks", "label": "Approve tasks"},
    {"name": "tasks.reject", "group": "tasks", "label": "Reject tasks"},
    {"name": "tasks.review", "group": "tasks", "label": "Review tasks"},
    {"name": "tasks.change-status", "group": "tasks", "label": "Change task status"},
    {"name": "tasks.submit-approval", "group": "tasks", "label": "Submit tasks for approval"},
    # Subtasks
    {"name": "subtasks.view", "group": "subtasks", "label": "View subtasks"},
    {"name": "subtasks.create", "group": "subtasks", "label": "Create subtasks"},
    {"name": "subtasks.update", "group": "subtasks", "label": "Update subtasks"},
    {"name": "subtasks.delete", "group": "subtasks", "label": "Delete subtasks"},
    {"name": "subtasks.assign", "group": "subtasks", "label": "Assign subtasks"},
    {"name": "subtasks.change-status", "group": "subtasks", "label": "Change subtask status"},
    {"name": "subtasks.approve", "group": "subtasks", "label": "Approve subtasks"},
    # Dashboard
    {"name": "dashboard.view", "group": "dashboard", "label": "View dashboard"},
    {"name": "dashboard.activity", "group": "dashboard", "label": "View team activity"},
    {"name": "dashboard.notifications", "group": "dashboard", "label": "View notifications"},
    {"name": "dashboard.announcements", "group": "dashboard", "label": "View announcements"},
    # Comments
    {"name": "comments.view", "group": "comments", "label": "View comments"},
    {"name": "comments.create", "group": "comments", "label": "Create comments"},
    {"name": "comments.update", "group": "comments", "label": "Update comments"},
    {"name": "comments.delete", "group": "comments", "label": "Delete comments"},
    {"name": "comments.activity", "group": "comments", "label": "View activity logs"},
    # Reports
    {"name": "reports.view", "group": "reports", "label": "View reports"},
    {"name": "reports.generate", "group": "reports", "label": "Generate reports"},
    {"name": "reports.export", "group": "reports", "label": "Export reports"},
    {"name": "reports.download", "group": "reports", "label": "Download reports"},
    # Attachments
    {"name": "attachments.view", "group": "attachments", "label": "View attachments"},
    {"name": "attachments.upload", "group": "attachments", "label": "Upload attachments"},
    {"name": "attachments.delete", "group": "attachments", "label": "Delete attachments"},
    {"name": "attachments.download", "group": "attachments", "label": "Download attachments"},
    # Announcements
    {"name": "announcements.view", "group": "announcements", "label": "View announcements"},
    {"name": "announcements.create", "group": "announcements", "label": "Create announcements"},
    {"name": "announcements.update", "group": "announcements", "label": "Update announcements"},
    {"name": "announcements.delete", "group": "announcements", "label": "Delete announcements"},
    {"name": "announcements.pin", "group": "announcements", "label": "Pin announcements"},
    # Notifications
    {"name": "notifications.view", "group": "notifications", "label": "View notifications"},
    {"name": "notifications.manage", "group": "notifications", "label": "Manage notification settings"},
    # Permissions
    {"name": "permissions.view", "group": "permissions", "label": "View permissions"},
    {"name": "permissions.manage", "group": "permissions", "label": "Manage permissions"},
    # Meetings
    {"name": "meetings.view", "group": "meetings", "label": "View meetings"},
    {"name": "meetings.create", "group": "meetings", "label": "Create meetings"},
    {"name": "meetings.update", "group": "meetings", "label": "Update meetings"},
    {"name": "meetings.delete", "group": "meetings", "label": "Delete meetings"},
    # Milestones
    {"name": "milestones.view", "group": "milestones", "label": "View milestones"},
    {"name": "milestones.create", "group": "milestones", "label": "Create milestones"},
    {"name": "milestones.update", "group": "milestones", "label": "Update milestones"},
    {"name": "milestones.delete", "group": "milestones", "label": "Delete milestones"},
]

ALL_PERMISSION_NAMES = [p["name"] for p in PERMISSION_DEFS]

ROLE_CONFIGS = [
    {
        "name": "super-admin",
        "description": "Full system access with all permissions",
        "color": "#DC2626",
        "icon": "shield",
        "is_system": True,
        "is_active": True,
        "permissions": ALL_PERMISSION_NAMES,
    },
    {
        "name": "project-manager",
        "description": "Manages projects, tasks, and team members",
        "color": "#2563EB",
        "icon": "briefcase",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.activity", "dashboard.notifications", "dashboard.announcements",
            "projects.view", "projects.create", "projects.update", "projects.delete",
            "projects.archive", "projects.manage-members", "projects.manage-settings",
            "tasks.view", "tasks.create", "tasks.update", "tasks.delete",
            "tasks.assign", "tasks.approve", "tasks.reject", "tasks.review",
            "tasks.change-status",
            "subtasks.view", "subtasks.create", "subtasks.update", "subtasks.delete",
            "subtasks.assign", "subtasks.change-status", "subtasks.approve",
            "meetings.view", "meetings.create", "meetings.update",
            "announcements.view", "announcements.create", "announcements.update", "announcements.delete",
            "reports.view", "reports.generate", "reports.export", "reports.download",
            "users.view",
            "comments.view", "comments.create", "comments.update",
            "attachments.view", "attachments.upload", "attachments.download",
            "notifications.view", "notifications.manage",
            "milestones.view", "milestones.create", "milestones.update",
        ],
    },
    {
        "name": "team-lead",
        "description": "Leads a development team with task management",
        "color": "#7C3AED",
        "icon": "users",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.activity", "dashboard.notifications", "dashboard.announcements",
            "projects.view",
            "tasks.view", "tasks.create", "tasks.update", "tasks.assign",
            "tasks.change-status", "tasks.submit-approval",
            "subtasks.view", "subtasks.create", "subtasks.update",
            "subtasks.assign", "subtasks.change-status",
            "meetings.view", "meetings.create",
            "reports.view",
            "comments.view", "comments.create", "comments.update",
            "attachments.view", "attachments.upload",
            "announcements.view",
            "notifications.view",
            "milestones.view",
        ],
    },
    {
        "name": "developer",
        "description": "Works on assigned tasks and subtasks",
        "color": "#059669",
        "icon": "code",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "tasks.view", "tasks.update", "tasks.change-status", "tasks.submit-approval",
            "subtasks.view", "subtasks.create", "subtasks.update", "subtasks.change-status",
            "meetings.view",
            "comments.view", "comments.create", "comments.update",
            "attachments.view", "attachments.upload", "attachments.download",
            "announcements.view",
            "notifications.view",
        ],
    },
    {
        "name": "designer",
        "description": "Handles design tasks and attachments",
        "color": "#D97706",
        "icon": "palette",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "projects.view",
            "tasks.view", "tasks.update", "tasks.change-status",
            "subtasks.view", "subtasks.update", "subtasks.change-status",
            "meetings.view",
            "comments.view", "comments.create",
            "attachments.view", "attachments.upload", "attachments.download",
            "announcements.view",
            "notifications.view",
        ],
    },
    {
        "name": "hr",
        "description": "Manages users and company settings",
        "color": "#0891B2",
        "icon": "building",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "users.view", "users.create", "users.update", "users.delete",
            "users.deactivate", "users.reset-password", "users.invite",
            "announcements.view", "announcements.create", "announcements.update", "announcements.delete",
            "permissions.view",
            "comments.view", "comments.create",
            "notifications.view", "notifications.manage",
            "attachments.view", "attachments.upload",
        ],
    },
    {
        "name": "qa-engineer",
        "description": "Reviews and approves tasks and subtasks",
        "color": "#0D9488",
        "icon": "check-circle",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "tasks.view", "tasks.approve", "tasks.reject", "tasks.review",
            "subtasks.view", "subtasks.approve",
            "meetings.view",
            "reports.view",
            "comments.view", "comments.create",
            "attachments.view",
            "announcements.view",
            "notifications.view",
        ],
    },
    {
        "name": "intern",
        "description": "Limited access for learning and observation",
        "color": "#6B7280",
        "icon": "graduation-cap",
        "is_system": False,
        "is_active": True,
        "permissions": [
            "dashboard.view", "dashboard.notifications",
            "tasks.view",
            "subtasks.view",
            "meetings.view",
            "comments.view", "comments.create",
            "attachments.view", "attachments.download",
            "announcements.view",
            "notifications.view",
        ],
    },
]

TEST_USERS = [
    {"name": "Super Admin", "email": "admin@company.com", "role": "super-admin"},
    {"name": "Project Manager", "email": "pm@company.com", "role": "project-manager"},
    {"name": "Team Lead", "email": "lead@company.com", "role": "team-lead"},
    {"name": "Developer One", "email": "dev1@company.com", "role": "developer"},
    {"name": "Developer Two", "email": "dev2@company.com", "role": "developer"},
    {"name": "Designer One", "email": "designer1@company.com", "role": "designer"},
    {"name": "Designer Two", "email": "designer2@company.com", "role": "designer"},
    {"name": "HR Manager", "email": "hr@company.com", "role": "hr"},
    {"name": "QA Engineer", "email": "qa@company.com", "role": "qa-engineer"},
    {"name": "Intern", "email": "intern@company.com", "role": "intern"},
]

EXISTING_USERS_MAP = [
    {"name": "Abhijith", "role": "super-admin"},
    {"name": "Eve", "role": "project-manager"},
    {"name": "Geo", "role": "team-lead"},
    {"name": "Tojin", "role": "developer"},
    {"name": "Alice", "role": "developer"},
    {"name": "Bob", "role": "developer"},
    {"name": "Frank", "role": "developer"},
    {"name": "Carol", "role": "designer"},
    {"name": "David", "role": "designer"},
    {"name": "Grace", "role": "designer"},
    {"name": "Cincy", "role": "employee"},
    {"name": "Divya", "role": "employee"},
    {"name": "Rojan", "role": "employee"},
]


def seed(db: Session):
    perm_objects = {}
    for pdef in PERMISSION_DEFS:
        perm = db.query(Permission).filter(Permission.name == pdef["name"]).first()
        if not perm:
            perm = Permission(
                name=pdef["name"],
                guard_name="web",
                group=pdef["group"],
                label=pdef["label"],
            )
            db.add(perm)
            db.flush()
        else:
            if perm.group != pdef["group"] or perm.label != pdef["label"]:
                perm.group = pdef["group"]
                perm.label = pdef["label"]
                db.flush()
        perm_objects[pdef["name"]] = perm

    role_objects = {}
    for rcfg in ROLE_CONFIGS:
        role = db.query(Role).filter(Role.name == rcfg["name"]).first()
        if not role:
            role = Role(
                name=rcfg["name"],
                guard_name="web",
                description=rcfg["description"],
                color=rcfg["color"],
                icon=rcfg["icon"],
                is_active=rcfg["is_active"],
                is_system=rcfg["is_system"],
            )
            db.add(role)
            db.flush()
        else:
            role.description = rcfg["description"]
            role.color = rcfg["color"]
            role.icon = rcfg["icon"]
            role.is_active = rcfg["is_active"]
            role.is_system = rcfg["is_system"]
            db.flush()

        role.permissions = [perm_objects[n] for n in rcfg["permissions"]]
        role_objects[rcfg["name"]] = role

    for user_data in TEST_USERS:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            existing.name = user_data["name"]
            role = role_objects.get(user_data["role"])
            if role and role not in existing.roles:
                existing.roles.append(role)
            continue

        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password=get_password_hash("password"),
            is_active=True,
        )
        db.add(user)
        db.flush()
        role = role_objects.get(user_data["role"])
        if role:
            user.roles.append(role)

    for mapping in EXISTING_USERS_MAP:
        user = db.query(User).filter(User.name == mapping["name"]).first()
        if user:
            role = role_objects.get(mapping["role"])
            if role and role not in user.roles:
                user.roles.append(role)

    db.commit()


if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    seed(db)
    db.close()
    print("Database seeded successfully")
