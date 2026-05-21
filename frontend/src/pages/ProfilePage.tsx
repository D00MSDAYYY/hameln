import { useState } from 'react';
import { Typography, Panel, CellList, CellSimple, Flex, Button } from '@maxhub/max-ui';
import { SettingsPanel } from '../components/user/settingsPanel';
import { UserInfoResponse } from '../api/types';

interface ProfilePageProps {
  user: UserInfoResponse;
  onLogout?: () => void;  // если решите передавать, но не обязательно
}

const ProfilePage = ({ user }: ProfilePageProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');

  const handleLogout = async () => {
    console.log('Нажата кнопка Выйти'); // <-- добавьте это для проверки в консоли
    try {
      const res = await fetch('api/user/logout', { method: 'POST', credentials: 'include' });
      console.log('Ответ сервера:', res.status); // посмотрим статус
      if (!res.ok) {
        console.error('Сервер вернул ошибку', res.status);
      }
    } catch (err) {
      console.error('Ошибка fetch:', err);
    }

    // Гарантированно удаляем куку на клиенте
    document.cookie = 'session_id=; Max-Age=0; path=/';
    console.log('Кука удалена, перезагружаем...');
    window.location.reload();
  };

  if (currentView === 'main') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 16, padding: '0 4px' }}>
          <Flex align="center" gap={12}>
            <Typography.Body style={{ fontSize: 16, fontWeight: 500 }}>
              @{user.nickname}
            </Typography.Body>
          </Flex>
          <div style={{
            backgroundColor: '#e5b73b',
            color: '#000',
            padding: '4px 12px',
            borderRadius: 16,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(0,0,0,0.1)',
          }}>
            🏆 {user.points}
          </div>
        </Flex>

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
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CellList>
              <CellSimple title="Настройки" showChevron onClick={() => setCurrentView('settings')} />
              {/* <CellSimple title="Архив мероприятий" showChevron /> */}
              {/* <CellSimple title="О приложении" showChevron /> */}
            </CellList>
          </div>
          <Button
            mode="tertiary"
            stretched
            onClick={handleLogout}
            style={{ color: '#d32f2f', fontSize: 16, fontWeight: 500, marginTop: 8 }}
          >
            Выйти
          </Button>
        </Panel>
      </div>
    );
  }

  return <SettingsPanel onBack={() => setCurrentView('main')} user={user} />;
};

export default ProfilePage;