from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "super-admin"
    PROJECT_MANAGER = "project-manager"
    TEAM_LEAD = "team-lead"
    EMPLOYEE = "employee"

    def label(self) -> str:
        labels = {
            "super-admin": "Super Admin",
            "project-manager": "Project Manager",
            "team-lead": "Team Lead",
            "employee": "Employee",
        }
        return labels[self.value]

    @classmethod
    def select_options(cls) -> list[dict]:
        return [{"value": r.value, "label": r.label()} for r in cls]


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"

    def label(self) -> str:
        labels = {"active": "Active", "on_hold": "On Hold", "completed": "Completed", "archived": "Archived"}
        return labels[self.value]

    def color(self) -> str:
        colors = {"active": "success", "on_hold": "warning", "completed": "info", "archived": "neutral"}
        return colors[self.value]


class ProjectPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

    def label(self) -> str:
        return self.value.capitalize()

    def color(self) -> str:
        colors = {"low": "neutral", "medium": "info", "high": "warning", "urgent": "danger"}
        return colors[self.value]


class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    DONE = "done"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"

    def label(self) -> str:
        labels = {
            "backlog": "Backlog", "todo": "To Do", "in_progress": "In Progress",
            "in_review": "In Review", "approved": "Approved", "done": "Done",
            "cancelled": "Cancelled", "blocked": "Blocked",
        }
        return labels[self.value]

    def color(self) -> str:
        colors = {
            "backlog": "neutral", "todo": "info", "in_progress": "warning",
            "in_review": "warning", "approved": "success", "done": "success",
            "cancelled": "danger", "blocked": "danger",
        }
        return colors[self.value]


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

    def label(self) -> str:
        return self.value.capitalize()

    def color(self) -> str:
        colors = {"low": "neutral", "medium": "info", "high": "warning", "urgent": "danger"}
        return colors[self.value]


class ProjectMemberRole(str, Enum):
    OWNER = "owner"
    MANAGER = "manager"
    LEAD = "lead"
    DEVELOPER = "developer"
    MEMBER = "member"


class AnnouncementPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class AnnouncementStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AT_RISK = "at_risk"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class IntegrationType(str, Enum):
    GITHUB = "github"
    FIGMA = "figma"
    EMAIL_HOOK = "email_hook"
