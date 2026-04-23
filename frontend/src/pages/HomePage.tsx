import { useState } from 'react';
import { EventCard, EventInfo } from '../components/EventCard/EventCard';
import { EventInfoDisplayer } from '../components/EventInfoDisplayer';

const mockEvents: EventInfo[] = [
  {
    name: 'Конференция по React',
    tags: ['React', 'Frontend'],
    is_registered: false,
    points: 150,
    date: '25 мая 2025, 10:00',
  },
  {
    name: 'Воркшоп по FastAPI',
    tags: ['Python', 'Backend', 'API'],
    is_registered: true,
    points: 200,
    date: '27 мая 2025, 14:00',
  },
  {
    name: 'Встреча сообщества VK Mini Apps',
    tags: ['VK', 'Mini Apps', 'Сообщество'],
    is_registered: false,
    points: 75,
    date: '30 мая 2025, 18:30',
  },
  {
    name: 'Хакатон по мобильной разработке',
    tags: ['iOS', 'Android', 'Flutter'],
    is_registered: true,
    points: 300,
    date: '1–3 июня 2025',
  },
  {
    name: 'Лекция по дизайну интерфейсов',
    tags: ['UI/UX', 'Figma', 'Проектирование'],
    is_registered: false,
    points: 120,
    date: '5 июня 2025, 16:00',
  },
  {
    name: 'Курс по Docker и Kubernetes',
    tags: ['DevOps', 'Контейнеры', 'Оркестрация'],
    is_registered: false,
    points: 250,
    date: '10 июня 2025, 19:00',
  },
  {
    name: 'Вебинар по карьере в IT',
    tags: ['Резюме', 'Собеседования', 'Soft Skills'],
    is_registered: true,
    points: 50,
    date: '12 июня 2025, 20:00',
  },
  {
    name: 'Открытие летнего IT-лагеря',
    tags: ['Обучение', 'Нетворкинг', 'Активный отдых'],
    is_registered: false,
    points: 180,
    date: '15 июня 2025',
  },
  {
    name: 'Соревнования по спортивному программированию',
    tags: ['Алгоритмы', 'C++', 'Python'],
    is_registered: false,
    points: 400,
    date: '20 июня 2025, 11:00',
  },
  {
    name: 'Мастер-класс по публичным выступлениям',
    tags: ['Ораторство', 'Презентации', 'Коммуникация'],
    is_registered: false,
    points: 90,
    date: '22 июня 2025, 17:00',
  },
];

const HomePage = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);

  const handleMoreClick = (event: EventInfo) => setSelectedEvent(event);
  const handleBack = () => setSelectedEvent(null);
  const handleRegisterSwapped = (eventName: string) => console.log(`Зарегистрирован: ${eventName}`);
  const handleUnregisterSwapped = (eventName: string) => console.log(`Отмена: ${eventName}`);

  if (selectedEvent) {
    return <EventInfoDisplayer eventName={selectedEvent.name} onBack={handleBack} />;
  }

  return (
    <>
      {mockEvents.map((event) => (
        <EventCard
          key={event.name}
          eventInfo={event}
          onMoreClick={() => handleMoreClick(event)}
          onRegisterSwapped={() => handleRegisterSwapped(event.name)}
          onUnregisterSwapped={() => handleUnregisterSwapped(event.name)}
        />
      ))}
    </>
  );
};

export default HomePage;