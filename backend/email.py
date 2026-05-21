import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Union
import os

# Настройки SMTP (лучше вынести в переменные окружения)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")

def send_email(
    to_address: Union[str, List[str]],
    subject: str,
    body: str,
    is_html: bool = False,
    cc: Optional[Union[str, List[str]]] = None,
) -> bool:
    """
    Отправляет простое текстовое (или HTML) письмо без вложений.
    """
    if isinstance(to_address, str):
        to_address = [to_address]
    if cc is None:
        cc = []
    elif isinstance(cc, str):
        cc = [cc]

    msg = MIMEMultipart()
    msg["From"] = SMTP_USERNAME
    msg["To"] = ", ".join(to_address)
    msg["Subject"] = subject
    if cc:
        msg["Cc"] = ", ".join(cc)

    content_type = "html" if is_html else "plain"
    msg.attach(MIMEText(body, content_type, "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[Email] Сообщение отправлено на {', '.join(to_address)}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("[Email] Ошибка аутентификации. Проверьте логин и пароль.")
        return False
    except smtplib.SMTPException as e:
        print(f"[Email] Ошибка при отправке: {e}")
        return False