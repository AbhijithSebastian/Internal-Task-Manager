from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    guard_name = Column(String(255), default="web", nullable=False)
    group = Column(String(255), nullable=True, index=True)
    label = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions", lazy="selectin")
    users = relationship("User", secondary="user_permissions", back_populates="direct_permissions", lazy="selectin")
