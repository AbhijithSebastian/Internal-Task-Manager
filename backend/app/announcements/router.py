from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timezone

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.announcements.models import Announcement
from app.users.models import User
from app.core.enums import AnnouncementPriority, AnnouncementStatus
from app.common_schemas import enum_label
from app.core.enums import AnnouncementStatus, AnnouncementPriority

router = APIRouter()


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "medium"
    status: str = "published"
    published_at: Optional[datetime] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    is_pinned: bool = False


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    published_at: Optional[datetime] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    is_pinned: Optional[bool] = None


@router.get("")
def list_announcements(
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Announcement).filter(Announcement.deleted_at.is_(None))

    if status:
        query = query.filter(Announcement.status == AnnouncementStatus(status))
    else:
        query = query.filter(Announcement.status != AnnouncementStatus.SCHEDULED)

    if priority:
        query = query.filter(Announcement.priority == AnnouncementPriority(priority))

    if q:
        like = f"%{q}%"
        query = query.filter(or_(Announcement.title.ilike(like), Announcement.content.ilike(like)))

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


@router.get("/{announcement_id}")
def get_announcement(announcement_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id, Announcement.deleted_at.is_(None)).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    return format_announcement(announcement)


@router.post("", status_code=201)
def create_announcement(data: AnnouncementCreate, db: Session = Depends(get_db),
                        current_user: User = require_permissions(["announcements.create"])):
    now = datetime.now(timezone.utc)
    status = AnnouncementStatus(data.status) if data.status else AnnouncementStatus.PUBLISHED

    if data.published_at and data.published_at > now and status != AnnouncementStatus.DRAFT:
        status = AnnouncementStatus.SCHEDULED

    published_at = data.published_at
    if not published_at:
        published_at = now if status == AnnouncementStatus.PUBLISHED else None

    announcement = Announcement(
        title=data.title,
        content=data.content,
        priority=AnnouncementPriority(data.priority) if data.priority else AnnouncementPriority.MEDIUM,
        status=status,
        author_id=current_user.id,
        published_at=published_at,
        target_type=data.target_type,
        target_id=data.target_id,
        is_pinned=data.is_pinned,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    log_activity(db, "announcements", announcement.id, "Announcement created", causer_id=current_user.id)
    return format_announcement(announcement)


@router.put("/{announcement_id}")
def update_announcement(announcement_id: int, data: AnnouncementUpdate,
                        db: Session = Depends(get_db),
                        current_user: User = require_permissions(["announcements.update"])):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    if not current_user.is_super_admin and announcement.author_id != current_user.id:
        raise HTTPException(403, "Not authorized to update this announcement")

    now = datetime.now(timezone.utc)

    if data.title is not None:
        announcement.title = data.title
    if data.content is not None:
        announcement.content = data.content
    if data.priority is not None:
        announcement.priority = AnnouncementPriority(data.priority)
    if data.status is not None:
        announcement.status = AnnouncementStatus(data.status)
    if data.published_at is not None or data.status == "published":
        announcement.published_at = data.published_at or now
    if data.target_type is not None:
        announcement.target_type = data.target_type
    if data.target_id is not None:
        announcement.target_id = data.target_id
    if data.is_pinned is not None:
        announcement.is_pinned = data.is_pinned

    if announcement.status == AnnouncementStatus.PUBLISHED and announcement.published_at and announcement.published_at > now:
        announcement.status = AnnouncementStatus.SCHEDULED

    db.commit()
    db.refresh(announcement)
    return format_announcement(announcement)


@router.patch("/{announcement_id}/status")
def update_announcement_status(
    announcement_id: int, data: AnnouncementUpdate, db: Session = Depends(get_db),
    current_user: User = require_permissions(["announcements.update"]),
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    now = datetime.now(timezone.utc)
    if data.status is not None:
        target_status = AnnouncementStatus(data.status)
        announcement.status = target_status
        if target_status == AnnouncementStatus.PUBLISHED:
            if announcement.published_at and announcement.published_at > now:
                announcement.status = AnnouncementStatus.SCHEDULED
            else:
                announcement.published_at = now
    if data.is_pinned is not None:
        announcement.is_pinned = data.is_pinned
    db.commit()
    db.refresh(announcement)
    return format_announcement(announcement)


@router.patch("/{announcement_id}/pin")
def update_announcement_pin(
    announcement_id: int, data: AnnouncementUpdate, db: Session = Depends(get_db),
    current_user: User = require_permissions(["announcements.update"]),
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    if data.is_pinned is not None:
        announcement.is_pinned = data.is_pinned
    db.commit()
    db.refresh(announcement)
    return format_announcement(announcement)


@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db),
                        current_user: User = require_permissions(["announcements.delete"])):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise NotFoundException("Announcement", announcement_id)
    if not current_user.is_super_admin and announcement.author_id != current_user.id:
        raise HTTPException(403, "Not authorized to delete this announcement")

    announcement.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Announcement deleted successfully"}


def format_announcement(a: Announcement) -> dict:
    return {
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "priority": a.priority if a.priority else "medium",
        "priority_label": enum_label(a.priority, AnnouncementPriority, "Medium"),
        "status": a.status if a.status else "published",
        "status_label": enum_label(a.status, AnnouncementStatus, "Draft"),
        "author": {"id": a.author.id, "name": a.author.name} if a.author else None,
        "published_at": a.published_at,
        "created_at": a.created_at,
        "target_type": a.target_type,
        "target_id": a.target_id,
        "is_pinned": a.is_pinned,
    }
