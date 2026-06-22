from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException, BusinessException
from app.tasks.models import Task, TaskDependency, task_assignees
from app.projects.models import Project, ProjectMember
from app.users.models import User
from app.core.enums import TaskStatus, TaskPriority, UserRole

router = APIRouter()


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    tags: Optional[list[str]] = None
    due_date: Optional[str] = None
    employee_eta: Optional[str] = None
    estimated_hours: Optional[float] = None
    project_id: int
    module_id: Optional[int] = None
    assignee_ids: Optional[list[int]] = None
    dependency_ids: Optional[list[int]] = None
    parent_id: Optional[int] = None
    requires_approval: bool = False
    approver_id: Optional[int] = None
    subtasks: Optional[list[dict]] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[list[str]] = None
    due_date: Optional[str] = None
    employee_eta: Optional[str] = None
    estimated_hours: Optional[float] = None
    status: Optional[str] = None
    module_id: Optional[int] = None
    assignee_ids: Optional[list[int]] = None
    dependency_ids: Optional[list[int]] = None
    requires_approval: Optional[bool] = None
    approver_id: Optional[int] = None


@router.get("")
def list_tasks(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    project_id: Optional[int] = Query(None),
    assignee_id: Optional[int] = Query(None),
    tag: Optional[str] = Query(None),
    tab: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_direction: str = Query("desc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task).filter(Task.deleted_at.is_(None), Task.parent_id.is_(None))

    if tab == "my-tasks":
        query = query.filter(Task.assignees.any(User.id == current_user.id))
    elif not current_user.is_super_admin:
        if current_user.role and current_user.role.name == UserRole.PROJECT_MANAGER.value:
            query = query.filter(
                Task.project.has(Project.pm_id == current_user.id) |
                Task.assignees.any(User.id == current_user.id)
            )
        else:
            project_ids = db.query(ProjectMember.project_id).filter(
                ProjectMember.user_id == current_user.id
            ).subquery()
            query = query.filter(Task.project_id.in_(project_ids))

    if search:
        query = query.filter(Task.title.ilike(f"%{search}%") | Task.description.ilike(f"%{search}%"))
    if status:
        if status == "pending":
            query = query.filter(Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]))
        elif status == "blocked":
            query = query.filter(Task.status == TaskStatus.BLOCKED)
        elif status == "needs_review":
            query = query.filter(Task.requires_approval == True, Task.status == TaskStatus.IN_REVIEW)
        else:
            query = query.filter(Task.status == TaskStatus(status))
    if priority:
        query = query.filter(Task.priority == TaskPriority(priority))
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if assignee_id:
        query = query.filter(Task.assignees.any(User.id == assignee_id))
    if tag:
        query = query.filter(Task.tags.contains(tag) if hasattr(Task.tags, 'contains') else True)
    if tab == "completed":
        query = query.filter(Task.status == TaskStatus.DONE)

    sort_col = getattr(Task, sort_by, Task.created_at)
    query = query.order_by(sort_col.desc() if sort_direction == "desc" else sort_col.asc())

    total = query.count()
    tasks = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [format_task(t) for t in tasks],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
        "stats": get_task_stats(current_user.id, db),
    }


