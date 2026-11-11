"""add user meeting announcement fields

Revision ID: 005
Revises: 004
Create Date: 2026-06-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users - add department, designation, employee_id, reporting_manager_id
    op.add_column("users", sa.Column("department", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("designation", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("employee_id", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("reporting_manager_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_users_reporting_manager", "users", "users", ["reporting_manager_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_users_department", "users", ["department"])
    op.create_index("ix_users_employee_id", "users", ["employee_id"])

    # MeetingLogs - add location, recording_link, next_meeting_date
    op.add_column("meeting_logs", sa.Column("location", sa.String(255), nullable=True))
    op.add_column("meeting_logs", sa.Column("recording_link", sa.String(2048), nullable=True))
    op.add_column("meeting_logs", sa.Column("next_meeting_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column("meeting_logs", sa.Column("related_task_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_meeting_logs_related_task", "meeting_logs", "tasks", ["related_task_id"], ["id"], ondelete="SET NULL")

    # Announcements - add target_type, target_id, is_pinned
    op.add_column("announcements", sa.Column("target_type", sa.String(50), nullable=True))
    op.add_column("announcements", sa.Column("target_id", sa.Integer(), nullable=True))
    op.add_column("announcements", sa.Column("is_pinned", sa.Boolean(), default=False, nullable=False, server_default=sa.text("false")))
    op.create_index("ix_announcements_target", "announcements", ["target_type", "target_id"])
    op.create_index("ix_announcements_is_pinned", "announcements", ["is_pinned"])


def downgrade() -> None:
    op.drop_index("ix_announcements_is_pinned", table_name="announcements")
    op.drop_index("ix_announcements_target", table_name="announcements")
    op.drop_column("announcements", "is_pinned")
    op.drop_column("announcements", "target_id")
    op.drop_column("announcements", "target_type")

    op.drop_constraint("fk_meeting_logs_related_task", "meeting_logs", type_="foreignkey")
    op.drop_column("meeting_logs", "related_task_id")
    op.drop_column("meeting_logs", "next_meeting_date")
    op.drop_column("meeting_logs", "recording_link")
    op.drop_column("meeting_logs", "location")

    op.drop_index("ix_users_employee_id", table_name="users")
    op.drop_index("ix_users_department", table_name="users")
    op.drop_constraint("fk_users_reporting_manager", "users", type_="foreignkey")
    op.drop_column("users", "reporting_manager_id")
    op.drop_column("users", "employee_id")
    op.drop_column("users", "designation")
    op.drop_column("users", "department")
