from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException, ForbiddenError
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task
from app.meetings.models import MeetingLog
from app.users.models import User
from app.core.enums import ProjectStatus, ProjectPriority, ProjectMemberRole, TaskStatus
from app.common_schemas import enum_label
from app.core.enums import ProjectStatus, ProjectPriority, TaskStatus

router = APIRouter()


@router.get("/recent")
def get_recent_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member_project_ids = [
        pm.project_id for pm in db.query(ProjectMember).filter(
            ProjectMember.user_id == current_user.id
        ).all()
    ]
    if not member_project_ids:
        return {"items": [], "total": 0}
    projects = db.query(Project).filter(
        Project.deleted_at.is_(None),
        Project.id.in_(member_project_ids),
    ).order_by(Project.updated_at.desc().nullslast()).limit(10).all()
    return {
        "items": [format_project(p, db) for p in projects],
        "total": len(projects),
    }


@router.get("/search")
def search_projects(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    term = f"%{q}%"
    projects = db.query(Project).filter(
        Project.deleted_at.is_(None),
        Project.name.ilike(term),
    ).limit(limit).all()
    return [
        {"id": p.id, "name": p.name, "status": p.status if p.status else "active",
         "priority": p.priority if p.priority else "medium"}
        for p in projects
    ]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    priority: str = "medium"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    pm_id: Optional[int] = None
    lead_id: Optional[int] = None
    figma_url: Optional[str] = None
    figma_token: Optional[str] = None
    github_url: Optional[str] = None
    docs_url: Optional[str] = None
    meeting_url: Optional[str] = None
    member_ids: Optional[list[int]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    pm_id: Optional[int] = None
    lead_id: Optional[int] = None
    figma_url: Optional[str] = None
    figma_token: Optional[str] = None
    github_url: Optional[str] = None
    docs_url: Optional[str] = None
    meeting_url: Optional[str] = None


@router.get("")
def list_projects(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    pm_id: Optional[int] = Query(None),
    lead_id: Optional[int] = Query(None),
    sort_by: str = Query("created_at"),
    sort_direction: str = Query("desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project).filter(Project.deleted_at.is_(None))

    if not current_user.is_super_admin:
        project_ids = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id
        ).subquery()
        query = query.filter(
            (Project.id.in_(project_ids)) |
            (Project.pm_id == current_user.id) |
            (Project.lead_id == current_user.id) |
            (Project.author_id == current_user.id)
        )

    if search:
        query = query.filter(Project.name.ilike(f"%{search}%") | Project.description.ilike(f"%{search}%"))
    if status:
        query = query.filter(Project.status == ProjectStatus(status))
    if priority:
        query = query.filter(Project.priority == ProjectPriority(priority))
    if pm_id:
        query = query.filter(Project.pm_id == pm_id)
    if lead_id:
        query = query.filter(Project.lead_id == lead_id)

    sort_col = getattr(Project, sort_by, Project.created_at)
    query = query.order_by(sort_col.desc() if sort_direction == "desc" else sort_col.asc())

    total = query.count()
    projects = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [format_project(p, db) for p in projects],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at.is_(None)).first()
    if not project:
        raise NotFoundException("Project", project_id)

    return format_project_detail(project, db)


@router.post("", status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db),
                   current_user: User = require_permissions(["projects.create"])):
    project = Project(
        name=data.name,
        description=data.description,
        priority=ProjectPriority(data.priority) if data.priority else ProjectPriority.MEDIUM,
        start_date=datetime.fromisoformat(data.start_date).date() if data.start_date else None,
        end_date=datetime.fromisoformat(data.end_date).date() if data.end_date else None,
        pm_id=data.pm_id,
        lead_id=data.lead_id,
        figma_url=data.figma_url,
        figma_token=data.figma_token,
        github_url=data.github_url,
        docs_url=data.docs_url,
        meeting_url=data.meeting_url,
        author_id=current_user.id,
    )
    db.add(project)
    db.flush()

    pm = ProjectMember(project_id=project.id, user_id=current_user.id, role=ProjectMemberRole.OWNER)
    db.add(pm)

    if data.member_ids:
        for uid in data.member_ids:
            if uid != current_user.id:
                db.add(ProjectMember(project_id=project.id, user_id=uid, role=ProjectMemberRole.MEMBER))

    db.commit()
    db.refresh(project)

    log_activity(db, "projects", project.id, "Project created", causer_id=current_user.id,
                 properties={"name": project.name, "priority": project.priority})
    return format_project(project, db)


@router.put("/{project_id}")
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db),
                   current_user: User = require_permissions(["projects.update"])):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        old_status = project.status
        project.status = ProjectStatus(data.status)
    if data.priority is not None:
        project.priority = ProjectPriority(data.priority)
    if data.start_date is not None:
        project.start_date = datetime.fromisoformat(data.start_date).date() if data.start_date else None
    if data.end_date is not None:
        project.end_date = datetime.fromisoformat(data.end_date).date() if data.end_date else None
    if data.pm_id is not None:
        project.pm_id = data.pm_id
    if data.lead_id is not None:
        project.lead_id = data.lead_id
    if data.figma_url is not None:
        project.figma_url = data.figma_url
    if data.figma_token is not None:
        project.figma_token = data.figma_token
    if data.github_url is not None:
        project.github_url = data.github_url
    if data.docs_url is not None:
        project.docs_url = data.docs_url
    if data.meeting_url is not None:
        project.meeting_url = data.meeting_url

    db.commit()
    db.refresh(project)

    log_activity(db, "projects", project.id, "Project updated", causer_id=current_user.id)
    return format_project(project, db)


