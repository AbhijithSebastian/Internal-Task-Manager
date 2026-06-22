import csv
from io import StringIO, BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, text
from typing import Optional
from datetime import datetime, date, timedelta
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task, task_assignees
from app.users.models import User
from app.comments.models import Comment
from app.meetings.models import MeetingLog
from app.activity_logs.models import ActivityLog
from app.attachments.models import Attachment
from app.core.enums import TaskStatus, TaskPriority, ProjectStatus, ProjectPriority, ProjectMemberRole

router = APIRouter()


def paginate(query, page: int, per_page: int):
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


def resolve_project_ids(current_user: User, db: Session) -> Optional[list[int]]:
    if current_user.is_super_admin:
        return None
    role_names = [r.name for r in current_user.roles]
    if "project-manager" in role_names:
        ids = db.query(Project.id).filter(Project.pm_id == current_user.id).all()
        return [r[0] for r in ids]
    if "team-lead" in role_names:
        ids = db.query(Project.id).filter(Project.lead_id == current_user.id).all()
        return [r[0] for r in ids]
    ids = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).all()
    return [r[0] for r in ids]


def apply_project_scope(query, project_ids: Optional[list[int]], model_column):
    if project_ids is not None:
        return query.filter(model_column.in_(project_ids))
    return query


TASK_STATUS_VALUES = [s.value for s in TaskStatus]


@router.get("")
def get_reports(
    tab: str = Query("projects"),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    project_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_dir: Optional[str] = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.view"]),
):
    project_ids = resolve_project_ids(current_user, db)
    filters = {
        "project_ids": project_ids,
        "project_id": project_id,
        "user_id": user_id,
        "status": status,
        "priority": priority,
        "date_from": date_from,
        "date_to": date_to,
        "search": search,
        "sort_by": sort_by,
        "sort_dir": sort_dir,
    }

    if tab == "projects":
        data = get_project_reports(filters, page, per_page, db)
    elif tab == "tasks":
        data = get_task_reports(filters, page, per_page, db)
    elif tab == "subtasks":
        data = get_subtask_reports(filters, page, per_page, db)
    elif tab == "employees":
        data = get_employee_reports(filters, page, per_page, db)
    else:
        data = get_project_reports(filters, page, per_page, db)

    return {"data": data, "tab": tab}


