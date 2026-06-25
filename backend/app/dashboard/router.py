from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.core.deps import get_current_user
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task, task_assignees
from app.users.models import User
from app.comments.models import Comment, Mention
from app.activity_logs.models import ActivityLog
from app.core.enums import TaskStatus, UserRole, ProjectStatus
from app.common_schemas import enum_label
from app.core.enums import ProjectStatus, ProjectPriority

router = APIRouter()


def get_user_project_ids(user: User, db: Session) -> list[int]:
    if user.is_super_admin:
        ids = db.query(Project.id).filter(
            Project.deleted_at.is_(None)
        ).all()
        return [r[0] for r in ids]

    direct = db.query(Project.id).filter(
        (Project.pm_id == user.id) | (Project.lead_id == user.id),
        Project.deleted_at.is_(None)
    ).all()

    member = db.query(ProjectMember.project_id).filter(
        ProjectMember.user_id == user.id
    ).all()

    ids = set(r[0] for r in direct) | set(r[0] for r in member)
    return list(ids)


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_ids = get_user_project_ids(current_user, db)
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    prev_week_start = week_start - timedelta(days=7)
    prev_week_end = week_start - timedelta(seconds=1)

    active_projects = db.query(func.count(Project.id)).filter(
        Project.id.in_(project_ids), Project.status == ProjectStatus.ACTIVE,
        Project.deleted_at.is_(None)
    ).scalar() or 0

    tasks_due = db.query(func.count(Task.id)).filter(
        Task.project_id.in_(project_ids), Task.parent_id.is_(None),
        Task.deleted_at.is_(None), Task.due_date.isnot(None),
        Task.due_date >= week_start.date(),
        Task.due_date <= week_end.date(),
    ).scalar() or 0

    pending_reviews = db.query(func.count(Task.id)).filter(
        Task.project_id.in_(project_ids), Task.status == TaskStatus.IN_REVIEW,
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
    ).scalar() or 0

    prev_active = db.query(func.count(Project.id)).filter(
        Project.id.in_(project_ids), Project.status == ProjectStatus.ACTIVE,
        Project.deleted_at.is_(None), Project.created_at <= prev_week_end
    ).scalar() or 0

    prev_due = db.query(func.count(Task.id)).filter(
        Task.project_id.in_(project_ids), Task.parent_id.is_(None),
        Task.deleted_at.is_(None), Task.due_date.isnot(None),
        Task.due_date >= prev_week_start.date(),
        Task.due_date <= prev_week_end.date(),
    ).scalar() or 0

    prev_reviews = db.query(func.count(Task.id)).filter(
        Task.project_id.in_(project_ids), Task.status == TaskStatus.IN_REVIEW,
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
        Task.created_at <= prev_week_end
    ).scalar() or 0

    def calc_trend(prev: int, curr: int) -> int:
        if prev == 0:
            return 100 if curr > 0 else 0
        return int(round(((curr - prev) / prev) * 100))

    return {
        "active_projects": active_projects,
        "tasks_due_this_week": tasks_due,
        "pending_reviews": pending_reviews,
        "trends": {
            "active_projects": calc_trend(prev_active, active_projects),
            "tasks_due_this_week": calc_trend(prev_due, tasks_due),
            "pending_reviews": calc_trend(prev_reviews, pending_reviews),
        },
    }


@router.get("/role-data")
def get_role_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role and current_user.role.name == UserRole.EMPLOYEE.value:
        return get_employee_data(current_user, db)
    elif current_user.role and current_user.role.name == UserRole.PROJECT_MANAGER.value:
        return get_pm_data(current_user, db)
    elif current_user.role and current_user.role.name == UserRole.TEAM_LEAD.value:
        return get_team_lead_data(current_user, db)
    else:
        return get_admin_data(current_user, db)


