import csv
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
from datetime import datetime, date
from io import BytesIO
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
from app.core.enums import TaskStatus, UserRole, ProjectStatus

router = APIRouter()


def resolve_project_ids(current_user: User, db: Session) -> Optional[list[int]]:
    if current_user.is_super_admin:
        return None
    if current_user.role and current_user.role.name == UserRole.PROJECT_MANAGER.value:
        ids = db.query(Project.id).filter(Project.pm_id == current_user.id).all()
        return [r[0] for r in ids]
    if current_user.role and current_user.role.name == UserRole.TEAM_LEAD.value:
        ids = db.query(Project.id).filter(Project.lead_id == current_user.id).all()
        return [r[0] for r in ids]
    ids = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).all()
    return [r[0] for r in ids]


def apply_project_filter(query, project_ids: Optional[list[int]], column="project_id"):
    if project_ids is not None:
        return query.filter(getattr(query.entity, column).in_(project_ids))
    return query


@router.get("")
def get_reports(
    tab: str = Query("task_completion"),
    project_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.view"]),
):
    filters = {}
    project_ids = resolve_project_ids(current_user, db)

    if project_ids is not None:
        filters["project_ids"] = project_ids
    if project_id:
        if project_ids is not None:
            if project_id not in project_ids:
                raise HTTPException(403, "Access denied to this project")
        filters["project_id"] = project_id
    if user_id:
        filters["user_id"] = user_id
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to

    if current_user.role and current_user.role.name == UserRole.EMPLOYEE.value:
        filters["user_id"] = current_user.id

    data = {}
    if tab == "task_completion":
        data = get_task_completion(filters, db)
    elif tab == "workload_distribution":
        data = get_workload_distribution(filters, db)
    elif tab == "weekly_summary":
        data = get_weekly_summary(filters, db)
    elif tab == "meeting_logs":
        data = get_meeting_logs(filters, db)
    else:
        data = get_task_completion(filters, db)

    return {"data": data, "tab": tab, "filters": filters}


@router.get("/export")
def export_report(
    tab: str = Query("task_completion"),
    format: str = Query("csv"),
    project_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.export"]),
):
    filters = {}
    project_ids = resolve_project_ids(current_user, db)

    if project_ids is not None:
        filters["project_ids"] = project_ids
    if project_id:
        filters["project_id"] = project_id
    if user_id:
        filters["user_id"] = user_id
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to

    if tab == "task_completion":
        rows = get_task_completion(filters, db)
        headers = ["Project", "Total Tasks", "Completed", "Pending", "Completion Rate (%)"]
    elif tab == "workload_distribution":
        rows = get_workload_distribution(filters, db)
        headers = ["User"]
        for s in TaskStatus:
            headers.append(s.label())
        headers.append("Total")
    elif tab == "weekly_summary":
        rows = get_weekly_summary(filters, db)
        headers = ["Date From", "Date To", "Tasks Created", "Tasks Completed", "Comments Added"]
    elif tab == "meeting_logs":
        rows = get_meeting_logs(filters, db)
        headers = ["Project", "Date", "Title", "Attendees", "Summary", "Decisions Taken", "Blockers", "Action Items", "Notes"]
    else:
        rows = get_task_completion(filters, db)
        headers = ["Project", "Total Tasks", "Completed", "Pending", "Completion Rate (%)"]

    if format == "xlsx":
        return export_xlsx(headers, rows, tab)
    else:
        return export_csv(headers, rows, tab)


