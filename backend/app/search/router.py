from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.users.models import User
from app.projects.models import Project
from app.tasks.models import Task

router = APIRouter()


@router.get("")
def global_search(
    q: str = Query(..., min_length=1, max_length=200),
    type: Optional[str] = Query(None, regex="^(users|projects|tasks)$"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = {}
    term = f"%{q}%"

    if not type or type == "users":
        users = db.query(User).filter(
            User.deleted_at.is_(None),
            or_(User.name.ilike(term), User.email.ilike(term)),
        ).limit(limit).all()
        results["users"] = [
            {"id": u.id, "name": u.name, "email": u.email, "job_title": u.job_title, "avatar_url": u.avatar_url}
            for u in users
        ]

    if not type or type == "projects":
        projects = db.query(Project).filter(
            Project.deleted_at.is_(None),
            Project.name.ilike(term),
        ).limit(limit).all()
        results["projects"] = [
            {"id": p.id, "name": p.name, "status": p.status.value if p.status else "active",
             "priority": p.priority.value if p.priority else "medium"}
            for p in projects
        ]

    if not type or type == "tasks":
        tasks = db.query(Task).filter(
            Task.deleted_at.is_(None),
            Task.parent_id.is_(None),
            Task.title.ilike(term),
        ).limit(limit).all()
        results["tasks"] = [
            {"id": t.id, "title": t.title, "status": t.status.value if t.status else "backlog",
             "priority": t.priority.value if t.priority else "medium", "project_id": t.project_id}
            for t in tasks
        ]

    return results
