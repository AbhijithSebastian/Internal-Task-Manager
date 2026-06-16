from datetime import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(255), nullable=False, index=True)
    data = Column(JSON, nullable=False, default=dict)
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications", lazy="selectin")

    @property
    def is_read(self) -> bool:
        return self.read_at is not None

    def mark_as_read(self):
        self.read_at = datetime.utcnow()
