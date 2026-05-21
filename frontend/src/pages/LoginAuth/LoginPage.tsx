import { useState } from 'react';
import { Panel, Typography, Flex, Button, Input, IconButton } from '@maxhub/max-ui';

interface LoginPageProps {
  onBack: () => void;
  onSuccess: (user: any) => void; // после успешного входа передаём данные пользователя наверх
}

export const LoginPage = ({ onBack, onSuccess }: LoginPageProps) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Ошибка отправки кода');
      }
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.trim().length < 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Неверный код');
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
          <Typography.Title variant="medium-strong">Вход</Typography.Title>
          <div style={{ width: 48 }} />
        </Flex>

        {step === 'email' ? (
          <>
            <Typography.Body style={{ marginBottom: 16 }}>
              Введите email, на который мы отправим код подтверждения
            </Typography.Body>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <Typography.Body style={{ color: '#d32f2f', marginTop: 8 }}>{error}</Typography.Body>}
            <Button
              mode="primary"
              stretched
              onClick={sendCode}
              loading={loading}
              style={{ marginTop: 16, fontWeight: 600 }}
            >
              Получить код
            </Button>
          </>
        ) : (
          <>
            <Typography.Body style={{ marginBottom: 16 }}>
              Введите код, отправленный на {email}
            </Typography.Body>
            <Input
              type="text"
              placeholder="Код"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
            />
            {error && <Typography.Body style={{ color: '#d32f2f', marginTop: 8 }}>{error}</Typography.Body>}
            <Button
              mode="primary"
              stretched
              onClick={verifyCode}
              loading={loading}
              style={{ marginTop: 16, fontWeight: 600 }}
            >
              Подтвердить
            </Button>
            <Button
              mode="tertiary"
              stretched
              onClick={() => setStep('email')}
              style={{ marginTop: 8 }}
            >
              Назад к email
            </Button>
          </>
        )}
      </Panel>
    </div>
  );
};