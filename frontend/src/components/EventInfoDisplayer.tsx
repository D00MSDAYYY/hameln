import { Panel, Typography, Button, Flex } from '@maxhub/max-ui';
import type { TagInfoResponse, EventInfoResponse } from '../api/types';

interface EventInfoDisplayerProps {
  event: EventInfoResponse;
  onBack: () => void;
  onRegister: () => void | Promise<void>;
  onUnregister: () => void | Promise<void>;
}

export const EventInfoDisplayer = ({
  event,
  onBack,
  onRegister,
  onUnregister,
}: EventInfoDisplayerProps) => {
  const {
    title,
    description,
    date,
    tags,
    points,
    is_registered,
    link,
    registered_users,
  } = event;
  const isUpcoming = date ? new Date(date).getTime() > Date.now() : false;

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
        {/* Заголовок + очки (как в карточке) */}
        <div style={{ marginBottom: 8 }}>
          <Flex justify="space-between" align="flex-start" gap={8}>
            <Typography.Title variant="large-strong" style={{ marginBottom: 0 }}>
              {title}
            </Typography.Title>
            {points > 0 && (
              <div
                style={{
                  backgroundColor: '#e5b73b',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              >
                ⭐ {points}
              </div>
            )}
          </Flex>
        </div>

        {/* Дата в стиле карточки (фиолетовый бейдж) */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 13,
              background: 'rgba(100, 9, 169, 0.1)',
              padding: '4px 8px',
              borderRadius: 12,
              display: 'inline-block',
              backdropFilter: 'blur(2px)',
              border: '1px solid rgba(0,0,0,0.05)',
              color: '#333',
            }}
          >
            🗓️ {formattedDate}
          </span>
        </div>

        {description && (
          <Typography.Body style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
            {description}
          </Typography.Body>
        )}

        <Flex gap={8} wrap="wrap" style={{ marginBottom: 16 }}>
          {tags?.map((tag: TagInfoResponse, idx) => (
            <span
              key={idx}
              style={{
                background: 'var(--background-secondary, #f0f0f0)',
                padding: '4px 8px',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              🏷️ {tag.title}
            </span>
          ))}
        </Flex>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginBottom: 16, textDecoration: 'none' }}
          >
            <Button mode="secondary" stretched>
              🔗 Ссылка на мероприятие
            </Button>
          </a>
        )}

        {isUpcoming && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Title
              variant="small-strong"
              style={{ marginBottom: 8 }}
            >
              Уже зарегистрировались
            </Typography.Title>
            {registered_users && registered_users.length > 0 ? (
              <Flex gap={8} wrap="wrap">
                {registered_users.map((user, idx) => {
                  const fullName = [user.firstname, user.lastname]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <span
                      key={`${fullName}-${idx}`}
                      style={{
                        background: 'var(--background-secondary, #f0f0f0)',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 14,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {fullName || 'Пользователь'}
                      {user.company ? ` · ${user.company}` : ''}
                    </span>
                  );
                })}
              </Flex>
            ) : (
              <Typography.Body style={{ color: 'var(--text-secondary)' }}>
                Пока никто не зарегистрировался
              </Typography.Body>
            )}
          </div>
        )}

        {/* Кнопка регистрации / отмены */}
        {!is_registered ? (
          <Button
            mode="primary"
            stretched
            onClick={async () => {
              await onRegister();
              onBack();
            }}
            style={{
              backgroundColor: '#4caf50',
              borderColor: '#4caf50',
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Зарегистрироваться
          </Button>
        ) : (
          <Button
            mode="secondary"
            stretched
            onClick={async () => {
              await onUnregister();
              onBack();
            }}
            style={{
              backgroundColor: '#d32f2f',
              color: '#fff',
              borderColor: '#d32f2f',
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Отменить регистрацию
          </Button>
        )}

        <Button mode="primary" onClick={onBack} style={{ marginTop: 'auto' }}>
          Назад
        </Button>
      </Panel>
    </div>
  );
};
