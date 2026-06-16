from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.milestones.models import Milestone
from app.users.models import User
from app.core.enums import MilestoneStatus

router = APIRouter()


class MilestoneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: str = "pending"
    project_id: int


class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    completed_at: Optional[str] = None


@router.get("")
def list_milestones(
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Milestone).filter(Milestone.deleted_at.is_(None))
    if project_id:
        query = query.filter(Milestone.project_id == project_id)
    if status:
        query = query.filter(Milestone.status == MilestoneStatus(status))

    total = query.count()
    milestones = query.order_by(Milestone.due_date.asc().nullslast()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "items": [format_milestone(m) for m in milestones],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/{milestone_id}")
def get_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise NotFoundException("Milestone", milestone_id)
    return format_milestone(milestone)


@router.post("", status_code=201)
def create_milestone(
    data: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["projects.update"])),
):
    milestone = Milestone(
        name=data.name,
        description=data.description,
        due_date=datetime.fromisoformat(data.due_date).date() if data.due_date else None,
        status=MilestoneStatus(data.status),
        project_id=data.project_id,
        author_id=current_user.id,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    log_activity(db, "milestones", milestone.id, "Milestone created",
                 causer_id=current_user.id,
                 properties={"project_id": data.project_id, "name": data.name})
    return format_milestone(milestone)


@router.put("/{milestone_id}")
def update_milestone(
    milestone_id: int,
    data: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise NotFoundException("Milestone", milestone_id)

    if data.name is not None:
        milestone.name = data.name
    if data.description is not None:
        milestone.description = data.description
    if data.due_date is not None:
        milestone.due_date = datetime.fromisoformat(data.due_date).date() if data.due_date else None
    if data.status is not None:
        milestone.status = MilestoneStatus(data.status)
    if data.completed_at is not None:
        milestone.completed_at = datetime.fromisoformat(data.completed_at).date() if data.completed_at else None

    db.commit()
    db.refresh(milestone)

    log_activity(db, "milestones", milestone.id, "Milestone updated", causer_id=current_user.id)
    return format_milestone(milestone)


@router.delete("/{milestone_id}")
def delete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["projects.update"])),
):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise NotFoundException("Milestone", milestone_id)

    milestone.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db, "milestones", milestone_id, "Milestone deleted", causer_id=current_user.id)
    return {"message": "Milestone deleted successfully"}


def format_milestone(m: Milestone) -> dict:
    return {
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "due_date": m.due_date.isoformat() if m.due_date else None,
        "completed_at": m.completed_at.isoformat() if m.completed_at else None,
        "status": m.status.value if m.status else "pending",
        "status_label": m.status.label() if m.status else "Pending",
        "project_id": m.project_id,
        "author": {"id": m.author.id, "name": m.author.name} if m.author else None,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }
