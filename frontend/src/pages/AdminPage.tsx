import { useState } from 'react';
import { Typography, Panel, CellList, CellSimple } from '@maxhub/max-ui';
import EditEventsPanel from '../components/AdminPanels/EditEventsPanel';
import ReportPanel from '../components/AdminPanels/ReportPanel';
import EditUsersPanel from '../components/AdminPanels/EditUsersPanel';
import SignupRequestsPanel from '../components/AdminPanels/SignupRequestsPanel';
import ErrorLogsPanel from '../components/AdminPanels/ErrorLogsPanel';

const AdminPage = () => {
  const [currentView, setCurrentView] = useState<
    'main' | 'editEvents' | 'createReport' | 'editUsers' | 'signupRequests' | 'errorLogs'
  >('main');

  if (currentView === 'editEvents') {
    return <EditEventsPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'createReport') {
    return <ReportPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'editUsers') {
    return <EditUsersPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'signupRequests') {
    return <SignupRequestsPanel onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'errorLogs') {
    return <ErrorLogsPanel onBack={() => setCurrentView('main')} />;
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
              title="Создать отчёт"
              showChevron
              onClick={() => setCurrentView('createReport')}
            />
            <CellSimple
              title="Редактировать мероприятия"
              showChevron
              onClick={() => setCurrentView('editEvents')}
            />
            <CellSimple
              title="Редактировать участников"
              showChevron
              onClick={() => setCurrentView('editUsers')}
            />
            <CellSimple
              title="Заявки"
              showChevron
              onClick={() => setCurrentView('signupRequests')}
            />
            <CellSimple
              title="Логи ошибок"
              showChevron
              onClick={() => setCurrentView('errorLogs')}
            />
          </CellList>
        </div>
      </Panel>
    </div>
  );
};

export default AdminPage;
