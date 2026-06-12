import { useState } from 'react';
import { Typography, Panel, CellList, CellSimple, Flex, Button } from '@maxhub/max-ui';
import { SettingsPanel } from '../components/SettingsPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { UserInfoResponse } from '../api/types';
import { userApi } from '../api/user';

interface ProfilePageProps {
  user: UserInfoResponse;
  onLogout?: () => void;  // если решите передавать, но не обязательно
}

const ProfilePage = ({ user }: ProfilePageProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'leaderboard'>('main');
  const displayName = [user.firstname, user.lastname].filter(Boolean).join(' ') || 'Пользователь';

  const handleLogout = async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.error('Ошибка выхода:', err);
    }

    document.cookie = 'session_id=; Max-Age=0; path=/';
    window.location.reload();
  };

  if (currentView === 'main') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 16, padding: '0 4px' }}>
          <Flex align="center" gap={12}>
            <Typography.Body style={{ fontSize: 16, fontWeight: 500 }}>
              {displayName}
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
              <CellSimple title="Таблица лидеров" showChevron onClick={() => setCurrentView('leaderboard')} />
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

  if (currentView === 'settings') {
    return <SettingsPanel onBack={() => setCurrentView('main')} user={user} />;
  }

  return <LeaderboardPanel onBack={() => setCurrentView('main')} />;
};

export default ProfilePage;
