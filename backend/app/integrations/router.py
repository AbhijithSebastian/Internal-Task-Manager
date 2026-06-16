from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.integrations.models import Integration
from app.users.models import User
from app.core.enums import IntegrationType

router = APIRouter()


class IntegrationCreate(BaseModel):
    project_id: int
    type: str
    label: Optional[str] = None
    config: dict = {}


class IntegrationUpdate(BaseModel):
    label: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


@router.get("")
def list_integrations(
    project_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Integration)
    if project_id:
        query = query.filter(Integration.project_id == project_id)
    if type:
        query = query.filter(Integration.type == type)
    if is_active is not None:
        query = query.filter(Integration.is_active == is_active)

    total = query.count()
    integrations = query.order_by(Integration.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "items": [format_integration(i) for i in integrations],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/{integration_id}")
def get_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise NotFoundException("Integration", integration_id)
    return format_integration(integration)


@router.post("", status_code=201)
def create_integration(
    data: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["projects.update"]),
):
    integration = Integration(
        project_id=data.project_id,
        type=data.type,
        label=data.label,
        config=data.config,
        is_active=True,
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    log_activity(db, "integrations", integration.id, "Integration created",
                 causer_id=current_user.id,
                 properties={"project_id": data.project_id, "type": data.type})
    return format_integration(integration)


@router.put("/{integration_id}")
def update_integration(
    integration_id: int,
    data: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise NotFoundException("Integration", integration_id)

    if data.label is not None:
        integration.label = data.label
    if data.config is not None:
        integration.config = data.config
    if data.is_active is not None:
        integration.is_active = data.is_active

    db.commit()
    db.refresh(integration)

    log_activity(db, "integrations", integration.id, "Integration updated", causer_id=current_user.id)
    return format_integration(integration)


@router.delete("/{integration_id}")
def delete_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["projects.update"]),
):
    integration = db.query(Integration).filter(Integration.id == integration_id).first()
    if not integration:
        raise NotFoundException("Integration", integration_id)

    db.delete(integration)
    db.commit()

    log_activity(db, "integrations", integration_id, "Integration deleted", causer_id=current_user.id)
    return {"message": "Integration deleted successfully"}


def format_integration(i: Integration) -> dict:
    return {
        "id": i.id,
        "project_id": i.project_id,
        "type": i.type,
        "label": i.label,
        "config": i.config,
        "is_active": i.is_active,
        "last_synced_at": i.last_synced_at,
        "created_at": i.created_at,
        "updated_at": i.updated_at,
    }
