from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Date,
    ForeignKey, Enum as SAEnum, Numeric, Table, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.enums import TaskStatus, TaskPriority


task_assignees = Table(
    "task_assignees",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SAEnum(TaskStatus), default=TaskStatus.BACKLOG, nullable=False, index=True)
    priority = Column(SAEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False, index=True)
    tags = Column(JSON, nullable=True)
    blocked_reason = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True, index=True)
    employee_eta = Column(Date, nullable=True)
    estimated_hours = Column(Numeric(8, 2), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    parent_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True)
    requires_approval = Column(Boolean, default=False, nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    rejection_reason = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    author = relationship("User", back_populates="authored_tasks", foreign_keys=[author_id], lazy="selectin")
    assignees = relationship("User", secondary=task_assignees, back_populates="assigned_tasks", lazy="selectin")
    approver = relationship("User", foreign_keys=[approver_id], lazy="selectin")
    project = relationship("Project", back_populates="tasks", foreign_keys=[project_id], lazy="selectin")
    module = relationship("Module", back_populates="tasks", lazy="selectin")

    parent = relationship("Task", back_populates="subtasks", remote_side=[id], lazy="selectin")
    subtasks = relationship("Task", back_populates="parent", remote_side=[parent_id], lazy="selectin",
                            cascade="all, delete-orphan")

    comments = relationship("Comment", back_populates="task", lazy="selectin", cascade="all, delete-orphan")

    dependencies = relationship(
        "Task", secondary="task_dependencies",
        primaryjoin="Task.id == TaskDependency.task_id",
        secondaryjoin="Task.id == TaskDependency.dependency_id",
        back_populates="dependents", lazy="selectin",
    )
    dependents = relationship(
        "Task", secondary="task_dependencies",
        primaryjoin="Task.id == TaskDependency.dependency_id",
        secondaryjoin="Task.id == TaskDependency.task_id",
        back_populates="dependencies", lazy="selectin",
    )

    @property
    def approval_status(self) -> Optional[str]:
        if not self.requires_approval:
            return None
        status_map = {
            TaskStatus.IN_REVIEW: "pending_review",
            TaskStatus.APPROVED: "approved",
        }
        return status_map.get(self.status, "not_submitted")

    @property
    def subtask_count(self) -> int:
        return len([t for t in self.subtasks if not t.deleted_at]) if self.subtasks else 0

    @property
    def completed_subtask_count(self) -> int:
        return len([t for t in (self.subtasks or []) if t.status == TaskStatus.DONE])

    @property
    def subtask_completion_rate(self) -> int:
        total = self.subtask_count
        if total == 0:
            return 0
        return int(round((self.completed_subtask_count / total) * 100))


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    dependency_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
