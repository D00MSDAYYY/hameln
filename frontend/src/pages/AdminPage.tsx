import { useState } from 'react';
import { Typography, Panel, CellList, CellSimple, Flex, IconButton } from '@maxhub/max-ui';
import EditEventsPanel from '../components/AdminPanels/EditEventsPanel'
import ArchiveEventsPanel from '../components/AdminPanels/ArchiveEventsPanel';


const DebugConsolePanel = ({ onBack }: { onBack: () => void }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Panel
      mode="primary"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, borderRadius: 16, overflow: 'hidden' }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <IconButton mode="tertiary" onClick={onBack}>
          <span style={{ fontSize: 20 }}>←</span>
        </IconButton>
        <Typography.Title variant="medium-strong">Консоль отладки</Typography.Title>
        <div style={{ width: 48 }} />
      </Flex>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Typography.Body>Здесь будет консоль для выполнения отладочных команд.</Typography.Body>
      </div>
    </Panel>
  </div>
);

const AdminPage = () => {
  const [currentView, setCurrentView] = useState<'main' | 'editEvents' | 'archiveEvents' | 'debugConsole'>('main');

  if (currentView === 'editEvents') {
    return <EditEventsPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'archiveEvents') {
    return <ArchiveEventsPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'debugConsole') {
    return <DebugConsolePanel onBack={() => setCurrentView('main')} />;
  }

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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <CellList>
            <CellSimple
              title="Редактирование мероприятий"
              showChevron
              onClick={() => setCurrentView('editEvents')}
            />
            <CellSimple
              title="Архив всех мероприятий"
              showChevron
              onClick={() => setCurrentView('archiveEvents')}
            />
            <CellSimple
              title="Консоль отладки"
              showChevron
              onClick={() => setCurrentView('debugConsole')}
            />
          </CellList>
        </div>
      </Panel>
    </div>
  );
};

export default AdminPage;