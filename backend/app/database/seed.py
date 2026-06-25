from sqlalchemy.orm import Session
from app.core.security import get_password_hash
import app.database.models  # noqa: ensure all models are registered
from app.users.models import User
from app.roles.models import Role, role_permissions
from app.permissions.models import Permission


def seed(db: Session):
    if db.query(User).count() > 0:
        return

    permission_names = [
        "users.view", "users.create", "users.update", "users.delete",
        "users.deactivate", "users.reset-password", "users.invite",
        "projects.view", "projects.create", "projects.update", "projects.delete",
        "projects.archive", "projects.manage-members", "projects.manage-settings",
        "tasks.view", "tasks.create", "tasks.update", "tasks.delete",
        "tasks.assign", "tasks.approve", "tasks.reject", "tasks.change-status",
        "tasks.submit-approval",
        "subtasks.view", "subtasks.create", "subtasks.update", "subtasks.delete",
        "subtasks.assign", "subtasks.change-status", "subtasks.approve",
        "dashboard.view", "dashboard.activity", "dashboard.notifications", "dashboard.announcements",
        "comments.view", "comments.create", "comments.update", "comments.delete", "comments.activity",
        "reports.view", "reports.generate", "reports.export", "reports.download",
        "attachments.view", "attachments.upload", "attachments.delete", "attachments.download",
        "announcements.view", "announcements.create", "announcements.update", "announcements.delete",
        "notifications.view", "notifications.manage",
    ]

    perm_objects = {}
    for name in permission_names:
        perm = db.query(Permission).filter(Permission.name == name).first()
        if not perm:
            perm = Permission(name=name)
            db.add(perm)
            db.flush()
        perm_objects[name] = perm

    roles_config = {
        "super-admin": permission_names,
        "project-manager": [
            "users.view", "users.create", "users.update", "users.delete",
            "users.deactivate", "users.reset-password", "users.invite",
            "projects.view", "projects.create", "projects.update", "projects.delete",
            "projects.archive", "projects.manage-members", "projects.manage-settings",
            "tasks.view", "tasks.create", "tasks.update", "tasks.delete",
            "tasks.assign", "tasks.approve", "tasks.reject", "tasks.change-status",
            "subtasks.view", "subtasks.create", "subtasks.update", "subtasks.delete",
            "subtasks.assign", "subtasks.change-status", "subtasks.approve",
            "dashboard.view", "dashboard.activity", "dashboard.notifications", "dashboard.announcements",
            "comments.view", "comments.create", "comments.update", "comments.delete", "comments.activity",
            "reports.view", "reports.generate", "reports.export", "reports.download",
            "attachments.view", "attachments.upload", "attachments.delete", "attachments.download",
            "announcements.view", "announcements.create", "announcements.update", "announcements.delete",
            "notifications.view", "notifications.manage",
        ],
        "team-lead": [
            "users.view",
            "projects.view",
            "tasks.view", "tasks.create", "tasks.update", "tasks.change-status",
            "subtasks.view", "subtasks.create", "subtasks.update", "subtasks.change-status",
            "dashboard.view", "dashboard.activity", "dashboard.notifications", "dashboard.announcements",
            "comments.view", "comments.create", "comments.update", "comments.delete",
            "reports.view",
            "attachments.view", "attachments.upload",
            "announcements.view",
            "notifications.view",
        ],
        "developer": [
            "tasks.view", "tasks.create", "tasks.update", "tasks.change-status", "tasks.submit-approval",
            "subtasks.view", "subtasks.create", "subtasks.update", "subtasks.change-status",
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "comments.view", "comments.create", "comments.update",
            "attachments.view", "attachments.upload",
            "announcements.view",
            "notifications.view",
        ],
        "designer": [
            "tasks.view", "tasks.update", "tasks.change-status",
            "subtasks.view", "subtasks.update", "subtasks.change-status",
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "comments.view", "comments.create",
            "attachments.view", "attachments.upload",
            "announcements.view",
            "notifications.view",
        ],
        "employee": [
            "tasks.view", "tasks.update", "tasks.change-status", "tasks.submit-approval",
            "subtasks.view", "subtasks.update", "subtasks.change-status",
            "dashboard.view", "dashboard.notifications", "dashboard.announcements",
            "comments.view", "comments.create",
            "attachments.view", "attachments.upload",
            "announcements.view",
            "notifications.view",
        ],
    }

    for role_name, perm_names in roles_config.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name)
            db.add(role)
            db.flush()

        role.permissions = [perm_objects[n] for n in perm_names]

    db.flush()

    admin = User(
        name="Super Admin",
        email="abhijith@tool.com",
        password=get_password_hash("password"),
        is_active=True,
    )
    db.add(admin)
    db.flush()
    admin_role = db.query(Role).filter(Role.name == "super-admin").first()
    if admin_role:
        admin.roles.append(admin_role)

    pm = User(
        name="Project Manager",
        email="pm@internaltool.com",
        password=get_password_hash("password"),
        is_active=True,
    )
    db.add(pm)
    db.flush()
    pm_role = db.query(Role).filter(Role.name == "project-manager").first()
    if pm_role:
        pm.roles.append(pm_role)

    lead = User(
        name="Team Lead",
        email="lead@internaltool.com",
        password=get_password_hash("password"),
        is_active=True,
    )
    db.add(lead)
    db.flush()
    tl_role = db.query(Role).filter(Role.name == "team-lead").first()
    if tl_role:
        lead.roles.append(tl_role)

    emp = User(
        name="Employee One",
        email="employee@internaltool.com",
        password=get_password_hash("password"),
        is_active=True,
    )
    db.add(emp)
    db.flush()
    emp_role = db.query(Role).filter(Role.name == "employee").first()
    if emp_role:
        emp.roles.append(emp_role)

    additional_users = [
        ("Cincy", "employee"),
        ("Tojin", "employee"),
        ("Geo", "team-lead"),
        ("Divya", "employee"),
        ("Abhijith", "super-admin"),
        ("Rojan", "employee"),
        ("Alice", "developer"),
        ("Bob", "developer"),
        ("Carol", "designer"),
        ("David", "designer"),
        ("Eve", "project-manager"),
        ("Frank", "developer"),
        ("Grace", "designer"),
    ]
    for name, role_name in additional_users:
        u = User(
            name=name,
            email=f"{name.lower()}@internaltool.com",
            password=get_password_hash("password"),
            is_active=True,
        )
        db.add(u)
        db.flush()
        r = db.query(Role).filter(Role.name == role_name).first()
        if r:
            u.roles.append(r)

    db.commit()


if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    seed(db)
    db.close()
    print("Database seeded successfully")
