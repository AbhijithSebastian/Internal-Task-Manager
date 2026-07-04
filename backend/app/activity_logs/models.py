from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    log_name = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=False)
    subject_type = Column(String(255), nullable=True, index=True)
    subject_id = Column(Integer, nullable=True, index=True)
    causer_type = Column(String(255), nullable=True)
    causer_id = Column(Integer, nullable=True, index=True)
    properties = Column(JSON, nullable=True)
    event = Column(String(255), nullable=True)
    batch_uuid = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
