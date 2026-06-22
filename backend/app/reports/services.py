import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.colors import HexColor

from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

PRIMARY = HexColor("#2563EB")
DARK = HexColor("#1E293B")
MEDIUM = HexColor("#475569")
LIGHT = HexColor("#F1F5F9")
BORDER = HexColor("#CBD5E1")

def build_reportlab_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("ReportTitle", fontName="Helvetica-Bold", fontSize=18, textColor=DARK, spaceAfter=4))
    styles.add(ParagraphStyle("ReportSubtitle", fontName="Helvetica", fontSize=9, textColor=MEDIUM, spaceAfter=2))
    styles.add(ParagraphStyle("SectionTitle", fontName="Helvetica-Bold", fontSize=12, textColor=PRIMARY, spaceBefore=14, spaceAfter=6))
    styles.add(ParagraphStyle("SubSection", fontName="Helvetica-Bold", fontSize=10, textColor=DARK, spaceBefore=8, spaceAfter=4))
    styles.add(ParagraphStyle("ReportBody", fontName="Helvetica", fontSize=9, textColor=DARK, spaceAfter=3, leading=13))
    styles.add(ParagraphStyle("KPIValue", fontName="Helvetica-Bold", fontSize=16, textColor=DARK))
    styles.add(ParagraphStyle("KPILabel", fontName="Helvetica", fontSize=7, textColor=MEDIUM, spaceBefore=2))
    styles.add(ParagraphStyle("FooterNote", fontName="Helvetica", fontSize=7, textColor=MEDIUM))
    styles.add(ParagraphStyle("CellNormal", fontName="Helvetica", fontSize=8, textColor=DARK, leading=11))
    styles.add(ParagraphStyle("CellBold", fontName="Helvetica-Bold", fontSize=8, textColor=DARK, leading=11))
    styles.add(ParagraphStyle("HeaderCell", fontName="Helvetica-Bold", fontSize=8, textColor=colors.white))
    return styles


def build_header_table(styles, title: str, subtitle: str):
    header_data = [
        [Paragraph(title, styles["ReportTitle"]), ""],
        [Paragraph(subtitle, styles["ReportSubtitle"]), Paragraph(f"Generated: {datetime.now().strftime('%b %d, %Y %I:%M %p')}", styles["ReportSubtitle"])],
    ]
    tbl = Table(header_data, colWidths=[12*cm, 8*cm])
    tbl.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    return tbl


def build_divider():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=6, spaceAfter=6)


