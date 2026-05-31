import { useState, useEffect } from 'react';
import { MaxUI } from '@maxhub/max-ui';
import Layout from './components/Layout';
import { AuthChoicePage } from './pages/LoginAuth/AuthChoicePage';
import { LoginPage } from './pages/LoginAuth/LoginPage';
import { SignUpPage } from './pages/LoginAuth/SignUpPage';
import { authApi } from './api/auth';
import type { UserInfoResponse } from './api/types';

function App() {
  const [user, setUser] = useState<UserInfoResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [authView, setAuthView] = useState<'choice' | 'login' | 'signup'>('choice');

  const checkSession = async () => {
    try {
      const data = await authApi.getProfile();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkSession();
    window.addEventListener('focus', checkSession);
    return () => window.removeEventListener('focus', checkSession);
  }, []);

  const handleLoginSuccess = (userData: UserInfoResponse) => {
    setUser(userData);
  };

  const handleSignupSubmitted = () => {
    setAuthView('login');
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
            onSignUp={() => setAuthView('signup')}
          />
        )}
        {authView === 'login' && (
          <LoginPage
            onBack={() => setAuthView('choice')}
            onSuccess={handleLoginSuccess}
          />
        )}
        {authView === 'signup' && (
          <SignUpPage
            onBack={() => setAuthView('choice')}
            onSubmitted={handleSignupSubmitted}
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
