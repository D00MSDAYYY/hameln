import { useState, useEffect } from 'react';
import {
    Typography,
    Panel,
    Flex,
    IconButton,
    Button,
} from '@maxhub/max-ui';
import UserFormPanel from './UserFormPanel';
import type { UserInfoResponse } from '../../api/types';
import { adminApi } from '../../api/admin';




const EditUsersPanel = ({ onBack }: { onBack: () => void }) => {
    const [users, setUsers] = useState<UserInfoResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
    const [editingUser, setEditingUser] = useState<UserInfoResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setUsers(await adminApi.getUsers());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetState = () => {
        setCurrentView('list');
        setEditingUser(null);
    };

    const handleCreate = async (body: Record<string, any>) => {
        try {
            setError(null);
            await adminApi.createUser(body);
            await fetchUsers();
            resetState();
        } catch (err: any) {
            setError(err.message || 'Не удалось создать пользователя');
        }
    };

    const handleUpdate = async (body: Record<string, any>) => {
        if (!editingUser) return;
        try {
            setError(null);
            await adminApi.updateUser(editingUser.id!, body);
            await fetchUsers();
            resetState();
        } catch (err: any) {
            setError(err.message || 'Не удалось обновить пользователя');
        }
    };

    const handleDelete = async (userId: number, userName: string) => {
        const confirmed = window.confirm(
            `Вы уверены, что хотите удалить пользователя "${userName}"?`
        );
        if (!confirmed) return;

        try {
            setError(null);
            await adminApi.deleteUser(userId);
            await fetchUsers();
        } catch (err: any) {
            setError(err.message || 'Не удалось удалить пользователя');
        }
    };

    if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>;

    // ---------- Список пользователей ----------
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
                        <Typography.Title variant="medium-strong">Участники</Typography.Title>
                        <div style={{ width: 48 }} />
                    </Flex>

                    <Button
                        mode="primary"
                        stretched
                        onClick={() => {
                            setEditingUser(null);
                            setCurrentView('create');
                        }}
                        style={{ backgroundColor: '#4caf50', borderColor: '#4caf50', marginBottom: 12 }}
                    >
                        ➕
                    </Button>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {users.map((user) => (
                            <Panel
                                key={user.id}
                                mode="secondary"
                                style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}
                            >
                                <Flex justify="space-between" align="center">
                                    <Flex direction="column" gap={2}>
                                        <Typography.Body>
                                            {user.firstname} {user.lastname}
                                        </Typography.Body>
                                        <Typography.Body variant="small" style={{ color: 'var(--text-secondary)' }}>
                                            @{user.nickname} · {user.role} · {user.company || 'Без компании'}
                                        </Typography.Body>
                                    </Flex>
                                    <Flex direction="column" gap={4}>
                                        <Button
                                            mode="tertiary"
                                            size="small"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setCurrentView('edit');
                                            }}
                                            style={{ backgroundColor: '#555', color: '#fff' }}
                                        >
                                            ✏️
                                        </Button>
                                        <Button
                                            mode="tertiary"
                                            size="small"
                                            onClick={() => user.id && handleDelete(user.id, user.nickname || '')}
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

    // ---------- Создание / Редактирование пользователя ----------
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
                        {currentView === 'create' ? 'Новый участник' : 'Редактирование участника'}
                    </Typography.Title>
                    <div style={{ width: 48 }} />
                </Flex>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <UserFormPanel
                        initial={editingUser || undefined}
                        onSave={editingUser ? handleUpdate : handleCreate}
                        onCancel={resetState}
                    />
                </div>
            </Panel>
        </div>
    );
};

export default EditUsersPanel;
