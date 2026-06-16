from app.core.database import Base
from app.users.models import User, user_roles, user_permissions
from app.roles.models import Role, role_permissions
from app.permissions.models import Permission
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task, TaskDependency, task_assignees
from app.comments.models import Comment, Mention
from app.meetings.models import MeetingLog
from app.announcements.models import Announcement
from app.milestones.models import Milestone
from app.integrations.models import Integration
from app.notifications.models import Notification
from app.activity_logs.models import ActivityLog
from app.attachments.models import Attachment