@router.get("/parents")
def get_parent_tasks(project_id: Optional[int] = Query(None),
                     db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    query = db.query(Task).filter(Task.parent_id.is_(None), Task.deleted_at.is_(None))
    if project_id:
        query = query.filter(Task.project_id == project_id)
    tasks = query.order_by(Task.title).all()
    return {"tasks": [{"id": t.id, "title": t.title, "project_id": t.project_id} for t in tasks]}


@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    return format_task_detail(task)


@router.post("", status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db),
                current_user: User = require_permissions(["tasks.create"])):
    task = Task(
        title=data.title,
        description=data.description,
        priority=TaskPriority(data.priority) if data.priority else TaskPriority.MEDIUM,
        tags=data.tags,
        due_date=datetime.fromisoformat(data.due_date).date() if data.due_date else None,
        employee_eta=datetime.fromisoformat(data.employee_eta).date() if data.employee_eta else None,
        estimated_hours=data.estimated_hours,
        project_id=data.project_id,
        module_id=data.module_id,
        author_id=current_user.id,
        parent_id=data.parent_id,
        requires_approval=data.requires_approval,
        approver_id=data.approver_id,
    )
    db.add(task)
    db.flush()

    assignee_ids = data.assignee_ids or []
    if assignee_ids:
        users = db.query(User).filter(User.id.in_(assignee_ids)).all()
        task.assignees = users

    if data.dependency_ids:
        for dep_id in data.dependency_ids:
            if dep_id != task.id:
                td = TaskDependency(task_id=task.id, dependency_id=dep_id)
                db.add(td)

    if data.subtasks:
        for sub in data.subtasks:
            subtask = Task(
                title=sub["title"],
                description=sub.get("description"),
                priority=TaskPriority(sub.get("priority", "medium")),
                project_id=data.project_id,
                parent_id=task.id,
                author_id=current_user.id,
            )
            db.add(subtask)

    db.commit()
    db.refresh(task)

    log_activity(db, "tasks", task.id, "Task created", causer_id=current_user.id,
                 properties={"title": task.title, "project_id": task.project_id})
    return format_task(task)


