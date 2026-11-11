"""add missing role metadata columns

Revision ID: 007
Revises: 006
Create Date: 2026-07-06
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("roles", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("roles", sa.Column("color", sa.String(length=50), nullable=True))
    op.add_column("roles", sa.Column("icon", sa.String(length=50), nullable=True))
    op.add_column("roles", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("roles", sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("roles", "is_system")
    op.drop_column("roles", "is_active")
    op.drop_column("roles", "icon")
    op.drop_column("roles", "color")
    op.drop_column("roles", "description")
