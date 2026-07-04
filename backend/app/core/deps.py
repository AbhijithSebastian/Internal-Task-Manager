from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from typing import List, Optional, Union

from app.core.database import get_db
from app.core.security import decode_token
from app.users.models import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    token_type = payload.get("type")

    if not user_id or token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


class PermissionChecker:
    def __init__(self, permissions: list[str], logic: str = "AND"):
        self.permissions = permissions
        self.logic = logic

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.is_super_admin:
            return user

        user_permissions = set(user.get_all_permissions())

        if self.logic == "OR":
            if not any(p in user_permissions for p in self.permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {' or '.join(self.permissions)}",
                )
        else:
            for required in self.permissions:
                if required not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Missing required permission: {required}",
                    )

        return user


def require_permissions(*permissions):
    if len(permissions) == 1 and isinstance(permissions[0], list):
        return Depends(PermissionChecker(permissions[0], logic="AND"))
    else:
        return Depends(PermissionChecker(list(permissions), logic="OR"))


def require_active(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return user
