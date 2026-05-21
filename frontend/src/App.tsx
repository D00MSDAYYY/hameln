import { useState, useEffect } from 'react';
import { MaxUI } from '@maxhub/max-ui';
import Layout from './components/Layout';
import { AuthChoicePage } from './pages/user/loginAuth/AuthChoicePage';
import { LoginPage } from './pages/user/loginAuth/user/loginPage';
import { RegisterPage } from './pages/user/loginAuth/RegisterPage';
import { UserInfoResponse } from './api/types';

function App() {
  const [user, setUser] = useState<UserInfoResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [authView, setAuthView] = useState<'choice' | 'login' | 'register'>('choice');

  // Функция проверки сессии
  const checkSession = async () => {
    try {
      const res = await fetch('/user/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  };

  // Проверяем сессию при загрузке и при фокусе окна
  useEffect(() => {
    checkSession();
    window.addEventListener('focus', checkSession);
    return () => window.removeEventListener('focus', checkSession);
  }, []);

  // После успешного входа/регистрации просто перезапрашиваем сессию (или сохраняем user)
  const handleAuthSuccess = (userData?: UserInfoResponse) => {
    if (userData) {
      setUser(userData);
    } else {
      checkSession();  // если данные не передали, перепроверим сессию
    }
  };

  if (checking) {
    return (
      <MaxUI colorScheme="light">
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Проверка сессии...
        </div>
      </MaxUI>
    );
  }

  if (!user) {
    return (
      <MaxUI colorScheme="light">
        {authView === 'choice' && (
          <AuthChoicePage
            onLogin={() => setAuthView('login')}
            onRegister={() => setAuthView('register')}
          />
        )}
        {authView === 'login' && (
          <LoginPage
            onBack={() => setAuthView('choice')}
            onSuccess={handleAuthSuccess}
          />
        )}
        {authView === 'register' && (
          <RegisterPage
            onBack={() => setAuthView('choice')}
            onSuccess={handleAuthSuccess}
          />
        )}
      </MaxUI>
    );
  }

  return (
    <MaxUI colorScheme="light">
      <Layout user={user} />
    </MaxUI>
  );
}

export default App;