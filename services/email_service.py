import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from helpers.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> None:
        """
        Sends an email using the configured SMTP server.
        If SMTP_HOST or SMTP_USERNAME is not set, it simulates sending the email in logs.
        """
        if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
            logger.info("==========================================")
            logger.info("SMTP email configurations are missing. SIMULATING EMAIL:")
            logger.info(f"To: {to_email}")
            logger.info(f"Subject: {subject}")
            logger.info("------------------------------------------")
            logger.info("HTML CONTENT SIMULATION:")
            # Log a small snippet
            logger.info(html_content[:500] + "...")
            logger.info("==========================================")
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            part = MIMEText(html_content, "html", "utf-8")
            msg.attach(part)

            # Establish SMTP connection
            if settings.SMTP_SSL:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                if settings.SMTP_TLS:
                    server.starttls()

            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Successfully sent email to {to_email} with subject: {subject}")
        except Exception as e:
            logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")
            raise e

    @staticmethod
    def send_password_reset_email(to_email: str, name: str, reset_link: str, lang: str = "ar") -> None:
        """
        Formats a beautifully styled dual/single language reset password email and sends it.
        """
        if lang == "ar":
            subject = "استعادة كلمة المرور - منصة الاستشارات"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
            color: #333333;
        }}
        .container {{
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e1e8ed;
        }}
        .header {{
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            text-align: center;
            padding: 35px 20px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .content {{
            padding: 35px 30px;
            line-height: 1.8;
            text-align: right;
        }}
        .greeting {{
            font-size: 18px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 20px;
        }}
        .info-text {{
            font-size: 15px;
            color: #555555;
            margin-bottom: 30px;
        }}
        .button-container {{
            text-align: center;
            margin: 35px 0;
        }}
        .btn {{
            background-color: #007bff;
            color: #ffffff !important;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            display: inline-block;
            box-shadow: 0 4px 10px rgba(0,123,255,0.25);
            transition: background-color 0.2s;
        }}
        .btn:hover {{
            background-color: #0056b3;
        }}
        .warning-text {{
            font-size: 13px;
            color: #ff3333;
            background-color: #fff0f0;
            padding: 10px 15px;
            border-radius: 6px;
            border-right: 4px solid #ff3333;
            margin-top: 25px;
        }}
        .footer {{
            background-color: #f8f9fa;
            text-align: center;
            padding: 25px;
            font-size: 12px;
            color: #777777;
            border-top: 1px solid #e1e8ed;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>منصة الاستشارات</h1>
        </div>
        <div class="content">
            <div class="greeting">مرحباً {name}،</div>
            <div class="info-text">
                لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. يرجى النقر على الزر أدناه لإعادة تعيينها:
            </div>
            <div class="button-container">
                <a href="{reset_link}" class="btn">إعادة تعيين كلمة المرور</a>
            </div>
            <div class="warning-text">
                ملاحظة: هذا الرابط صالح لمدة 15 دقيقة فقط. إذا لم تقم بطلب إعادة التعيين بنفسك، يرجى تجاهل هذا البريد الإلكتروني.
            </div>
        </div>
        <div class="footer">
            <p>هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
            <p>&copy; 2026 منصة الاستشارات. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>
"""
        else:
            subject = "Password Reset Request - Consultation Platform"
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
            color: #333333;
        }}
        .container {{
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border: 1px solid #e1e8ed;
        }}
        .header {{
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #ffffff;
            text-align: center;
            padding: 35px 20px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .content {{
            padding: 35px 30px;
            line-height: 1.8;
            text-align: left;
        }}
        .greeting {{
            font-size: 18px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 20px;
        }}
        .info-text {{
            font-size: 15px;
            color: #555555;
            margin-bottom: 30px;
        }}
        .button-container {{
            text-align: center;
            margin: 35px 0;
        }}
        .btn {{
            background-color: #007bff;
            color: #ffffff !important;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            display: inline-block;
            box-shadow: 0 4px 10px rgba(0,123,255,0.25);
            transition: background-color 0.2s;
        }}
        .btn:hover {{
            background-color: #0056b3;
        }}
        .warning-text {{
            font-size: 13px;
            color: #ff3333;
            background-color: #fff0f0;
            padding: 10px 15px;
            border-radius: 6px;
            border-left: 4px solid #ff3333;
            margin-top: 25px;
        }}
        .footer {{
            background-color: #f8f9fa;
            text-align: center;
            padding: 25px;
            font-size: 12px;
            color: #777777;
            border-top: 1px solid #e1e8ed;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Consultation Platform</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {name},</div>
            <div class="info-text">
                We received a request to reset the password for your account. Please click the button below to reset it:
            </div>
            <div class="button-container">
                <a href="{reset_link}" class="btn">Reset Password</a>
            </div>
            <div class="warning-text">
                Note: This link is valid for 15 minutes only. If you did not make this request yourself, please ignore this email.
            </div>
        </div>
        <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
        EmailService.send_email(to_email, subject, html_content)
