"""add_figma_token_to_projects

Revision ID: b1c2d3e4f5a6
Revises: d4a6ea2b159f
Create Date: 2026-07-23 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("figma_token", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("projects", "figma_token")
