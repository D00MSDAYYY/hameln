import { useEffect, useState } from 'react';
import {
  Button,
  Flex,
  IconButton,
  Input,
  Panel,
  Typography,
} from '@maxhub/max-ui';
import { adminApi } from '../../api/admin';
import type { SignupRequest, SignupRequestInfoResponse } from '../../api/types';

type ViewMode = 'list' | 'edit';

interface SignupRequestsPanelProps {
  onBack: () => void;
}

interface SignupRequestFormProps {
  initial: SignupRequestInfoResponse;
  onCancel: () => void;
  onSave: (payload: SignupRequest) => void | Promise<void>;
}

const buildPayload = ({
  phone,
  firstname,
  lastname,
  company,
}: SignupRequestInfoResponse): SignupRequest => ({
  phone: phone?.trim() || '',
  firstname: firstname?.trim() || '',
  lastname: lastname?.trim() || '',
  company: company?.trim() || '',
});

const SignupRequestForm = ({ initial, onCancel, onSave }: SignupRequestFormProps) => {
  const [phone, setPhone] = useState(initial.phone || '');
  const [firstname, setFirstname] = useState(initial.firstname || '');
  const [lastname, setLastname] = useState(initial.lastname || '');
  const [company, setCompany] = useState(initial.company || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const payload = buildPayload({
      phone,
      firstname,
      lastname,
      company,
    });

    if (!payload.phone) {
      setError('Укажите телефон');
      return;
    }

    if (!payload.firstname || !payload.lastname || !payload.company) {
      setError('Заполните обязательные поля');
      return;
    }

    setError('');
    onSave(payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Typography.Title variant="small-strong">Телефон</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            type="tel"
            placeholder="Введите телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Имя</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите имя"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Фамилия</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите фамилию"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
        </Panel>
      </div>

      <div>
        <Typography.Title variant="small-strong">Компания</Typography.Title>
        <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Input
            placeholder="Введите компанию"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Panel>
      </div>

      {error && <Typography.Body style={{ color: '#d32f2f' }}>{error}</Typography.Body>}

      <Flex gap={12} style={{ marginTop: 20 }}>
        <Button mode="primary" stretched onClick={handleSubmit}>
          Сохранить
        </Button>
        <Button mode="tertiary" stretched onClick={onCancel}>
          Отмена
        </Button>
      </Flex>
    </div>
  );
};

const SignupRequestsPanel = ({ onBack }: SignupRequestsPanelProps) => {
  const [requests, setRequests] = useState<SignupRequestInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [editingRequest, setEditingRequest] = useState<SignupRequestInfoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setRequests(await adminApi.getSignupRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const resetState = () => {
    setCurrentView('list');
    setEditingRequest(null);
  };

  const handleUpdate = async (payload: SignupRequest) => {
    if (!editingRequest?.id) return;

    try {
      setError(null);
      setMessage(null);
      await adminApi.updateSignupRequest(editingRequest.id, payload);
      await fetchRequests();
      resetState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить заявку');
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setError(null);
      const result = await adminApi.approveSignupRequest(requestId);
      setMessage(result.message);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось одобрить заявку');
    }
  };

  const handleDelete = async (requestId: number, title: string) => {
    const confirmed = window.confirm(`Отклонить заявку "${title}"?`);
    if (!confirmed) return;

    try {
      setError(null);
      setMessage(null);
      const result = await adminApi.deleteSignupRequest(requestId);
      setMessage(result.message);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отклонить заявку');
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>;

  if (currentView === 'edit' && editingRequest) {
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
            <Typography.Title variant="medium-strong">Редактирование заявки</Typography.Title>
            <div style={{ width: 48 }} />
          </Flex>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SignupRequestForm
              initial={editingRequest}
              onCancel={resetState}
              onSave={handleUpdate}
            />
          </div>
        </Panel>
      </div>
    );
  }

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
      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: 8,
            background: '#e8f5e9',
            borderRadius: 8,
            color: '#2e7d32',
          }}
        >
          <Typography.Body>{message}</Typography.Body>
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
          <Typography.Title variant="medium-strong">Заявки</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {requests.length === 0 ? (
            <Typography.Body style={{ color: 'var(--text-secondary)' }}>
              Заявок нет
            </Typography.Body>
          ) : (
            requests.map((request) => {
              const title = `${request.firstname || ''} ${request.lastname || ''}`.trim() || 'Без имени';
              const contact = request.phone || '';

              return (
                <Panel
                  key={request.id}
                  mode="secondary"
                  style={{ padding: 12, borderRadius: 12, marginBottom: 8 }}
                >
                  <Flex justify="space-between" align="center">
                    <Flex direction="column" gap={2}>
                      <Typography.Body>{title}</Typography.Body>
                      <Typography.Body variant="small" style={{ color: 'var(--text-secondary)' }}>
                        {contact || 'Контакт не указан'} · {request.company || 'Без компании'}
                      </Typography.Body>
                    </Flex>
                    <Flex direction="column" gap={4}>
                      <Button
                        mode="primary"
                        size="small"
                        onClick={() => request.id && handleApprove(request.id)}
                      >
                        Одобрить
                      </Button>
                      <Button
                        mode="tertiary"
                        size="small"
                        onClick={() => {
                          setEditingRequest(request);
                          setCurrentView('edit');
                        }}
                      >
                        Изменить
                      </Button>
                      <Button
                        mode="tertiary"
                        size="small"
                        onClick={() => request.id && handleDelete(request.id, title)}
                        style={{ backgroundColor: '#d32f2f', color: '#fff' }}
                      >
                        Отклонить
                      </Button>
                    </Flex>
                  </Flex>
                </Panel>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
};

export default SignupRequestsPanel;
