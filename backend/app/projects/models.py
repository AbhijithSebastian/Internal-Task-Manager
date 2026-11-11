from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.enums import ProjectStatus, ProjectPriority, ProjectMemberRole


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default=ProjectStatus.ACTIVE.value, nullable=False, index=True)
    priority = Column(String(50), default=ProjectPriority.MEDIUM.value, nullable=False, index=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    pm_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    figma_url = Column(String(2048), nullable=True)
    figma_token = Column(String(512), nullable=True)
    github_url = Column(String(2048), nullable=True)
    docs_url = Column(String(2048), nullable=True)
    meeting_url = Column(String(2048), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    author = relationship("User", back_populates="authored_projects", foreign_keys=[author_id], lazy="selectin")
    project_manager = relationship("User", foreign_keys=[pm_id], lazy="selectin")
    team_lead = relationship("User", foreign_keys=[lead_id], lazy="selectin")

    member_links = relationship("ProjectMember", back_populates="project", lazy="selectin", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", lazy="selectin", cascade="all, delete-orphan",
                         foreign_keys="Task.project_id")
    meeting_logs = relationship("MeetingLog", back_populates="project", lazy="selectin", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="project", lazy="selectin", cascade="all, delete-orphan")
    modules = relationship("Module", back_populates="project", lazy="selectin", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="project", lazy="selectin", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="project", lazy="selectin", cascade="all, delete-orphan")
    endpoints = relationship("Endpoint", back_populates="project", lazy="selectin", cascade="all, delete-orphan")

    @property
    def members(self):
        return [link.user for link in self.member_links]

    @property
    def member_count(self) -> int:
        return len(self.member_links)

    def get_links(self) -> dict:
        return {
            "figma": self.figma_url,
            "github": self.github_url,
            "docs": self.docs_url,
            "meeting": self.meeting_url,
        }


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default=ProjectMemberRole.MEMBER.value, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="member_links")
    user = relationship("User", back_populates="projects")
