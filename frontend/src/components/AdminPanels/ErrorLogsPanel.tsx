import { useEffect, useState } from 'react';
import {
  Button,
  Flex,
  IconButton,
  Panel,
  Typography,
} from '@maxhub/max-ui';
import { adminApi } from '../../api/admin';

type LogSource = 'backend' | 'frontend';

interface ErrorLogsPanelProps {
  onBack: () => void;
}

const LOG_TITLES: Record<LogSource, string> = {
  backend: 'Бэкенд',
  frontend: 'Фронтенд',
};

const ErrorLogsPanel = ({ onBack }: ErrorLogsPanelProps) => {
  const [activeTab, setActiveTab] = useState<LogSource>('backend');
  const [log, setLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLog = async (source: LogSource) => {
    setLoading(true);
    setError('');

    try {
      setLog(await adminApi.getLog(source));
    } catch (err) {
      setLog('');
      setError(err instanceof Error ? err.message : 'Не удалось загрузить лог');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog(activeTab);
  }, [activeTab]);

  const tabButton = (source: LogSource) => (
    <Button
      mode={activeTab === source ? 'primary' : 'tertiary'}
      onClick={() => setActiveTab(source)}
      style={{ flex: 1, borderRadius: 12, fontWeight: 500 }}
    >
      {LOG_TITLES[source]}
    </Button>
  );

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
          <Typography.Title variant="medium-strong">Логи ошибок</Typography.Title>
          <IconButton mode="tertiary" onClick={() => fetchLog(activeTab)} disabled={loading}>
            <span style={{ fontSize: 18 }}>↻</span>
          </IconButton>
        </Flex>

        <Flex gap={8} style={{ marginBottom: 16 }}>
          {tabButton('backend')}
          {tabButton('frontend')}
        </Flex>

        {error && (
          <Typography.Body style={{ color: '#d32f2f', marginBottom: 12 }}>
            {error}
          </Typography.Body>
        )}

        <Panel
          mode="secondary"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            minHeight: 0,
          }}
        >
          <pre
            style={{
              flex: 1,
              margin: 0,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {loading ? 'Загрузка...' : log}
          </pre>
        </Panel>
      </Panel>
    </div>
  );
};

export default ErrorLogsPanel;
