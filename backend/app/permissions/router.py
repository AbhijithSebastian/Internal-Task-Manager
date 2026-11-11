from fastapi import APIRouter, Depends, HTTPException, Query
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
    permission_ids: list[int]


class UpdateInheritPermissions(BaseModel):
    inherit: bool


PERMISSION_GROUPS = {
    "users": {
        "label": "Users",
        "permissions": [
            {"name": "users.view", "label": "View users"},
            {"name": "users.create", "label": "Create users"},
            {"name": "users.update", "label": "Update users"},
            {"name": "users.delete", "label": "Delete users"},
            {"name": "users.restore", "label": "Restore users"},
            {"name": "users.deactivate", "label": "Deactivate users"},
            {"name": "users.reset-password", "label": "Reset user passwords"},
            {"name": "users.invite", "label": "Invite users"},
        ],
    },
    "projects": {
        "label": "Projects",
        "permissions": [
            {"name": "projects.view", "label": "View projects"},
            {"name": "projects.create", "label": "Create projects"},
            {"name": "projects.update", "label": "Update projects"},
            {"name": "projects.delete", "label": "Delete projects"},
            {"name": "projects.archive", "label": "Archive projects"},
            {"name": "projects.manage-members", "label": "Manage project members"},
            {"name": "projects.manage-settings", "label": "Manage project settings"},
        ],
    },
    "tasks": {
        "label": "Tasks",
        "permissions": [
            {"name": "tasks.view", "label": "View tasks"},
            {"name": "tasks.create", "label": "Create tasks"},
            {"name": "tasks.update", "label": "Update tasks"},
            {"name": "tasks.delete", "label": "Delete tasks"},
            {"name": "tasks.assign", "label": "Assign tasks"},
            {"name": "tasks.approve", "label": "Approve tasks"},
            {"name": "tasks.reject", "label": "Reject tasks"},
            {"name": "tasks.review", "label": "Review tasks"},
            {"name": "tasks.change-status", "label": "Change task status"},
            {"name": "tasks.submit-approval", "label": "Submit tasks for approval"},
        ],
    },
    "subtasks": {
        "label": "Subtasks",
        "permissions": [
            {"name": "subtasks.view", "label": "View subtasks"},
            {"name": "subtasks.create", "label": "Create subtasks"},
            {"name": "subtasks.update", "label": "Update subtasks"},
            {"name": "subtasks.delete", "label": "Delete subtasks"},
            {"name": "subtasks.assign", "label": "Assign subtasks"},
            {"name": "subtasks.change-status", "label": "Change subtask status"},
            {"name": "subtasks.approve", "label": "Approve subtasks"},
        ],
    },
    "dashboard": {
        "label": "Dashboard",
        "permissions": [
            {"name": "dashboard.view", "label": "View dashboard"},
            {"name": "dashboard.activity", "label": "View team activity"},
            {"name": "dashboard.notifications", "label": "View notifications"},
            {"name": "dashboard.announcements", "label": "View announcements"},
        ],
    },
    "comments": {
        "label": "Comments & Activities",
        "permissions": [
            {"name": "comments.view", "label": "View comments"},
            {"name": "comments.create", "label": "Create comments"},
            {"name": "comments.update", "label": "Update comments"},
            {"name": "comments.delete", "label": "Delete comments"},
            {"name": "comments.activity", "label": "View activity logs"},
        ],
    },
    "reports": {
        "label": "Reports",
        "permissions": [
            {"name": "reports.view", "label": "View reports"},
            {"name": "reports.generate", "label": "Generate reports"},
            {"name": "reports.export", "label": "Export reports"},
            {"name": "reports.download", "label": "Download reports"},
        ],
    },
    "attachments": {
        "label": "Attachments",
        "permissions": [
            {"name": "attachments.view", "label": "View attachments"},
            {"name": "attachments.upload", "label": "Upload attachments"},
            {"name": "attachments.delete", "label": "Delete attachments"},
            {"name": "attachments.download", "label": "Download attachments"},
        ],
    },
    "announcements": {
        "label": "Announcements",
        "permissions": [
            {"name": "announcements.view", "label": "View announcements"},
            {"name": "announcements.create", "label": "Create announcements"},
            {"name": "announcements.update", "label": "Update announcements"},
            {"name": "announcements.delete", "label": "Delete announcements"},
            {"name": "announcements.pin", "label": "Pin announcements"},
        ],
    },
    "notifications": {
        "label": "Notifications",
        "permissions": [
            {"name": "notifications.view", "label": "View notifications"},
            {"name": "notifications.manage", "label": "Manage notification settings"},
        ],
    },
    "permissions": {
        "label": "Permissions",
        "permissions": [
            {"name": "permissions.view", "label": "View permissions"},
            {"name": "permissions.manage", "label": "Manage permissions"},
        ],
    },
    "meetings": {
        "label": "Meetings",
        "permissions": [
            {"name": "meetings.view", "label": "View meetings"},
            {"name": "meetings.create", "label": "Create meetings"},
            {"name": "meetings.update", "label": "Update meetings"},
            {"name": "meetings.delete", "label": "Delete meetings"},
        ],
    },
    "milestones": {
        "label": "Milestones",
        "permissions": [
            {"name": "milestones.view", "label": "View milestones"},
            {"name": "milestones.create", "label": "Create milestones"},
            {"name": "milestones.update", "label": "Update milestones"},
            {"name": "milestones.delete", "label": "Delete milestones"},
        ],
    },
}


