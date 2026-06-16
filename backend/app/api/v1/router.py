from fastapi import APIRouter
from app.api.v1 import (
    auth, users, roles, permissions, projects, tasks,
    comments, meetings, announcements, reports, notifications, attachments, activity, dashboard
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(comments.router, prefix="/comments", tags=["Comments"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Announcements"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["Attachments"])
api_router.include_router(activity.router, prefix="/activity", tags=["Activity"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
