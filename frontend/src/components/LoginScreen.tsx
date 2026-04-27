import { useState } from 'react';
import { Panel, Typography, Input, Button } from '@maxhub/max-ui';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password === '1q2w') {
      setError('');
      onLogin();
    } else {
      setError('Неверный пароль');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', // прижимаем к верху
      paddingTop: '30vh',           // отступ сверху 30% высоты окна — панель смещена вниз
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