def get_project_reports(filters: dict, page: int, per_page: int, db: Session) -> dict:
    query = db.query(Project).filter(Project.deleted_at.is_(None))

    if filters.get("project_ids") is not None:
        query = query.filter(Project.id.in_(filters["project_ids"]))
    if filters.get("project_id"):
        query = query.filter(Project.id == filters["project_id"])
    if filters.get("search"):
        q = f"%{filters['search']}%"
        query = query.filter(Project.name.ilike(q))
    if filters.get("status"):
        try:
            ps = ProjectStatus(filters["status"])
            query = query.filter(Project.status == ps)
        except ValueError:
            pass
    if filters.get("priority"):
        try:
            pp = ProjectPriority(filters["priority"])
            query = query.filter(Project.priority == pp)
        except ValueError:
            pass

    sort_col = getattr(Project, filters.get("sort_by", "created_at"), Project.created_at)
    sort_fn = sort_col.desc() if filters.get("sort_dir", "desc") == "desc" else sort_col.asc()
    query = query.order_by(sort_fn)

    total = query.count()
    projects = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for p in projects:
        total_tasks = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        total_subtasks = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.isnot(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        completed_subtasks = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.isnot(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        meeting_count = db.query(func.count(MeetingLog.id)).filter(
            MeetingLog.project_id == p.id
        ).scalar() or 0
        attachment_count = db.query(func.count(Attachment.id)).filter(
            Attachment.model_type == "projects", Attachment.model_id == p.id
        ).scalar() or 0

        team_leads = []
        designers = []
        developers = []
        qa_members = []
        other_members = []

        for link in p.member_links:
            role_val = link.role.value if hasattr(link.role, "value") else str(link.role)
            member_info = {
                "id": link.user_id,
                "name": link.user.name if link.user else "Unknown",
                "role": role_val,
            }
            if role_val == "lead":
                team_leads.append(member_info)
            elif role_val == "developer":
                developers.append(member_info)
            elif role_val == "qa":
                qa_members.append(member_info)
            elif role_val == "designer":
                designers.append(member_info)
            else:
                other_members.append(member_info)

        planned_hours = db.query(func.sum(Task.estimated_hours)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0

        progress = round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0

        blocked_count = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.BLOCKED
        ).scalar() or 0

        overdue_count = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.due_date.isnot(None),
            Task.due_date < date.today(),
            Task.status != TaskStatus.DONE
        ).scalar() or 0

        health_score = 100
        if blocked_count > 0:
            health_score -= blocked_count * 10
        if overdue_count > 0:
            health_score -= overdue_count * 5
        if progress < 25:
            health_score -= 15
        elif progress < 50:
            health_score -= 10
        health_score = max(0, min(100, health_score))

        items.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "client": None,
            "status": p.status.value if p.status else "unknown",
            "status_label": p.status.label() if p.status else "Unknown",
            "priority": p.priority.value if p.priority else "unknown",
            "priority_label": p.priority.label() if p.priority else "Unknown",
            "progress": progress,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "end_date": p.end_date.isoformat() if p.end_date else None,
            "completion_date": None,
            "pm": p.project_manager.name if p.project_manager else None,
            "lead": p.team_lead.name if p.team_lead else None,
            "team_leads": team_leads,
            "designers": designers,
            "developers": developers,
            "qa_members": qa_members,
            "team_members": other_members,
            "planned_hours": round(float(planned_hours), 1) if planned_hours else 0,
            "actual_hours": None,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": total_tasks - completed_tasks,
            "total_subtasks": total_subtasks,
            "completed_subtasks": completed_subtasks,
            "meeting_count": meeting_count,
            "attachment_count": attachment_count,
            "health_score": health_score,
            "blocked_count": blocked_count,
            "overdue_count": overdue_count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


def get_task_reports(filters: dict, page: int, per_page: int, db: Session) -> dict:
    query = db.query(Task).filter(Task.parent_id.is_(None), Task.deleted_at.is_(None))

    if filters.get("project_ids") is not None:
        query = query.filter(Task.project_id.in_(filters["project_ids"]))
    if filters.get("project_id"):
        query = query.filter(Task.project_id == filters["project_id"])
    if filters.get("user_id"):
        query = query.filter(Task.assignees.any(User.id == filters["user_id"]))
    if filters.get("search"):
        q = f"%{filters['search']}%"
        query = query.filter(Task.title.ilike(q))
    if filters.get("status"):
        try:
            ts = TaskStatus(filters["status"])
            query = query.filter(Task.status == ts)
        except ValueError:
            pass
    if filters.get("priority"):
        try:
            tp = TaskPriority(filters["priority"])
            query = query.filter(Task.priority == tp)
        except ValueError:
            pass
    if filters.get("date_from"):
        try:
            dt = datetime.strptime(filters["date_from"], "%Y-%m-%d")
            query = query.filter(Task.created_at >= dt)
        except ValueError:
            pass
    if filters.get("date_to"):
        try:
            dt = datetime.strptime(filters["date_to"], "%Y-%m-%d")
            query = query.filter(Task.created_at <= dt)
        except ValueError:
            pass

    sort_col = getattr(Task, filters.get("sort_by", "created_at"), Task.created_at)
    sort_fn = sort_col.desc() if filters.get("sort_dir", "desc") == "desc" else sort_col.asc()
    query = query.order_by(sort_fn)

    total = query.count()
    tasks = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for t in tasks:
        assignees = [{"id": u.id, "name": u.name} for u in (t.assignees or [])]
        comment_count = db.query(func.count(Comment.id)).filter(
            Comment.task_id == t.id, Comment.deleted_at.is_(None)
        ).scalar() or 0
        attachment_count = db.query(func.count(Attachment.id)).filter(
            Attachment.model_type == "tasks", Attachment.model_id == t.id
        ).scalar() or 0
        subtask_count = db.query(func.count(Task.id)).filter(
            Task.parent_id == t.id, Task.deleted_at.is_(None)
        ).scalar() or 0

        duration_days = None
        if t.created_at:
            end = t.updated_at or t.created_at
            duration_days = (end - t.created_at).days

        started_date = None
        completed_date = None
        if t.status == TaskStatus.IN_PROGRESS and t.updated_at:
            started_date = t.updated_at.isoformat()
        elif t.status == TaskStatus.DONE:
            completed_date = t.updated_at.isoformat() if t.updated_at else None

        linked_meeting_count = db.query(func.count(MeetingLog.id)).filter(
            MeetingLog.related_task_id == t.id
        ).scalar() or 0

        recent_comments = db.query(Comment).filter(
            Comment.task_id == t.id, Comment.deleted_at.is_(None)
        ).order_by(Comment.created_at.desc()).limit(3).all()

        items.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status.value if t.status else "unknown",
            "status_label": t.status.label() if t.status else "Unknown",
            "priority": t.priority.value if t.priority else "unknown",
            "priority_label": t.priority.label() if t.priority else "Unknown",
            "project_id": t.project_id,
            "project_name": t.project.name if t.project else None,
            "assignees": assignees,
            "author": t.author.name if t.author else None,
            "estimated_hours": float(t.estimated_hours) if t.estimated_hours else None,
            "actual_hours": None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "started_date": started_date,
            "completed_date": completed_date,
            "comment_count": comment_count,
            "attachment_count": attachment_count,
            "subtask_count": subtask_count,
            "linked_meeting_count": linked_meeting_count,
            "time_tracking": None,
            "comments": [
                {"body": c.body[:150], "author": c.author.name if c.author else None,
                 "created_at": c.created_at.isoformat() if c.created_at else None}
                for c in recent_comments
            ],
            "duration_days": duration_days,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


def get_subtask_reports(filters: dict, page: int, per_page: int, db: Session) -> dict:
    query = db.query(Task).filter(Task.parent_id.isnot(None), Task.deleted_at.is_(None))

    if filters.get("project_ids") is not None:
        query = query.filter(Task.project_id.in_(filters["project_ids"]))
    if filters.get("project_id"):
        query = query.filter(Task.project_id == filters["project_id"])
    if filters.get("user_id"):
        query = query.filter(Task.assignees.any(User.id == filters["user_id"]))
    if filters.get("search"):
        q = f"%{filters['search']}%"
        query = query.filter(Task.title.ilike(q))
    if filters.get("status"):
        try:
            ts = TaskStatus(filters["status"])
            query = query.filter(Task.status == ts)
        except ValueError:
            pass
    if filters.get("priority"):
        try:
            tp = TaskPriority(filters["priority"])
            query = query.filter(Task.priority == tp)
        except ValueError:
            pass

    sort_col = getattr(Task, filters.get("sort_by", "created_at"), Task.created_at)
    sort_fn = sort_col.desc() if filters.get("sort_dir", "desc") == "desc" else sort_col.asc()
    query = query.order_by(sort_fn)

    total = query.count()
    subtasks = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for t in subtasks:
        assignees = [{"id": u.id, "name": u.name} for u in (t.assignees or [])]
        parent_task = db.query(Task).filter(Task.id == t.parent_id, Task.deleted_at.is_(None)).first()

        duration_days = None
        if t.created_at:
            end = t.updated_at or t.created_at
            duration_days = (end - t.created_at).days

        started_date = None
        completed_date = None
        completion_time_hours = None
        if t.status == TaskStatus.IN_PROGRESS and t.updated_at:
            started_date = t.updated_at.isoformat()
        elif t.status == TaskStatus.DONE:
            completed_date = t.updated_at.isoformat() if t.updated_at else None
            if t.created_at and completed_date:
                try:
                    c = datetime.fromisoformat(completed_date)
                    delta = c - t.created_at
                    completion_time_hours = round(delta.total_seconds() / 3600, 1)
                except (ValueError, TypeError):
                    pass

        attachment_count = db.query(func.count(Attachment.id)).filter(
            Attachment.model_type == "tasks", Attachment.model_id == t.id
        ).scalar() or 0

        recent_activity = db.query(ActivityLog).filter(
            ActivityLog.subject_type == "tasks",
            ActivityLog.subject_id == t.id
        ).order_by(ActivityLog.created_at.desc()).limit(5).all()

        items.append({
            "id": t.id,
            "title": t.title,
            "notes": t.description,
            "status": t.status.value if t.status else "unknown",
            "status_label": t.status.label() if t.status else "Unknown",
            "priority": t.priority.value if t.priority else "unknown",
            "priority_label": t.priority.label() if t.priority else "Unknown",
            "parent_task_id": t.parent_id,
            "parent_task_title": parent_task.title if parent_task else None,
            "project_id": t.project_id,
            "project_name": t.project.name if t.project else None,
            "assignees": assignees,
            "assigned_user": assignees[0]["name"] if assignees else None,
            "estimated_hours": float(t.estimated_hours) if t.estimated_hours else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "started_date": started_date,
            "completed_date": completed_date,
            "completion_time": completion_time_hours,
            "duration_days": duration_days,
            "attachment_count": attachment_count,
            "activity_history": [
                {"description": a.description, "event": a.event,
                 "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in recent_activity
            ],
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


def get_employee_reports(filters: dict, page: int, per_page: int, db: Session) -> dict:
    query = db.query(User).filter(User.deleted_at.is_(None), User.is_active == True)

    if filters.get("user_id"):
        query = query.filter(User.id == filters["user_id"])
    if filters.get("search"):
        q = f"%{filters['search']}%"
        query = query.filter(User.name.ilike(q))
    if filters.get("project_ids") is not None:
        query = query.filter(
            User.id.in_(
                db.query(ProjectMember.user_id).filter(
                    ProjectMember.project_id.in_(filters["project_ids"])
                )
            )
        )

    sort_col = getattr(User, filters.get("sort_by", "name"), User.name)
    sort_fn = sort_col.asc() if filters.get("sort_dir", "asc") == "asc" else sort_col.desc()
    query = query.order_by(sort_fn)

    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for u in users:
        assigned_tasks = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.parent_id.is_(None),
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.parent_id.is_(None),
            Task.status == TaskStatus.DONE,
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0
        assigned_subtasks = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.parent_id.isnot(None),
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0
        completed_subtasks = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.parent_id.isnot(None),
            Task.status == TaskStatus.DONE,
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0

        meeting_count = db.query(func.count(MeetingLog.id)).filter(
            MeetingLog.author_id == u.id
        ).scalar() or 0

        overdue = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None),
            Task.due_date.isnot(None),
            Task.due_date < date.today(),
            Task.status != TaskStatus.DONE,
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0

        role_names = [r.name for r in u.roles]

        project_count = db.query(func.count(ProjectMember.project_id)).filter(
            ProjectMember.user_id == u.id
        ).scalar() or 0

        total_hours = db.query(func.sum(Task.estimated_hours)).filter(
            Task.deleted_at.is_(None), Task.parent_id.is_(None),
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0

        completed_task_ids = db.query(Task.id).filter(
            Task.deleted_at.is_(None), Task.parent_id.is_(None),
            Task.status == TaskStatus.DONE,
            Task.assignees.any(User.id == u.id)
        ).subquery()
        avg_completion_time = db.query(
            func.avg(Task.updated_at - Task.created_at)
        ).filter(
            Task.id.in_(db.query(completed_task_ids.c.id))
        ).scalar()
        avg_completion_hours = None
        if avg_completion_time:
            avg_completion_hours = round(avg_completion_time.total_seconds() / 3600, 1)

        productivity_score = 0
        rate = round((completed_tasks / assigned_tasks) * 100, 1) if assigned_tasks > 0 else 0
        if assigned_tasks > 0:
            score = rate
            score -= overdue * 5
            score += min(meeting_count, 10)
            productivity_score = max(0, min(100, round(score)))

        recent_activity = db.query(ActivityLog).filter(
            ActivityLog.causer_id == u.id
        ).order_by(ActivityLog.created_at.desc()).limit(3).all()

        items.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "job_title": u.job_title,
            "department": u.department,
            "designation": u.designation,
            "employee_id": u.employee_id,
            "avatar_url": u.avatar_url,
            "roles": role_names,
            "role": role_names[0] if role_names else None,
            "assigned_tasks": assigned_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": assigned_tasks - completed_tasks,
            "assigned_subtasks": assigned_subtasks,
            "completed_subtasks": completed_subtasks,
            "overdue_tasks": overdue,
            "meeting_count": meeting_count,
            "project_count": project_count,
            "total_hours": round(float(total_hours), 1) if total_hours else 0,
            "average_completion_time": avg_completion_hours,
            "productivity_score": productivity_score,
            "completion_rate": rate,
            "recent_activity": [
                {"description": a.description, "event": a.event,
                 "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in recent_activity
            ],
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


# --- Export Endpoints ---

@router.get("/export")
def export_report(
    tab: str = Query("projects"),
    format: str = Query("csv"),
    search: Optional[str] = Query(None),
    project_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_dir: Optional[str] = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.export"]),
):
    project_ids = resolve_project_ids(current_user, db)
    filters = {
        "project_ids": project_ids,
        "project_id": project_id,
        "user_id": user_id,
        "status": status,
        "priority": priority,
        "date_from": date_from,
        "date_to": date_to,
        "search": search,
        "sort_by": sort_by,
        "sort_dir": sort_dir,
    }

    export_map = {
        "projects": ("projects", get_project_export_rows),
        "tasks": ("tasks", get_task_export_rows),
        "subtasks": ("subtasks", get_subtask_export_rows),
        "employees": ("employees", get_employee_export_rows),
    }

    tab_key, row_fn = export_map.get(tab, ("projects", get_project_export_rows))
    headers, rows = row_fn(filters, db)

    if format == "xlsx":
        return export_xlsx(headers, rows, tab_key)
    else:
        return export_csv(headers, rows, tab_key)


def get_project_export_rows(filters: dict, db: Session):
    data = get_project_reports(filters, 1, 999999, db)
    headers = ["Name", "Status", "Priority", "Progress (%)", "Start Date", "End Date",
               "PM", "Lead", "Team Leads", "Developers", "Planned Hours",
               "Total Tasks", "Completed", "Pending",
               "Total Subtasks", "Completed Subtasks",
               "Meetings", "Attachments", "Health Score", "Blocked", "Overdue"]
    rows = []
    for item in data["items"]:
        rows.append({
            "name": item["name"],
            "status": item["status_label"],
            "priority": item["priority_label"],
            "progress": item["progress"],
            "start_date": item["start_date"] or "",
            "end_date": item["end_date"] or "",
            "pm": item["pm"] or "",
            "lead": item["lead"] or "",
            "team_leads": ", ".join(m["name"] for m in item["team_leads"]),
            "developers": ", ".join(m["name"] for m in item["developers"]),
            "planned_hours": item["planned_hours"],
            "total_tasks": item["total_tasks"],
            "completed_tasks": item["completed_tasks"],
            "pending_tasks": item["pending_tasks"],
            "total_subtasks": item["total_subtasks"],
            "completed_subtasks": item["completed_subtasks"],
            "meeting_count": item["meeting_count"],
            "attachment_count": item["attachment_count"],
            "health_score": item["health_score"],
            "blocked_count": item["blocked_count"],
            "overdue_count": item["overdue_count"],
        })
    return headers, rows


def get_task_export_rows(filters: dict, db: Session):
    data = get_task_reports(filters, 1, 999999, db)
    headers = ["Title", "Project", "Status", "Priority", "Assignees", "Author",
               "Estimated Hours", "Due Date", "Started Date", "Completed Date",
               "Comments", "Attachments", "Subtasks", "Linked Meetings",
               "Duration (Days)", "Created"]
    rows = []
    for item in data["items"]:
        rows.append({
            "title": item["title"],
            "project": item["project_name"] or "",
            "status": item["status_label"],
            "priority": item["priority_label"],
            "assignees": ", ".join(a["name"] for a in item["assignees"]),
            "author": item["author"] or "",
            "estimated_hours": item["estimated_hours"] or "",
            "due_date": item["due_date"] or "",
            "started_date": item["started_date"] or "",
            "completed_date": item["completed_date"] or "",
            "comments": item["comment_count"],
            "attachments": item["attachment_count"],
            "subtasks": item["subtask_count"],
            "linked_meetings": item["linked_meeting_count"],
            "duration_days": item["duration_days"] or "",
            "created_at": item["created_at"] or "",
        })
    return headers, rows


def get_subtask_export_rows(filters: dict, db: Session):
    data = get_subtask_reports(filters, 1, 999999, db)
    headers = ["Title", "Parent Task", "Project", "Status", "Priority",
               "Assigned User", "Estimated Hours", "Started Date", "Completed Date",
               "Completion Time (hrs)", "Duration (Days)", "Attachments",
               "Notes", "Created"]
    rows = []
    for item in data["items"]:
        rows.append({
            "title": item["title"],
            "parent_task": item["parent_task_title"] or "",
            "project": item["project_name"] or "",
            "status": item["status_label"],
            "priority": item["priority_label"],
            "assigned_user": item["assigned_user"] or "",
            "estimated_hours": item["estimated_hours"] or "",
            "started_date": item["started_date"] or "",
            "completed_date": item["completed_date"] or "",
            "completion_time": item["completion_time"] if item["completion_time"] is not None else "",
            "duration_days": item["duration_days"] or "",
            "attachments": item["attachment_count"],
            "notes": item["notes"] or "",
            "created_at": item["created_at"] or "",
        })
    return headers, rows


def get_employee_export_rows(filters: dict, db: Session):
    data = get_employee_reports(filters, 1, 999999, db)
    headers = ["Name", "Email", "Role", "Department", "Designation",
               "Project Count", "Assigned Tasks", "Completed", "Pending",
               "Assigned Subtasks", "Completed Subtasks", "Overdue",
               "Total Hours", "Avg Completion (hrs)", "Meetings",
               "Productivity Score", "Completion Rate (%)"]
    rows = []
    for item in data["items"]:
        rows.append({
            "name": item["name"],
            "email": item["email"],
            "role": item["role"] or "",
            "department": item["department"] or "",
            "designation": item["designation"] or "",
            "project_count": item["project_count"],
            "assigned_tasks": item["assigned_tasks"],
            "completed_tasks": item["completed_tasks"],
            "pending_tasks": item["pending_tasks"],
            "assigned_subtasks": item["assigned_subtasks"],
            "completed_subtasks": item["completed_subtasks"],
            "overdue_tasks": item["overdue_tasks"],
            "total_hours": item["total_hours"],
            "avg_completion_time": item["average_completion_time"] if item["average_completion_time"] is not None else "",
            "meeting_count": item["meeting_count"],
            "productivity_score": item["productivity_score"],
            "completion_rate": item["completion_rate"],
        })
    return headers, rows


# --- Preview Endpoints ---

@router.get("/{report_type}/{item_id}/preview")
def get_report_preview(
    report_type: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.view"]),
):
    if report_type == "projects":
        item = db.query(Project).filter(Project.id == item_id, Project.deleted_at.is_(None)).first()
        if not item:
            raise HTTPException(404, "Project not found")
        return build_project_preview(item, db)
    elif report_type == "tasks":
        item = db.query(Task).filter(Task.id == item_id, Task.deleted_at.is_(None)).first()
        if not item:
            raise HTTPException(404, "Task not found")
        return build_task_preview(item, db)
    elif report_type == "subtasks":
        item = db.query(Task).filter(Task.id == item_id, Task.deleted_at.is_(None),
                                     Task.parent_id.isnot(None)).first()
        if not item:
            raise HTTPException(404, "Subtask not found")
        return build_subtask_preview(item, db)
    elif report_type == "employees":
        item = db.query(User).filter(User.id == item_id, User.deleted_at.is_(None)).first()
        if not item:
            raise HTTPException(404, "Employee not found")
        return build_employee_preview(item, db)
    else:
        raise HTTPException(400, "Invalid report type")


def build_project_preview(project, db):
    total_tasks = db.query(func.count(Task.id)).filter(
        Task.project_id == project.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
    ).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.project_id == project.id, Task.parent_id.is_(None),
        Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
    ).scalar() or 0

    team_members = []
    for link in project.member_links:
        team_members.append({
            "id": link.user_id,
            "name": link.user.name if link.user else "Unknown",
            "role": link.role.value if hasattr(link.role, "value") else str(link.role),
        })

    recent_activity = db.query(ActivityLog).filter(
        ActivityLog.subject_type == "projects",
        ActivityLog.subject_id == project.id
    ).order_by(ActivityLog.created_at.desc()).limit(10).all()

    meetings = db.query(MeetingLog).filter(
        MeetingLog.project_id == project.id
    ).order_by(MeetingLog.meeting_date.desc()).limit(10).all()

    return {
        "type": "project",
        "data": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status.value if project.status else None,
            "status_label": project.status.label() if project.status else None,
            "priority": project.priority.value if project.priority else None,
            "priority_label": project.priority.label() if project.priority else None,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "pm": project.project_manager.name if project.project_manager else None,
            "lead": project.team_lead.name if project.team_lead else None,
            "team_members": team_members,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": total_tasks - completed_tasks,
            "completion_rate": round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0,
            "health_score": max(0, 100 - (total_tasks - completed_tasks) * 5) if total_tasks > 0 else 100,
            "meetings": [
                {"id": m.id, "title": m.title, "date": m.meeting_date.isoformat() if m.meeting_date else None}
                for m in meetings
            ],
            "recent_activity": [
                {
                    "description": a.description,
                    "event": a.event,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in recent_activity
            ],
        },
    }


def build_task_preview(task, db):
    assignees = [{"id": u.id, "name": u.name} for u in (task.assignees or [])]
    comments = db.query(Comment).filter(
        Comment.task_id == task.id, Comment.deleted_at.is_(None)
    ).order_by(Comment.created_at.desc()).limit(10).all()

    activity = db.query(ActivityLog).filter(
        ActivityLog.subject_type == "tasks",
        ActivityLog.subject_id == task.id
    ).order_by(ActivityLog.created_at.desc()).limit(10).all()

    meetings = db.query(MeetingLog).filter(
        MeetingLog.related_task_id == task.id
    ).all()

    return {
        "type": "task",
        "data": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status.value if task.status else None,
            "status_label": task.status.label() if task.status else None,
            "priority": task.priority.value if task.priority else None,
            "priority_label": task.priority.label() if task.priority else None,
            "project_name": task.project.name if task.project else None,
            "assignees": assignees,
            "author": task.author.name if task.author else None,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "comments": [
                {"body": c.body[:200], "author": c.author.name if c.author else None,
                 "created_at": c.created_at.isoformat() if c.created_at else None}
                for c in comments
            ],
            "activity": [
                {"description": a.description, "event": a.event,
                 "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in activity
            ],
            "meetings": [
                {"id": m.id, "title": m.title, "date": m.meeting_date.isoformat() if m.meeting_date else None}
                for m in meetings
            ],
        },
    }


def build_subtask_preview(subtask, db):
    parent = db.query(Task).filter(Task.id == subtask.parent_id, Task.deleted_at.is_(None)).first()
    assignees = [{"id": u.id, "name": u.name} for u in (subtask.assignees or [])]

    started_date = None
    completed_date = None
    completion_time_hours = None
    if subtask.status == TaskStatus.IN_PROGRESS and subtask.updated_at:
        started_date = subtask.updated_at.isoformat()
    elif subtask.status == TaskStatus.DONE:
        completed_date = subtask.updated_at.isoformat() if subtask.updated_at else None
        if subtask.created_at and completed_date:
            try:
                c = datetime.fromisoformat(completed_date)
                delta = c - subtask.created_at
                completion_time_hours = round(delta.total_seconds() / 3600, 1)
            except (ValueError, TypeError):
                pass

    attachment_count = db.query(func.count(Attachment.id)).filter(
        Attachment.model_type == "tasks", Attachment.model_id == subtask.id
    ).scalar() or 0

    activity = db.query(ActivityLog).filter(
        ActivityLog.subject_type == "tasks",
        ActivityLog.subject_id == subtask.id
    ).order_by(ActivityLog.created_at.desc()).limit(10).all()

    return {
        "type": "subtask",
        "data": {
            "id": subtask.id,
            "title": subtask.title,
            "notes": subtask.description,
            "status": subtask.status.value if subtask.status else None,
            "status_label": subtask.status.label() if subtask.status else None,
            "priority": subtask.priority.value if subtask.priority else None,
            "priority_label": subtask.priority.label() if subtask.priority else None,
            "parent_task_title": parent.title if parent else None,
            "parent_task_id": parent.id if parent else None,
            "project_name": subtask.project.name if subtask.project else None,
            "assignees": assignees,
            "estimated_hours": float(subtask.estimated_hours) if subtask.estimated_hours else None,
            "due_date": subtask.due_date.isoformat() if subtask.due_date else None,
            "started_date": started_date,
            "completed_date": completed_date,
            "completion_time": completion_time_hours,
            "attachment_count": attachment_count,
            "created_at": subtask.created_at.isoformat() if subtask.created_at else None,
            "activity": [
                {"description": a.description, "event": a.event,
                 "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in activity
            ],
        },
    }


def build_employee_preview(employee, db):
    assigned_tasks = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.assignees.any(User.id == employee.id)
    ).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.status == TaskStatus.DONE,
        Task.assignees.any(User.id == employee.id)
    ).scalar() or 0
    assigned_subtasks = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None), Task.parent_id.isnot(None),
        Task.assignees.any(User.id == employee.id)
    ).scalar() or 0
    completed_subtasks = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None), Task.parent_id.isnot(None),
        Task.status == TaskStatus.DONE,
        Task.assignees.any(User.id == employee.id)
    ).scalar() or 0
    overdue = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None),
        Task.due_date.isnot(None),
        Task.due_date < date.today(),
        Task.status != TaskStatus.DONE,
        Task.assignees.any(User.id == employee.id)
    ).scalar() or 0
    meeting_count = db.query(func.count(MeetingLog.id)).filter(
        MeetingLog.author_id == employee.id
    ).scalar() or 0

    total_hours = db.query(func.sum(Task.estimated_hours)).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.assignees.any(User.id == employee.id)
    ).scalar() or 0

    completed_ids = db.query(Task.id).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.status == TaskStatus.DONE,
        Task.assignees.any(User.id == employee.id)
    ).subquery()
    avg_time = db.query(
        func.avg(Task.updated_at - Task.created_at)
    ).filter(
        Task.id.in_(db.query(completed_ids.c.id))
    ).scalar()
    avg_completion_hours = round(avg_time.total_seconds() / 3600, 1) if avg_time else None

    rate = round((completed_tasks / assigned_tasks) * 100, 1) if assigned_tasks > 0 else 0
    score = rate
    score -= overdue * 5
    score += min(meeting_count, 10)
    productivity_score = max(0, min(100, round(score)))

    recent_activity = db.query(ActivityLog).filter(
        ActivityLog.causer_id == employee.id
    ).order_by(ActivityLog.created_at.desc()).limit(10).all()

    meetings = db.query(MeetingLog).filter(
        MeetingLog.author_id == employee.id
    ).order_by(MeetingLog.meeting_date.desc()).limit(10).all()

    project_count = db.query(func.count(ProjectMember.project_id)).filter(
        ProjectMember.user_id == employee.id
    ).scalar() or 0

    role_names = [r.name for r in employee.roles]

    return {
        "type": "employee",
        "data": {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "job_title": employee.job_title,
            "department": employee.department,
            "designation": employee.designation,
            "employee_id": employee.employee_id,
            "avatar_url": employee.avatar_url,
            "roles": role_names,
            "role": role_names[0] if role_names else None,
            "project_count": project_count,
            "assigned_tasks": assigned_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": assigned_tasks - completed_tasks,
            "assigned_subtasks": assigned_subtasks,
            "completed_subtasks": completed_subtasks,
            "overdue_tasks": overdue,
            "meeting_count": meeting_count,
            "total_hours": round(float(total_hours), 1) if total_hours else 0,
            "average_completion_time": avg_completion_hours,
            "productivity_score": productivity_score,
            "completion_rate": rate,
            "meetings": [
                {"id": m.id, "title": m.title, "date": m.meeting_date.isoformat() if m.meeting_date else None}
                for m in meetings
            ],
            "recent_activity": [
                {"description": a.description, "event": a.event,
                 "created_at": a.created_at.isoformat() if a.created_at else None}
                for a in recent_activity
            ],
        },
    }


