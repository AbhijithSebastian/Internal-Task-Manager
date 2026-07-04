import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.resources.models import Resource, ResourceVersion, ResourceLink, ResourceActivity
from app.projects.models import Project
from app.users.models import User
from app.core.config import settings

router = APIRouter()

UPLOAD_DIR = Path(settings.upload_dir) / "resources"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

RESOURCE_TYPES = [
    "image", "document", "zip", "apk", "video",
    "figma", "github", "url", "other",
]

LINKED_TYPES = ["task", "endpoint", "design", "meeting", "report"]


class ResourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    resource_type: str = Field(...)
    category: Optional[str] = None
    url: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict] = None


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict] = None


class LinkCreate(BaseModel):
    linked_type: str = Field(...)
    linked_id: int = Field(...)


def _format_resource(r: Resource) -> dict:
    return {
        "id": r.id,
        "project_id": r.project_id,
        "name": r.name,
        "description": r.description,
        "resource_type": r.resource_type,
        "category": r.category,
        "url": r.url,
        "file_path": r.file_path,
        "file_size": r.file_size,
        "mime_type": r.mime_type,
        "tags": r.tags or [],
        "metadata": r.extra_metadata or {},
        "current_version": r.current_version,
        "uploaded_by": r.uploaded_by,
        "uploader": {"id": r.uploader.id, "name": r.uploader.name} if r.uploader else None,
        "version_count": len(r.versions) if r.versions else 0,
        "link_count": len(r.links) if r.links else 0,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


def _format_version(v: ResourceVersion) -> dict:
    return {
        "id": v.id,
        "resource_id": v.resource_id,
        "version": v.version,
        "file_path": v.file_path,
        "file_size": v.file_size,
        "mime_type": v.mime_type,
        "metadata": v.extra_metadata or {},
        "uploaded_by": v.uploaded_by,
        "uploader": {"id": v.uploader.id, "name": v.uploader.name} if v.uploader else None,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


def _format_link(l: ResourceLink) -> dict:
    return {
        "id": l.id,
        "resource_id": l.resource_id,
        "linked_type": l.linked_type,
        "linked_id": l.linked_id,
        "created_at": l.created_at.isoformat() if l.created_at else None,
    }


def _format_activity(a: ResourceActivity) -> dict:
    return {
        "id": a.id,
        "resource_id": a.resource_id,
        "action": a.action,
        "user_id": a.user_id,
        "user": {"id": a.user.id, "name": a.user.name} if a.user else None,
        "metadata": a.extra_metadata or {},
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def _type_from_mime(mime: str) -> str:
    if not mime:
        return "other"
    if mime.startswith("image/"):
        return "image"
    if mime.startswith("video/"):
        return "video"
    if "pdf" in mime or "word" in mime or "spreadsheet" in mime or "presentation" in mime or "officedocument" in mime:
        return "document"
    if "zip" in mime or "x-rar" in mime or "x-7z" in mime or "gzip" in mime:
        return "zip"
    if "vnd.android" in mime:
        return "apk"
    return "other"


def _ext_from_type(resource_type: str) -> str:
    mapping = {
        "apk": ".apk", "zip": ".zip", "video": ".mp4",
        "document": ".pdf",
    }
    return mapping.get(resource_type, ".bin")


@router.get("")
def list_resources(
    project_id: int = Query(..., alias="project_id"),
    search: Optional[str] = Query(None, max_length=200),
    resource_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    uploaded_by: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    version: Optional[int] = Query(None),
    sort_by: str = Query("newest", regex="^(newest|oldest|recently_updated|alphabetical)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Resource).filter(
        Resource.project_id == project_id,
        Resource.deleted_at.is_(None),
    )

    if search:
        term = f"%{search}%"
        query = query.filter(
            db.query(Resource.name.ilike(term) | Resource.description.ilike(term))
            .exists().correlate(Resource)
        )

    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    if category:
        query = query.filter(Resource.category == category)
    if uploaded_by:
        query = query.filter(Resource.uploaded_by == uploaded_by)
    if version:
        query = query.filter(Resource.current_version == version)

    sort_map = {
        "newest": Resource.created_at.desc(),
        "oldest": Resource.created_at.asc(),
        "recently_updated": Resource.updated_at.desc(),
        "alphabetical": Resource.name.asc(),
    }
    query = query.order_by(sort_map.get(sort_by, Resource.created_at.desc()))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [_format_resource(r) for r in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.post("", status_code=201)
def create_resource_link(
    data: ResourceCreate,
    project_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    if data.resource_type not in RESOURCE_TYPES:
        raise HTTPException(422, f"Invalid resource type. Must be one of: {', '.join(RESOURCE_TYPES)}")

    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at.is_(None)).first()
    if not project:
        raise NotFoundException("Project", project_id)

    resource = Resource(
        project_id=project_id,
        name=data.name,
        description=data.description,
        resource_type=data.resource_type,
        category=data.category,
        url=data.url,
        tags=data.tags or [],
        metadata=data.metadata or {},
        uploaded_by=current_user.id,
    )
    db.add(resource)
    db.flush()

    activity = ResourceActivity(
        resource_id=resource.id,
        action="uploaded",
        user_id=current_user.id,
        metadata={"resource_type": data.resource_type, "name": data.name},
    )
    db.add(activity)
    db.commit()
    db.refresh(resource)

    log_activity(db, "resources", resource.id, f"Resource '{resource.name}' uploaded",
                 causer_id=current_user.id,
                 properties={"project_id": project_id, "resource_type": data.resource_type})

    return _format_resource(resource)


@router.post("/upload", status_code=201)
async def upload_resource_file(
    project_id: int = Query(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    resource_type: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    project = db.query(Project).filter(Project.id == project_id, Project.deleted_at.is_(None)).first()
    if not project:
        raise NotFoundException("Project", project_id)

    original_filename = file.filename or "file"
    safe_filename = os.path.basename(original_filename)

    ext = Path(safe_filename).suffix.lower() if safe_filename else ""
    ext_stripped = ext.lstrip(".")
    if ext_stripped not in settings.allowed_upload_extension_set:
        raise HTTPException(400, f"File extension '.{ext_stripped}' is not allowed")

    content = await file.read()
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(413, f"File size exceeds maximum allowed limit of {settings.max_upload_size_mb}MB")

    rtype = resource_type or _type_from_mime(file.content_type or "")
    file_uuid = str(uuid.uuid4())
    stored_name = f"{file_uuid}{ext}"
    file_path = UPLOAD_DIR / stored_name

    with open(file_path, "wb") as f:
        f.write(content)

    resource = Resource(
        project_id=project_id,
        name=name,
        description=description,
        resource_type=rtype,
        category=category,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type,
        tags=tags.split(",") if tags else [],
        uploaded_by=current_user.id,
    )
    db.add(resource)
    db.flush()

    version = ResourceVersion(
        resource_id=resource.id,
        version=1,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(version)

    activity = ResourceActivity(
        resource_id=resource.id,
        action="uploaded",
        user_id=current_user.id,
        metadata={"file_name": safe_filename, "file_size": len(content), "resource_type": rtype},
    )
    db.add(activity)
    db.commit()
    db.refresh(resource)

    log_activity(db, "resources", resource.id, f"Resource file '{resource.name}' uploaded",
                 causer_id=current_user.id,
                 properties={"project_id": project_id, "file_name": safe_filename})

    return _format_resource(resource)


@router.get("/{resource_id}")
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    activity = ResourceActivity(
        resource_id=resource.id,
        action="viewed",
        user_id=current_user.id,
    )
    db.add(activity)
    db.commit()

    return _format_resource(resource)


@router.put("/{resource_id}")
def update_resource(
    resource_id: int,
    data: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    if data.name is not None:
        resource.name = data.name
    if data.description is not None:
        resource.description = data.description
    if data.category is not None:
        resource.category = data.category
    if data.tags is not None:
        resource.tags = data.tags
    if data.metadata is not None:
        resource.extra_metadata = {**(resource.extra_metadata or {}), **data.metadata}

    activity = ResourceActivity(
        resource_id=resource.id,
        action="updated",
        user_id=current_user.id,
    )
    db.add(activity)
    db.commit()
    db.refresh(resource)

    return _format_resource(resource)


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    resource.deleted_at = datetime.utcnow()

    activity = ResourceActivity(
        resource_id=resource.id,
        action="deleted",
        user_id=current_user.id,
    )
    db.add(activity)
    db.commit()

    log_activity(db, "resources", resource.id, f"Resource '{resource.name}' deleted",
                 causer_id=current_user.id,
                 properties={"project_id": resource.project_id})
    return {"message": "Resource deleted successfully"}


@router.post("/{resource_id}/versions", status_code=201)
async def upload_new_version(
    resource_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    original_filename = file.filename or "file"
    ext = Path(original_filename).suffix.lower() if original_filename else ""
    ext_stripped = ext.lstrip(".")
    if ext_stripped not in settings.allowed_upload_extension_set:
        raise HTTPException(400, f"File extension '.{ext_stripped}' is not allowed")

    content = await file.read()
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(413, f"File size exceeds maximum allowed limit of {settings.max_upload_size_mb}MB")

    new_version = resource.current_version + 1
    file_uuid = str(uuid.uuid4())
    stored_name = f"{file_uuid}{ext}"
    file_path = UPLOAD_DIR / stored_name

    with open(file_path, "wb") as f:
        f.write(content)

    resource.current_version = new_version
    resource.file_path = str(file_path)
    resource.file_size = len(content)
    resource.mime_type = file.content_type
    resource.updated_at = datetime.utcnow()

    version = ResourceVersion(
        resource_id=resource.id,
        version=new_version,
        file_path=str(file_path),
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(version)

    activity = ResourceActivity(
        resource_id=resource.id,
        action="updated",
        user_id=current_user.id,
        metadata={"new_version": new_version, "file_size": len(content)},
    )
    db.add(activity)
    db.commit()
    db.refresh(resource)

    return _format_resource(resource)


@router.get("/{resource_id}/versions")
def get_resource_versions(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    return {
        "current_version": resource.current_version,
        "versions": [_format_version(v) for v in resource.versions],
    }


@router.post("/{resource_id}/download")
def track_download(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    activity = ResourceActivity(
        resource_id=resource.id,
        action="downloaded",
        user_id=current_user.id,
    )
    db.add(activity)
    db.commit()

    return {"message": "Download tracked"}


@router.get("/{resource_id}/links")
def get_resource_links(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    return {
        "links": [_format_link(l) for l in resource.links],
    }


@router.post("/{resource_id}/links", status_code=201)
def create_resource_link_relation(
    resource_id: int,
    data: LinkCreate,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    if data.linked_type not in LINKED_TYPES:
        raise HTTPException(422, f"Invalid linked type. Must be one of: {', '.join(LINKED_TYPES)}")

    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    existing = db.query(ResourceLink).filter(
        ResourceLink.resource_id == resource_id,
        ResourceLink.linked_type == data.linked_type,
        ResourceLink.linked_id == data.linked_id,
    ).first()
    if existing:
        raise HTTPException(409, "Link already exists")

    link = ResourceLink(
        resource_id=resource_id,
        linked_type=data.linked_type,
        linked_id=data.linked_id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    return _format_link(link)


@router.delete("/{resource_id}/links/{link_id}")
def delete_resource_link(
    resource_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions([]),
):
    link = db.query(ResourceLink).filter(
        ResourceLink.id == link_id,
        ResourceLink.resource_id == resource_id,
    ).first()
    if not link:
        raise NotFoundException("ResourceLink", link_id)

    db.delete(link)
    db.commit()
    return {"message": "Link removed successfully"}


@router.get("/{resource_id}/activity")
def get_resource_activity(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    return {
        "activities": [_format_activity(a) for a in resource.activities],
    }


@router.get("/{resource_id}/file")
def download_resource_file(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id, Resource.deleted_at.is_(None)).first()
    if not resource:
        raise NotFoundException("Resource", resource_id)

    if not resource.file_path or not Path(resource.file_path).exists():
        raise HTTPException(404, "File not found on disk")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=resource.file_path,
        media_type=resource.mime_type or "application/octet-stream",
        filename=resource.name,
    )
