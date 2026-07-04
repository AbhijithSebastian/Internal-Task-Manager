from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.endpoints.models import Endpoint, EndpointReference, EndpointActivity
from app.projects.models import Project
from app.users.models import User
from sqlalchemy import cast, String

router = APIRouter()

HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
ENDPOINT_STATUSES = ["draft", "review", "active", "deprecated"]
REFERENCE_TYPES = ["task", "resource", "design", "meeting"]


class EndpointCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    method: str = Field(...)
    url: str = Field(min_length=1, max_length=2048)
    description: Optional[str] = None
    authentication: Optional[dict] = None
    headers: Optional[list[dict]] = None
    query_params: Optional[list[dict]] = None
    path_params: Optional[list[dict]] = None
    request_body: Optional[dict] = None
    response_body: Optional[dict] = None
    status_codes: Optional[list[dict]] = None
    example_requests: Optional[list[dict]] = None
    example_responses: Optional[list[dict]] = None
    tags: Optional[list[str]] = None
    version: Optional[str] = "1.0"
    status: Optional[str] = "draft"


class EndpointUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    authentication: Optional[dict] = None
    headers: Optional[list[dict]] = None
    query_params: Optional[list[dict]] = None
    path_params: Optional[list[dict]] = None
    request_body: Optional[dict] = None
    response_body: Optional[dict] = None
    status_codes: Optional[list[dict]] = None
    example_requests: Optional[list[dict]] = None
    example_responses: Optional[list[dict]] = None
    tags: Optional[list[str]] = None
    version: Optional[str] = None
    status: Optional[str] = None


class ReferenceCreate(BaseModel):
    linked_type: str = Field(...)
    linked_id: int = Field(...)


def _format_endpoint(e: Endpoint) -> dict:
    return {
        "id": e.id,
        "project_id": e.project_id,
        "name": e.name,
        "method": e.method,
        "url": e.url,
        "description": e.description,
        "authentication": e.authentication or {},
        "headers": e.headers or [],
        "query_params": e.query_params or [],
        "path_params": e.path_params or [],
        "request_body": e.request_body or {},
        "response_body": e.response_body or {},
        "status_codes": e.status_codes or [],
        "example_requests": e.example_requests or [],
        "example_responses": e.example_responses or [],
        "tags": e.tags or [],
        "version": e.version or "1.0",
        "status": e.status or "draft",
        "owner_id": e.owner_id,
        "owner": {"id": e.owner.id, "name": e.owner.name} if e.owner else None,
        "reference_count": len(e.references) if e.references else 0,
        "activity_count": len(e.activities) if e.activities else 0,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "updated_at": e.updated_at.isoformat() if e.updated_at else None,
    }


