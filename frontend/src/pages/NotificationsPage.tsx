import { useState, useEffect } from 'react';
import { Panel, Typography } from '@maxhub/max-ui';
import type { NotificationItem } from '../api/types';


const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (!res.ok) throw new Error('Ошибка загрузки уведомлений');
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
      } catch (err: any) {
        setError(err.message || 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Загрузка уведомлений...</div>;
  if (error) return <div style={{ padding: 16, color: 'red' }}>Ошибка: {error}</div>;

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
        <Typography.Title variant="medium-strong" style={{ marginBottom: 16 }}>
          Уведомления
        </Typography.Title>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Typography.Body style={{ color: 'var(--text-secondary)' }}>
              У вас пока нет уведомлений.
            </Typography.Body>
          ) : (
            notifications.map((item) => (
              <Panel key={item.id} mode="secondary" style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}>
                <Typography.Body style={{ fontWeight: 500 }}>{item.title}</Typography.Body>
                {item.body && (
                  <Typography.Body style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {item.body}
                  </Typography.Body>
                )}
                <Typography.Body style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleString('ru-RU')}
                </Typography.Body>
              </Panel>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
};

export default NotificationsPage;