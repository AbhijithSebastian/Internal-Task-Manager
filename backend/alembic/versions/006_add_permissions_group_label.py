"""add group and label columns to permissions table

Revision ID: 006
Revises: 60d778210886
Create Date: 2026-07-06
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, None] = "60d778210886"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("permissions", sa.Column("group", sa.String(255), nullable=True, index=True))
    op.add_column("permissions", sa.Column("label", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("permissions", "label")
    op.drop_column("permissions", "group")
