import { useState } from 'react';
import { Panel, Typography, Input, Button } from '@maxhub/max-ui';

interface LoginScreenProps {
  onLogin: (userData: { nickname: string; points: number; company: string }) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      const res = await fetch('api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // чтобы куки отправлялись
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Ошибка входа');
        return;
      }
      const user = await res.json();
      onLogin(user);
    } catch (e) {
      setError('Сервер недоступен');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: '30vh',
      background: 'var(--background_page)',
    }}>
      <Panel mode="primary" style={{ padding: 24, borderRadius: 16, width: '90%', maxWidth: 320 }}>
        <Typography.Title variant="medium-strong" style={{ textAlign: 'center', marginBottom: 16 }}>
          Вход
        </Typography.Title>
        <Input
          type="password"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
        />
        {error && (
          <Typography.Body style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>
            {error}
          </Typography.Body>
        )}
        <Button mode="primary" stretched style={{ marginTop: 12 }} onClick={handleSubmit}>
          Войти
        </Button>
      </Panel>
    </div>
  );
};

export default LoginScreen;