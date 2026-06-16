from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.enums import AnnouncementPriority, AnnouncementStatus


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(SAEnum(AnnouncementPriority), default=AnnouncementPriority.MEDIUM, nullable=False, index=True)
    status = Column(SAEnum(AnnouncementStatus), default=AnnouncementStatus.PUBLISHED, nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    author = relationship("User", back_populates="announcements", foreign_keys=[author_id], lazy="selectin")
