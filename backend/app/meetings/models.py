from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class MeetingLog(Base):
    __tablename__ = "meeting_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    meeting_date = Column(Date, nullable=False)
    attendees = Column(JSON, nullable=True)
    summary = Column(Text, nullable=False)
    decisions_taken = Column(Text, nullable=True)
    blockers = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="meeting_logs", lazy="selectin")
    author = relationship("User", back_populates="meeting_logs", foreign_keys=[author_id], lazy="selectin")
