import { useState, useCallback } from 'react';
import {
  Flex,
  Input,
  Panel,
  Typography,
  IconButton,
  Spinner,
} from '@maxhub/max-ui';
import type { UserInfoResponse } from '../../api/types';

interface AttendantsEditorProps {
  value: UserInfoResponse[];
  onChange: (value: UserInfoResponse[]) => void;
  disabled?: boolean;
}

export const AttendantsEditor = ({ value, onChange, disabled }: AttendantsEditorProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserInfoResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: UserInfoResponse[] = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = (user: UserInfoResponse) => {
    if (!value.some((u) => u.id === user.id)) {
      onChange([...value, user]);
    }
    setQuery('');
    setResults([]);
  };

  const removeUser = (userId: number) => {
    onChange(value.filter((u) => u.id !== userId));
  };

  if (disabled) {
    return (
      <Typography.Body variant="small" style={{ color: 'var(--text-secondary)' }}>
        Сохраните событие, чтобы добавить посетителей
      </Typography.Body>
    );
  }

  return (
    <Flex direction="column" gap={12}>
      {/* Поиск (сверху, на всю ширину) */}
      <Flex direction="column" gap={8}>
        <Input
          mode="secondary"
          placeholder="Поиск по нику..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          disabled={loading}
          style={{ width: '100%' }}
        />
        {loading && <Spinner size={20} />}
        {results.length > 0 && (
          <Flex direction="column" gap={4}>
            {results.map((user) => (
              <Panel
                key={user.id}
                mode="secondary"
                style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
                onClick={() => addUser(user)}
              >
                <Typography.Body>{user.nickname}</Typography.Body>
              </Panel>
            ))}
          </Flex>
        )}
      </Flex>

      {/* Выбранные посетители (снизу) */}
      {value.length > 0 ? (
        <Flex direction="column" gap={8}>
          {value.map((user) => (
            <Panel key={user.id} mode="secondary" style={{ padding: '8px 12px', borderRadius: 8 }}>
              <Flex justify="space-between" align="center">
                <Typography.Body>{user.nickname}</Typography.Body>
                <IconButton
                  mode="tertiary"
                  size="small"
                  onClick={() => user.id && removeUser(user.id)}
                >
                  <span>✕</span>
                </IconButton>
              </Flex>
            </Panel>
          ))}
        </Flex>
      ) : (
        <Typography.Body variant="small" style={{ color: 'var(--text-secondary)' }}>
          Посетителей пока нет
        </Typography.Body>
      )}
    </Flex>
  );
};