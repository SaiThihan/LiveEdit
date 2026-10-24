
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LogtoProvider } from '@logto/react';
import LogtoCallback from './components/LogtoCallback';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const endpoint = import.meta.env.VITE_LOGTO_ENDPOINT;
const appId = import.meta.env.VITE_LOGTO_APP_ID;
const isE2eMode = import.meta.env.MODE === 'e2e';
const logtoConfig = {
  endpoint: endpoint || 'https://logto.invalid/oidc',
  appId: appId || 'playwright-e2e',
  scopes: ['email'],
};
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {(endpoint && appId) || isE2eMode ? (
      <LogtoProvider config={logtoConfig}>
        <ThemeProvider>
          <ToastProvider>
            {window.location.pathname === '/callback' ? <LogtoCallback /> : <App />}
          </ToastProvider>
        </ThemeProvider>
      </LogtoProvider>
    ) : (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 text-center">
        <p>Configure VITE_LOGTO_ENDPOINT and VITE_LOGTO_APP_ID to enable Google sign-in.</p>
      </div>
    )}
  </React.StrictMode>
);
