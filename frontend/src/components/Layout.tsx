import { useState } from 'react';
import { IconButton, Typography } from '@maxhub/max-ui';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import NotificationsPage from '../pages/NotificationsPage';



const AccountIcon = () => <span style={{ fontSize: 24 }}>👤</span>;
const NotificationsIcon = () => <span style={{ fontSize: 24 }}>🔔</span>;
const HomeIcon = () => <span style={{ fontSize: 24 }}>🏠</span>;

const Layout = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const handleHomeClick = () => setCurrentPage('home');
  const handleProfileClick = () => setCurrentPage('profile');
  const handleNotificationsClick = () => {
    setCurrentPage('notifications');
  };

  const activeButtonStyle = {
    filter: 'brightness(0.85)',
    background: 'rgba(0, 0, 0, 0.05)',
    transition: 'filter 0.2s ease, background 0.2s ease',
  };

  const pageBackground = 'rgba(0, 0, 0, 0.05)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100vh', // фиксируем высоту на весь экран
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
          </Typography.Title>
        </header>

        {/* Область с прокруткой */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: pageBackground,
          transition: 'background 0.2s ease',
        }}>
          <div style={{ padding: 16 }}>
            {currentPage === 'profile' && <ProfilePage nickname="ivanov" points={150} />}
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'notifications' && <NotificationsPage />}
          </div>
        </div>

        <footer style={{
          display: 'flex',
          background: 'transparent',
          flexShrink: 0,
          height: '55px',              // фиксированная высота футера
          alignItems: 'stretch',       // чтобы кнопки растягивались на всю высоту
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={handleProfileClick}
              style={{
                width: '100%',
                height: '100%',         // кнопка занимает всю высоту футера
                ...(currentPage === 'profile' ? activeButtonStyle : {})
              }}
            >
              <AccountIcon />
            </IconButton>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={handleHomeClick}
              style={{
                width: '100%',
                height: '100%',
                ...(currentPage === 'home' ? activeButtonStyle : {})
              }}
            >
              <HomeIcon />
            </IconButton>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={handleNotificationsClick}
              style={{
                width: '100%',
                height: '100%',
                ...(currentPage === 'notifications' ? activeButtonStyle : {})
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;