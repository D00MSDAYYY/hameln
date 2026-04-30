from datetime import datetime, timedelta
from models import *

# ========== Пользователи ==========
users_db = [
    User(
        id=1,
        nickname="ivanov",
        points=150,
        company="ООО Рога и Копыта",
        password="12",
        role=Roles.user,
    ),
    User(
        id=2,
        nickname="petrov",
        points=200,
        company="ЗАО Пример",
        password="123",
        role=Roles.user,
    ),
    User(
        id=3,
        nickname="admin",
        points=999,
        company="Администрация",
        password="1234",
        role=Roles.admin,
    ),
]

# ========== События ==========
events_db = [
    Event(
        id=1,
        name="Конференция VK Mini Apps",
        description="Ежегодная конференция для разработчиков мини-приложений ВКонтакте.",
        tags=["VK", "Mini Apps", "Разработка"],
        points=150,
        date="2025-06-15T10:00",
        link="https://vk.com/dev/events",
        is_archived=False,
    ),
    Event(
        id=2,
        name="React Advanced: Мастер-класс",
        description="Углубленный мастер-класс по продвинутым техникам React.",
        tags=["React", "Frontend", "JavaScript"],
        points=200,
        date="2025-06-20T14:00",
        is_archived=False,
    ),
    Event(
        id=3,
        name="Python для анализа данных",
        description="Введение в Python с акцентом на анализ данных.",
        tags=["Python", "Data Science", "Аналитика"],
        points=100,
        date="2025-07-01T18:00",
        is_archived=False,
    ),
    Event(
        id=4,
        name="Хакатон «Код здоровья»",
        description="Соревнование по созданию IT-решений для медицины.",
        tags=["Хакатон", "Медицина", "Python"],
        points=300,
        date="2025-07-10T09:00",
        link="https://healthcode.example.com",
        is_archived=False,
    ),
    Event(
        id=5,
        name="Старый Новый Год (архив)",
        description="Давно прошедшее праздничное мероприятие.",
        tags=["Праздник", "Архив"],
        points=50,
        date="2023-01-14T20:00",
        is_archived=True,
    ),
    Event(
        id=6,
        name="Основы Docker (архив)",
        description="Практический воркшоп по контейнеризации.",
        tags=["Docker", "DevOps", "Архив"],
        points=120,
        date="2024-09-01T10:00",
        is_archived=True,
    ),
]

# ========== Уведомления ==========
notifications_db = [
    Notification(
        id=1,
        title="Конференция уже завтра!",
        body="Не забудьте посетить конференцию VK Mini Apps завтра в 10:00.",
        created_at=(datetime.now() - timedelta(hours=2)).isoformat(),
    ),
    Notification(
        id=2,
        title="Новое событие добавлено",
        body="Открыта регистрация на хакатон «Код здоровья».",
        created_at=(datetime.now() - timedelta(days=1)).isoformat(),
    ),
    Notification(
        id=3,
        title="Изменение в расписании",
        body="React мастер-класс перенесён на 20 июня 14:00.",
        created_at=(datetime.now() - timedelta(days=2)).isoformat(),
    ),
]

# ========== Регистрации ==========
registrations_db = [
    Registration(user_id=1, event_id=1),  # ivanov идёт на конференцию
    Registration(user_id=1, event_id=2),  # ivanov идёт на React
    Registration(user_id=2, event_id=3),  # petrov идёт на Python
    Registration(user_id=2, event_id=4),  # petrov идёт на хакатон
    Registration(user_id=3, event_id=1),  # admin тоже на конференцию
]

# ========== Теги ==========
tags_db = [
    Tag(id=1, name="React"),
    Tag(id=2, name="Frontend"),
    Tag(id=3, name="Python"),
    Tag(id=4, name="Backend"),
    Tag(id=5, name="API"),
    Tag(id=6, name="VK"),
    Tag(id=7, name="Mini Apps"),
    Tag(id=8, name="Сообщество"),
    Tag(id=9, name="iOS"),
    Tag(id=10, name="Android"),
    Tag(id=11, name="Flutter"),
    Tag(id=12, name="Data Science"),
    Tag(id=13, name="Аналитика"),
    Tag(id=14, name="DevOps"),
    Tag(id=15, name="Docker"),
    Tag(id=16, name="Kubernetes"),
    Tag(id=17, name="Хакатон"),
    Tag(id=18, name="Медицина"),
    Tag(id=19, name="Алгоритмы"),
    Tag(id=20, name="C++"),
]

# Хранилище сессий (сюда сессии будут добавляться при логине)
sessions_db = {}

# Счётчик ID для новых событий
event_id_counter = max(e.id for e in events_db) + 1
