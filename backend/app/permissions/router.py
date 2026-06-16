from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.exceptions import NotFoundException
from app.core.activity import log_activity
from app.permissions.models import Permission
from app.users.models import User
from app.roles.models import Role
from app.core.enums import UserRole

router = APIRouter()


class UpdateUserPermissions(BaseModel):
    inherit_role_permissions: bool = True
    permissions: Optional[list[str]] = None


class UpdateUserRole(BaseModel):
    role: str


@router.get("/users/{user_id}")
def get_user_permissions(user_id: int, db: Session = Depends(get_db),
                         current_user: User = require_permissions(["permissions.view"])):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    role_permissions = []
    if user.roles:
        role_permissions = [p.name for p in user.roles[0].permissions]

    direct_permissions = [p.name for p in user.direct_permissions]

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name if user.role else None,
            "role_label": user.role.label() if user.role else None,
            "is_active": user.is_active,
            "is_super_admin": user.is_super_admin,
            "inherit_role_permissions": user.inherit_role_permissions,
        },
        "role_permissions": role_permissions,
        "direct_permissions": direct_permissions,
        "effective_permissions": role_permissions if user.inherit_role_permissions else direct_permissions,
        "all_permissions": get_permission_groups(),
    }


@router.put("/users/{user_id}")
def update_user_permissions(
    user_id: int, data: UpdateUserPermissions,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    user.inherit_role_permissions = data.inherit_role_permissions

    if not data.inherit_role_permissions and data.permissions is not None:
        perms = db.query(Permission).filter(Permission.name.in_(data.permissions)).all()
        user.direct_permissions = perms
    elif data.inherit_role_permissions:
        user.direct_permissions = []

    db.commit()

    log_activity(db, "users", user.id, "Permissions updated", causer_id=current_user.id,
                 properties={"inherit_role_permissions": data.inherit_role_permissions})
    return {"message": "Permissions updated successfully"}


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int, data: UpdateUserRole,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    role = db.query(Role).filter(Role.name == data.role).first()
    if not role:
        raise HTTPException(422, "Invalid role")

    user.roles = [role]
    user.inherit_role_permissions = True
    user.direct_permissions = []
    db.commit()

    log_activity(db, "users", user.id, "User role updated", causer_id=current_user.id,
                 properties={"role": data.role})
    return {"message": "User role updated successfully"}


def get_permission_groups() -> dict:
    PERMISSION_MAP = {
        "users": ["users.view", "users.create", "users.update", "users.delete",
                   "users.restore", "users.deactivate", "users.reset-password", "users.invite"],
        "projects": ["projects.view", "projects.create", "projects.update", "projects.delete",
                      "projects.archive", "projects.manage-members", "projects.manage-settings"],
        "tasks": ["tasks.view", "tasks.create", "tasks.update", "tasks.delete",
                   "tasks.assign", "tasks.approve", "tasks.reject", "tasks.review",
                   "tasks.change-status", "tasks.submit-approval"],
        "subtasks": ["subtasks.view", "subtasks.create", "subtasks.update", "subtasks.delete",
                      "subtasks.assign", "subtasks.change-status", "subtasks.approve"],
        "dashboard": ["dashboard.view", "dashboard.activity", "dashboard.notifications", "dashboard.announcements"],
        "comments": ["comments.view", "comments.create", "comments.update", "comments.delete", "comments.activity"],
        "reports": ["reports.view", "reports.generate", "reports.export", "reports.download"],
        "attachments": ["attachments.view", "attachments.upload", "attachments.delete", "attachments.download"],
        "announcements": ["announcements.view", "announcements.create", "announcements.update",
                           "announcements.delete", "announcements.pin"],
        "notifications": ["notifications.view", "notifications.manage"],
        "permissions": ["permissions.view", "permissions.manage"],
    }

    LABELS = {
        "users": "Users", "projects": "Projects", "tasks": "Tasks", "subtasks": "Subtasks",
        "dashboard": "Dashboard", "comments": "Comments & Activities", "reports": "Reports",
        "attachments": "Attachments", "announcements": "Announcements",
        "notifications": "Notifications", "permissions": "Permissions",
    }

    all_perms = [
        {"value": "users.view", "label": "View users"},
        {"value": "users.create", "label": "Create users"},
        {"value": "users.update", "label": "Update users"},
        {"value": "users.delete", "label": "Delete users"},
        {"value": "users.restore", "label": "Restore users"},
        {"value": "users.deactivate", "label": "Deactivate users"},
        {"value": "users.reset-password", "label": "Reset user passwords"},
        {"value": "users.invite", "label": "Invite users"},
        {"value": "projects.view", "label": "View projects"},
        {"value": "projects.create", "label": "Create projects"},
        {"value": "projects.update", "label": "Update projects"},
        {"value": "projects.delete", "label": "Delete projects"},
        {"value": "projects.archive", "label": "Archive projects"},
        {"value": "projects.manage-members", "label": "Assign project members"},
        {"value": "projects.manage-settings", "label": "Manage project settings"},
        {"value": "tasks.view", "label": "View tasks"},
        {"value": "tasks.create", "label": "Create tasks"},
        {"value": "tasks.update", "label": "Update tasks"},
        {"value": "tasks.delete", "label": "Delete tasks"},
        {"value": "tasks.assign", "label": "Assign tasks"},
        {"value": "tasks.approve", "label": "Approve tasks"},
        {"value": "tasks.reject", "label": "Reject tasks"},
        {"value": "tasks.review", "label": "Review tasks"},
        {"value": "tasks.change-status", "label": "Change task status"},
        {"value": "tasks.submit-approval", "label": "Submit tasks for approval"},
        {"value": "subtasks.view", "label": "View subtasks"},
        {"value": "subtasks.create", "label": "Create subtasks"},
        {"value": "subtasks.update", "label": "Update subtasks"},
        {"value": "subtasks.delete", "label": "Delete subtasks"},
        {"value": "subtasks.assign", "label": "Assign subtasks"},
        {"value": "subtasks.change-status", "label": "Change subtask status"},
        {"value": "subtasks.approve", "label": "Approve subtasks"},
        {"value": "dashboard.view", "label": "View Dashboard"},
        {"value": "dashboard.activity", "label": "View team activity"},
        {"value": "dashboard.notifications", "label": "Dashboard notifications"},
        {"value": "dashboard.announcements", "label": "Dashboard announcements"},
        {"value": "comments.view", "label": "View comments"},
        {"value": "comments.create", "label": "Create comments"},
        {"value": "comments.update", "label": "Update comments"},
        {"value": "comments.delete", "label": "Delete comments"},
        {"value": "comments.activity", "label": "View activity logs"},
        {"value": "reports.view", "label": "View reports"},
        {"value": "reports.generate", "label": "Generate reports"},
        {"value": "reports.export", "label": "Export reports"},
        {"value": "reports.download", "label": "Download reports"},
        {"value": "attachments.view", "label": "View attachments"},
        {"value": "attachments.upload", "label": "Upload attachments"},
        {"value": "attachments.delete", "label": "Delete attachments"},
        {"value": "attachments.download", "label": "Download attachments"},
        {"value": "announcements.view", "label": "View announcements"},
        {"value": "announcements.create", "label": "Create announcements"},
        {"value": "announcements.update", "label": "Update announcements"},
        {"value": "announcements.delete", "label": "Delete announcements"},
        {"value": "announcements.pin", "label": "Pin announcements"},
        {"value": "notifications.view", "label": "View notifications"},
        {"value": "notifications.manage", "label": "Manage notification settings"},
        {"value": "permissions.view", "label": "View permissions"},
        {"value": "permissions.manage", "label": "Manage permissions"},
    ]

    groups = []
    for group_key, perm_names in PERMISSION_MAP.items():
        perms = [p for p in all_perms if p["value"] in perm_names]
        groups.append({
            "key": group_key,
            "label": LABELS.get(group_key, group_key.capitalize()),
            "permissions": perms,
        })

    return groups
