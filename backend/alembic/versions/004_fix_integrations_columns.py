"""fix integrations table column names

Revision ID: 004
Revises: 003
Create Date: 2026-06-17
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("integrations", "name", new_column_name="label", existing_type=sa.String(255), nullable=True)
    op.alter_column("integrations", "enabled", new_column_name="is_active", existing_type=sa.Boolean(), nullable=False)
    op.add_column("integrations", sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_integrations_is_active", "integrations", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_integrations_is_active", table_name="integrations")
    op.drop_column("integrations", "last_synced_at")
    op.alter_column("integrations", "is_active", new_column_name="enabled", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("integrations", "label", new_column_name="name", existing_type=sa.String(255), nullable=False)
