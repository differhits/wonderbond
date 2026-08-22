import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppRoutes from './routes/AppRoutes';

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const applyTheme = () => {
      let theme = localStorage.getItem('wb_theme');
      if (!theme) theme = 'system';

      if (theme === 'dark') {
        document.body.classList.add('dark');
      } else if (theme === 'light') {
        document.body.classList.remove('dark');
      } else {
        // System preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      }
    };

    applyTheme();

    // Listen for theme preference changes from other components/storage
    window.addEventListener('storage', applyTheme);
    return () => window.removeEventListener('storage', applyTheme);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
