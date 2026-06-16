from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    password_confirmation: str
    job_title: Optional[str] = None

    @field_validator("password_confirmation")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    email: EmailStr
    password: str
    password_confirmation: str

    @field_validator("password_confirmation")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_user(cls, user, access_token, refresh_token):
        return cls(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.name if user.role else None,
                "role_label": user.role.label() if user.role else None,
                "avatar": user.avatar_url or "",
                "is_super_admin": user.is_super_admin,
                "inherit_role_permissions": user.inherit_role_permissions,
                "permissions": user.get_all_permissions(),
            },
        )