# --- Analytics / Chart Data ---

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.view"]),
):
    project_ids = resolve_project_ids(current_user, db)

    # ── Project Progress ──
    proj_query = db.query(
        Project.id, Project.name,
        Project.status, Project.priority,
        Project.start_date, Project.end_date,
    ).filter(Project.deleted_at.is_(None))
    proj_query = apply_project_scope(proj_query, project_ids, Project.id)
    all_projects = proj_query.all()

    project_progress = []
    for p in all_projects:
        total_t = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        done_t = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        progress = round((done_t / total_t) * 100, 1) if total_t > 0 else 0
        project_progress.append({
            "name": p.name,
            "progress": progress,
            "total_tasks": total_t,
            "completed_tasks": done_t,
            "pending_tasks": total_t - done_t,
            "status": p.status.value if p.status else "unknown",
        })

    # ── Task Completion (by status) ──
    task_query = db.query(Task.status, func.count(Task.id)).filter(
        Task.parent_id.is_(None), Task.deleted_at.is_(None)
    )
    if project_ids is not None:
        task_query = task_query.filter(Task.project_id.in_(project_ids))
    task_by_status = task_query.group_by(Task.status).all()

    status_labels = {s.value: s.label() for s in TaskStatus}
    task_completion = [
        {"status": status_labels.get(s, s), "count": c}
        for s, c in task_by_status
    ]

    # ── Task priority distribution ──
    priority_query = db.query(Task.priority, func.count(Task.id)).filter(
        Task.parent_id.is_(None), Task.deleted_at.is_(None)
    )
    if project_ids is not None:
        priority_query = priority_query.filter(Task.project_id.in_(project_ids))
    task_by_priority = priority_query.group_by(Task.priority).all()

    priority_labels = {s.value: s.label() for s in TaskPriority}
    task_priority_dist = [
        {"priority": priority_labels.get(s, s), "count": c}
        for s, c in task_by_priority
    ]

    # ── Employee Productivity ──
    emp_query = db.query(User).filter(User.deleted_at.is_(None), User.is_active == True)
    if project_ids is not None:
        emp_query = emp_query.filter(
            User.id.in_(
                db.query(ProjectMember.user_id).filter(
                    ProjectMember.project_id.in_(project_ids)
                )
            )
        )
    all_users = emp_query.limit(20).all()

    employee_productivity = []
    for u in all_users:
        assigned = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.parent_id.is_(None),
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0
        completed = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.parent_id.is_(None),
            Task.status == TaskStatus.DONE,
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0
        overdue = db.query(func.count(Task.id)).filter(
            Task.deleted_at.is_(None), Task.due_date.isnot(None),
            Task.due_date < date.today(), Task.status != TaskStatus.DONE,
            Task.assignees.any(User.id == u.id)
        ).scalar() or 0
        rate = round((completed / assigned) * 100, 1) if assigned > 0 else 0
        score = max(0, min(100, rate - overdue * 5 + min(5, 5)))
        employee_productivity.append({
            "name": u.name,
            "assigned": assigned,
            "completed": completed,
            "overdue": overdue,
            "completion_rate": rate,
            "productivity_score": score,
        })

    # ── Workload Distribution (tasks per project) ──
    workload_data = []
    for p in all_projects[:10]:
        total_t = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        done_t = db.query(func.count(Task.id)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None),
            Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).scalar() or 0
        workload_data.append({
            "name": p.name[:20],
            "Total": total_t,
            "Completed": done_t,
            "Pending": total_t - done_t,
        })

    # ── Completion Trends (by month) ──
    six_months_ago = date.today() - timedelta(days=180)
    trend_query = db.query(
        func.date_trunc("month", Task.updated_at).label("month"),
        func.count(Task.id),
    ).filter(
        Task.parent_id.is_(None), Task.deleted_at.is_(None),
        Task.status == TaskStatus.DONE,
        Task.updated_at >= six_months_ago,
    )
    if project_ids is not None:
        trend_query = trend_query.filter(Task.project_id.in_(project_ids))
    trend_data = trend_query.group_by(text("month")).order_by(text("month")).all()

    months = []
    now = date.today()
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m < 1:
            m += 12
            y -= 1
        months.append(f"{y}-{m:02d}")

    trend_map = {}
    for m, c in trend_data:
        key = m.strftime("%Y-%m") if hasattr(m, "strftime") else str(m)[:7]
        trend_map[key] = c

    completion_trends = []
    for m in months:
        completion_trends.append({
            "month": m,
            "completed": trend_map.get(m, 0),
        })

    # ── Time Tracking (estimated hours per project) ──
    time_data = []
    for p in all_projects[:10]:
        est_hours = db.query(func.sum(Task.estimated_hours)).filter(
            Task.project_id == p.id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).scalar() or 0
        time_data.append({
            "name": p.name[:20],
            "estimated_hours": round(float(est_hours), 1) if est_hours else 0,
        })

    return {
        "project_progress": project_progress[:10],
        "task_completion": task_completion,
        "task_priority_distribution": task_priority_dist,
        "employee_productivity": employee_productivity[:15],
        "workload_distribution": workload_data,
        "completion_trends": completion_trends,
        "time_tracking": time_data,
    }