class ProjectDuplicate(BaseModel):
    name: Optional[str] = None


@router.post("/{project_id}/duplicate", status_code=201)
def duplicate_project(project_id: int, data: ProjectDuplicate = None,
                      db: Session = Depends(get_db),
                      current_user: User = require_permissions(["projects.create"])):
    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at.is_(None)).first()
    if not project:
        raise NotFoundException("Project", project_id)

    if data is None:
        data = ProjectDuplicate()

    dup = Project(
        name=data.name or f"{project.name} (Copy)",
        description=project.description,
        priority=project.priority or ProjectPriority.MEDIUM,
        status=ProjectStatus.ACTIVE,
        start_date=project.start_date,
        end_date=project.end_date,
        pm_id=current_user.id,
        figma_url=project.figma_url,
        github_url=project.github_url,
        docs_url=project.docs_url,
        author_id=current_user.id,
    )
    db.add(dup)
    db.flush()

    pm = ProjectMember(project_id=dup.id, user_id=current_user.id, role=ProjectMemberRole.OWNER)
    db.add(pm)

    db.commit()
    db.refresh(dup)

    log_activity(db, "projects", dup.id, "Project duplicated from #" + str(project_id),
                 causer_id=current_user.id)
    return format_project(dup, db)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db),
                   current_user: User = require_permissions(["projects.delete"])):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)

    project.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db, "projects", project.id, "Project deleted", causer_id=current_user.id)
    return {"message": "Project deleted successfully"}


@router.patch("/{project_id}/status")
def update_project_status(project_id: int, status: str, db: Session = Depends(get_db),
                          current_user: User = require_permissions(["projects.update"])):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)

    old_status = project.status
    project.status = ProjectStatus(status)
    db.commit()

    log_activity(db, "projects", project.id, "Project status changed",
                 causer_id=current_user.id,
                 properties={"old": old_status if old_status else None, "new": status})
    return {"message": "Status updated", "status": status}


@router.patch("/{project_id}/archive")
def archive_project(project_id: int, db: Session = Depends(get_db),
                    current_user: User = require_permissions(["projects.archive"])):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)

    project.status = ProjectStatus.ARCHIVED
    db.commit()

    log_activity(db, "projects", project.id, "Project archived", causer_id=current_user.id)
    return {"message": "Project archived successfully"}


@router.get("/{project_id}/members")
def get_members(project_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)

    members = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "project_id": m.project_id,
            "role": m.role if m.role else "member",
            "user": {
                "id": m.user.id,
                "name": m.user.name,
                "email": m.user.email,
            },
        }
        for m in members
    ]


@router.post("/{project_id}/members")
def add_member(project_id: int, user_id: int, role: str = "member",
               db: Session = Depends(get_db),
               current_user: User = require_permissions(["projects.manage-members"])):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(422, "User is already a member")

    pm = ProjectMember(project_id=project_id, user_id=user_id, role=ProjectMemberRole(role))
    db.add(pm)
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    log_activity(db, "projects", project.id, "Member added", causer_id=current_user.id,
                 properties={"member": user.name if user else str(user_id), "role": role})
    return {"message": "Member added successfully"}


