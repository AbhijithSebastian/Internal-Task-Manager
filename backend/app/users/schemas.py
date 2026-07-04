from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime
from app.core.enums import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    password_confirmation: str
    job_title: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    reporting_manager_id: Optional[int] = None
    role: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    password_confirmation: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    reporting_manager_id: Optional[int] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class PermissionBrief(BaseModel):
    id: int
    name: str
    guard_name: str
    group: Optional[str] = None
    label: Optional[str] = None

    class Config:
        from_attributes = True


class RoleBrief(BaseModel):
    id: int
    name: str
    guard_name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True
    is_system: bool = False
    permissions: list[PermissionBrief] = []

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    job_title: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    reporting_manager_id: Optional[int] = None
    is_active: bool
    inherit_role_permissions: bool = False
    email_verified_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    role: Optional[str] = None
    role_label: Optional[str] = None
    is_super_admin: bool = False
    permissions: list[str] = []
    effective_permissions: list[str] = []
    roles: list[RoleBrief] = []

    @classmethod
    def from_orm_user(cls, user) -> "UserResponse":
        role_obj = user.role if hasattr(user, "role") and user.role else None
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            job_title=getattr(user, "job_title", None),
            phone=getattr(user, "phone", None),
            avatar_url=getattr(user, "avatar_url", None),
            department=getattr(user, "department", None),
            designation=getattr(user, "designation", None),
            employee_id=getattr(user, "employee_id", None),
            reporting_manager_id=getattr(user, "reporting_manager_id", None),
            is_active=getattr(user, "is_active", True),
            inherit_role_permissions=getattr(user, "inherit_role_permissions", False),
            email_verified_at=getattr(user, "email_verified_at", None),
            last_login_at=getattr(user, "last_login_at", None),
            created_at=getattr(user, "created_at", None),
            updated_at=getattr(user, "updated_at", None),
            deleted_at=getattr(user, "deleted_at", None),
            role=role_obj.name if role_obj else None,
            role_label=UserRole(role_obj.name).label() if role_obj and role_obj.name in [e.value for e in UserRole] else (role_obj.name if role_obj else None),
            is_super_admin=user.is_super_admin if hasattr(user, "is_super_admin") else False,
            permissions=user.get_all_permissions() if hasattr(user, "get_all_permissions") else [],
            effective_permissions=user.get_all_permissions() if hasattr(user, "get_all_permissions") else [],
            roles=[
                RoleBrief(
                    id=r.id,
                    name=r.name,
                    guard_name=r.guard_name,
                    description=r.description,
                    color=r.color,
                    icon=r.icon,
                    is_active=r.is_active,
                    is_system=r.is_system,
                    permissions=[
                        PermissionBrief(
                            id=p.id, name=p.name, guard_name=p.guard_name,
                            group=p.group, label=p.label,
                        )
                        for p in (r.permissions or [])
                    ],
                )
                for r in (user.roles or [])
            ],
        )


class UserBrief(BaseModel):
    id: int
    name: str
    email: str
    job_title: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
