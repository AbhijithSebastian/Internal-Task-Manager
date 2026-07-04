import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not settings.smtp_host:
        logger.warning("SMTP not configured — email not sent to %s", to_email)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        logger.info("Email sent to %s", to_email)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False


def send_password_reset_email(to_email: str, token: str, name: str) -> bool:
    reset_url = f"{settings.frontend_url}/reset-password?token={token}&email={to_email}"
    html = f"""
    <html><body style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>Hello {name},</p>
        <p>Click the button below to reset your password. This link expires in {settings.password_reset_token_expire_minutes} minutes.</p>
        <p style="text-align: center;">
            <a href="{reset_url}" style="display: inline-block; padding: 12px 24px; background-color: #2563EB; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>— Internal Task Manager</p>
    </body></html>
    """
    return send_email(to_email, "Reset Your Password", html)
