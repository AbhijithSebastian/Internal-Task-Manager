from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    method = Column(String(10), nullable=False)
    url = Column(String(2048), nullable=False)
    description = Column(Text, nullable=True)
    authentication = Column(JSON, nullable=True, default=dict)
    headers = Column(JSON, nullable=True, default=list)
    query_params = Column(JSON, nullable=True, default=list)
    path_params = Column(JSON, nullable=True, default=list)
    request_body = Column(JSON, nullable=True, default=dict)
    response_body = Column(JSON, nullable=True, default=dict)
    status_codes = Column(JSON, nullable=True, default=list)
    example_requests = Column(JSON, nullable=True, default=list)
    example_responses = Column(JSON, nullable=True, default=list)
    tags = Column(JSON, nullable=True, default=list)
    version = Column(String(20), nullable=False, default="1.0")
    status = Column(String(20), nullable=False, default="draft", index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="endpoints")
    owner = relationship("User", foreign_keys=[owner_id], lazy="selectin")
    references = relationship("EndpointReference", back_populates="endpoint", lazy="selectin",
                              cascade="all, delete-orphan", order_by="EndpointReference.created_at.desc()")
    activities = relationship("EndpointActivity", back_populates="endpoint", lazy="selectin",
                              cascade="all, delete-orphan", order_by="EndpointActivity.created_at.desc()")


class EndpointReference(Base):
    __tablename__ = "endpoint_references"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    linked_type = Column(String(50), nullable=False, index=True)
    linked_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    endpoint = relationship("Endpoint", back_populates="references")


class EndpointActivity(Base):
    __tablename__ = "endpoint_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    extra_metadata = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    endpoint = relationship("Endpoint", back_populates="activities")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
