import { useState } from 'react';
import { MaxUI } from '@maxhub/max-ui';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <MaxUI platform="ios" colorScheme="light">
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      </MaxUI>
    );
  }

  return (
    <MaxUI platform="ios" colorScheme="light">
      <Layout />
    </MaxUI>
  );
}

export default App;