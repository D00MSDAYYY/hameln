import { useState } from 'react';
import { Panel, Typography, Flex, Button, Input, IconButton } from '@maxhub/max-ui';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

export const RegisterPage = ({ onBack, onSuccess }: RegisterPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !firstname.trim() || !lastname.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstname, lastname }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Ошибка регистрации');
      }
      const user = await res.json();
      onSuccess(user);
    } catch (err: any) {
      setError(err.message);
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
          <Typography.Title variant="medium-strong">Регистрация</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Имя"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
          <Input
            placeholder="Фамилия"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
          {error && <Typography.Body style={{ color: '#d32f2f' }}>{error}</Typography.Body>}
          <Button
            mode="primary"
            stretched
            onClick={handleRegister}
            loading={loading}
            style={{ fontWeight: 600, marginTop: 8 }}
          >
            Зарегистрироваться
          </Button>
        </div>
      </Panel>
    </div>
  );
};