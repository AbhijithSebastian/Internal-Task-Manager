from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.activity_logs.models import ActivityLog
from app.users.models import User

router = APIRouter()


@router.get("")
def list_activity_logs(
    subject_type: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    causer_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ActivityLog)

    if subject_type:
        query = query.filter(ActivityLog.subject_type == subject_type)
    if subject_id:
        query = query.filter(ActivityLog.subject_id == subject_id)
    if causer_id:
        query = query.filter(ActivityLog.causer_id == causer_id)
    if not current_user.is_super_admin:
        pass

    total = query.count()
    logs = query.order_by(ActivityLog.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "items": [{
            "id": l.id,
            "log_name": l.log_name,
            "description": l.description,
            "subject_type": l.subject_type,
            "subject_id": l.subject_id,
            "causer_type": l.causer_type,
            "causer_id": l.causer_id,
            "properties": l.properties,
            "event": l.event,
            "batch_uuid": l.batch_uuid,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        } for l in logs],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }
