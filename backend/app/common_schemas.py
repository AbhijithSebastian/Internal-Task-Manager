from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, date


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
