from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger, JSON, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    model_type = Column(String(255), nullable=False, index=True)
    model_id = Column(Integer, nullable=False, index=True)
    collection_name = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(255), nullable=True)
    disk = Column(String(255), nullable=False, default="local")
    size = Column(BigInteger, nullable=False, default=0)
    manipulations = Column(JSON, nullable=False, default=dict)
    custom_properties = Column(JSON, nullable=False, default=dict)
    order_column = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
