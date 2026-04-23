import { Panel, Typography } from '@maxhub/max-ui';

const NotificationsPage = () => {
  return (
    <Panel mode="primary" style={{ padding: 20, borderRadius: 16 }}>
      <Typography.Title variant="medium-strong" style={{ marginBottom: 12 }}>
        Уведомления
      </Typography.Title>
      <Typography.Body style={{ color: 'var(--text-secondary)' }}>
        У вас пока нет новых уведомлений.
      </Typography.Body>
    </Panel>
  );
};

export default NotificationsPage;