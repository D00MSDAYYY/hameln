import { useEffect, useState } from 'react';
import { Flex, IconButton, Panel, Typography } from '@maxhub/max-ui';
import type { UserInfoResponse } from '../api/types';
import { userApi } from '../api/user';

interface LeaderboardPanelProps {
  onBack: () => void;
}

export const LeaderboardPanel = ({ onBack }: LeaderboardPanelProps) => {
  const [users, setUsers] = useState<UserInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi
      .getLeaderboard()
      .then((data) => setUsers(data || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить таблицу лидеров'))
      .finally(() => setLoading(false));
  }, []);

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
          <Typography.Title variant="medium-strong">Таблица лидеров</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Typography.Body>Загрузка...</Typography.Body>
          ) : error ? (
            <Typography.Body style={{ color: '#d32f2f' }}>{error}</Typography.Body>
          ) : users.length === 0 ? (
            <Typography.Body style={{ color: 'var(--text-secondary)' }}>
              Пока нет участников с очками
            </Typography.Body>
          ) : (
            <Panel
              mode="secondary"
              style={{
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px minmax(0, 1fr) minmax(0, 1.2fr) 72px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <Typography.Body style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                  Место
                </Typography.Body>
                <Typography.Body style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                  Имя
                </Typography.Body>
                <Typography.Body style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
                  Компания
                </Typography.Body>
                <Typography.Body style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
                  Очки
                </Typography.Body>
              </div>

              {users.map((leader, index) => (
                <div
                  key={leader.id ?? `${leader.firstname}-${leader.lastname}` ?? index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px minmax(0, 1fr) minmax(0, 1.2fr) 72px',
                    gap: 12,
                    alignItems: 'center',
                    minHeight: 48,
                    padding: '10px 12px',
                    borderBottom: index === users.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <Typography.Body style={{ fontWeight: 700 }}>
                    {index + 1}
                  </Typography.Body>
                  <Typography.Body
                    style={{
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {[leader.firstname, leader.lastname].filter(Boolean).join(' ') || 'Пользователь'}
                  </Typography.Body>
                  <Typography.Body
                    style={{
                      color: leader.company ? undefined : 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {leader.company || '-'}
                  </Typography.Body>
                  <Typography.Body style={{ fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {leader.points ?? 0}
                  </Typography.Body>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </Panel>
    </div>
  );
};
