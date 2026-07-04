from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.exceptions import NotFoundException
from app.core.activity import log_activity
from app.roles.models import Role
from app.permissions.models import Permission
from app.users.models import User
from app.core.enums import UserRole

router = APIRouter()


class RoleCreate(BaseModel):
    name: str
    guard_name: str = "web"
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class RolePermissionsUpdate(BaseModel):
    permission_ids: list[int]


class BulkUsersRequest(BaseModel):
    user_ids: list[int]


def _role_response(role: Role) -> dict:
    return {
        "id": role.id,
        "name": role.name,
        "guard_name": role.guard_name,
        "description": role.description,
        "color": role.color,
        "icon": role.icon,
        "is_active": role.is_active,
        "is_system": role.is_system,
        "label": UserRole(role.name).label() if role.name in [e.value for e in UserRole] else role.name,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": [
            {"id": p.id, "name": p.name, "guard_name": p.guard_name, "group": p.group, "label": p.label}
            for p in role.permissions
        ],
    }


@router.post("", status_code=201)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    if db.query(Role).filter(Role.name == data.name).first():
        raise HTTPException(409, "Role already exists")
    role = Role(
        name=data.name,
        guard_name=data.guard_name,
        description=data.description,
        color=data.color,
        icon=data.icon,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    log_activity(db, "roles", role.id, "Role created", causer_id=current_user.id,
                 properties={"name": role.name})
    return _role_response(role)


@router.get("")
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    roles = db.query(Role).order_by(Role.name).all()
    result = []
    for role in roles:
        resp = _role_response(role)
        resp["user_count"] = db.query(User).filter(User.roles.any(id=role.id)).count()
        result.append(resp)
    return result


@router.get("/{role_id}")
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    resp = _role_response(role)
    resp["user_count"] = db.query(User).filter(User.roles.any(id=role.id)).count()
    return resp


@router.put("/{role_id}")
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    if data.name is not None:
        existing = db.query(Role).filter(Role.name == data.name, Role.id != role_id).first()
        if existing:
            raise HTTPException(409, "Role name already exists")
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.color is not None:
        role.color = data.color
    if data.icon is not None:
        role.icon = data.icon
    if data.is_active is not None:
        role.is_active = data.is_active
    db.commit()
    db.refresh(role)
    log_activity(db, "roles", role.id, "Role updated", causer_id=current_user.id,
                 properties={"name": role.name})
    return _role_response(role)


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    if role.is_system:
        raise HTTPException(422, "Cannot delete a system role")
    user_count = db.query(User).filter(User.roles.any(id=role.id)).count()
    if user_count > 0:
        raise HTTPException(422, f"Cannot delete role assigned to {user_count} user(s)")
    db.delete(role)
    db.commit()
    log_activity(db, "roles", role_id, "Role deleted", causer_id=current_user.id,
                 properties={"name": role.name})
    return {"message": "Role deleted successfully"}


@router.post("/{role_id}/duplicate")
def duplicate_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    original = db.query(Role).filter(Role.id == role_id).first()
    if not original:
        raise NotFoundException("Role", role_id)

    base_name = f"{original.name}-copy"
    new_name = base_name
    counter = 1
    while db.query(Role).filter(Role.name == new_name).first():
        new_name = f"{base_name}-{counter}"
        counter += 1

    role = Role(
        name=new_name,
        guard_name=original.guard_name,
        description=original.description,
        color=original.color,
        icon=original.icon,
    )
    db.add(role)
    db.flush()

    role.permissions = original.permissions.copy()
    db.commit()
    db.refresh(role)

    log_activity(db, "roles", role.id, "Role duplicated", causer_id=current_user.id,
                 properties={"source": original.name, "name": role.name})
    return _role_response(role)


@router.post("/{role_id}/toggle-active")
def toggle_role_active(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    role.is_active = not role.is_active
    db.commit()
    status = "activated" if role.is_active else "deactivated"
    log_activity(db, "roles", role.id, f"Role {status}", causer_id=current_user.id)
    return {"message": f"Role {status} successfully", "is_active": role.is_active}


@router.get("/{role_id}/permissions")
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    return [
        {"id": p.id, "name": p.name, "guard_name": p.guard_name, "group": p.group, "label": p.label}
        for p in role.permissions
    ]


@router.put("/{role_id}/permissions")
def update_role_permissions(
    role_id: int,
    data: RolePermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)

    permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
    if len(permissions) != len(data.permission_ids):
        raise HTTPException(422, "One or more permission IDs are invalid")

    role.permissions = permissions
    db.commit()

    log_activity(db, "roles", role.id, "Role permissions updated",
                 causer_id=current_user.id,
                 properties={"role": role.name, "permission_ids": data.permission_ids})
    return {"message": "Role permissions updated successfully"}


@router.get("/{role_id}/users")
def get_role_users(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    users = db.query(User).filter(User.roles.any(id=role.id)).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "job_title": u.job_title,
            "avatar_url": u.avatar_url,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.post("/{role_id}/users")
def assign_users_to_role(
    role_id: int,
    data: BulkUsersRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)

    users = db.query(User).filter(User.id.in_(data.user_ids)).all()
    if len(users) != len(data.user_ids):
        raise HTTPException(422, "One or more user IDs are invalid")

    for user in users:
        if role not in user.roles:
            user.roles.append(role)

    db.commit()
    log_activity(db, "roles", role.id, "Users assigned to role", causer_id=current_user.id,
                 properties={"role": role.name, "user_ids": data.user_ids})
    return {"message": f"{len(users)} user(s) assigned to role successfully"}


@router.delete("/{role_id}/users")
def remove_users_from_role(
    role_id: int,
    data: BulkUsersRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)

    users = db.query(User).filter(User.id.in_(data.user_ids)).all()
    for user in users:
        if role in user.roles:
            user.roles.remove(role)

    db.commit()
    log_activity(db, "roles", role.id, "Users removed from role", causer_id=current_user.id,
                 properties={"role": role.name, "user_ids": data.user_ids})
    return {"message": f"{len(users)} user(s) removed from role successfully"}