@router.put("/{project_id}/members/{user_id}")
def update_member_role(project_id: int, user_id: int, role: str,
                       db: Session = Depends(get_db),
                       current_user: User = require_permissions(["projects.manage-members"])):
    pm = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
    ).first()
    if not pm:
        raise NotFoundException("Project member")

    pm.role = ProjectMemberRole(role)
    db.commit()
    return {"message": "Member role updated successfully"}


@router.delete("/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db),
                  current_user: User = require_permissions(["projects.manage-members"])):
    pm = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
    ).first()
    if not pm:
        raise NotFoundException("Project member")

    db.delete(pm)
    db.commit()
    return {"message": "Member removed successfully"}


@router.get("/{project_id}/tasks")
def get_project_tasks(project_id: int, per_page: int = Query(50, ge=1, le=200),
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)
    tasks = db.query(Task).filter(Task.project_id == project_id, Task.deleted_at.is_(None)).limit(per_page).all()
    return {
        "items": [
            {"id": t.id, "title": t.title, "status": t.status, "priority": t.priority,
             "due_date": t.due_date.isoformat() if t.due_date else None,
             "created_at": t.created_at.isoformat() if t.created_at else None}
            for t in tasks
        ],
        "total": len(tasks),
    }


@router.get("/{project_id}/meetings")
def get_project_meetings(project_id: int, per_page: int = Query(20, ge=1, le=100),
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)
    meetings = db.query(MeetingLog).filter(MeetingLog.project_id == project_id).limit(per_page).all()
    return {
        "items": [
            {"id": m.id, "title": m.title, "meeting_date": m.meeting_date.isoformat() if m.meeting_date else None,
             "location": m.location, "summary": m.summary, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in meetings
        ],
        "total": len(meetings),
    }


@router.get("/{project_id}/activity")
def get_project_activity(project_id: int, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    from app.activity_logs.models import ActivityLog
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException("Project", project_id)
    activities = db.query(ActivityLog).filter(
        ActivityLog.subject_type == "projects", ActivityLog.subject_id == project_id
    ).order_by(ActivityLog.created_at.desc()).limit(50).all()
    return {
        "items": [
            {"id": a.id, "description": a.description, "causer_id": a.causer_id,
             "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in activities
        ],
        "total": len(activities),
    }


def format_project(p: Project, db: Session) -> dict:
    task_count = len([t for t in p.tasks if not t.parent_id and not t.deleted_at])
    completed_count = len([t for t in p.tasks if not t.parent_id and t.status == TaskStatus.DONE and not t.deleted_at])

    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "status": p.status if p.status else "active",
        "status_label": enum_label(p.status, ProjectStatus, "Active"),
        "priority": p.priority if p.priority else "medium",
        "priority_label": enum_label(p.priority, ProjectPriority, "Medium"),
        "start_date": p.start_date,
        "end_date": p.end_date,
        "author": {"id": p.author.id, "name": p.author.name} if p.author else None,
        "project_manager": {"id": p.project_manager.id, "name": p.project_manager.name} if p.project_manager else None,
        "team_lead": {"id": p.team_lead.id, "name": p.team_lead.name} if p.team_lead else None,
        "figma_url": p.figma_url,
        "figma_token": p.figma_token,
        "github_url": p.github_url,
        "docs_url": p.docs_url,
        "meeting_url": p.meeting_url,
        "member_count": p.member_count,
        "task_count": task_count,
        "completed_task_count": completed_count,
        "created_at": p.created_at,
    }


def format_project_detail(p: Project, db: Session) -> dict:
    data = format_project(p, db)
    data["members"] = [
        {"id": m.user.id, "name": m.user.name, "email": m.user.email, "role": m.role if m.role else "member"}
        for m in p.member_links
    ]
    data["tasks"] = [
        {
            "id": t.id, "title": t.title, "status": t.status if t.status else "backlog",
            "priority": t.priority if t.priority else "medium",
            "author": {"id": t.author.id, "name": t.author.name} if t.author else None,
            "assignees": [{"id": a.id, "name": a.name} for a in t.assignees],
            "due_date": t.due_date, "created_at": t.created_at,
        }
        for t in p.tasks if not t.parent_id and not t.deleted_at
    ]
    data["milestones"] = [
        {
            "id": m.id, "name": m.name, "status": m.status if m.status else "pending",
            "due_date": m.due_date, "completed_at": m.completed_at,
        }
        for m in p.milestones if not m.deleted_at
    ]
    return data
