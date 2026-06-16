from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.security import get_password_hash
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate, UserResponse, UserBrief
from app.roles.models import Role

router = APIRouter()


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
    current_user: User = Depends(require_permissions(["users.view"])),
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
             current_user: User = Depends(require_permissions(["users.view"]))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    return format_user_response(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db),
                current_user: User = Depends(require_permissions(["users.create"]))):
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
                current_user: User = Depends(require_permissions(["users.update"]))):
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
                current_user: User = Depends(require_permissions(["users.delete"]))):
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
                 current_user: User = Depends(require_permissions(["users.restore"]))):
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
                  current_user: User = Depends(require_permissions(["users.update"]))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User", user_id)
    user.is_active = not user.is_active
    db.commit()

    status = "activated" if user.is_active else "deactivated"
    log_activity(db, "users", user.id, f"User {status}", causer_id=current_user.id)
    return {"message": f"User {status} successfully", "is_active": user.is_active}


def format_user_response(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "job_title": user.job_title,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "is_active": user.is_active,
        "inherit_role_permissions": user.inherit_role_permissions,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "deleted_at": user.deleted_at,
        "role": user.role.name if user.role else None,
        "role_label": user.role.label() if user.role else None,
        "is_super_admin": user.is_super_admin,
        "permissions": user.get_all_permissions(),
    }
