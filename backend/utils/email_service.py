import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_reset_email(to_email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    subject = "Reset your InterviewAI password"
    body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #D97757;">Reset your password</h2>
        <p>We received a request to reset your InterviewAI password. Click the button below to set a new one.</p>
        <a href="{reset_link}" style="display:inline-block; padding:12px 24px; background:#D97757; color:#fff; text-decoration:none; border-radius:8px; margin:16px 0;">
            Reset Password
        </a>
        <p style="color:#888; font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
    """

    msg = MIMEMultipart()
    msg["From"] = GMAIL_USER
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())