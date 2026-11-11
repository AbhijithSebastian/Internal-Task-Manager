import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token
)
from app.core.deps import get_current_user
from app.core.config import settings
from app.core.email import send_password_reset_email
from app.users.models import User, PasswordResetToken
from app.auth.schemas import (
    LoginRequest, LoginResponse, RegisterRequest, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.users.schemas import UserResponse
from app.core.activity import log_activity

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    user.last_login_at = datetime.utcnow()
    db.commit()

    log_activity(db, "users", user.id, "authenticated", causer_id=user.id)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return LoginResponse.from_orm_user(
        user, access_token, refresh_token
    )


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=request.name,
        email=request.email,
        password=get_password_hash(request.password),
        job_title=request.job_title,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    from app.roles.models import Role
    employee_role = db.query(Role).filter(Role.name == "employee").first()
    if employee_role:
        user.roles.append(employee_role)
        db.commit()

    log_activity(db, "users", user.id, "registered", causer_id=user.id)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return LoginResponse.from_orm_user(
        user, access_token, refresh_token
    )


@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if not user_id or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return LoginResponse.from_orm_user(
        user, access_token, refresh_token
    )


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.is_active:
        return {"message": "If that email exists, a reset link has been sent"}

    token = secrets.token_urlsafe(32)
    existing = db.query(PasswordResetToken).filter(PasswordResetToken.email == request.email).first()
    if existing:
        db.delete(existing)
        db.flush()

    reset = PasswordResetToken(email=request.email, token=token)
    db.add(reset)
    db.commit()

    sent = send_password_reset_email(request.email, token, user.name)
    if not sent:
        return {
            "message": "Password reset email queued",
            "debug_token": token if settings.app_debug else None,
        }

    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if request.password != request.password_confirmation:
        raise HTTPException(status_code=422, detail="Passwords do not match")

    reset = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == request.email,
        PasswordResetToken.token == request.token,
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if reset.is_expired(settings.password_reset_token_expire_minutes):
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = get_password_hash(request.password)
    db.delete(reset)
    db.commit()

    log_activity(db, "users", user.id, "password_reset", causer_id=user.id)
    return {"message": "Password has been reset successfully"}


@router.post("/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_activity(db, "users", user.id, "logged_out", causer_id=user.id)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse.from_orm_user(user)
