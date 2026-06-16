import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.attachments.models import Attachment
from app.users.models import User

router = APIRouter()

UPLOAD_DIR = Path("storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.get("")
def list_attachments(
    model_type: Optional[str] = Query(None),
    model_id: Optional[int] = Query(None),
    collection_name: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Attachment)

    if model_type:
        query = query.filter(Attachment.model_type == model_type)
    if model_id:
        query = query.filter(Attachment.model_id == model_id)
    if collection_name:
        query = query.filter(Attachment.collection_name == collection_name)

    total = query.count()
    attachments = query.order_by(Attachment.order_column.asc().nullslast(),
                                  Attachment.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "items": [format_attachment(a) for a in attachments],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.post("/upload", status_code=201)
async def upload_attachment(
    model_type: str,
    model_id: int,
    collection_name: str = "default",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["attachments.upload"]),
):
    ext = Path(file.filename).suffix if file.filename else ""
    file_uuid = str(uuid.uuid4())
    stored_name = f"{file_uuid}{ext}"
    file_path = UPLOAD_DIR / stored_name

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        uuid=file_uuid,
        model_type=model_type,
        model_id=model_id,
        collection_name=collection_name,
        name=file.filename or stored_name,
        file_name=stored_name,
        mime_type=file.content_type,
        disk="local",
        size=len(content),
        order_column=db.query(Attachment).filter(
            Attachment.model_type == model_type,
            Attachment.model_id == model_id,
        ).count() + 1,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    log_activity(db, "attachments", attachment.id, "Attachment uploaded",
                 causer_id=current_user.id,
                 properties={"model_type": model_type, "model_id": model_id,
                            "file_name": file.filename})
    return format_attachment(attachment)


@router.get("/download/{attachment_id}")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["attachments.download"]),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(404, "Attachment not found")

    file_path = UPLOAD_DIR / attachment.file_name
    if not file_path.exists():
        raise HTTPException(404, "File not found on disk")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(file_path),
        media_type=attachment.mime_type or "application/octet-stream",
        filename=attachment.name,
    )


@router.delete("/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["attachments.delete"]),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(404, "Attachment not found")

    file_path = UPLOAD_DIR / attachment.file_name
    if file_path.exists():
        file_path.unlink()

    db.delete(attachment)
    db.commit()

    log_activity(db, "attachments", attachment_id, "Attachment deleted",
                 causer_id=current_user.id)
    return {"message": "Attachment deleted"}


def format_attachment(a: Attachment) -> dict:
    return {
        "id": a.id,
        "uuid": a.uuid,
        "model_type": a.model_type,
        "model_id": a.model_id,
        "collection_name": a.collection_name,
        "name": a.name,
        "file_name": a.file_name,
        "mime_type": a.mime_type,
        "disk": a.disk,
        "size": a.size,
        "order_column": a.order_column,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "url": f"/api/v1/attachments/download/{a.id}",
    }
