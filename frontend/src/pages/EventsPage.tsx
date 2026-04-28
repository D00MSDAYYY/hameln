import { useState, useEffect } from 'react';
import { EventCard } from '../components/EventCard/EventCard';
import { EventInfoDisplayer } from '../components/EventInfoDisplayer';
import type { EventItem } from '../api/types';


const EventsPage = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/events', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Ошибка загрузки событий');
        }
        const data: EventItem[] = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);



  const handleMoreClick = async (eventId: number) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить детали');
      const detail: EventItem = await res.json();
      setSelectedEvent(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };
  const handleBack = () => setSelectedEvent(null);

  const handleRegisterSwapped = async (eventId: number) => {
    try {
      await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        credentials: 'include',
      });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: true } : e));
      console.log(`Зарегистрирован на событие ${eventId}`);
    } catch (err) {
      console.error('Ошибка регистрации', err);
    }
  };

  const handleUnregisterSwapped = async (eventId: number) => {
    try {
      await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: false } : e));
      console.log(`Отмена регистрации на событие ${eventId}`);
    } catch (err) {
      console.error('Ошибка отмены регистрации', err);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Загрузка событий...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>Ошибка: {error}</div>;
  if (loadingDetail) return <div style={{ padding: 16 }}>Загрузка деталей...</div>;
  if (selectedEvent) {
    return <EventInfoDisplayer event={selectedEvent} onBack={handleBack} />;
  }

  // Сортировка: сначала зарегистрированные, затем по возрастанию даты
  const sortedEvents = [...events].sort((a, b) => {
    if (a.is_registered && !b.is_registered) return -1;
    if (!a.is_registered && b.is_registered) return 1;
    return a.date.localeCompare(b.date);
  });

  return (
    <>
      {sortedEvents.map((event) => (
        <EventCard
          key={event.id}
          eventInfo={event}
          onMoreClick={() => handleMoreClick(event.id)}
          onRegisterSwapped={() => handleRegisterSwapped(event.id)}
          onUnregisterSwapped={() => handleUnregisterSwapped(event.id)}
        />
      ))}
    </>
  );
};

export default EventsPage;