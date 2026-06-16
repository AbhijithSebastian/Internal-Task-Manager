from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from typing import List, Optional

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
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.is_super_admin:
            return user

        user_permissions = set()
        if user.inherit_role_permissions:
            for role in user.roles:
                for perm in role.permissions:
                    user_permissions.add(perm.name)
        else:
            for perm in user.direct_permissions:
                user_permissions.add(perm.name)

        for required in self.required_permissions:
            if required not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {required}",
                )

        return user


def require_permissions(permissions: List[str]):
    return Depends(PermissionChecker(permissions))


def require_active(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    return user
