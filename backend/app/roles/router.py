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


class RoleUpdatePermissions(BaseModel):
    permissions: list[str]


@router.get("")
def list_roles(db: Session = Depends(get_db),
               current_user: User = Depends(require_permissions(["permissions.view"]))):
    roles = db.query(Role).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "label": UserRole(r.name).label() if r.name in [e.value for e in UserRole] else r.name,
            "permissions": [p.name for p in r.permissions],
        }
        for r in roles
    ]


@router.get("/{role_id}")
def get_role(role_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(require_permissions(["permissions.view"]))):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    return {
        "id": role.id,
        "name": role.name,
        "permissions": [p.name for p in role.permissions],
    }


@router.put("/{role_id}/permissions")
def update_role_permissions(
    role_id: int, data: RoleUpdatePermissions,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["permissions.manage"])),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)

    permissions = db.query(Permission).filter(Permission.name.in_(data.permissions)).all()
    role.permissions = permissions
    db.commit()

    log_activity(db, "roles", role.id, "Role permissions updated",
                 causer_id=current_user.id,
                 properties={"role": role.name, "permissions": data.permissions})
    return {"message": "Role permissions updated successfully"}