def build_kpi_row(styles, items: list[tuple[str, str]]):
    cols = len(items)
    data = []
    row1 = []
    row2 = []
    for val, lab in items:
        row1.append(Paragraph(f"<b>{val}</b>", styles["KPIValue"]))
        row2.append(Paragraph(lab, styles["KPILabel"]))
    data.append(row1)
    data.append(row2)

    col_width = 19*cm / cols
    tbl = Table(data, colWidths=[col_width]*cols)
    tbl_style = [
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    tbl.setStyle(TableStyle(tbl_style))
    return tbl


def build_field_table(styles, fields: list[tuple[str, str]]):
    data = [[
        Paragraph("<b>Field</b>", styles["HeaderCell"]),
        Paragraph("<b>Value</b>", styles["HeaderCell"]),
    ]]
    for label, value in fields:
        val_str = str(value) if value is not None and value != "" else "—"
        data.append([
            Paragraph(label, styles["CellBold"]),
            Paragraph(val_str, styles["CellNormal"]),
        ])

    tbl = Table(data, colWidths=[6*cm, 14*cm])
    tbl_style = [
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]
    tbl.setStyle(TableStyle(tbl_style))
    return tbl


def build_member_list(styles, title: str, members: list):
    if not members:
        return None
    elements = []
    elements.append(Paragraph(title, styles["SubSection"]))
    names = [m["name"] for m in members]
    elements.append(Paragraph(", ".join(names), styles["ReportBody"]))
    return elements


def generate_project_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = build_reportlab_styles()
    elements = []

    elements.append(build_header_table(styles, data.get("name") or "Project Report", "Project Performance Summary"))
    elements.append(build_divider())

    elements.append(Paragraph(f"Status: {data.get('status_label')}  |  Priority: {data.get('priority_label')}", styles["ReportBody"]))
    elements.append(Spacer(1, 4))

    kpis = [
        (f"{data.get('completion_rate', 0)}%", "Completion"),
        (str(data.get("total_tasks", 0)), "Total Tasks"),
        (str(data.get("completed_tasks", 0)), "Completed"),
        (str(data.get("pending_tasks", 0)), "Pending"),
    ]
    elements.append(build_kpi_row(styles, kpis))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Overview", styles["SectionTitle"]))
    fields = [
        ("Status", data.get("status_label")),
        ("Priority", data.get("priority_label")),
        ("Start Date", str(data.get("start_date") or "—")),
        ("End Date", str(data.get("end_date") or "—")),
        ("Completion Date", str(data.get("completion_date") or "—")),
        ("Project Manager", data.get("pm")),
        ("Team Lead", data.get("lead")),
    ]
    elements.append(build_field_table(styles, fields))
    elements.append(Spacer(1, 6))

    if data.get("team_leads") or data.get("developers") or data.get("team_members"):
        elements.append(Paragraph("Team", styles["SectionTitle"]))
        team_elements = []
        for title, members in [("Team Leads", data.get("team_leads", [])),
                                ("Developers", data.get("developers", [])),
                                ("Team Members", data.get("team_members", []))]:
            block = build_member_list(styles, title, members)
            if block:
                team_elements.extend(block)
        if team_elements:
            elements.extend(team_elements)
            elements.append(Spacer(1, 4))

    elements.append(Paragraph("Tasks & Progress", styles["SectionTitle"]))
    task_fields = [
        ("Total Tasks", str(data.get("total_tasks", 0))),
        ("Completed", str(data.get("completed_tasks", 0))),
        ("Pending", str(data.get("pending_tasks", 0))),
        ("Total Subtasks", str(data.get("total_subtasks", 0))),
        ("Completed Subtasks", str(data.get("completed_subtasks", 0))),
    ]
    elements.append(build_field_table(styles, task_fields))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Health & Metrics", styles["SectionTitle"]))
    health_kpis = [
        (str(data.get("health_score", 0)), "Health Score"),
        (str(data.get("blocked_count", 0)), "Blocked"),
        (str(data.get("overdue_count", 0)), "Overdue"),
        (str(data.get("meeting_count", 0)), "Meetings"),
    ]
    elements.append(build_kpi_row(styles, health_kpis))
    elements.append(Spacer(1, 4))

    if data.get("recent_activity"):
        elements.append(Paragraph("Recent Activity", styles["SectionTitle"]))
        for a in data.get("recent_activity", [])[:5]:
            desc = a.get("description", "")
            ts = a.get("created_at", "")
            elements.append(Paragraph(f"• {desc}  <i><font size='7' color='#475569'>{ts}</font></i>", styles["ReportBody"]))

    elements.append(Spacer(1, 10))
    elements.append(build_divider())
    elements.append(Paragraph(f"Generated by Internal Task Manager · {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["FooterNote"]))

    doc.build(elements)
    return buf.getvalue()


def generate_task_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = build_reportlab_styles()
    elements = []

    elements.append(build_header_table(styles, data.get("title") or "Task Report", "Task Details & Activity"))
    elements.append(build_divider())

    kpis = [
        (data.get("status_label") or "—", "Status"),
        (data.get("priority_label") or "—", "Priority"),
        (f"{data.get('estimated_hours', '—')}h" if data.get("estimated_hours") else "—", "Est. Hours"),
        (str(len(data.get("comments", []))), "Comments"),
    ]
    elements.append(build_kpi_row(styles, kpis))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Time & Dates", styles["SectionTitle"]))
    fields = [
        ("Created", str(data.get("created_at") or "—")),
        ("Started", str(data.get("started_date") or "—")),
        ("Completed", str(data.get("completed_date") or "—")),
        ("Due Date", str(data.get("due_date") or "—")),
        ("Est. Hours", f"{data.get('estimated_hours')}h" if data.get("estimated_hours") else "—"),
        ("Actual Hours", f"{data.get('actual_hours')}h" if data.get("actual_hours") else "Not tracked"),
    ]
    elements.append(build_field_table(styles, fields))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Details", styles["SectionTitle"]))
    detail_fields = [
        ("Project", data.get("project_name")),
        ("Author", data.get("author")),
        ("Attachments", str(data.get("attachment_count", 0))),
    ]
    elements.append(build_field_table(styles, detail_fields))
    elements.append(Spacer(1, 4))

    assignees = data.get("assignees", [])
    if assignees:
        elements.append(Paragraph("Assignees", styles["SectionTitle"]))
        names = [a["name"] for a in assignees]
        elements.append(Paragraph(", ".join(names), styles["ReportBody"]))
        elements.append(Spacer(1, 4))

    if data.get("meetings"):
        elements.append(Paragraph("Linked Meetings", styles["SectionTitle"]))
        for m in data["meetings"][:5]:
            title = m.get("title", "—")
            date = m.get("date", "—")
            elements.append(Paragraph(f"• {title}  <i><font size='7' color='#475569'>{date}</font></i>", styles["ReportBody"]))

    if data.get("activity"):
        elements.append(Paragraph("Activity Timeline", styles["SectionTitle"]))
        for a in data["activity"][:5]:
            desc = a.get("description", "")
            ts = a.get("created_at", "")
            elements.append(Paragraph(f"• {desc}  <i><font size='7' color='#475569'>{ts}</font></i>", styles["ReportBody"]))

    elements.append(Spacer(1, 10))
    elements.append(build_divider())
    elements.append(Paragraph(f"Generated by Internal Task Manager · {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["FooterNote"]))

    doc.build(elements)
    return buf.getvalue()


def generate_subtask_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = build_reportlab_styles()
    elements = []

    elements.append(build_header_table(styles, data.get("title") or "Subtask Report", "Subtask Details"))
    elements.append(build_divider())

    kpis = [
        (data.get("status_label") or "—", "Status"),
        (data.get("priority_label") or "—", "Priority"),
        (f"{data.get('completion_time', '—')}h" if data.get("completion_time") else "—", "Completion"),
        (str(data.get("attachment_count", 0)), "Attachments"),
    ]
    elements.append(build_kpi_row(styles, kpis))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Time & Dates", styles["SectionTitle"]))
    fields = [
        ("Created", str(data.get("created_at") or "—")),
        ("Started", str(data.get("started_date") or "—")),
        ("Completed", str(data.get("completed_date") or "—")),
        ("Due Date", str(data.get("due_date") or "—")),
        ("Est. Hours", f"{data.get('estimated_hours')}h" if data.get("estimated_hours") else "—"),
        ("Completion", f"{data.get('completion_time')}h" if data.get("completion_time") else "—"),
    ]
    elements.append(build_field_table(styles, fields))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Details", styles["SectionTitle"]))
    detail_fields = [
        ("Parent Task", data.get("parent_task_title")),
        ("Project", data.get("project_name")),
        ("Attachments", str(data.get("attachment_count", 0))),
    ]
    elements.append(build_field_table(styles, detail_fields))
    elements.append(Spacer(1, 4))

    assignees = data.get("assignees", [])
    if assignees:
        elements.append(Paragraph("Assigned Users", styles["SectionTitle"]))
        names = [a["name"] for a in assignees]
        elements.append(Paragraph(", ".join(names), styles["ReportBody"]))

    if data.get("activity"):
        elements.append(Paragraph("Activity History", styles["SectionTitle"]))
        for a in data["activity"][:5]:
            desc = a.get("description", "")
            ts = a.get("created_at", "")
            elements.append(Paragraph(f"• {desc}  <i><font size='7' color='#475569'>{ts}</font></i>", styles["ReportBody"]))

    elements.append(Spacer(1, 10))
    elements.append(build_divider())
    elements.append(Paragraph(f"Generated by Internal Task Manager · {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["FooterNote"]))

    doc.build(elements)
    return buf.getvalue()


def generate_employee_pdf(data: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = build_reportlab_styles()
    elements = []

    elements.append(build_header_table(styles, data.get("name") or "Employee Report", "Employee Performance Summary"))
    elements.append(build_divider())

    kpis = [
        (str(data.get("assigned_tasks", 0)), "Tasks"),
        (str(data.get("completed_tasks", 0)), "Completed"),
        (str(data.get("overdue_tasks", 0)), "Overdue"),
        (f"{data.get('completion_rate', 0)}%", "Rate"),
    ]
    elements.append(build_kpi_row(styles, kpis))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Workload", styles["SectionTitle"]))
    workload_kpis = [
        (str(data.get("assigned_subtasks", 0)), "Subtasks"),
        (str(data.get("completed_subtasks", 0)), "Subtasks Done"),
        (f"{data.get('total_hours', 0)}h", "Total Hours"),
        (f"{data.get('average_completion_time', '—')}h" if data.get("average_completion_time") else "—", "Avg Completion"),
    ]
    elements.append(build_kpi_row(styles, workload_kpis))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Scorecard", styles["SectionTitle"]))
    score_fields = [
        ("Productivity Score", f"{data.get('productivity_score', 0)}/100"),
        ("Meeting Count", str(data.get("meeting_count", 0))),
    ]
    elements.append(build_field_table(styles, score_fields))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("Details", styles["SectionTitle"]))
    detail_fields = [
        ("Role", data.get("role")),
        ("Department", data.get("department")),
        ("Designation", data.get("designation")),
        ("Employee ID", data.get("employee_id")),
        ("Projects", str(data.get("project_count", 0))),
        ("Pending Tasks", str(data.get("pending_tasks", 0))),
    ]
    elements.append(build_field_table(styles, detail_fields))
    elements.append(Spacer(1, 4))

    if data.get("meetings"):
        elements.append(Paragraph("Recent Meetings", styles["SectionTitle"]))
        for m in data["meetings"][:5]:
            title = m.get("title", "—")
            date = m.get("date", "—")
            elements.append(Paragraph(f"• {title}  <i><font size='7' color='#475569'>{date}</font></i>", styles["ReportBody"]))

    if data.get("recent_activity"):
        elements.append(Paragraph("Recent Activity", styles["SectionTitle"]))
        for a in data["recent_activity"][:5]:
            desc = a.get("description", "")
            ts = a.get("created_at", "")
            elements.append(Paragraph(f"• {desc}  <i><font size='7' color='#475569'>{ts}</font></i>", styles["ReportBody"]))

    elements.append(Spacer(1, 10))
    elements.append(build_divider())
    elements.append(Paragraph(f"Generated by Internal Task Manager · {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["FooterNote"]))

    doc.build(elements)
    return buf.getvalue()


PDF_GENERATORS = {
    "projects": generate_project_pdf,
    "tasks": generate_task_pdf,
    "subtasks": generate_subtask_pdf,
    "employees": generate_employee_pdf,
}


def generate_docx(data: dict, report_type: str) -> bytes:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(4)

    def add_heading(text: str, level: int = 1):
        h = doc.add_heading(text, level=level)
        return h

    def add_kpi_table(items: list[tuple[str, str]], cols: int = 4):
        table = doc.add_table(rows=2, cols=cols)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.style = "Light Grid Accent 1"
        for i, (val, label) in enumerate(items):
            table.cell(0, i).text = val
            table.cell(1, i).text = label
            for cell in [table.cell(0, i), table.cell(1, i)]:
                for paragraph in cell.paragraphs:
                    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_paragraph()

    def add_field_table(fields: list[tuple[str, str]]):
        table = doc.add_table(rows=len(fields) + 1, cols=2)
        table.style = "Light Grid Accent 1"
        table.cell(0, 0).text = "Field"
        table.cell(0, 1).text = "Value"
        for i, (label, value) in enumerate(fields):
            val_str = str(value) if value is not None and value != "" else "—"
            table.cell(i + 1, 0).text = label
            table.cell(i + 1, 1).text = val_str
        doc.add_paragraph()

    if report_type == "projects":
        add_heading(data.get("name") or "Project Report", 0)
        add_heading("Project Performance Summary", 1)
        doc.add_paragraph(f"Status: {data.get('status_label')}  |  Priority: {data.get('priority_label')}")

        add_kpi_table([
            (f"{data.get('completion_rate', 0)}%", "Completion"),
            (str(data.get("total_tasks", 0)), "Total Tasks"),
            (str(data.get("completed_tasks", 0)), "Completed"),
            (str(data.get("pending_tasks", 0)), "Pending"),
        ])

        add_heading("Overview", 2)
        add_field_table([
            ("Status", data.get("status_label")),
            ("Priority", data.get("priority_label")),
            ("Start Date", str(data.get("start_date") or "—")),
            ("End Date", str(data.get("end_date") or "—")),
            ("PM", data.get("pm")),
            ("Lead", data.get("lead")),
        ])

        add_heading("Tasks & Progress", 2)
        add_field_table([
            ("Total Tasks", str(data.get("total_tasks", 0))),
            ("Completed", str(data.get("completed_tasks", 0))),
            ("Pending", str(data.get("pending_tasks", 0))),
            ("Total Subtasks", str(data.get("total_subtasks", 0))),
            ("Completed Subtasks", str(data.get("completed_subtasks", 0))),
        ])

        add_heading("Health & Metrics", 2)
        add_field_table([
            ("Health Score", str(data.get("health_score", 0))),
            ("Blocked", str(data.get("blocked_count", 0))),
            ("Overdue", str(data.get("overdue_count", 0))),
            ("Meetings", str(data.get("meeting_count", 0))),
        ])

    elif report_type == "tasks":
        add_heading(data.get("title") or "Task Report", 0)
        add_heading("Task Details & Activity", 1)

        add_kpi_table([
            (data.get("status_label") or "—", "Status"),
            (data.get("priority_label") or "—", "Priority"),
            (f"{data.get('estimated_hours', '—')}h" if data.get("estimated_hours") else "—", "Est. Hours"),
            (str(len(data.get("comments", []))), "Comments"),
        ])

        add_heading("Time & Dates", 2)
        add_field_table([
            ("Created", str(data.get("created_at") or "—")),
            ("Started", str(data.get("started_date") or "—")),
            ("Completed", str(data.get("completed_date") or "—")),
            ("Due Date", str(data.get("due_date") or "—")),
        ])

        add_heading("Details", 2)
        add_field_table([
            ("Project", data.get("project_name")),
            ("Author", data.get("author")),
            ("Attachments", str(data.get("attachment_count", 0))),
        ])

    elif report_type == "subtasks":
        add_heading(data.get("title") or "Subtask Report", 0)
        add_heading("Subtask Details", 1)

        add_kpi_table([
            (data.get("status_label") or "—", "Status"),
            (data.get("priority_label") or "—", "Priority"),
            (f"{data.get('completion_time', '—')}h" if data.get("completion_time") else "—", "Completion"),
            (str(data.get("attachment_count", 0)), "Attachments"),
        ])

        add_heading("Time & Dates", 2)
        add_field_table([
            ("Created", str(data.get("created_at") or "—")),
            ("Started", str(data.get("started_date") or "—")),
            ("Completed", str(data.get("completed_date") or "—")),
            ("Due Date", str(data.get("due_date") or "—")),
        ])

        add_heading("Details", 2)
        add_field_table([
            ("Parent Task", data.get("parent_task_title")),
            ("Project", data.get("project_name")),
            ("Attachments", str(data.get("attachment_count", 0))),
        ])

    elif report_type == "employees":
        add_heading(data.get("name") or "Employee Report", 0)
        add_heading("Employee Performance Summary", 1)

        add_kpi_table([
            (str(data.get("assigned_tasks", 0)), "Tasks"),
            (str(data.get("completed_tasks", 0)), "Completed"),
            (str(data.get("overdue_tasks", 0)), "Overdue"),
            (f"{data.get('completion_rate', 0)}%", "Rate"),
        ])

        add_heading("Workload", 2)
        add_kpi_table([
            (str(data.get("assigned_subtasks", 0)), "Subtasks"),
            (str(data.get("completed_subtasks", 0)), "Subtasks Done"),
            (f"{data.get('total_hours', 0)}h", "Total Hours"),
            (f"{data.get('average_completion_time', '—')}h" if data.get("average_completion_time") else "—", "Avg Completion"),
        ])

        add_heading("Details", 2)
        add_field_table([
            ("Role", data.get("role")),
            ("Department", data.get("department")),
            ("Designation", data.get("designation")),
            ("Employee ID", data.get("employee_id")),
            ("Projects", str(data.get("project_count", 0))),
            ("Productivity Score", f"{data.get('productivity_score', 0)}/100"),
        ])

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"Generated by Internal Task Manager · {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


DOCX_GENERATORS = {
    "projects": generate_docx,
    "tasks": generate_docx,
    "subtasks": generate_docx,
    "employees": generate_docx,
}