@router.get("/projects")
def get_current_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_super_admin:
        projects = db.query(Project).filter(
            Project.status == ProjectStatus.ACTIVE, Project.deleted_at.is_(None)
        ).order_by(Project.name).limit(10).all()
    else:
        project_ids = get_user_project_ids(current_user, db)
        projects = db.query(Project).filter(
            Project.id.in_(project_ids), Project.status == ProjectStatus.ACTIVE,
            Project.deleted_at.is_(None)
        ).order_by(Project.name).limit(10).all()

    result = []
    for p in projects:
        total = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        completed = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        result.append({
            "id": p.id,
            "name": p.name,
            "total_tasks": total,
            "completed_tasks": completed,
            "completion_rate": round((completed / total) * 100, 1) if total > 0 else 0,
            "pm": p.project_manager.name if p.project_manager else None,
        })

    return result


@router.get("/activities")
def get_recent_activities(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project_ids = get_user_project_ids(current_user, db)

    activities = db.query(ActivityLog).filter(
        ActivityLog.subject_id.in_(
            db.query(Task.id).filter(
                Task.project_id.in_(project_ids), Task.deleted_at.is_(None)
            )
        ),
        ActivityLog.subject_type == "tasks",
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    return [{
        "id": a.id,
        "description": a.description,
        "subject_type": a.subject_type,
        "subject_id": a.subject_id,
        "causer_id": a.causer_id,
        "properties": a.properties,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    } for a in activities]


def get_employee_data(user: User, db: Session) -> dict:
    my_tasks = db.query(Task).filter(
        Task.assignees.any(User.id == user.id),
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
        Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
    ).order_by(Task.due_date.asc()).limit(10).all()

    mentions = db.query(Mention).filter(
        Mention.user_id == user.id
    ).order_by(Mention.created_at.desc()).limit(5).all()

    pending = db.query(Task).filter(
        Task.author_id == user.id, Task.requires_approval == True,
        Task.status == TaskStatus.IN_REVIEW, Task.deleted_at.is_(None),
    ).order_by(Task.created_at.desc()).limit(10).all()

    return {
        "my_tasks": [{
            "id": t.id, "title": t.title, "status": t.status if t.status else None,
            "status_label": enum_label(t.status, TaskStatus, "Backlog") if t.status else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "project_id": t.project_id,
            "project_name": t.project.name if t.project else None,
            "priority": t.priority if t.priority else None,
        } for t in my_tasks],
        "mentions": [{
            "id": m.id,
            "comment_id": m.comment_id,
            "comment_body": m.comment.body[:100] if m.comment and m.comment.body else "",
            "mentioned_by": m.comment.author.name if m.comment and m.comment.author else None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        } for m in mentions],
        "pending_approvals": [{
            "id": t.id, "title": t.title,
            "approver": t.approver.name if t.approver else None,
            "project_name": t.project.name if t.project else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        } for t in pending],
    }


def get_pm_data(user: User, db: Session) -> dict:
    project_ids = [r[0] for r in db.query(Project.id).filter(
        Project.pm_id == user.id, Project.deleted_at.is_(None)
    ).all()]

    active_projects = []
    for p in db.query(Project).filter(
        Project.id.in_(project_ids), Project.status == ProjectStatus.ACTIVE,
        Project.deleted_at.is_(None)
    ).all():
        total = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        completed = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        active_projects.append({
            "id": p.id, "name": p.name,
            "total_tasks": total, "completed_tasks": completed,
            "completion_rate": round((completed / total) * 100, 1) if total > 0 else 0,
        })

    pending = db.query(Task).filter(
        Task.project_id.in_(project_ids), Task.requires_approval == True,
        Task.status == TaskStatus.IN_REVIEW, Task.deleted_at.is_(None),
    ).order_by(Task.created_at.desc()).limit(10).all()

    member_ids = db.query(ProjectMember.user_id).filter(
        ProjectMember.project_id.in_(project_ids)
    ).distinct().subquery()

    workload = db.query(User, func.count(Task.id).label("pending_tasks")).outerjoin(
        task_assignees, Task.assignees
    ).filter(
        User.id.in_(member_ids),
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
        Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
        Task.project_id.in_(project_ids),
    ).group_by(User.id).all()

    return {
        "active_projects": active_projects,
        "pending_approvals": [{
            "id": t.id, "title": t.title,
            "project_name": t.project.name if t.project else None,
            "author": t.author.name if t.author else None,
            "assignees": [{"id": a.id, "name": a.name} for a in (t.assignees or [])],
            "created_at": t.created_at.isoformat() if t.created_at else None,
        } for t in pending],
        "workload": [{"id": w.User.id, "name": w.User.name, "pending_tasks": w.pending_tasks or 0} for w in workload],
    }


def get_team_lead_data(user: User, db: Session) -> dict:
    project_ids = [r[0] for r in db.query(Project.id).filter(
        Project.lead_id == user.id, Project.deleted_at.is_(None)
    ).all()]

    member_ids = db.query(ProjectMember.user_id).filter(
        ProjectMember.project_id.in_(project_ids)
    ).distinct().subquery()

    workload = db.query(User, func.count(Task.id).label("pending_tasks")).outerjoin(
        task_assignees, Task.assignees
    ).filter(
        User.id.in_(member_ids),
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
        Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
        Task.project_id.in_(project_ids),
    ).group_by(User.id).all()

    review_tasks = db.query(Task).filter(
        Task.project_id.in_(project_ids), Task.status == TaskStatus.IN_REVIEW,
        Task.deleted_at.is_(None),
    ).order_by(Task.created_at.desc()).limit(10).all()

    blocked_tasks = db.query(Task).filter(
        Task.project_id.in_(project_ids), Task.status == TaskStatus.BLOCKED,
        Task.deleted_at.is_(None),
    ).order_by(Task.created_at.desc()).limit(10).all()

    return {
        "team_workload": [{"id": w.User.id, "name": w.User.name, "pending_tasks": w.pending_tasks or 0} for w in workload],
        "review_tasks": [{
            "id": t.id, "title": t.title,
            "project_name": t.project.name if t.project else None,
            "assignees": [{"id": a.id, "name": a.name} for a in (t.assignees or [])],
        } for t in review_tasks],
        "blocked_tasks": [{
            "id": t.id, "title": t.title,
            "blocked_reason": t.blocked_reason,
            "project_name": t.project.name if t.project else None,
            "assignees": [{"id": a.id, "name": a.name} for a in (t.assignees or [])],
        } for t in blocked_tasks],
    }


def get_admin_data(user: User, db: Session) -> dict:
    projects = db.query(Project).filter(Project.deleted_at.is_(None)).all()
    project_progress = []
    for p in projects:
        total = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        completed = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        project_progress.append({
            "id": p.id, "name": p.name,
            "total_tasks": total, "completed_tasks": completed,
            "completion_rate": round((completed / total) * 100, 1) if total > 0 else 0,
        })

    status_counts = dict(
        db.query(Task.status, func.count(Task.id)).filter(
            Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).group_by(Task.status).all()
    )
    status_distribution = [{
        "status": s.value, "label": s.label(),
        "count": status_counts.get(s, 0),
    } for s in TaskStatus]

    tasks_over_time = db.query(
        func.date(Task.created_at).label("date"),
        func.count(Task.id).label("count"),
    ).filter(
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
        Task.created_at >= datetime.utcnow() - timedelta(days=30),
    ).group_by(func.date(Task.created_at)).order_by(func.date(Task.created_at)).all()

    active_users = db.query(User).filter(
        User.deleted_at.is_(None), User.is_active == True
    ).all()

    team_workload = []
    for u in active_users:
        pending = db.query(func.count(Task.id)).filter(
            Task.assignees.any(User.id == u.id),
            Task.parent_id.is_(None), Task.deleted_at.is_(None),
            Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
        ).scalar() or 0
        team_workload.append({"id": u.id, "name": u.name, "pending_tasks": pending})

    pending_approvals = db.query(Task).filter(
        Task.requires_approval == True, Task.status == TaskStatus.IN_REVIEW,
        Task.deleted_at.is_(None),
    ).order_by(Task.created_at.desc()).limit(10).all()

    return {
        "project_progress": project_progress,
        "status_distribution": status_distribution,
        "tasks_over_time": [{"date": str(r.date), "count": r.count} for r in tasks_over_time],
        "team_workload": team_workload,
        "pending_approvals": [{
            "id": t.id, "title": t.title,
            "project_name": t.project.name if t.project else None,
            "author": t.author.name if t.author else None,
            "assignees": [{"id": a.id, "name": a.name} for a in (t.assignees or [])],
        } for t in pending_approvals],
    }