@router.get("/project/{project_id}/preview")
def project_preview(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["reports.view"]),
):
    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at.is_(None)).first()
    if not project:
        raise HTTPException(404, "Project not found")

    total_tasks = db.query(func.count(Task.id)).filter(
        Task.project_id == project_id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
    ).scalar() or 0

    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.project_id == project_id, Task.parent_id.is_(None),
        Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
    ).scalar() or 0

    completion_rate = round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0

    status_counts = dict(
        db.query(Task.status, func.count(Task.id)).filter(
            Task.project_id == project_id, Task.parent_id.is_(None), Task.deleted_at.is_(None)
        ).group_by(Task.status).all()
    )

    tasks_summary = {}
    for s in TaskStatus:
        tasks_summary[s.value] = status_counts.get(s, 0)

    task_counts_by_user = dict(
        db.query(task_assignees.c.user_id, func.count(task_assignees.c.task_id))
        .join(Task, Task.id == task_assignees.c.task_id)
        .filter(Task.project_id == project_id, Task.parent_id.is_(None), Task.deleted_at.is_(None))
        .group_by(task_assignees.c.user_id).all()
    )

    team_summary = []
    for link in project.member_links:
        team_summary.append({
            "name": link.user.name if link.user else "Unknown",
            "role": link.role.value if hasattr(link.role, 'value') else link.role,
            "assigned_tasks_count": task_counts_by_user.get(link.user_id, 0) if link.user_id else 0,
        })

    upcoming = db.query(Task).filter(
        Task.project_id == project_id, Task.parent_id.is_(None),
        Task.deleted_at.is_(None), Task.due_date.isnot(None),
        Task.status != TaskStatus.DONE
    ).order_by(Task.due_date.asc()).limit(5).all()

    deadlines = [{
        "id": t.id, "title": t.title,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "status": t.status.value if t.status else None,
        "priority": t.priority.value if t.priority else None,
    } for t in upcoming]

    blocked_count = db.query(func.count(Task.id)).filter(
        Task.project_id == project_id, Task.parent_id.is_(None),
        Task.deleted_at.is_(None), Task.status == TaskStatus.BLOCKED
    ).scalar() or 0

    health_score = 100
    if blocked_count > 0:
        health_score -= blocked_count * 10
    if completion_rate < 50:
        health_score -= 20
    elif completion_rate < 75:
        health_score -= 10
    health_score = max(0, min(100, health_score))

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status.label() if project.status else None,
            "priority": project.priority.label() if project.priority else None,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "pm": project.project_manager.name if project.project_manager else None,
            "lead": project.team_lead.name if project.team_lead else None,
        },
        "progress_summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completion_rate,
        },
        "tasks_summary": tasks_summary,
        "team_summary": team_summary,
        "deadlines": deadlines,
        "health_score": health_score,
    }


def get_task_completion(filters: dict, db: Session) -> list[dict]:
    query = db.query(
        Project.id,
        Project.name,
        func.count(Task.id).filter(Task.parent_id.is_(None), Task.deleted_at.is_(None)).label("total_tasks"),
        func.count(Task.id).filter(
            Task.parent_id.is_(None), Task.deleted_at.is_(None), Task.status == TaskStatus.DONE
        ).label("completed_tasks"),
        func.count(Task.id).filter(
            Task.parent_id.is_(None), Task.deleted_at.is_(None), Task.status != TaskStatus.DONE
        ).label("pending_tasks"),
    ).outerjoin(Task, Task.project_id == Project.id).filter(Project.deleted_at.is_(None))

    if "project_ids" in filters and filters["project_ids"] is not None:
        query = query.filter(Project.id.in_(filters["project_ids"]))
    if "project_id" in filters and filters["project_id"] is not None:
        if "project_ids" in filters and filters["project_ids"] is not None:
            if filters["project_id"] in filters["project_ids"]:
                query = query.filter(Project.id == filters["project_id"])
        else:
            query = query.filter(Project.id == filters["project_id"])

    results = query.group_by(Project.id, Project.name).order_by(Project.name).all()

    return [{
        "project_id": r.id,
        "project_name": r.name,
        "total_tasks": r.total_tasks or 0,
        "completed_tasks": r.completed_tasks or 0,
        "pending_tasks": r.pending_tasks or 0,
        "completion_rate": round(((r.completed_tasks or 0) / (r.total_tasks or 1)) * 100, 1) if (r.total_tasks or 0) > 0 else 0,
    } for r in results]


