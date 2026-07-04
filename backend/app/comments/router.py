from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import re

from app.core.database import get_db
from app.core.deps import get_current_user, require_permissions
from app.core.activity import log_activity
from app.core.exceptions import NotFoundException
from app.comments.models import Comment, Mention
from app.users.models import User

router = APIRouter()


def extract_mentions(text: str) -> list[str]:
    return re.findall(r'@(\w+)', text)


@router.get("")
def list_comments(
    task_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Comment).filter(Comment.deleted_at.is_(None), Comment.parent_id.is_(None))

    if task_id:
        query = query.filter(Comment.task_id == task_id)
    if project_id:
        query = query.filter(Comment.project_id == project_id)

    total = query.count()
    comments = query.order_by(Comment.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    return {
        "items": [format_comment(c) for c in comments],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 0,
    }


@router.post("", status_code=201)
def create_comment(
    task_id: int,
    body: str,
    project_id: int,
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["comments.create"]),
):
    comment = Comment(
        body=body,
        task_id=task_id,
        project_id=project_id,
        author_id=current_user.id,
        parent_id=parent_id,
    )
    db.add(comment)
    db.flush()

    mentioned_names = extract_mentions(body)
    if mentioned_names:
        mentioned_users = db.query(User).filter(
            User.name.in_(mentioned_names), User.is_active == True,
            User.deleted_at.is_(None),
        ).all()
        for mu in mentioned_users:
            mention = Mention(user_id=mu.id, comment_id=comment.id)
            db.add(mention)

    db.commit()
    db.refresh(comment)

    log_activity(db, "comments", comment.id, "Comment created", causer_id=current_user.id,
                 properties={"task_id": task_id, "body_preview": body[:100]})
    return format_comment(comment)


@router.put("/{comment_id}")
def update_comment(
    comment_id: int,
    body: str,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["comments.update"]),
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id, Comment.deleted_at.is_(None)
    ).first()
    if not comment:
        raise NotFoundException("Comment", comment_id)
    if comment.author_id != current_user.id and not current_user.is_super_admin:
        raise HTTPException(403, "You can only edit your own comments")

    comment.body = body
    db.commit()
    db.refresh(comment)

    log_activity(db, "comments", comment.id, "Comment updated", causer_id=current_user.id)
    return format_comment(comment)


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = require_permissions(["comments.delete"]),
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id, Comment.deleted_at.is_(None)
    ).first()
    if not comment:
        raise NotFoundException("Comment", comment_id)

    comment.deleted_at = datetime.utcnow()
    db.commit()

    log_activity(db, "comments", comment.id, "Comment deleted", causer_id=current_user.id)
    return {"message": "Comment deleted successfully"}


def format_comment(c: Comment) -> dict:
    return {
        "id": c.id,
        "body": c.body,
        "task_id": c.task_id,
        "project_id": c.project_id,
        "parent_id": c.parent_id,
        "author": {
            "id": c.author.id,
            "name": c.author.name,
        } if c.author else None,
        "mentions": [
            {"user_id": m.user_id, "username": m.user.name if m.user else None}
            for m in (c.mentions or [])
        ],
        "replies": [
            {
                "id": r.id, "body": r.body,
                "author": {"id": r.author.id, "name": r.author.name} if r.author else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in (c.replies or []) if not r.deleted_at
        ],
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
    }
