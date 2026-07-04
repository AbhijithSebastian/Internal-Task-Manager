import os
import sys
import argparse
import random
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy import insert, create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.core.security import get_password_hash
from app.core.enums import (
    UserRole, ProjectStatus, ProjectPriority, TaskStatus, TaskPriority,
    ProjectMemberRole, AnnouncementPriority, AnnouncementStatus, MilestoneStatus,
    IntegrationType
)
from app.users.models import User, Role, user_roles
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task, task_assignees
from app.comments.models import Comment
from app.notifications.models import Notification
from app.activity_logs.models import ActivityLog
from app.attachments.models import Attachment
from app.meetings.models import MeetingLog
from app.announcements.models import Announcement
from app.milestones.models import Milestone
from app.integrations.models import Integration

fake = Faker('en_US')

def generate_dataset(scale=1.0):
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    print(f"Generating enterprise dataset with scale {scale}...")

    # Calculate targets
    t_super_admins = max(1, int(5 * scale))
    t_admins = max(1, int(20 * scale))
    t_pms = max(1, int(80 * scale))
    t_leads = max(1, int(150 * scale))
    t_employees = max(1, int(1000 * scale))
    t_total_users = t_super_admins + t_admins + t_pms + t_leads + t_employees

    t_projects = max(1, int(10000 * scale))
    t_tasks = max(1, int(20000 * scale))
    t_subtasks = max(1, int(30000 * scale))
    t_meetings = max(1, int(15000 * scale))
    t_announcements = max(1, int(5000 * scale))
    t_comments = max(1, int(150000 * scale))
    t_notifications = max(1, int(100000 * scale))
    t_attachments = max(1, int(100000 * scale))
    t_activity = max(1, int(500000 * scale))

    print(f"Target Projects: {t_projects}, Tasks: {t_tasks}")

    default_password = get_password_hash("password123")

    # Roles
    roles = {
        "super-admin": session.query(Role).filter_by(name="super-admin").first(),
        "admin": session.query(Role).filter_by(name="admin").first() or Role(name="admin"),
        "project-manager": session.query(Role).filter_by(name="project-manager").first(),
        "team-lead": session.query(Role).filter_by(name="team-lead").first() or Role(name="team-lead"),
        "employee": session.query(Role).filter_by(name="employee").first() or Role(name="employee"),
    }
    for r in roles.values():
        if r and not r.id:
            session.add(r)
    session.commit()

    # Create Users
    users_data = []
    for _ in range(t_super_admins):
        users_data.append({"name": fake.name(), "email": fake.unique.email(), "password": default_password, "role": roles["super-admin"]})
    for _ in range(t_admins):
        users_data.append({"name": fake.name(), "email": fake.unique.email(), "password": default_password, "role": roles["admin"]})
    for _ in range(t_pms):
        users_data.append({"name": fake.name(), "email": fake.unique.email(), "password": default_password, "role": roles["project-manager"]})
    for _ in range(t_leads):
        users_data.append({"name": fake.name(), "email": fake.unique.email(), "password": default_password, "role": roles["team-lead"]})
    for _ in range(t_employees):
        users_data.append({"name": fake.name(), "email": fake.unique.email(), "password": default_password, "role": roles["employee"]})

    db_users = []
    user_roles_data = []
    
    print("Inserting Users...")
    for u in users_data:
        db_user = User(
            name=u["name"],
            email=u["email"],
            password=u["password"],
            job_title=fake.job(),
            phone=fake.phone_number()[:20],
            is_active=random.choice([True, True, True, False]),
            last_login_at=fake.date_time_between(start_date='-1y', end_date='now') if random.random() > 0.1 else None,
        )
        session.add(db_user)
        db_users.append((db_user, u["role"]))
        
    session.commit()
    
    for db_user, role in db_users:
        user_roles_data.append({"user_id": db_user.id, "role_id": role.id})
    session.execute(insert(user_roles), user_roles_data)
    session.commit()

    user_ids = [u[0].id for u in db_users]

    print("Inserting Projects...")
    projects_data = []
    for _ in range(t_projects):
        projects_data.append({
            "name": fake.catch_phrase(),
            "description": fake.text(),
            "status": random.choice(list(ProjectStatus)).value,
            "priority": random.choice(list(ProjectPriority)).value,
            "author_id": random.choice(user_ids),
            "created_at": fake.date_time_between(start_date='-2y', end_date='now'),
        })
    
    chunk_size = 5000
    for i in range(0, len(projects_data), chunk_size):
        session.execute(insert(Project), projects_data[i:i+chunk_size])
    session.commit()
    
    project_ids = [p.id for p in session.query(Project.id).all()]

    print("Inserting Tasks and Subtasks...")
    tasks_data = []
    for _ in range(t_tasks):
        tasks_data.append({
            "title": fake.sentence(),
            "description": fake.text(),
            "status": random.choice(list(TaskStatus)).value,
            "priority": random.choice(list(TaskPriority)).value,
            "project_id": random.choice(project_ids),
            "author_id": random.choice(user_ids),
            "due_date": fake.date_between(start_date='-1m', end_date='+6m'),
        })
    for i in range(0, len(tasks_data), chunk_size):
        session.execute(insert(Task), tasks_data[i:i+chunk_size])
    session.commit()

    task_ids = [t.id for t in session.query(Task.id).all()]
    subtasks_data = []
    for _ in range(t_subtasks):
        subtasks_data.append({
            "title": fake.sentence(),
            "status": random.choice(list(TaskStatus)).value,
            "project_id": random.choice(project_ids),
            "parent_id": random.choice(task_ids),
        })
    for i in range(0, len(subtasks_data), chunk_size):
        session.execute(insert(Task), subtasks_data[i:i+chunk_size])
    session.commit()
    
    print("Done generating dataset.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scale", type=float, default=1.0)
    args = parser.parse_args()
    generate_dataset(args.scale)