def get_workload_distribution(filters: dict, db: Session) -> list[dict]:
    query = db.query(User).filter(User.deleted_at.is_(None), User.is_active == True)

    if "user_id" in filters and filters["user_id"] is not None:
        query = query.filter(User.id == filters["user_id"])

    if "project_ids" in filters and filters["project_ids"] is not None:
        query = query.filter(
            User.id.in_(
                db.query(ProjectMember.user_id).filter(
                    ProjectMember.project_id.in_(filters["project_ids"])
                )
            )
        )

    users = query.all()
    results = []

    for user in users:
        row = {"user_id": user.id, "user_name": user.name}
        total = 0
        for status in TaskStatus:
            count = db.query(func.count(Task.id)).filter(
                Task.deleted_at.is_(None), Task.parent_id.is_(None),
                Task.status == status,
                Task.assignees.any(User.id == user.id)
            ).scalar() or 0
            if "project_ids" in filters and filters["project_ids"] is not None:
                count = db.query(func.count(Task.id)).filter(
                    Task.deleted_at.is_(None), Task.parent_id.is_(None),
                    Task.status == status,
                    Task.project_id.in_(filters["project_ids"]),
                    Task.assignees.any(User.id == user.id)
                ).scalar() or 0
            row[f"{status.value}_tasks"] = count
            total += count
        row["total_tasks"] = total
        results.append(row)

    return sorted(results, key=lambda x: x["total_tasks"], reverse=True)


def get_weekly_summary(filters: dict, db: Session) -> list[dict]:
    today = date.today()
    date_from = filters.get("date_from", str(today.replace(day=today.day - today.weekday())))
    date_to = filters.get("date_to", str(today.replace(day=today.day - today.weekday() + 6)))

    tasks_created = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        func.date(Task.created_at) >= date_from,
        func.date(Task.created_at) <= date_to,
    )
    tasks_completed = db.query(func.count(Task.id)).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.status == TaskStatus.DONE,
        func.date(Task.updated_at) >= date_from,
        func.date(Task.updated_at) <= date_to,
    )
    comments_query = db.query(func.count(Comment.id)).filter(
        Comment.deleted_at.is_(None),
        func.date(Comment.created_at) >= date_from,
        func.date(Comment.created_at) <= date_to,
    )

    if "project_ids" in filters and filters["project_ids"] is not None:
        tasks_created = tasks_created.filter(Task.project_id.in_(filters["project_ids"]))
        tasks_completed = tasks_completed.filter(Task.project_id.in_(filters["project_ids"]))
        comments_query = comments_query.filter(Comment.project_id.in_(filters["project_ids"]))

    return [{
        "date_from": date_from,
        "date_to": date_to,
        "tasks_created": tasks_created.scalar() or 0,
        "tasks_completed": tasks_completed.scalar() or 0,
        "comments_added": comments_query.scalar() or 0,
    }]


def get_meeting_logs(filters: dict, db: Session) -> list[dict]:
    query = db.query(MeetingLog).join(Project, MeetingLog.project_id == Project.id)

    if "project_id" in filters and filters["project_id"] is not None:
        query = query.filter(MeetingLog.project_id == filters["project_id"])
    elif "project_ids" in filters and filters["project_ids"] is not None:
        query = query.filter(MeetingLog.project_id.in_(filters["project_ids"]))

    if "date_from" in filters and filters["date_from"] is not None:
        query = query.filter(MeetingLog.meeting_date >= filters["date_from"])
    if "date_to" in filters and filters["date_to"] is not None:
        query = query.filter(MeetingLog.meeting_date <= filters["date_to"])

    logs = query.order_by(MeetingLog.meeting_date.desc()).all()

    return [{
        "meeting_id": log.id,
        "project_name": log.project.name if log.project else "N/A",
        "date": log.meeting_date.isoformat() if log.meeting_date else None,
        "title": log.title,
        "attendees": ", ".join(log.attendees) if isinstance(log.attendees, list) else (log.attendees or ""),
        "summary": log.summary,
        "decisions_taken": log.decisions_taken or "",
        "blockers": log.blockers or "",
        "action_items": log.action_items or "",
        "notes": log.notes or "",
        "author_name": log.author.name if log.author else None,
    } for log in logs]


def export_csv(headers: list[str], rows: list[dict], tab: str):
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([str(row.get(h.lower().replace(" ", "_"), row.get(h.lower().replace(" ", "_").replace("-", "_"), ""))) for h in headers])
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
        ws.column_dimensions[get_column_letter(col_idx)].width = 20

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={tab}-report.xlsx"},
    )
