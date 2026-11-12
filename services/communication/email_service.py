import smtplib
import logging
from email.header import Header
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

        to_email_str = str(to_email).strip()
        if not to_email_str.isascii():
            logger.error(f"Cannot send email to invalid non-ASCII address: {to_email_str}")
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = Header(subject, "utf-8").encode()
            
            from_name = Header(settings.SMTP_FROM_NAME or "Diwan", "utf-8").encode()
            msg["From"] = f"{from_name} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email_str

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

            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email_str], msg.as_string())
            server.quit()
            logger.info(f"Successfully sent email to {to_email_str} with subject: {subject}")
        except Exception as e:
            logger.error(f"Failed to send SMTP email to {to_email_str}: {str(e)}")

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

    @staticmethod
    def send_register_otp_email(to_email: str, name: str, otp_code: str, lang: str = "ar") -> None:
        """
        Sends an email with a 6-digit OTP code to verify account registration.
        """
        user_name = name or "مستخدم ديوان"
        if lang == "ar":
            subject = "رمز تأكيد حسابك - منصة ديوان للاستشارات الضريبية"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #0D3C5C 0%, #005D9C 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; text-align: right; }}
        .greeting {{ font-size: 16px; font-weight: bold; color: #0D3C5C; margin-bottom: 15px; }}
        .info-text {{ font-size: 14px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 25px 0; background: #f0f7ff; border: 2px dashed #005D9C; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0D3C5C; display: inline-block; }}
        .warning-text {{ font-size: 12.5px; color: #64748B; background-color: #f8fafc; padding: 12px 15px; border-radius: 6px; border-right: 4px solid #E5A83B; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>منصة ديوان للاستشارات الضريبية الذكية</h1>
        </div>
        <div class="content">
            <div class="greeting">مرحباً {user_name}،</div>
            <div class="info-text">
                أهلاً بك في منصة ديوان. يرجى استخدام رمز التحقق التالي لتأكيد حسابك وإتمام عملية التسجيل:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                🔒 تنبيه: هذا الرمز صالح لمدة 10 دقائق فقط. نستخدم رمز التحقق لحماية حسابك والتأكد من هويتك.
            </div>
        </div>
        <div class="footer">
            <p>هذا البريد تم إرساله تلقائياً من منصة ديوان للاستشارات الضريبية، يرجى عدم الرد عليه.</p>
            <p>&copy; 2026 منصة ديوان. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>"""
        else:
            subject = "Account Verification Code - Diwan Tax Platform"
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #0D3C5C 0%, #005D9C 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; }}
        .greeting {{ font-size: 16px; font-weight: bold; color: #0D3C5C; margin-bottom: 15px; }}
        .info-text {{ font-size: 14px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 25px 0; background: #f0f7ff; border: 2px dashed #005D9C; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0D3C5C; display: inline-block; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Diwan Tax Platform</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {user_name},</div>
            <div class="info-text">
                Welcome to Diwan Tax. Please use the following verification code to verify your account:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 Diwan Tax Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_password_otp_email(to_email: str, name: str, otp_code: str, lang: str = "ar") -> None:
        """
        Sends an email with a 6-digit OTP code for password reset.
        """
        if lang == "ar":
            subject = "رمز التحقق لإعادة تعيين كلمة المرور - منصة الاستشارات"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; text-align: right; }}
        .greeting {{ font-size: 17px; font-weight: bold; color: #1e3c72; margin-bottom: 15px; }}
        .info-text {{ font-size: 15px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 30px 0; background: #f0f4ff; border: 2px dashed #2a5298; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e3c72; display: inline-block; }}
        .warning-text {{ font-size: 13px; color: #d9534f; background-color: #fff0f0; padding: 12px 15px; border-radius: 6px; border-right: 4px solid #d9534f; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
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
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. يرجى استخدام رمز التحقق التالي لإتمام العملية:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                ⚠️ تنبيه: هذا الرمز صالح لمدة 10 دقائق فقط. لا تشارك هذا الرمز مع أي شخص لحماية أمان حسابك.
            </div>
        </div>
        <div class="footer">
            <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
            <p>&copy; 2026 منصة الاستشارات الضريبية والقانونية. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>"""
        else:
            subject = "Password Reset Verification Code - Consultation Platform"
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; }}
        .greeting {{ font-size: 17px; font-weight: bold; color: #1e3c72; margin-bottom: 15px; }}
        .info-text {{ font-size: 15px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 30px 0; background: #f0f4ff; border: 2px dashed #2a5298; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e3c72; display: inline-block; }}
        .warning-text {{ font-size: 13px; color: #d9534f; background-color: #fff0f0; padding: 12px 15px; border-radius: 6px; border-left: 4px solid #d9534f; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
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
                We received a request to reset your password. Use the following verification code to complete the process:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                ⚠️ Note: This code is valid for 10 minutes only. Never share this code with anyone.
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_register_otp_email(to_email: str, name: str, otp_code: str, lang: str = "ar") -> None:
        """
        Sends an email with a 6-digit OTP code to verify account registration.
        """
        user_name = name or "مستخدم ديوان"
        if lang == "ar":
            subject = "رمز تأكيد حسابك - منصة ديوان للاستشارات الضريبية"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #0D3C5C 0%, #005D9C 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; text-align: right; }}
        .greeting {{ font-size: 16px; font-weight: bold; color: #0D3C5C; margin-bottom: 15px; }}
        .info-text {{ font-size: 14px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 25px 0; background: #f0f7ff; border: 2px dashed #005D9C; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0D3C5C; display: inline-block; }}
        .warning-text {{ font-size: 12.5px; color: #64748B; background-color: #f8fafc; padding: 12px 15px; border-radius: 6px; border-right: 4px solid #E5A83B; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>منصة ديوان للاستشارات الضريبية الذكية</h1>
        </div>
        <div class="content">
            <div class="greeting">مرحباً {user_name}،</div>
            <div class="info-text">
                أهلاً بك في منصة ديوان. يرجى استخدام رمز التحقق التالي لتأكيد حسابك وإتمام عملية التسجيل:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                🔒 تنبيه: هذا الرمز صالح لمدة 10 دقائق فقط. نستخدم رمز التحقق لحماية حسابك والتأكد من هويتك.
            </div>
        </div>
        <div class="footer">
            <p>هذا البريد تم إرساله تلقائياً من منصة ديوان للاستشارات الضريبية، يرجى عدم الرد عليه.</p>
            <p>&copy; 2026 منصة ديوان. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>"""
        else:
            subject = "Account Verification Code - Diwan Tax Platform"
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #0D3C5C 0%, #005D9C 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; }}
        .greeting {{ font-size: 16px; font-weight: bold; color: #0D3C5C; margin-bottom: 15px; }}
        .info-text {{ font-size: 14px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 25px 0; background: #f0f7ff; border: 2px dashed #005D9C; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0D3C5C; display: inline-block; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Diwan Tax Platform</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {user_name},</div>
            <div class="info-text">
                Welcome to Diwan Tax. Please use the following verification code to verify your account:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 Diwan Tax Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_email_change_otp(to_email: str, name: str, otp_code: str, lang: str = "ar") -> None:
        """
        Sends an email with a 6-digit OTP code to verify a new email address.
        """
        if lang == "ar":
            subject = "رمز التحقق لتغيير البريد الإلكتروني - منصة الاستشارات"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; text-align: right; }}
        .greeting {{ font-size: 17px; font-weight: bold; color: #11998e; margin-bottom: 15px; }}
        .info-text {{ font-size: 15px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 30px 0; background: #eafaf1; border: 2px dashed #11998e; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #11998e; display: inline-block; }}
        .warning-text {{ font-size: 13px; color: #555555; background-color: #f8f9fa; padding: 12px 15px; border-radius: 6px; border-right: 4px solid #11998e; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
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
                تلقينا طلباً لربط هذا البريد الإلكتروني بحسابك في منصة الاستشارات. يرجى إدخال رمز التحقق التالي لتأكيد البريد:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                ⚠️ تنبيه: هذا الرمز صالح لمدة 15 دقيقة. إذا لم تكن قد طلبت تغيير بريدك الإلكتروني، يرجى تجاهل هذه الرسالة.
            </div>
        </div>
        <div class="footer">
            <p>هذا البريد تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
            <p>&copy; 2026 منصة الاستشارات الضريبية والقانونية. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>"""
        else:
            subject = "Email Change Verification Code - Consultation Platform"
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; }}
        .greeting {{ font-size: 17px; font-weight: bold; color: #11998e; margin-bottom: 15px; }}
        .info-text {{ font-size: 15px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 30px 0; background: #eafaf1; border: 2px dashed #11998e; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #11998e; display: inline-block; }}
        .warning-text {{ font-size: 13px; color: #555555; background-color: #f8f9fa; padding: 12px 15px; border-radius: 6px; border-left: 4px solid #11998e; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
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
                We received a request to update your account email to this address. Use the following code to confirm your new email:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                ⚠️ Note: This code expires in 15 minutes. If you did not make this request, please ignore this email.
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_register_otp_email(to_email: str, name: str, otp_code: str, lang: str = "ar") -> None:
        """
        Sends an email with a 6-digit OTP code to verify account registration.
        """
        user_name = name or "مستخدم ديوان"
        if lang == "ar":
            subject = "رمز تأكيد حسابك - منصة ديوان للاستشارات الضريبية"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #0D3C5C 0%, #005D9C 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; text-align: right; }}
        .greeting {{ font-size: 16px; font-weight: bold; color: #0D3C5C; margin-bottom: 15px; }}
        .info-text {{ font-size: 14px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 25px 0; background: #f0f7ff; border: 2px dashed #005D9C; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0D3C5C; display: inline-block; }}
        .warning-text {{ font-size: 12.5px; color: #64748B; background-color: #f8fafc; padding: 12px 15px; border-radius: 6px; border-right: 4px solid #E5A83B; margin-top: 20px; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>منصة ديوان للاستشارات الضريبية الذكية</h1>
        </div>
        <div class="content">
            <div class="greeting">مرحباً {user_name}،</div>
            <div class="info-text">
                أهلاً بك في منصة ديوان. يرجى استخدام رمز التحقق التالي لتأكيد حسابك وإتمام عملية التسجيل:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
            <div class="warning-text">
                🔒 تنبيه: هذا الرمز صالح لمدة 10 دقائق فقط. نستخدم رمز التحقق لحماية حسابك والتأكد من هويتك.
            </div>
        </div>
        <div class="footer">
            <p>هذا البريد تم إرساله تلقائياً من منصة ديوان للاستشارات الضريبية، يرجى عدم الرد عليه.</p>
            <p>&copy; 2026 منصة ديوان. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>"""
        else:
            subject = "Account Verification Code - Diwan Tax Platform"
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #0D3C5C 0%, #005D9C 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; }}
        .greeting {{ font-size: 16px; font-weight: bold; color: #0D3C5C; margin-bottom: 15px; }}
        .info-text {{ font-size: 14px; color: #555555; margin-bottom: 25px; }}
        .otp-box {{ text-align: center; margin: 25px 0; background: #f0f7ff; border: 2px dashed #005D9C; border-radius: 10px; padding: 20px; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0D3C5C; display: inline-block; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Diwan Tax Platform</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {user_name},</div>
            <div class="info-text">
                Welcome to Diwan Tax. Please use the following verification code to verify your account:
            </div>
            <div class="otp-box">
                <span class="otp-code">{otp_code}</span>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 Diwan Tax Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        EmailService.send_email(to_email, subject, html_content)

    @staticmethod
    def send_email_changed_security_alert(to_old_email: str, name: str, new_email: str, lang: str = "ar") -> None:
        """
        Sends a security notification to the old email notifying the user that their email was updated.
        """
        if lang == "ar":
            subject = "تنبيه أمان: تم تغيير البريد الإلكتروني لحسابك"
            html_content = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; text-align: right; }}
        .greeting {{ font-size: 17px; font-weight: bold; color: #eb3349; margin-bottom: 15px; }}
        .info-text {{ font-size: 15px; color: #555555; margin-bottom: 20px; }}
        .alert-box {{ background: #fff5f5; border-right: 4px solid #eb3349; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #333; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>منصة الاستشارات - تنبيه أمني</h1>
        </div>
        <div class="content">
            <div class="greeting">مرحباً {name}،</div>
            <div class="info-text">
                نود إعلامك بأنه تم تغيير البريد الإلكتروني المرتبط بحسابك بنجاح إلى: <strong>{new_email}</strong>.
            </div>
            <div class="alert-box">
                إذا لم تكن أنت من قام بهذا الإجراء، يرجى التواصل فوراً مع فريق الدعم الفني لإيقاف الحساب واستعادته بأمان.
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 منصة الاستشارات الضريبية والقانونية. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>"""
        else:
            subject = "Security Alert: Your Account Email Has Been Changed"
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }}
        .container {{ max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }}
        .header {{ background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: #ffffff; text-align: center; padding: 30px 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .content {{ padding: 30px; line-height: 1.8; }}
        .greeting {{ font-size: 17px; font-weight: bold; color: #eb3349; margin-bottom: 15px; }}
        .info-text {{ font-size: 15px; color: #555555; margin-bottom: 20px; }}
        .alert-box {{ background: #fff5f5; border-left: 4px solid #eb3349; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #333; }}
        .footer {{ background-color: #f8f9fa; text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #e1e8ed; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Consultation Platform - Security Alert</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {name},</div>
            <div class="info-text">
                This is a notification that the email address for your account has been successfully changed to: <strong>{new_email}</strong>.
            </div>
            <div class="alert-box">
                If you did not make this change, please contact support immediately to secure your account.
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2026 Consultation Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"""
        EmailService.send_email(to_old_email, subject, html_content)
