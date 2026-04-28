import { Panel, Typography, Button, Flex } from '@maxhub/max-ui';
import type { EventItem, EventDetail } from '../api/types';

interface EventInfoDisplayerProps {
  event: EventDetail;
  onBack: () => void;
}

export const EventInfoDisplayer = ({ event, onBack }: EventInfoDisplayerProps) => {
  const { name, description, date, tags, points, is_registered } = event;

  const formattedDate = new Date(date).toLocaleString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Panel
        mode="primary"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <Typography.Title variant="large-strong" style={{ marginBottom: 16 }}>
          {name}
        </Typography.Title>


        {description && (
          <Typography.Body style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
            {description}
          </Typography.Body>
        )}

        <Flex gap={8} wrap="wrap" style={{ marginBottom: 16 }}>
          {tags.map((tag, idx) => (
            <span key={idx} style={{
              background: 'var(--background-secondary, #f0f0f0)',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 14,
            }}>
              🏷️ {tag}
            </span>
          ))}
        </Flex>

        <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
          {is_registered && (
            <div style={{
              backgroundColor: '#4caf50',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 14,
            }}>
              ✓ Зарегистрирован
            </div>
          )}
        </Flex>

        <Button mode="primary" onClick={onBack} style={{ marginTop: 'auto' }}>
          Назад к списку
        </Button>
      </Panel>
    </div>
  );
};