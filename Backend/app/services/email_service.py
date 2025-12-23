import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..config import get_settings

settings = get_settings()


def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
    """
    Enviar email usando SMTP
    Retorna True si se envió correctamente, False si hubo error
    """
    if not settings.EMAIL_CONFIGURED:
        print(f"⚠️  Email no configurado. No se pudo enviar email a {to_email}")
        print(f"   Para configurar: establece SMTP_USER y SMTP_PASSWORD en las variables de entorno")
        return False

    try:
        # Crear mensaje
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        # Agregar contenido de texto plano (fallback)
        if text_content:
            part1 = MIMEText(text_content, "plain")
            msg.attach(part1)

        # Agregar contenido HTML
        part2 = MIMEText(html_content, "html")
        msg.attach(part2)

        # Conectar y enviar
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

        print(f"✅ Email enviado exitosamente a {to_email}")
        return True

    except Exception as e:
        print(f"❌ Error al enviar email a {to_email}: {str(e)}")
        return False


def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> bool:
    """
    Enviar email de restablecimiento de contraseña
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    subject = "Restablecer tu contraseña - MathMaster"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .warning {{ background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MathMaster</h1>
                <p>Restablecer Contraseña</p>
            </div>
            <div class="content">
                <h2>Hola {user_name},</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MathMaster.</p>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Restablecer Contraseña</a>
                </div>

                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-size: 12px;">
                    {reset_url}
                </p>

                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este enlace expirará en 1 hora.</li>
                        <li>Si no solicitaste restablecer tu contraseña, puedes ignorar este email.</li>
                    </ul>
                </div>
            </div>
            <div class="footer">
                <p>Este email fue enviado automáticamente por MathMaster.</p>
                <p>Por favor no respondas a este mensaje.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Hola {user_name},

    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MathMaster.

    Para crear una nueva contraseña, visita el siguiente enlace:
    {reset_url}

    Este enlace expirará en 1 hora.

    Si no solicitaste restablecer tu contraseña, puedes ignorar este email.

    Saludos,
    El equipo de MathMaster
    """

    return send_email(to_email, subject, html_content, text_content)
