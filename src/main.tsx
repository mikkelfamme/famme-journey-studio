import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { WorkspaceProvider } from './store/WorkspaceContext';
import './styles.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <WorkspaceProvider><App /></WorkspaceProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
