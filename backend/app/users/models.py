from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.roles.models import Role
from app.permissions.models import Permission
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task
from app.comments.models import Comment, Mention
from app.meetings.models import MeetingLog
from app.milestones.models import Milestone
from app.announcements.models import Announcement
from app.notifications.models import Notification
from app.activity_logs.models import ActivityLog
from app.integrations.models import Integration
from app.attachments.models import Attachment
from app.modules.models import Module


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    email = Column(String(255), primary_key=True, index=True)
    token = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    def is_expired(self, expire_minutes: int = 60) -> bool:
        from datetime import timedelta
        return datetime.utcnow() > self.created_at.replace(tzinfo=None) + timedelta(minutes=expire_minutes)


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

user_permissions = Table(
    "user_permissions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    department = Column(String(255), nullable=True, index=True)
    designation = Column(String(255), nullable=True)
    employee_id = Column(String(50), nullable=True, index=True)
    reporting_manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    inherit_role_permissions = Column(Boolean, default=True, nullable=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="selectin")
    direct_permissions = relationship("Permission", secondary=user_permissions, back_populates="users", lazy="selectin")

    reporting_manager = relationship("User", remote_side="User.id", back_populates="direct_reports", foreign_keys=[reporting_manager_id])
    direct_reports = relationship("User", back_populates="reporting_manager", foreign_keys=[reporting_manager_id])

    projects = relationship("ProjectMember", back_populates="user", lazy="selectin")
    assigned_tasks = relationship("Task", secondary="task_assignees", back_populates="assignees", lazy="selectin")
    authored_tasks = relationship("Task", back_populates="author", foreign_keys="Task.author_id", lazy="selectin")
    comments = relationship("Comment", back_populates="author", foreign_keys="Comment.author_id", lazy="selectin")
    authored_projects = relationship("Project", back_populates="author", foreign_keys="Project.author_id", lazy="selectin")
    meeting_logs = relationship("MeetingLog", back_populates="author", foreign_keys="MeetingLog.author_id", lazy="selectin")
    milestones = relationship("Milestone", back_populates="author", foreign_keys="Milestone.author_id", lazy="selectin")
    announcements = relationship("Announcement", back_populates="author", foreign_keys="Announcement.author_id", lazy="selectin")

    notifications = relationship("Notification", back_populates="user", lazy="selectin")
    mentions = relationship("Mention", back_populates="user", lazy="selectin")

    @property
    def is_super_admin(self) -> bool:
        return any(role.name == "super-admin" for role in self.roles)

    @property
    def role(self):
        if self.roles:
            return self.roles[0]
        return None

    def has_permission(self, permission_name: str) -> bool:
        if self.is_super_admin:
            return True
        if self.inherit_role_permissions:
            for role in self.roles:
                for perm in role.permissions:
                    if perm.name == permission_name:
                        return True
        else:
            for perm in self.direct_permissions:
                if perm.name == permission_name:
                    return True
        return False

    def get_all_permissions(self) -> list[str]:
        if self.is_super_admin:
            return ["*"]
        perms = set()
        if self.inherit_role_permissions:
            for role in self.roles:
                for perm in role.permissions:
                    perms.add(perm.name)
        else:
            for perm in self.direct_permissions:
                perms.add(perm.name)
        return list(perms)
