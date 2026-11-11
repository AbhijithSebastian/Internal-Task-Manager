from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(String(50), nullable=False, index=True)
    category = Column(String(100), nullable=True, index=True)
    url = Column(String(2048), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True, default=0)
    mime_type = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    extra_metadata = Column("metadata", JSON, nullable=True, default=dict)
    current_version = Column(Integer, nullable=False, default=1)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="resources")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="selectin")
    versions = relationship("ResourceVersion", back_populates="resource", lazy="selectin",
                            cascade="all, delete-orphan", order_by="ResourceVersion.version.desc()")
    links = relationship("ResourceLink", back_populates="resource", lazy="selectin",
                         cascade="all, delete-orphan")
    activities = relationship("ResourceActivity", back_populates="resource", lazy="selectin",
                              cascade="all, delete-orphan", order_by="ResourceActivity.created_at.desc()")


class ResourceVersion(Base):
    __tablename__ = "resource_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True, default=0)
    mime_type = Column(String(100), nullable=True)
    extra_metadata = Column("metadata", JSON, nullable=True, default=dict)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    resource = relationship("Resource", back_populates="versions")
    uploader = relationship("User", foreign_keys=[uploaded_by], lazy="selectin")


class ResourceLink(Base):
    __tablename__ = "resource_links"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    linked_type = Column(String(50), nullable=False, index=True)
    linked_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    resource = relationship("Resource", back_populates="links")


class ResourceActivity(Base):
    __tablename__ = "resource_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    extra_metadata = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    resource = relationship("Resource", back_populates="activities")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