def _format_reference(r: EndpointReference) -> dict:
    return {
        "id": r.id,
        "endpoint_id": r.endpoint_id,
        "linked_type": r.linked_type,
        "linked_id": r.linked_id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _format_activity(a: EndpointActivity) -> dict:
    return {
        "id": a.id,
        "endpoint_id": a.endpoint_id,
        "action": a.action,
        "user_id": a.user_id,
        "user": {"id": a.user.id, "name": a.user.name} if a.user else None,
        "metadata": a.extra_metadata or {},
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("")
def list_endpoints(
    project_id: int = Query(..., alias="project_id"),
    search: Optional[str] = Query(None, max_length=200),
    method: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    owner_id: Optional[int] = Query(None),
    tag: Optional[str] = Query(None),
    version: Optional[str] = Query(None),
    sort_by: str = Query("newest", pattern="^(newest|oldest|recently_updated|alphabetical)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Endpoint).filter(
        Endpoint.project_id == project_id,
        Endpoint.deleted_at.is_(None),
    )

    if search:
        term = f"%{search}%"
        query = query.filter(
            Endpoint.name.ilike(term) | Endpoint.url.ilike(term) | Endpoint.description.ilike(term)
        )

    if method:
        query = query.filter(Endpoint.method == method.upper())
    if status:
        query = query.filter(Endpoint.status == status)
    if owner_id:
        query = query.filter(Endpoint.owner_id == owner_id)
    if tag:
        query = query.filter(cast(Endpoint.tags, String).ilike(f"%{tag}%"))
    if version:
        query = query.filter(Endpoint.version == version)

    sort_map = {
        "newest": Endpoint.created_at.desc(),
        "oldest": Endpoint.created_at.asc(),
        "recently_updated": Endpoint.updated_at.desc(),
        "alphabetical": Endpoint.name.asc(),
    }
    query = query.order_by(sort_map.get(sort_by, Endpoint.created_at.desc()))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [_format_endpoint(e) for e in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


def _validate_endpoint_data(data: EndpointCreate | EndpointUpdate) -> None:
    if data.method and data.method.upper() not in HTTP_METHODS:
        raise HTTPException(422, f"Invalid HTTP method. Must be one of: {', '.join(HTTP_METHODS)}")
    if data.status and data.status not in ENDPOINT_STATUSES:
        raise HTTPException(422, f"Invalid status. Must be one of: {', '.join(ENDPOINT_STATUSES)}")


@router.post("", status_code=201)
def create_endpoint(
    data: EndpointCreate,
    project_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    _validate_endpoint_data(data)

    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at.is_(None)).first()
    if not project:
        raise NotFoundException("Project", project_id)

    method = data.method.upper()
    endpoint = Endpoint(
        project_id=project_id,
        name=data.name,
        method=method,
        url=data.url,
        description=data.description,
        authentication=data.authentication or {},
        headers=data.headers or [],
        query_params=data.query_params or [],
        path_params=data.path_params or [],
        request_body=data.request_body or {},
        response_body=data.response_body or {},
        status_codes=data.status_codes or [],
        example_requests=data.example_requests or [],
        example_responses=data.example_responses or [],
        tags=data.tags or [],
        version=data.version or "1.0",
        status=data.status or "draft",
        owner_id=current_user.id,
    )
    db.add(endpoint)
    db.flush()

    activity = EndpointActivity(
        endpoint_id=endpoint.id,
        action="created",
        user_id=current_user.id,
        extra_metadata={"method": method, "name": data.name},
    )
    db.add(activity)
    db.commit()
    db.refresh(endpoint)

    log_activity(db, "endpoints", endpoint.id, f"Endpoint '{endpoint.name}' created",
                 causer_id=current_user.id,
                 properties={"project_id": project_id, "method": method})

    return _format_endpoint(endpoint)


@router.get("/{endpoint_id}")
def get_endpoint(
    endpoint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.deleted_at.is_(None)).first()
    if not endpoint:
        raise NotFoundException("Endpoint", endpoint_id)

    activity = EndpointActivity(
        endpoint_id=endpoint.id,
        action="viewed",
        user_id=current_user.id,
    )
    db.add(activity)
    db.commit()

    return _format_endpoint(endpoint)


@router.put("/{endpoint_id}")
def update_endpoint(
    endpoint_id: int,
    data: EndpointUpdate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.deleted_at.is_(None)).first()
    if not endpoint:
        raise NotFoundException("Endpoint", endpoint_id)

    _validate_endpoint_data(data)

    changed_fields = []
    if data.name is not None and data.name != endpoint.name:
        endpoint.name = data.name
        changed_fields.append("name")
    if data.method is not None:
        new_method = data.method.upper()
        if new_method != endpoint.method:
            endpoint.method = new_method
            changed_fields.append("method")
    if data.url is not None and data.url != endpoint.url:
        endpoint.url = data.url
        changed_fields.append("url")
    if data.description is not None:
        endpoint.description = data.description
        changed_fields.append("description")
    if data.authentication is not None:
        endpoint.authentication = data.authentication
        changed_fields.append("authentication")
    if data.headers is not None:
        endpoint.headers = data.headers
        changed_fields.append("headers")
    if data.query_params is not None:
        endpoint.query_params = data.query_params
        changed_fields.append("query_params")
    if data.path_params is not None:
        endpoint.path_params = data.path_params
        changed_fields.append("path_params")
    if data.request_body is not None:
        endpoint.request_body = data.request_body
        changed_fields.append("request_body")
    if data.response_body is not None:
        endpoint.response_body = data.response_body
        changed_fields.append("response_body")
    if data.status_codes is not None:
        endpoint.status_codes = data.status_codes
        changed_fields.append("status_codes")
    if data.example_requests is not None:
        endpoint.example_requests = data.example_requests
        changed_fields.append("example_requests")
    if data.example_responses is not None:
        endpoint.example_responses = data.example_responses
        changed_fields.append("example_responses")
    if data.tags is not None:
        endpoint.tags = data.tags
        changed_fields.append("tags")
    if data.version is not None and data.version != endpoint.version:
        endpoint.version = data.version
        changed_fields.append("version")
    if data.status is not None and data.status != endpoint.status:
        changed_fields.append(f"status:{endpoint.status}->{data.status}")
        endpoint.status = data.status

    endpoint.updated_at = datetime.utcnow()

    activity = EndpointActivity(
        endpoint_id=endpoint.id,
        action="updated",
        user_id=current_user.id,
        extra_metadata={"changed_fields": changed_fields},
    )
    db.add(activity)
    db.commit()
    db.refresh(endpoint)

    return _format_endpoint(endpoint)


@router.delete("/{endpoint_id}")
def delete_endpoint(
    endpoint_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.deleted_at.is_(None)).first()
    if not endpoint:
        raise NotFoundException("Endpoint", endpoint_id)

    endpoint.deleted_at = datetime.utcnow()
    endpoint.updated_at = datetime.utcnow()

    activity = EndpointActivity(
        endpoint_id=endpoint.id,
        action="deleted",
        user_id=current_user.id,
    )
    db.add(activity)
    db.commit()

    log_activity(db, "endpoints", endpoint.id, f"Endpoint '{endpoint.name}' deleted",
                 causer_id=current_user.id,
                 properties={"project_id": endpoint.project_id})

    return {"message": "Endpoint deleted successfully"}


@router.post("/{endpoint_id}/references", status_code=201)
def create_endpoint_reference(
    endpoint_id: int,
    data: ReferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.deleted_at.is_(None)).first()
    if not endpoint:
        raise NotFoundException("Endpoint", endpoint_id)

    if data.linked_type not in REFERENCE_TYPES:
        raise HTTPException(422, f"Invalid reference type. Must be one of: {', '.join(REFERENCE_TYPES)}")

    existing = db.query(EndpointReference).filter(
        EndpointReference.endpoint_id == endpoint_id,
        EndpointReference.linked_type == data.linked_type,
        EndpointReference.linked_id == data.linked_id,
    ).first()
    if existing:
        raise HTTPException(409, "Reference already exists")

    ref = EndpointReference(
        endpoint_id=endpoint_id,
        linked_type=data.linked_type,
        linked_id=data.linked_id,
    )
    db.add(ref)
    db.flush()

    activity = EndpointActivity(
        endpoint_id=endpoint.id,
        action="reference_added",
        user_id=current_user.id,
        extra_metadata={"linked_type": data.linked_type, "linked_id": data.linked_id},
    )
    db.add(activity)
    db.commit()

    return _format_reference(ref)


@router.get("/{endpoint_id}/references")
def list_endpoint_references(
    endpoint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.deleted_at.is_(None)).first()
    if not endpoint:
        raise NotFoundException("Endpoint", endpoint_id)

    return {"references": [_format_reference(r) for r in endpoint.references]}


@router.delete("/{endpoint_id}/references/{reference_id}")
def delete_endpoint_reference(
    endpoint_id: int,
    reference_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    ref = db.query(EndpointReference).filter(
        EndpointReference.id == reference_id,
        EndpointReference.endpoint_id == endpoint_id,
    ).first()
    if not ref:
        raise NotFoundException("EndpointReference", reference_id)

    db.delete(ref)
    db.flush()

    activity = EndpointActivity(
        endpoint_id=endpoint_id,
        action="reference_removed",
        user_id=current_user.id,
        extra_metadata={"linked_type": ref.linked_type, "linked_id": ref.linked_id},
    )
    db.add(activity)
    db.commit()

    return {"message": "Reference removed successfully"}


@router.get("/{endpoint_id}/activity")
def list_endpoint_activity(
    endpoint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.deleted_at.is_(None)).first()
    if not endpoint:
        raise NotFoundException("Endpoint", endpoint_id)

    return {"activities": [_format_activity(a) for a in endpoint.activities]}