@router.put("/{task_id}")
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db),
                current_user: User = require_permissions(["tasks.update"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    if current_user.role and current_user.role.name == UserRole.EMPLOYEE.value:
        data.due_date = None

    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.priority is not None:
        task.priority = TaskPriority(data.priority)
    if data.tags is not None:
        task.tags = data.tags
    if data.due_date is not None:
        task.due_date = datetime.fromisoformat(data.due_date).date() if data.due_date else None
    if data.employee_eta is not None:
        task.employee_eta = datetime.fromisoformat(data.employee_eta).date() if data.employee_eta else None
    if data.estimated_hours is not None:
        task.estimated_hours = data.estimated_hours
    if data.requires_approval is not None:
        task.requires_approval = data.requires_approval
    if data.approver_id is not None:
        task.approver_id = data.approver_id

    if data.assignee_ids is not None:
        users = db.query(User).filter(User.id.in_(data.assignee_ids)).all()
        task.assignees = users

    if data.dependency_ids is not None:
        task.dependencies = db.query(Task).filter(Task.id.in_(data.dependency_ids)).all()

    if data.status is not None:
        old_status = task.status
        new_status = TaskStatus(data.status)
        task.status = new_status
        if new_status == TaskStatus.APPROVED:
            task.approved_at = datetime.utcnow()
            task.rejection_reason = None

    db.commit()
    db.refresh(task)

    log_activity(db, "tasks", task.id, "Task updated", causer_id=current_user.id)
    return format_task(task)


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db),
                current_user: User = require_permissions(["tasks.delete"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    task.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db, "tasks", task.id, "Task deleted", causer_id=current_user.id)
    return {"message": "Task deleted successfully"}


@router.patch("/{task_id}/status")
def update_task_status(task_id: int, status: str, db: Session = Depends(get_db),
                       current_user: User = require_permissions(["tasks.change-status"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    old_status = task.status
    task.status = TaskStatus(status)
    if task.status == TaskStatus.APPROVED:
        task.approved_at = datetime.utcnow()
        task.rejection_reason = None
    db.commit()

    log_activity(db, "tasks", task.id, "Task status changed", causer_id=current_user.id,
                 properties={"old": old_status.value if old_status else None, "new": status})
    return {"message": "Status updated"}


@router.post("/{task_id}/assign")
def assign_task(task_id: int, assignee_id: int, db: Session = Depends(get_db),
                current_user: User = require_permissions(["tasks.assign"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    user = db.query(User).filter(User.id == assignee_id).first()
    if not user:
        raise NotFoundException("User", assignee_id)

    if user not in task.assignees:
        task.assignees.append(user)
        db.commit()

    log_activity(db, "tasks", task.id, "Task assigned", causer_id=current_user.id,
                 properties={"assignee": user.name})
    return {"message": "Task assigned successfully"}


@router.post("/{task_id}/dependencies")
def add_dependency(task_id: int, dependency_id: int, db: Session = Depends(get_db),
                   current_user: User = require_permissions(["tasks.update"])):
    if task_id == dependency_id:
        raise BusinessException("Task cannot depend on itself")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    existing = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id, TaskDependency.dependency_id == dependency_id
    ).first()
    if existing:
        raise HTTPException(422, "Dependency already exists")

    td = TaskDependency(task_id=task_id, dependency_id=dependency_id)
    db.add(td)
    db.commit()

    log_activity(db, "tasks", task.id, "Dependency added", causer_id=current_user.id,
                 properties={"dependency_id": dependency_id})
    return {"message": "Dependency added"}


@router.delete("/{task_id}/dependencies/{dependency_id}")
def remove_dependency(task_id: int, dependency_id: int, db: Session = Depends(get_db),
                      current_user: User = require_permissions(["tasks.update"])):
    td = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id, TaskDependency.dependency_id == dependency_id
    ).first()
    if td:
        db.delete(td)
        db.commit()

    log_activity(db, "tasks", task_id, "Dependency removed", causer_id=current_user.id)
    return {"message": "Dependency removed"}


@router.post("/{task_id}/submit-for-review")
def submit_for_review(task_id: int, db: Session = Depends(get_db),
                      current_user: User = require_permissions(["tasks.submit-approval"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)
    if not task.requires_approval:
        raise BusinessException("This task does not require approval")

    task.status = TaskStatus.IN_REVIEW
    db.commit()

    log_activity(db, "tasks", task.id, "Task submitted for review", causer_id=current_user.id)
    return {"message": "Task submitted for review"}


@router.post("/{task_id}/approve")
def approve_task(task_id: int, db: Session = Depends(get_db),
                 current_user: User = require_permissions(["tasks.approve"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    task.status = TaskStatus.APPROVED
    task.approved_at = datetime.utcnow()
    task.rejection_reason = None
    db.commit()

    log_activity(db, "tasks", task.id, "Task approved", causer_id=current_user.id)
    return {"message": "Task approved"}


@router.post("/{task_id}/reject")
def reject_task(task_id: int, reason: str, db: Session = Depends(get_db),
                current_user: User = require_permissions(["tasks.approve"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    task.status = TaskStatus.IN_PROGRESS
    task.rejection_reason = reason
    db.commit()

    log_activity(db, "tasks", task.id, "Task rejected", causer_id=current_user.id,
                 properties={"reason": reason})
    return {"message": "Task rejected"}


@router.post("/{task_id}/block")
def block_task(task_id: int, reason: str, db: Session = Depends(get_db),
               current_user: User = require_permissions(["tasks.update"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    task.status = TaskStatus.BLOCKED
    task.blocked_reason = reason
    db.commit()

    log_activity(db, "tasks", task.id, "Task blocked", causer_id=current_user.id,
                 properties={"reason": reason})
    return {"message": "Task blocked"}


@router.post("/{task_id}/unblock")
def unblock_task(task_id: int, db: Session = Depends(get_db),
                 current_user: User = require_permissions(["tasks.update"])):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException("Task", task_id)

    task.status = TaskStatus.TODO
    task.blocked_reason = None
    db.commit()

    log_activity(db, "tasks", task.id, "Task unblocked", causer_id=current_user.id)
    return {"message": "Task unblocked"}


@router.post("/{task_id}/subtasks")
def create_subtask(task_id: int, data: TaskCreate, db: Session = Depends(get_db),
                   current_user: User = require_permissions(["tasks.update"])):
    parent = db.query(Task).filter(Task.id == task_id).first()
    if not parent:
        raise NotFoundException("Task", task_id)

    subtask = Task(
        title=data.title,
        description=data.description,
        priority=TaskPriority(data.priority) if data.priority else TaskPriority.MEDIUM,
        due_date=datetime.fromisoformat(data.due_date).date() if data.due_date else None,
        estimated_hours=data.estimated_hours,
        project_id=parent.project_id,
        parent_id=parent.id,
        author_id=current_user.id,
    )
    db.add(subtask)
    if data.assignee_ids:
        users = db.query(User).filter(User.id.in_(data.assignee_ids)).all()
        subtask.assignees = users
    db.commit()
    db.refresh(subtask)

    log_activity(db, "tasks", parent.id, "Subtask created", causer_id=current_user.id,
                 properties={"subtask_title": subtask.title, "subtask_id": subtask.id})
    return format_task(subtask)


@router.delete("/{task_id}/subtasks/{subtask_id}")
def delete_subtask(task_id: int, subtask_id: int, db: Session = Depends(get_db),
                   current_user: User = require_permissions(["tasks.update"])):
    subtask = db.query(Task).filter(Task.id == subtask_id, Task.parent_id == task_id).first()
    if not subtask:
        raise NotFoundException("Subtask", subtask_id)

    subtask.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Subtask deleted"}


def get_task_stats(user_id: int, db: Session) -> dict:
    project_ids = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == user_id).subquery()

    total = db.query(Task).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.project_id.in_(project_ids)
    ).count()

    my_tasks = db.query(Task).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.assignees.any(User.id == user_id)
    ).count()

    my_subtasks = db.query(Task).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_not(None),
        Task.assignees.any(User.id == user_id)
    ).count()

    blocked = db.query(Task).filter(
        Task.deleted_at.is_(None), Task.parent_id.is_(None),
        Task.project_id.in_(project_ids),
        Task.status == TaskStatus.BLOCKED
    ).count()

    return {
        "total": total,
        "my_tasks": my_tasks,
        "my_subtasks": my_subtasks,
        "blocked": blocked,
    }


def format_task(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "status": t.status.value if t.status else "backlog",
        "status_label": t.status.label() if t.status else "Backlog",
        "priority": t.priority.value if t.priority else "medium",
        "priority_label": t.priority.label() if t.priority else "Medium",
        "tags": t.tags,
        "blocked_reason": t.blocked_reason,
        "due_date": t.due_date,
        "employee_eta": t.employee_eta,
        "estimated_hours": float(t.estimated_hours) if t.estimated_hours else None,
        "project_id": t.project_id,
        "project_name": t.project.name if t.project else None,
        "module_id": t.module_id,
        "module_name": t.module.name if t.module else None,
        "author": {"id": t.author.id, "name": t.author.name} if t.author else None,
        "assignees": [{"id": a.id, "name": a.name} for a in (t.assignees or [])],
        "parent_id": t.parent_id,
        "requires_approval": t.requires_approval,
        "approver_id": t.approver_id,
        "rejection_reason": t.rejection_reason,
        "approved_at": t.approved_at,
        "comment_count": len(t.comments) if t.comments else 0,
        "subtask_count": len([s for s in (t.subtasks or []) if not s.deleted_at]),
        "created_at": t.created_at,
        "updated_at": t.updated_at,
        "approval_status": t.approval_status,
        "subtask_completion_rate": t.subtask_completion_rate,
    }


def format_task_detail(t: Task) -> dict:
    data = format_task(t)
    data["dependencies"] = [
        {"id": d.id, "title": d.title, "status": d.status.value if d.status else "backlog",
         "assignees": [{"id": a.id, "name": a.name} for a in (d.assignees or [])]}
        for d in (t.dependencies or [])
    ]
    data["dependents"] = [
        {"id": d.id, "title": d.title, "status": d.status.value if d.status else "backlog"}
        for d in (t.dependents or [])
    ]
    data["subtasks"] = [
        format_task(s) for s in (t.subtasks or []) if not s.deleted_at
    ]
    data["comments"] = [
        {
            "id": c.id, "body": c.body,
            "author": {"id": c.author.id, "name": c.author.name} if c.author else None,
            "created_at": c.created_at,
            "parent_id": c.parent_id,
            "replies": [
                {"id": r.id, "body": r.body,
                 "author": {"id": r.author.id, "name": r.author.name} if r.author else None,
                 "created_at": r.created_at}
                for r in (c.replies or [])
            ],
        }
        for c in (t.comments or []) if not c.parent_id and not c.deleted_at
    ]
    return data
