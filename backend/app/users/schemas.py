from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    password_confirmation: str
    job_title: Optional[str] = None
    phone: Optional[str] = None
    role: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    password_confirmation: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    job_title: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    inherit_role_permissions: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    deleted_at: Optional[datetime] = None
    role: Optional[str] = None
    role_label: Optional[str] = None
    is_super_admin: bool = False
    permissions: list[str] = []

    class Config:
        from_attributes = True


class UserBrief(BaseModel):
    id: int
    name: str
    email: str
    job_title: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
