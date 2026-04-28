import { useState, useEffect } from 'react';
import { Panel, Typography, Flex, IconButton } from '@maxhub/max-ui';
import type { EventItem } from '../../api/types';


interface ArchiveEventsPanelProps {
  onBack: () => void;
}

const ArchiveEventsPanel = ({ onBack }: ArchiveEventsPanelProps) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api//admin/events/archived', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Ошибка загрузки архива');
        const data: EventItem[] = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Загрузка архива...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>Ошибка: {error}</div>;

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
          <IconButton mode="tertiary" onClick={onBack}>
            <span style={{ fontSize: 20 }}>←</span>
          </IconButton>
          <Typography.Title variant="medium-strong">Архив всех мероприятий</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {events.length === 0 ? (
            <Typography.Body style={{ textAlign: 'center' }}>Архив пуст</Typography.Body>
          ) : (
            events.map((event) => (
              <Panel key={event.id} mode="secondary" style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}>
                <Flex justify="space-between" align="center">
                  <Typography.Body style={{ flex: 1 }}>{event.name}</Typography.Body>
                  <Typography.Body style={{ flex: 1, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {event.date}
                  </Typography.Body>
                  <Typography.Body style={{ flexShrink: 0, fontWeight: 600 }}>
                    🏆 {event.points}
                  </Typography.Body>
                </Flex>
              </Panel>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
};

export default ArchiveEventsPanel;