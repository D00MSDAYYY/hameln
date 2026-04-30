import { useState, useEffect } from 'react';
import { Typography, Panel, Flex, IconButton, Button } from '@maxhub/max-ui';
import { EventFormPanel } from './EventFormPanel';
import type { EventItem, EventDetail } from '../../api/types';

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
};

const EditEventsPanel = ({ onBack }: { onBack: () => void }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingEvent, setEditingEvent] = useState<EventDetail | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events', { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data: EventItem[] = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (body: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Ошибка создания');
      await fetchEvents();
      setCurrentView('list');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (event: EventItem) => {
    fetch(`/api/events/${event.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then((detail: EventDetail) => {
        setEditingEvent(detail);
        setCurrentView('edit');
      });
  };

  const handleUpdate = async (body: Record<string, any>) => {
    if (!editingEvent) return;
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        // Отправляем все текущие поля формы + id события
        body: JSON.stringify({ id: editingEvent.id, ...body }),
      });
      if (!res.ok) throw new Error('Ошибка обновления');
      await fetchEvents();
      setCurrentView('list');
      setEditingEvent(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>;

  // Представление: список мероприятий
  if (currentView === 'list') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Panel
          mode="primary"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, borderRadius: 16, overflow: 'hidden' }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <IconButton mode="tertiary" onClick={onBack}>
              <span style={{ fontSize: 20 }}>←</span>
            </IconButton>
            <Typography.Title variant="medium-strong">Редактирование</Typography.Title>
            <div style={{ width: 48 }} />
          </Flex>

          {/* Зелёная кнопка создания */}
          <div style={{ marginBottom: 12 }}>
            <Button
              mode="primary"
              stretched
              onClick={() => { setEditingEvent(null); setCurrentView('create'); }}
              style={{ backgroundColor: '#4caf50', borderColor: '#4caf50' }}
            >
              ➕
            </Button>
          </div>

          {/* Прокручиваемый список */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {events.map(event => (
              <Panel key={event.id} mode="secondary" style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}>
                <Flex justify="space-between" align="center">
                  <Typography.Body style={{ flex: 1 }}>{event.name}</Typography.Body>
                  <Typography.Body style={{ flex: 1, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {formatDate(event.date)}
                  </Typography.Body>
                  <Flex gap={8} style={{ flexShrink: 0 }}>
                    <Button
                      mode="tertiary"
                      size="small"
                      onClick={() => handleEditClick(event)}
                      style={{ backgroundColor: '#555', color: '#fff' }}
                    >
                      ✏️
                    </Button>
                    <Button
                      mode="tertiary"
                      size="small"
                      onClick={() => console.log('Удалить', event.id)}
                      style={{ backgroundColor: '#d32f2f', color: '#fff' }}
                    >
                      🗑️
                    </Button>
                  </Flex>
                </Flex>
              </Panel>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  // Представление: создание или редактирование
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Panel
        mode="primary"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <IconButton mode="tertiary" onClick={() => { setCurrentView('list'); setEditingEvent(null); }}>
            <span style={{ fontSize: 20 }}>←</span>
          </IconButton>
          <Typography.Title variant="medium-strong">
            {currentView === 'create' ? 'Новое мероприятие' : 'Редактирование мероприятия'}
          </Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <EventFormPanel
            initial={editingEvent || undefined}
            onSave={editingEvent ? handleUpdate : handleCreate}
            onCancel={() => { setCurrentView('list'); setEditingEvent(null); }}
          />
        </div>
      </Panel>
    </div>
  );
};

export default EditEventsPanel;