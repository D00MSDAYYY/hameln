import { Panel, Typography, Flex, Button } from '@maxhub/max-ui';

interface AuthChoicePageProps {
    onLogin: () => void;
    onRegister: () => void;
}
export const AuthChoicePage = ({ onLogin, onRegister }: AuthChoicePageProps) => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Panel
        mode="primary"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          paddingBottom: 40,
          borderRadius: 16,
          overflow: 'hidden',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Typography.Title variant="large-strong" style={{ marginBottom: 8 }}>
          Добро пожаловать
        </Typography.Title>
        <Typography.Body style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24 }}>
          Войдите или создайте аккаунт, чтобы продолжить
        </Typography.Body>

        <Button mode="primary" stretched onClick={onLogin} style={{ fontWeight: 600, height: 48 }}>
          Войти
        </Button>
        <Button mode="secondary" stretched onClick={onRegister} style={{ fontWeight: 600, height: 48 }}>
          Зарегистрироваться
        </Button>
      </Panel>
    </div>
  );
};