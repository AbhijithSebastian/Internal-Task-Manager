from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.modules.models import Module
from app.users.models import User

router = APIRouter()


class ModuleCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None


class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("")
def list_modules(
    project_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Module).filter(Module.deleted_at.is_(None))
    if project_id:
        query = query.filter(Module.project_id == project_id)

    total = query.count()
    modules = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [format_module(m) for m in modules],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/{module_id}")
def get_module(module_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    module = db.query(Module).filter(Module.id == module_id, Module.deleted_at.is_(None)).first()
    if not module:
        raise NotFoundException("Module", module_id)
    return format_module(module)


@router.post("", status_code=201)
def create_module(data: ModuleCreate, db: Session = Depends(get_db),
                  current_user: User = require_permissions(["projects.manage-settings"])):
    module = Module(
        project_id=data.project_id,
        name=data.name,
        description=data.description,
    )
    db.add(module)
    db.commit()
    db.refresh(module)

    log_activity(db, "modules", module.id, "Module created", causer_id=current_user.id,
                 properties={"name": module.name, "project_id": module.project_id})
    return format_module(module)


@router.put("/{module_id}")
def update_module(module_id: int, data: ModuleUpdate, db: Session = Depends(get_db),
                  current_user: User = require_permissions(["projects.manage-settings"])):
    module = db.query(Module).filter(Module.id == module_id, Module.deleted_at.is_(None)).first()
    if not module:
        raise NotFoundException("Module", module_id)

    if data.name is not None:
        module.name = data.name
    if data.description is not None:
        module.description = data.description

    db.commit()
    db.refresh(module)

    log_activity(db, "modules", module.id, "Module updated", causer_id=current_user.id)
    return format_module(module)


@router.delete("/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db),
                  current_user: User = require_permissions(["projects.manage-settings"])):
    module = db.query(Module).filter(Module.id == module_id, Module.deleted_at.is_(None)).first()
    if not module:
        raise NotFoundException("Module", module_id)

    module.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db, "modules", module.id, "Module deleted", causer_id=current_user.id)
    return {"message": "Module deleted successfully"}


def format_module(m: Module) -> dict:
    return {
        "id": m.id,
        "project_id": m.project_id,
        "project_name": m.project.name if m.project else None,
        "name": m.name,
        "description": m.description,
        "task_count": len([t for t in (m.tasks or []) if not t.deleted_at]) if m.tasks else 0,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }
