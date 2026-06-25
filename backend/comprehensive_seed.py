"""Comprehensive seed script for enterprise test data."""
import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.enums import (
    UserRole, TaskStatus, TaskPriority, ProjectStatus, ProjectPriority,
    ProjectMemberRole, MilestoneStatus, AnnouncementPriority, AnnouncementStatus,
)
import app.database.models  # noqa
from app.users.models import User
from app.roles.models import Role
from app.projects.models import Project, ProjectMember
from app.tasks.models import Task, task_assignees
from app.meetings.models import MeetingLog
from app.announcements.models import Announcement
from app.notifications.models import Notification
from app.activity_logs.models import ActivityLog
from app.milestones.models import Milestone

db = SessionLocal()

if db.query(User).count() > 50:
    db.execute(task_assignees.delete())
    db.execute(Task.__table__.delete())
    db.execute(ProjectMember.__table__.delete())
    db.execute(Project.__table__.delete())
    db.execute(Milestone.__table__.delete())
    db.execute(MeetingLog.__table__.delete())
    db.execute(Announcement.__table__.delete())
    db.execute(Notification.__table__.delete())
    db.execute(ActivityLog.__table__.delete())
    db.execute(User.__table__.delete().where(User.email.like("user%@company.com")))
    db.commit()
    print("Cleared previous seed data; re-seeding...")

# Users
departments = ["Engineering", "Design", "Product", "Marketing", "Sales",
               "HR", "Finance", "Operations", "Legal", "Support",
               "Data Science", "DevOps", "Security", "QA", "Research"]
job_titles = ["Software Engineer", "Senior Engineer", "Staff Engineer",
              "Designer", "Product Manager", "Marketing Lead", "Analyst",
              "Coordinator", "Director", "VP", "Manager", "Associate",
              "Intern", "Consultant", "Architect"]

admin = db.query(User).filter(User.email == "abhijith@tool.com").first()
admin_role = db.query(Role).filter(Role.name == "super-admin").first()
pm_role = db.query(Role).filter(Role.name == "project-manager").first()
tl_role = db.query(Role).filter(Role.name == "team-lead").first()
emp_role = db.query(Role).filter(Role.name == "employee").first()

additional = []
for i in range(1, 51):
    dept = random.choice(departments)
    job = random.choice(job_titles)
    role_choice = random.choices(
        ["super-admin", "project-manager", "team-lead", "developer", "designer", "employee"],
        weights=[1, 3, 6, 15, 10, 20]
    )[0]
    u = User(
        name=f"User{i:03d}",
        email=f"user{i:03d}@company.com",
        password=get_password_hash("password"),
        is_active=True,
        department=dept,
        designation=job,
        job_title=job,
    )
    db.add(u)
    db.flush()
    dev_role = db.query(Role).filter(Role.name == "developer").first()
    des_role = db.query(Role).filter(Role.name == "designer").first()
    role_map = {"super-admin": admin_role, "project-manager": pm_role, "team-lead": tl_role, "developer": dev_role, "designer": des_role, "employee": emp_role}
    if role_map[role_choice]:
        u.roles.append(role_map[role_choice])
    additional.append(u)
db.commit()
print(f"Created {len(additional) + 10} total users")

all_users = db.query(User).all()
pms = [u for u in all_users if pm_role in u.roles][:8]
leads = [u for u in all_users if tl_role in u.roles][:12]
members = [u for u in all_users if emp_role in u.roles][:40]

# Projects
project_names = [
    "Project Alpha", "Project Beta", "Project Gamma", "Data Pipeline",
    "Mobile App v2", "Website Redesign", "API Gateway", "Dashboard Revamp",
    "Analytics Platform", "Notification System", "Search Engine", "Auth Service",
    "Payment Integration", "CRM Integration", "Chat System", "File Storage",
    "Email Service", "Monitoring Tool", "Deployment Pipeline", "Testing Framework",
]
projects = []
for i, name in enumerate(project_names):
    status = random.choice(["active", "active", "active", "on_hold", "completed"])
    priority = random.choice(["low", "medium", "medium", "high", "urgent"])
    start = date.today() - timedelta(days=random.randint(30, 365))
    end = start + timedelta(days=random.randint(60, 180)) if status == "active" else None
    pm = random.choice(pms)
    lead = random.choice(leads)
    p = Project(
        name=name,
        description=f"Description for {name}",
        status=ProjectStatus(status),
        priority=ProjectPriority(priority),
        start_date=start,
        end_date=end,
        pm_id=pm.id,
        lead_id=lead.id,
        author_id=admin.id,
        figma_url=f"https://figma.com/file/{name.lower().replace(' ', '-')}" if random.random() > 0.3 else None,
        github_url=f"https://github.com/org/{name.lower().replace(' ', '-')}" if random.random() > 0.3 else None,
        docs_url=f"https://docs.example.com/{name.lower().replace(' ', '-')}" if random.random() > 0.3 else None,
    )
    db.add(p)
    db.flush()
    # Add members
    pm_member = ProjectMember(project_id=p.id, user_id=pm.id, role=ProjectMemberRole.OWNER)
    db.add(pm_member)
    lead_member = ProjectMember(project_id=p.id, user_id=lead.id, role=ProjectMemberRole.LEAD)
    db.add(lead_member)
    for m in random.sample(members, random.randint(3, 8)):
        if m.id not in (pm.id, lead.id):
            db.add(ProjectMember(project_id=p.id, user_id=m.id, role=ProjectMemberRole.MEMBER))
    projects.append(p)
db.commit()
print(f"Created {len(projects)} projects")

# Milestones
milestone_statuses = list(MilestoneStatus)
for p in projects:
    for i in range(random.randint(1, 3)):
        m = Milestone(
            project_id=p.id,
            name=f"Milestone {i+1}",
            due_date=date.today() + timedelta(days=random.randint(1, 90)),
            status=random.choice(milestone_statuses),
        )
        db.add(m)
db.commit()
print("Created milestones")

# Tasks
status_values = list(TaskStatus)
priority_values = list(TaskPriority)
tasks = []
for p in projects:
    num_tasks = random.randint(8, 20)
    for i in range(num_tasks):
        assignee = random.choice(members) if random.random() > 0.2 else None
        t = Task(
            project_id=p.id,
            title=f"Task {i+1} for {p.name}",
            description=f"Description for task {i+1} in {p.name}",
            status=random.choice(status_values),
            priority=random.choice(priority_values),
            author_id=admin.id,
            due_date=date.today() + timedelta(days=random.randint(1, 60)),
            estimated_hours=random.randint(1, 40),
        )
        db.add(t)
        db.flush()
        if assignee:
            db.execute(task_assignees.insert().values(task_id=t.id, user_id=assignee.id))
        tasks.append(t)
db.commit()
print(f"Created {len(tasks)} tasks")

# Subtasks (stored as Task records with parent_id)
subtask_count = 0
for t in tasks:
    num_subtasks = random.randint(0, 3)
    for i in range(num_subtasks):
        st = Task(
            parent_id=t.id,
            project_id=t.project_id,
            title=f"Subtask {i+1} for task {t.id}",
            description=f"Subtask of task {t.id}",
            status=random.choice(status_values),
            priority=TaskPriority.MEDIUM,
            author_id=admin.id,
            due_date=date.today() + timedelta(days=random.randint(1, 30)),
        )
        db.add(st)
        subtask_count += 1
db.commit()
print(f"Created {subtask_count} subtasks")

# Meetings
meeting_titles = ["Sprint Planning", "Daily Standup", "Retrospective",
                  "Design Review", "Client Call", "Team Sync", "One-on-One",
                  "Workshop", "Demo Day", "Strategy Session"]
for p in projects:
    num_meetings = random.randint(1, 5)
    for i in range(num_meetings):
        mtg_date = datetime.now() - timedelta(days=random.randint(1, 30), hours=random.randint(1, 8))
        attendees = random.sample(members, min(random.randint(2, 5), len(members)))
        m = MeetingLog(
            project_id=p.id,
            title=random.choice(meeting_titles),
            meeting_date=mtg_date.date(),
            location=random.choice(["Virtual", "Office", "Client Site"]),
            summary=f"Summary for meeting {i+1} in {p.name}",
            decisions_taken=f"Key decisions made in meeting {i+1}",
            action_items=f"Action items from meeting {i+1}",
            author_id=random.choice(pms).id,
            attendees=[{"id": att.id, "name": att.name, "email": att.email} for att in attendees],
        )
        db.add(m)
db.commit()
print("Created meetings")

# Announcements
priorities_list = list(AnnouncementPriority)
for p in projects:
    num_ann = random.randint(0, 3)
    for i in range(num_ann):
        a = Announcement(
            title=f"Announcement for {p.name}",
            content=f"Important announcement content for {p.name}.",
            priority=random.choice(priorities_list),
            status=random.choice(["published", "draft"]),
            author_id=admin.id,
            target_type="project",
            target_id=p.id,
        )
        db.add(a)
db.commit()
print("Created announcements")

# Activity logs
for p in projects:
    db.add(ActivityLog(
        event="project_created",
        causer_id=admin.id,
        causer_type="user",
        subject_type="project",
        subject_id=p.id,
        properties={"name": p.name},
        log_name="project",
        description=f"Project {p.name} created",
    ))
db.commit()
db.add(ActivityLog(
    event="users_seeded",
    causer_id=admin.id,
    causer_type="system",
    subject_type="system",
    subject_id=0,
    properties={"count": len(all_users)},
    log_name="system",
    description=f"Seeded {len(all_users)} users",
))
db.commit()
print("Created activity logs")

# Notifications
for u in all_users[:20]:
    n = Notification(
        user_id=u.id,
        type="announcement",
        data={"message": f"Welcome to the platform, {u.name}!", "type": "system"},
    )
    db.add(n)
db.commit()
print("Created notifications")

db.close()
print("\nComprehensive seed complete!")
print(f"  Users: {len(all_users)}")
print(f"  Projects: {len(projects)}")
print(f"  Tasks: {len(tasks)}")
print(f"  Subtasks: {subtask_count}")
print(f"  Login: abhijith@tool.com / password")
