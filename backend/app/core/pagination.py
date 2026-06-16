from math import ceil
from typing import Any, Generic, TypeVar
from pydantic import BaseModel
from sqlalchemy import Select
from sqlalchemy.orm import Session

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int

    class Config:
        from_attributes = True


def paginate(
    query: Select,
    db: Session,
    page: int = 1,
    per_page: int = 15,
) -> tuple[list[Any], int]:
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 15
    if per_page > 100:
        per_page = 100

    total = db.query(query.subquery().count()).scalar() or 0
    offset = (page - 1) * per_page
    items = db.execute(query.offset(offset).limit(per_page)).scalars().all()

    return items, total


def build_paginated_response(
    items: list[Any],
    total: int,
    page: int,
    per_page: int,
    schema_class: type[BaseModel] | None = None,
) -> dict:
    if schema_class:
        items = [schema_class.model_validate(item) for item in items]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": ceil(total / per_page) if total > 0 else 0,
    }
