import { useState } from 'react';
import { IconButton, Typography, Button, Flex } from '@maxhub/max-ui';
import EventsPage from '../pages/user/eventsPage';
import ProfilePage from '../pages/user/profilePage';
import NotificationsPage from '../pages/user/notificationsPage';
import AdminPage from '../pages/AdminPage';
import type { UserInfoResponse } from '../api/types';

interface LayoutProps {
  user: UserInfoResponse;
}

const Layout = ({ user }: LayoutProps) => {
  const [currentPage, setCurrentPage] = useState('home');

  const handlePageChange = (page: string) => setCurrentPage(page);

  const pageBackground = 'rgba(0, 0, 0, 0.05)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100vh',
      }}>
        <header style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--separator_common)',
          background: 'var(--background_content)',
          flexShrink: 0,
        }}>
          <Typography.Title variant="medium-strong" style={{ textAlign: 'center' }}>
            {currentPage === 'home' && 'События'}
            {currentPage === 'profile' && 'Профиль'}
            {currentPage === 'notifications' && 'Уведомления'}
            {currentPage === 'admin' && 'Панель администратора'}
          </Typography.Title>
        </header>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: pageBackground,
          transition: 'background 0.2s ease',
        }}>
          <div style={{ padding: 16 }}>
            {currentPage === 'admin' && <AdminPage />}
            {currentPage === 'profile' && <ProfilePage user={user} />}
            {currentPage === 'home' && <EventsPage />}
            {currentPage === 'notifications' && <NotificationsPage />}
          </div>
        </div>

        {/* Нижняя панель навигации – сегментированные кнопки как в теме */}
        <footer style={{
          padding: '8px 12px',
          background: 'var(--background_content)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}>
          <Flex gap={8}>
            {user.role === 'admin' && (
              <Button
                mode={currentPage === 'admin' ? 'primary' : 'tertiary'}
                size="large"
                stretched
                style={{ borderRadius: 12, fontWeight: 500 }}
                onClick={() => handlePageChange('admin')}
              >
                👹
              </Button>
            )}

            <Button
              mode={currentPage === 'profile' ? 'primary' : 'tertiary'}
              size="large"
              stretched
              style={{ borderRadius: 12, fontWeight: 500 }}
              onClick={() => handlePageChange('profile')}
            >
              👤
            </Button>

            <Button
              mode={currentPage === 'home' ? 'primary' : 'tertiary'}
              size="large"
              stretched
              style={{ borderRadius: 12, fontWeight: 500 }}
              onClick={() => handlePageChange('home')}
            >
              🎉
            </Button>

            {/* Уведомления временно скрыты – раскомментируйте, когда понадобятся */}
            {/* <Button
              mode={currentPage === 'notifications' ? 'primary' : 'tertiary'}
              size="medium"
              stretched
              style={{ borderRadius: 12, fontWeight: 500 }}
              onClick={() => handlePageChange('notifications')}
            >
              🔔 Уведомления
            </Button> */}
          </Flex>
        </footer>
      </main>
    </div>
  );
};

export default Layout;