@router.get("")
def list_permissions(
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    groups = []
    for group_key, group_data in PERMISSION_GROUPS.items():
        permissions = []
        for perm_def in group_data["permissions"]:
            perm = db.query(Permission).filter(Permission.name == perm_def["name"]).first()
            permissions.append({
                "id": perm.id if perm else None,
                "name": perm_def["name"],
                "guard_name": perm.guard_name if perm else "web",
                "group": group_key,
                "label": perm_def["label"],
            })
        groups.append({
            "group": group_key,
            "label": group_data["label"],
            "permissions": permissions,
        })
    return {"groups": groups}


@router.get("/users/{user_id}")
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    role_permissions = list({p.name: p for p in user.roles[0].permissions}.values()) if user.roles else []
    direct_permissions = user.direct_permissions

    if user.inherit_role_permissions:
        effective_permissions = list({p.name: p for p in sum((r.permissions for r in user.roles), [])}.values()) if user.roles else []
    else:
        effective_permissions = direct_permissions

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,
            "is_super_admin": user.is_super_admin,
            "inherit_role_permissions": user.inherit_role_permissions,
        },
        "inherit_role_permissions": user.inherit_role_permissions,
        "role_permissions": [
            {"id": p.id, "name": p.name, "group": p.group, "label": p.label}
            for p in role_permissions
        ],
        "direct_permissions": [
            {"id": p.id, "name": p.name, "group": p.group, "label": p.label}
            for p in direct_permissions
        ],
        "effective_permissions": [
            {"id": p.id, "name": p.name, "group": p.group, "label": p.label}
            for p in effective_permissions
        ],
        "effective_permission_names": list(set(p.name for p in effective_permissions)),
        "all_permission_groups": list(PERMISSION_GROUPS.keys()),
    }


@router.put("/users/{user_id}")
def update_user_permissions(
    user_id: int,
    data: UpdateUserPermissions,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
    if len(permissions) != len(data.permission_ids):
        raise HTTPException(422, "One or more permission IDs are invalid")

    user.direct_permissions = permissions
    user.inherit_role_permissions = False
    db.commit()

    log_activity(db, "users", user.id, "Permission overrides updated", causer_id=current_user.id,
                 properties={"permission_ids": data.permission_ids})
    return {"message": "Permission overrides updated successfully"}


@router.put("/users/{user_id}/inherit")
def update_user_inherit_permissions(
    user_id: int,
    data: UpdateInheritPermissions,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    user.inherit_role_permissions = data.inherit
    if data.inherit:
        user.direct_permissions = []

    db.commit()
    log_activity(db, "users", user.id, "Permission inheritance updated", causer_id=current_user.id,
                 properties={"inherit_role_permissions": data.inherit})
    return {
        "message": "Permission inheritance updated successfully",
        "inherit_role_permissions": user.inherit_role_permissions,
    }