@router.get("/{report_type}/{item_id}/export/pdf")
def export_preview_pdf(
    report_type: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.export"]),
):
    from app.reports.services import PDF_GENERATORS
    if report_type not in PDF_GENERATORS:
        raise HTTPException(400, "Invalid report type")

    preview = get_report_preview(report_type, item_id, db, current_user)
    gen_fn = PDF_GENERATORS[report_type]
    pdf_bytes = gen_fn(preview["data"])

    from fastapi.responses import Response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={report_type}-{item_id}-report.pdf"},
    )


@router.get("/{report_type}/{item_id}/export/docx")
def export_preview_docx(
    report_type: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.export"]),
):
    from app.reports.services import DOCX_GENERATORS
    if report_type not in DOCX_GENERATORS:
        raise HTTPException(400, "Invalid report type")

    preview = get_report_preview(report_type, item_id, db, current_user)
    gen_fn = DOCX_GENERATORS[report_type]
    docx_bytes = gen_fn(preview["data"], report_type)

    from fastapi.responses import Response
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={report_type}-{item_id}-report.docx"},
    )


# --- Export helpers ---

def export_csv(headers: list[str], rows: list[dict], tab: str):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([str(row.get(h.lower().replace(" ", "_").replace("(%)", "rate"), "")) for h in headers])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={tab}-report.csv"},
    )


def export_xlsx(headers: list[str], rows: list[dict], tab: str):
    wb = Workbook()
    ws = wb.active
    ws.title = tab.replace("_", " ").title()

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2563EB", end_color="2563EB", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center')
        cell.border = thin_border

    for row_idx, row_data in enumerate(rows, 2):
        for col_idx, header in enumerate(headers, 1):
            key = header.lower().replace(" ", "_").replace("-", "_").replace("(%)", "rate")
            value = row_data.get(key, row_data.get(header.lower(), ""))
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border

    for col_idx in range(1, len(headers) + 1):
        ws.column_dimensions[get_column_letter(col_idx)].width = 22

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={tab}-report.xlsx"},
    )
