from pydantic import BaseModel
from typing import Optional, Any, Type, TypeVar
from datetime import datetime, date
from enum import Enum

E = TypeVar("E", bound=Enum)


def enum_label(value: str | None, enum_class: Type[E], default: str = "") -> str:
    if not value:
        return default
    try:
        return enum_class(value).label()  # type: ignore
    except (ValueError, TypeError):
        return str(value).replace("_", " ").title()


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
    errors: Optional[dict] = None


class UserBrief(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectBrief(BaseModel):
    id: int
    name: str
    status: str
    priority: str

    class Config:
        from_attributes = True


class TaskBrief(BaseModel):
    id: int
    title: str
    status: str
    priority: str

    class Config:
        from_attributes = True
