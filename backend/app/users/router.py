from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.security import get_password_hash
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate, UserResponse, UserBrief
from app.roles.models import Role
from app.permissions.models import Permission
from app.core.enums import UserRole

router = APIRouter()


class AddRoleRequest(BaseModel):
    role_id: int


class SetPermissionsRequest(BaseModel):
    permission_ids: list[int]


@router.get("/search")
def search_users(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    term = f"%{q}%"
    users = db.query(User).filter(
        User.deleted_at.is_(None),
        or_(User.name.ilike(term), User.email.ilike(term)),
    ).limit(limit).all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "job_title": u.job_title, "avatar_url": u.avatar_url}
        for u in users
    ]


@router.get("", response_model=dict)
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_direction: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["users.view"]),
):
    query = db.query(User).filter(User.deleted_at.is_(None))

    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        query = query.join(User.roles).filter(Role.name == role)
    if status == "inactive":
        query = query.filter(User.is_active == False)

    sort_col = getattr(User, sort_by, User.created_at)
    if sort_direction == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [format_user_response(u) for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db),
             current_user: User = require_permissions(["users.view"])):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    return format_user_response(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db),
                current_user: User = require_permissions(["users.create"])):
    if data.password != data.password_confirmation:
        raise HTTPException(status_code=422, detail="Passwords do not match")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password=get_password_hash(data.password),
        job_title=data.job_title,
        phone=data.phone,
        department=data.department,
        designation=data.designation,
        employee_id=data.employee_id,
        reporting_manager_id=data.reporting_manager_id,
    )
    db.add(user)
    db.flush()

    if data.role:
        role = db.query(Role).filter(Role.name == data.role).first()
        if role:
            user.roles.append(role)

    db.commit()
    db.refresh(user)

    log_activity(db, "users", user.id, "User created",
                 causer_id=current_user.id, properties={"name": user.name, "email": user.email})
    return format_user_response(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db),
                current_user: User = require_permissions(["users.update"])):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)

    if data.name is not None:
        user.name = data.name
    if data.email is not None and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = data.email
    if data.password:
        if data.password != data.password_confirmation:
            raise HTTPException(status_code=422, detail="Passwords do not match")
        user.password = get_password_hash(data.password)
    if data.job_title is not None:
        user.job_title = data.job_title
    if data.phone is not None:
        user.phone = data.phone
    if data.department is not None:
        user.department = data.department
    if data.designation is not None:
        user.designation = data.designation
    if data.employee_id is not None:
        user.employee_id = data.employee_id
    if data.reporting_manager_id is not None:
        user.reporting_manager_id = data.reporting_manager_id
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        role = db.query(Role).filter(Role.name == data.role).first()
        if role:
            user.roles = [role]
            user.inherit_role_permissions = True

    db.commit()
    db.refresh(user)

    log_activity(db, "users", user.id, "User updated", causer_id=current_user.id)
    return format_user_response(user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db),
                current_user: User = require_permissions(["users.delete"])):
    if user_id == current_user.id:
        raise HTTPException(status_code=422, detail="Cannot delete yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    if user.is_super_admin:
        raise HTTPException(status_code=422, detail="Cannot delete super admin")

    user.is_active = False
    user.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db, "users", user.id, "User deleted", causer_id=current_user.id)
    return {"message": "User deactivated successfully"}


@router.post("/{user_id}/restore")
def restore_user(user_id: int, db: Session = Depends(get_db),
                 current_user: User = require_permissions(["users.restore"])):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    user.deleted_at = None
    user.is_active = True
    db.commit()

    log_activity(db, "users", user.id, "User restored", causer_id=current_user.id)
    return {"message": "User restored successfully"}


@router.post("/{user_id}/toggle-active")
def toggle_active(user_id: int, db: Session = Depends(get_db),
                  current_user: User = require_permissions(["users.update"])):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    user.is_active = not user.is_active
    db.commit()

    status = "activated" if user.is_active else "deactivated"
    log_activity(db, "users", user.id, f"User {status}", causer_id=current_user.id)
    return {"message": f"User {status} successfully", "is_active": user.is_active}


@router.get("/{user_id}/roles")
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    return [
        {
            "id": r.id,
            "name": r.name,
            "guard_name": r.guard_name,
            "description": r.description,
            "color": r.color,
            "icon": r.icon,
            "is_active": r.is_active,
            "is_system": r.is_system,
            "permissions": [
                {"id": p.id, "name": p.name, "guard_name": p.guard_name, "group": p.group, "label": p.label}
                for p in r.permissions
            ],
        }
        for r in user.roles
    ]


@router.post("/{user_id}/roles")
def add_user_role(
    user_id: int,
    data: AddRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise NotFoundException("Role", data.role_id)
    if role in user.roles:
        raise HTTPException(409, "User already has this role")
    user.roles.append(role)
    db.commit()
    log_activity(db, "users", user.id, "Role added to user", causer_id=current_user.id,
                 properties={"role_id": data.role_id, "role_name": role.name})
    return {"message": f"Role '{role.name}' added to user successfully"}


@router.delete("/{user_id}/roles/{role_id}")
def remove_user_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.manage"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise NotFoundException("Role", role_id)
    if role not in user.roles:
        raise HTTPException(404, "User does not have this role")
    user.roles.remove(role)
    db.commit()
    log_activity(db, "users", user.id, "Role removed from user", causer_id=current_user.id,
                 properties={"role_id": role_id, "role_name": role.name})
    return {"message": f"Role '{role.name}' removed from user successfully"}


@router.get("/{user_id}/permissions")
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["permissions.view"]),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    return {
        "effective_permissions": user.get_all_permissions(),
        "inherit_role_permissions": user.inherit_role_permissions,
        "role_permissions": list(set(
            p.name for role in user.roles for p in role.permissions
        )),
        "direct_permissions": [p.name for p in user.direct_permissions],
    }


@router.put("/{user_id}/permissions")
def set_user_permissions(
    user_id: int,
    data: SetPermissionsRequest,
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
    log_activity(db, "users", user.id, "User permissions set", causer_id=current_user.id,
                 properties={"permission_ids": data.permission_ids})
    return {"message": "User permissions updated successfully"}


def format_user_response(user: User) -> dict:
    role_obj = user.role if hasattr(user, "role") and user.role else None
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "job_title": user.job_title,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "department": user.department,
        "designation": user.designation,
        "employee_id": user.employee_id,
        "reporting_manager_id": user.reporting_manager_id,
        "is_active": user.is_active,
        "inherit_role_permissions": user.inherit_role_permissions,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "deleted_at": user.deleted_at,
        "role": role_obj.name if role_obj else None,
        "role_label": UserRole(role_obj.name).label() if role_obj and role_obj.name in [e.value for e in UserRole] else (role_obj.name if role_obj else None),
        "is_super_admin": user.is_super_admin,
        "permissions": user.get_all_permissions(),
        "effective_permissions": user.get_all_permissions(),
        "roles": [
            {
                "id": r.id,
                "name": r.name,
                "guard_name": r.guard_name,
                "description": r.description,
                "color": r.color,
                "icon": r.icon,
                "is_active": r.is_active,
                "is_system": r.is_system,
                "permissions": [
                    {
                        "id": p.id, "name": p.name, "guard_name": p.guard_name,
                        "group": p.group, "label": p.label,
                    }
                    for p in (r.permissions or [])
                ],
            }
            for r in (user.roles or [])
        ],
    }
