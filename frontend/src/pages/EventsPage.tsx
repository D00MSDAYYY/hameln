import { useState, useEffect } from 'react';
import { EventCard } from '../components/EventCard/EventCard';
import { EventInfoDisplayer } from '../components/EventInfoDisplayer';
import type { EventInfoResponse } from '../api/types';

const EventsPage = () => {
  const [events, setEvents] = useState<EventInfoResponse[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/events', { credentials: 'include' });
        if (!res.ok) throw new Error('Ошибка загрузки событий');
        const data: EventInfoResponse[] = await res.json();
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
    const res = await fetch(`/api/user/events/${eventId}`, { credentials: 'include' });
    const detail: EventInfoResponse = await res.json();
    setSelectedEvent(detail);
  };

  const handleBack = () => setSelectedEvent(null);

  const handleRegisterSwapped = async (eventId: number) => {
    try {
      const res = await fetch(`/api/user/events/${eventId}/register`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Ошибка регистрации:', data.detail);
        return;
      }
      setEvents(prev =>
        prev.map(e => (e.id === eventId ? { ...e, is_registered: true } : e))
      );
    } catch (err) {
      console.error('Ошибка регистрации', err);
    }
  };

  const handleUnregisterSwapped = async (eventId: number) => {
    try {
      const res = await fetch(`/api/user/events/${eventId}/register`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Ошибка отмены:', data.detail);
        return;
      }
      setEvents(prev =>
        prev.map(e => (e.id === eventId ? { ...e, is_registered: false } : e))
      );
    } catch (err) {
      console.error('Ошибка отмены регистрации', err);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Загрузка событий...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>Ошибка: {error}</div>;
  if (selectedEvent) {
    return <EventInfoDisplayer
      event={selectedEvent}
      onBack={() => setSelectedEvent(null)}
      onRegister={() => handleRegisterSwapped(selectedEvent.id)}
      onUnregister={() => handleUnregisterSwapped(selectedEvent.id)}
    />;
  }

  // Сортировка: сначала зарегистрированные, затем по возрастанию даты
  const sortedEvents = [...events].sort((a, b) => {
    if (a.is_registered && !b.is_registered) return -1;
    if (!a.is_registered && b.is_registered) return 1;
    return a.date.localeCompare(b.date);
  });

  return (
    <>
      {sortedEvents.map(event => (
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