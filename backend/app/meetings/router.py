from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.meetings.models import MeetingLog
from app.users.models import User

router = APIRouter()


class MeetingCreate(BaseModel):
    project_id: int
    module_id: Optional[int] = None
    title: str
    meeting_date: str
    location: Optional[str] = None
    attendees: Optional[list[str]] = None
    summary: str
    decisions_taken: Optional[str] = None
    blockers: Optional[str] = None
    action_items: Optional[str] = None
    notes: Optional[str] = None
    recording_link: Optional[str] = None
    next_meeting_date: Optional[str] = None
    related_task_id: Optional[int] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    meeting_date: Optional[str] = None
    module_id: Optional[int] = None
    location: Optional[str] = None
    attendees: Optional[list[str]] = None
    summary: Optional[str] = None
    decisions_taken: Optional[str] = None
    blockers: Optional[str] = None
    action_items: Optional[str] = None
    notes: Optional[str] = None
    recording_link: Optional[str] = None
    next_meeting_date: Optional[str] = None
    related_task_id: Optional[int] = None


@router.get("")
def list_meetings(
    project_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MeetingLog)
    if project_id:
        query = query.filter(MeetingLog.project_id == project_id)

    total = query.count()
    meetings = query.order_by(MeetingLog.meeting_date.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "items": [format_meeting(m) for m in meetings],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/{meeting_id}")
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(MeetingLog).filter(MeetingLog.id == meeting_id).first()
    if not meeting:
        raise NotFoundException("Meeting", meeting_id)
    return format_meeting(meeting)


@router.post("", status_code=201)
def create_meeting(
    data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = MeetingLog(
        project_id=data.project_id,
        module_id=data.module_id,
        author_id=current_user.id,
        title=data.title,
        meeting_date=datetime.strptime(data.meeting_date, "%Y-%m-%d").date(),
        location=data.location,
        attendees=data.attendees,
        summary=data.summary,
        decisions_taken=data.decisions_taken,
        blockers=data.blockers,
        action_items=data.action_items,
        notes=data.notes,
        recording_link=data.recording_link,
        next_meeting_date=datetime.fromisoformat(data.next_meeting_date) if data.next_meeting_date else None,
        related_task_id=data.related_task_id,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    log_activity(db, "meetings", meeting.id, "Meeting log created",
                 causer_id=current_user.id,
                 properties={"project_id": data.project_id, "title": data.title})
    return format_meeting(meeting)


@router.put("/{meeting_id}")
def update_meeting(
    meeting_id: int,
    data: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(MeetingLog).filter(MeetingLog.id == meeting_id).first()
    if not meeting:
        raise NotFoundException("Meeting", meeting_id)

    if data.title is not None:
        meeting.title = data.title
    if data.meeting_date is not None:
        meeting.meeting_date = datetime.strptime(data.meeting_date, "%Y-%m-%d").date()
    if data.location is not None:
        meeting.location = data.location
    if data.attendees is not None:
        meeting.attendees = data.attendees
    if data.summary is not None:
        meeting.summary = data.summary
    if data.decisions_taken is not None:
        meeting.decisions_taken = data.decisions_taken
    if data.blockers is not None:
        meeting.blockers = data.blockers
    if data.action_items is not None:
        meeting.action_items = data.action_items
    if data.notes is not None:
        meeting.notes = data.notes
    if data.recording_link is not None:
        meeting.recording_link = data.recording_link
    if data.next_meeting_date is not None:
        meeting.next_meeting_date = datetime.fromisoformat(data.next_meeting_date)
    if data.related_task_id is not None:
        meeting.related_task_id = data.related_task_id
    if data.module_id is not None:
        meeting.module_id = data.module_id

    db.commit()
    db.refresh(meeting)

    log_activity(db, "meetings", meeting.id, "Meeting log updated", causer_id=current_user.id)
    return format_meeting(meeting)


@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    meeting = db.query(MeetingLog).filter(MeetingLog.id == meeting_id).first()
    if not meeting:
        raise NotFoundException("Meeting", meeting_id)

    db.delete(meeting)
    db.commit()

    log_activity(db, "meetings", meeting_id, "Meeting log deleted", causer_id=current_user.id)
    return {"message": "Meeting deleted successfully"}


def format_meeting(m: MeetingLog) -> dict:
    return {
        "id": m.id,
        "project_id": m.project_id,
        "project_name": m.project.name if m.project else None,
        "module_id": m.module_id,
        "module_name": m.module.name if m.module else None,
        "author": {"id": m.author.id, "name": m.author.name} if m.author else None,
        "title": m.title,
        "meeting_date": m.meeting_date.isoformat() if m.meeting_date else None,
        "location": m.location,
        "attendees": m.attendees,
        "summary": m.summary,
        "decisions_taken": m.decisions_taken,
        "blockers": m.blockers,
        "action_items": m.action_items,
        "notes": m.notes,
        "recording_link": m.recording_link,
        "next_meeting_date": m.next_meeting_date.isoformat() if m.next_meeting_date else None,
        "related_task_id": m.related_task_id,
        "organizer": {"id": m.author.id, "name": m.author.name} if m.author else None,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }
