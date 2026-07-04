"""Add modules table and module_id to tasks/meetings

Revision ID: 7ef4d52eb53d
Revises: 005
Create Date: 2026-06-22 16:47:07.123748
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '7ef4d52eb53d'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'modules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('tasks', sa.Column('module_id', sa.Integer(), sa.ForeignKey('modules.id', ondelete='SET NULL'), nullable=True, index=True))
    op.add_column('meeting_logs', sa.Column('module_id', sa.Integer(), sa.ForeignKey('modules.id', ondelete='SET NULL'), nullable=True, index=True))


def downgrade() -> None:
    op.drop_column('meeting_logs', 'module_id')
    op.drop_column('tasks', 'module_id')
    op.drop_table('modules')
