import { useState, useEffect } from 'react';
import { Typography, Panel, Flex, IconButton, Button } from '@maxhub/max-ui';
import { EventFormPanel } from './EventFormPanel';
import { AttendantsPanel } from './AttendantsPanel';
import type { EventInfoResponse } from '../../api/types';
 
const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const EditEventsPanel = ({ onBack }: { onBack: () => void }) => {
  const [events, setEvents] = useState<EventInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'attendants'>('list');
  const [editingEvent, setEditingEvent] = useState<EventInfoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attendants, setAttendants] = useState<UserSearchItem[]>([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events', { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data: EventInfoResponse[] = await res.json();
      data.sort((a, b) => {
        if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
        return a.date.localeCompare(b.date);
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetState = () => {
    setCurrentView('list');
    setEditingEvent(null);
    setAttendants([]);
  };

  const handleCreate = async (body: Record<string, any>) => {
    try {
      setError(null);
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `Ошибка ${res.status}`);
      }
      await fetchEvents();
      resetState();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать событие');
    }
  };

  const handleEditClick = async (event: EventInfoResponse) => {
    try {
      const detailRes = await fetch(`/api/events/${event.id}`, { credentials: 'include' });
      if (!detailRes.ok) throw new Error('Ошибка загрузки события');
      const detail: EventInfoResponse = await detailRes.json();
      setEditingEvent(detail);
      setCurrentView('edit');
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
    }
  };

  const handleUpdate = async (body: Record<string, any>) => {
    if (!editingEvent) return;
    try {
      setError(null);
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка обновления');
      }
      await fetchEvents();
      resetState();
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить событие');
    }
  };

  const handleAttendantsClick = async (event: EventInfoResponse) => {
    try {
      const attRes = await fetch(`/api/admin/events/${event.id}/attendants`, {
        credentials: 'include',
      });
      const attData: UserSearchItem[] = attRes.ok ? await attRes.json() : [];
      setAttendants(attData);
      setEditingEvent(event);
      setCurrentView('attendants');
    } catch (err: any) {
      setError('Не удалось загрузить посетителей');
    }
  };

  const handleSaveAttendants = async (attendantIds: number[]) => {
    if (!editingEvent) return;
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}/attendants`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendantIds),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      resetState();
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить посетителей');
    }
  };

  const handleDelete = async (eventId: number, eventName: string) => {
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить мероприятие "${eventName}"?`
    );
    if (!confirmed) return;

    try {
      setError(null);
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка удаления');
      }
      await fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить событие');
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>;

  // ---------- Режим просмотра / редактирования посетителей ----------
  if (currentView === 'attendants' && editingEvent) {
    return (
      <AttendantsPanel
        event={editingEvent}
        initialAttendants={attendants}
        onSave={handleSaveAttendants}
        onBack={resetState}
      />
    );
  }

  // ---------- Список событий ----------
  if (currentView === 'list') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: 8,
              background: '#ffebee',
              borderRadius: 8,
              color: '#d32f2f',
            }}
          >
            <Typography.Body>{error}</Typography.Body>
          </div>
        )}
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
            <IconButton mode="tertiary" onClick={onBack}>
              <span style={{ fontSize: 20 }}>←</span>
            </IconButton>
            <Typography.Title variant="medium-strong">Редактирование</Typography.Title>
            <div style={{ width: 48 }} />
          </Flex>

          <Button
            mode="primary"
            stretched
            onClick={() => {
              setEditingEvent(null);
              setCurrentView('create');
            }}
            style={{ backgroundColor: '#4caf50', borderColor: '#4caf50', marginBottom: 12 }}
          >
            ➕
          </Button>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {events.map((event) => (
              <Panel
                key={event.id}
                mode="secondary"
                style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}
              >
                <Flex justify="space-between" align="center">
                  <Typography.Body style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {event.is_archived && <span>📦</span>}
                    {event.title}
                  </Typography.Body>
                  <Typography.Body
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatDate(event.date)}
                  </Typography.Body>
                  <Flex direction="column" gap={4} style={{ flexShrink: 0 }}>
                    {/* Кнопка посетителей */}
                    <Button
                      mode="tertiary"
                      size="small"
                      onClick={() => handleAttendantsClick(event)}
                      style={{ backgroundColor: '#1976d2', color: '#fff' }}
                    >
                      👥
                    </Button>
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
                      onClick={() => handleDelete(event.id, event.title)}
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

  // ---------- Создание / Редактирование события ----------
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
          <IconButton mode="tertiary" onClick={resetState}>
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
            onCancel={resetState}
          />
        </div>
      </Panel>
    </div>
  );
};

export default EditEventsPanel;