import { useState } from 'react';
import { Typography, Panel, CellList, CellSimple, Flex } from '@maxhub/max-ui';
import { SettingsPanel } from '../components/SettingsPanel';

interface ProfilePageProps {
  nickname: string;
  points: number;
  company?: string;
}

const ProfilePage = ({ nickname, points, company }: ProfilePageProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');

  if (currentView === 'main') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Блок с информацией о пользователе — вне панели */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 16, padding: '0 4px' }}>
          <Flex align="center" gap={12}>
            <Typography.Body style={{ fontSize: 16, fontWeight: 500 }}>
              @{nickname}
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
            🏆 {points}
          </div>
        </Flex>

        {/* Панель со списком действий */}
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
              <CellSimple
                title="Настройки"
                showChevron
                onClick={() => setCurrentView('settings')}
              />
              <CellSimple title="Архив мероприятий" showChevron />
              <CellSimple title="О приложении" showChevron />
            </CellList>
          </div>
        </Panel>
      </div>
    );
  }

  return <SettingsPanel onBack={() => setCurrentView('main')} company={company} />;
};

export default ProfilePage;