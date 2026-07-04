"""add_endpoints_tables

Revision ID: 60d778210886
Revises: d4a6ea2b159f
Create Date: 2026-07-04 10:51:03.678232
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "60d778210886"
down_revision: Union[str, None] = "d4a6ea2b159f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("endpoints",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("method", sa.String(length=10), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("authentication", sa.JSON(), nullable=True),
        sa.Column("headers", sa.JSON(), nullable=True),
        sa.Column("query_params", sa.JSON(), nullable=True),
        sa.Column("path_params", sa.JSON(), nullable=True),
        sa.Column("request_body", sa.JSON(), nullable=True),
        sa.Column("response_body", sa.JSON(), nullable=True),
        sa.Column("status_codes", sa.JSON(), nullable=True),
        sa.Column("example_requests", sa.JSON(), nullable=True),
        sa.Column("example_responses", sa.JSON(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("version", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_endpoints_owner_id"), "endpoints", ["owner_id"], unique=False)
    op.create_index(op.f("ix_endpoints_project_id"), "endpoints", ["project_id"], unique=False)
    op.create_index(op.f("ix_endpoints_status"), "endpoints", ["status"], unique=False)

    op.create_table("endpoint_activities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("endpoint_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["endpoint_id"], ["endpoints.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_endpoint_activities_action"), "endpoint_activities", ["action"], unique=False)
    op.create_index(op.f("ix_endpoint_activities_endpoint_id"), "endpoint_activities", ["endpoint_id"], unique=False)

    op.create_table("endpoint_references",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("endpoint_id", sa.Integer(), nullable=False),
        sa.Column("linked_type", sa.String(length=50), nullable=False),
        sa.Column("linked_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["endpoint_id"], ["endpoints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_endpoint_references_endpoint_id"), "endpoint_references", ["endpoint_id"], unique=False)
    op.create_index(op.f("ix_endpoint_references_linked_type"), "endpoint_references", ["linked_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_endpoint_references_linked_type"), table_name="endpoint_references")
    op.drop_index(op.f("ix_endpoint_references_endpoint_id"), table_name="endpoint_references")
    op.drop_table("endpoint_references")
    op.drop_index(op.f("ix_endpoint_activities_endpoint_id"), table_name="endpoint_activities")
    op.drop_index(op.f("ix_endpoint_activities_action"), table_name="endpoint_activities")
    op.drop_table("endpoint_activities")
    op.drop_index(op.f("ix_endpoints_status"), table_name="endpoints")
    op.drop_index(op.f("ix_endpoints_project_id"), table_name="endpoints")
    op.drop_index(op.f("ix_endpoints_owner_id"), table_name="endpoints")
    op.drop_table("endpoints")
