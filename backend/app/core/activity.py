from typing import Optional
from sqlalchemy.orm import Session

from app.activity_logs.models import ActivityLog


def log_activity(
    db: Session,
    subject_type: str,
    subject_id: int,
    description: str,
    causer_id: Optional[int] = None,
    causer_type: str = "user",
    properties: Optional[dict] = None,
    event: Optional[str] = None,
    log_name: Optional[str] = None,
) -> ActivityLog:
    activity = ActivityLog(
        log_name=log_name or subject_type,
        description=description,
        subject_type=subject_type,
        subject_id=subject_id,
        causer_type=causer_type,
        causer_id=causer_id,
        properties=properties or {},
        event=event,
    )
    db.add(activity)
    db.flush()
    return activity
