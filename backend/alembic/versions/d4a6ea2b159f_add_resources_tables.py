"""add_resources_tables

Revision ID: d4a6ea2b159f
Revises: 7ef4d52eb53d
Create Date: 2026-07-04 10:08:28.472853
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d4a6ea2b159f"
down_revision: Union[str, None] = "7ef4d52eb53d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("resources",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("resource_type", sa.String(length=50), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("current_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("uploaded_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_resources_category"), "resources", ["category"], unique=False)
    op.create_index(op.f("ix_resources_project_id"), "resources", ["project_id"], unique=False)
    op.create_index(op.f("ix_resources_resource_type"), "resources", ["resource_type"], unique=False)

    op.create_table("resource_versions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("uploaded_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_resource_versions_resource_id"), "resource_versions", ["resource_id"], unique=False)

    op.create_table("resource_links",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column("linked_type", sa.String(length=50), nullable=False),
        sa.Column("linked_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_resource_links_linked_type"), "resource_links", ["linked_type"], unique=False)
    op.create_index(op.f("ix_resource_links_resource_id"), "resource_links", ["resource_id"], unique=False)

    op.create_table("resource_activities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_resource_activities_action"), "resource_activities", ["action"], unique=False)
    op.create_index(op.f("ix_resource_activities_resource_id"), "resource_activities", ["resource_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_resource_activities_resource_id"), table_name="resource_activities")
    op.drop_index(op.f("ix_resource_activities_action"), table_name="resource_activities")
    op.drop_table("resource_activities")
    op.drop_index(op.f("ix_resource_links_resource_id"), table_name="resource_links")
    op.drop_index(op.f("ix_resource_links_linked_type"), table_name="resource_links")
    op.drop_table("resource_links")
    op.drop_index(op.f("ix_resource_versions_resource_id"), table_name="resource_versions")
    op.drop_table("resource_versions")
    op.drop_index(op.f("ix_resources_resource_type"), table_name="resources")
    op.drop_index(op.f("ix_resources_project_id"), table_name="resources")
    op.drop_index(op.f("ix_resources_category"), table_name="resources")
    op.drop_table("resources")
