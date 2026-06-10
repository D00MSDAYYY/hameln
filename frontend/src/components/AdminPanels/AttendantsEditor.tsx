import { useEffect, useState } from 'react';
import {
  Flex,
  Panel,
  Typography,
  IconButton,
  Spinner,
} from '@maxhub/max-ui';
import type { UserInfoResponse } from '../../api/types';
import { adminApi } from '../../api/admin';
import { SearchableItemsWidget } from '../SearchableItemsWidget';

interface AttendantsEditorProps {
  value: UserInfoResponse[];
  onChange: (value: UserInfoResponse[]) => void;
  disabled?: boolean;
}

export const AttendantsEditor = ({ value, onChange, disabled }: AttendantsEditorProps) => {
  const [users, setUsers] = useState<UserInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (disabled) {
      setLoading(false);
      return;
    }

    adminApi
      .getUsers()
      .then((data) => {
        setUsers(data || []);
      })
      .catch(() => {
        setUsers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [disabled]);

  const availableUsers = users.filter(
    (user) => !value.some((selectedUser) => selectedUser.id === user.id)
  );

  const getUserLabel = (user: UserInfoResponse) => {
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
    return fullName || user.nickname || 'Пользователь';
  };

  const getUserSearchText = (user: UserInfoResponse) =>
    [
      user.nickname,
      user.firstname,
      user.lastname,
      user.phone,
      user.company,
    ]
      .filter(Boolean)
      .join(' ');

  const addUser = (user: UserInfoResponse) => {
    if (!value.some((u) => u.id === user.id)) {
      onChange([...value, user]);
    }
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

  if (loading) {
    return <Spinner size={20} />;
  }

  return (
    <Flex direction="column" gap={12}>
      <SearchableItemsWidget
        items={availableUsers}
        buttonLabel="Выбрать посетителя"
        title="Пользователи"
        searchPlaceholder="Поиск по имени, нику или телефону"
        emptyText="Все пользователи добавлены"
        getItemLabel={getUserLabel}
        getItemSearchText={getUserSearchText}
        getItemKey={(user, index) => user.id ?? user.nickname ?? index}
        onItemClick={addUser}
      />

      {value.length > 0 ? (
        <Flex direction="column" gap={8}>
          {value.map((user) => (
            <Panel key={user.id} mode="secondary" style={{ padding: '8px 12px', borderRadius: 8 }}>
              <Flex justify="space-between" align="center">
                <Typography.Body>{getUserLabel(user)}</Typography.Body>
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
