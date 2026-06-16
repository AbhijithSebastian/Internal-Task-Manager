from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.announcements.models import Announcement
from app.users.models import User
from app.core.enums import AnnouncementPriority, AnnouncementStatus

router = APIRouter()


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "medium"
    status: str = "published"
    published_at: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    published_at: Optional[datetime] = None


@router.get("")
def list_announcements(
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Announcement).filter(Announcement.deleted_at.is_(None))
    query = query.order_by(Announcement.published_at.desc().nullslast(), Announcement.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [format_announcement(a) for a in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.post("", status_code=201)
def create_announcement(data: AnnouncementCreate, db: Session = Depends(get_db),
                        current_user: User = Depends(require_permissions(["announcements.create"]))):
    announcement = Announcement(
        title=data.title,
        content=data.content,
        priority=AnnouncementPriority(data.priority) if data.priority else AnnouncementPriority.MEDIUM,
        status=AnnouncementStatus(data.status) if data.status else AnnouncementStatus.PUBLISHED,
        author_id=current_user.id,
        published_at=data.published_at or (datetime.utcnow() if data.status == "published" else None),
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    log_activity(db, "announcements", announcement.id, "Announcement created", causer_id=current_user.id)
    return format_announcement(announcement)


@router.put("/{announcement_id}")
def update_announcement(announcement_id: int, data: AnnouncementUpdate,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(require_permissions(["announcements.update"]))):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    if not current_user.is_super_admin and announcement.author_id != current_user.id:
        raise HTTPException(403, "Not authorized to update this announcement")

    if data.title is not None:
        announcement.title = data.title
    if data.content is not None:
        announcement.content = data.content
    if data.priority is not None:
        announcement.priority = AnnouncementPriority(data.priority)
    if data.status is not None:
        announcement.status = AnnouncementStatus(data.status)
    if data.published_at is not None or data.status == "published":
        announcement.published_at = data.published_at or datetime.utcnow()

    db.commit()
    db.refresh(announcement)
    return format_announcement(announcement)


@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(require_permissions(["announcements.delete"]))):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    if not current_user.is_super_admin and announcement.author_id != current_user.id:
        raise HTTPException(403, "Not authorized to delete this announcement")

    announcement.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Announcement deleted successfully"}


def format_announcement(a: Announcement) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "priority": a.priority.value if a.priority else "medium",
        "priority_label": a.priority.label() if a.priority else "Medium",
        "status": a.status.value if a.status else "published",
        "status_label": "Published" if (a.status and a.status.value == "published") else "Draft",
        "author": {"id": a.author.id, "name": a.author.name} if a.author else None,
        "published_at": a.published_at,
        "created_at": a.created_at,
    }
