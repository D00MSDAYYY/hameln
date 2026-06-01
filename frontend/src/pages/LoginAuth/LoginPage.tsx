import { useState } from 'react';
import { Panel, Typography, Flex, Button, Input, IconButton } from '@maxhub/max-ui';
import { authApi } from '../../api/auth';
import type { UserInfoResponse } from '../../api/types';
import { buildRussianPhone, isCompletePhoneTail, PhoneInput } from '../../components/PhoneInput';

interface LoginPageProps {
  onBack: () => void;
  onSuccess: (user: UserInfoResponse) => void;
}

export const LoginPage = ({ onBack, onSuccess }: LoginPageProps) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanPhone = phone.trim();
  const cleanPassword = password.trim();

  const login = async () => {
    if (!isCompletePhoneTail(cleanPhone) || !cleanPassword) return;

    setLoading(true);
    setError('');

    try {
      const user = await authApi.login({
        phone: buildRussianPhone(cleanPhone),
        password: cleanPassword,
      });
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

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
        <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
          <IconButton mode="tertiary" onClick={onBack}>
            <span style={{ fontSize: 20 }}>←</span>
          </IconButton>
          <Typography.Title variant="medium-strong">Вход</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Typography.Title variant="small-strong">Телефон</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <PhoneInput
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setError('');
                }}
              />
            </Panel>
          </div>

          <div>
            <Typography.Title variant="small-strong">Пароль</Typography.Title>
            <Panel mode="secondary" style={{ padding: 16, borderRadius: 12, marginTop: 12 }}>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
            </Panel>
          </div>
        </div>

        {error && <Typography.Body style={{ color: '#d32f2f', marginTop: 8 }}>{error}</Typography.Body>}
        <Button
          mode="primary"
          stretched
          onClick={login}
          loading={loading}
          disabled={!isCompletePhoneTail(cleanPhone) || !cleanPassword}
          style={{ marginTop: 16, fontWeight: 600 }}
        >
          Войти
        </Button>
      </Panel>
    </div>
  );
};
