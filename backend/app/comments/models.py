from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    body = Column(Text, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    task = relationship("Task", back_populates="comments", lazy="selectin")
    author = relationship("User", back_populates="comments", foreign_keys=[author_id], lazy="selectin")
    parent = relationship("Comment", back_populates="replies", remote_side=[id], lazy="selectin")
    replies = relationship("Comment", back_populates="parent", remote_side=[parent_id], lazy="selectin",
                           cascade="all, delete-orphan")
    mentions = relationship("Mention", back_populates="comment", lazy="selectin", cascade="all, delete-orphan")


class Mention(Base):
    __tablename__ = "mentions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="mentions", lazy="selectin")
    comment = relationship("Comment", back_populates="mentions", lazy="selectin")
