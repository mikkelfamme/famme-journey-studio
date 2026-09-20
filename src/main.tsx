import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { WorkspaceProvider } from './store/WorkspaceContext';
import './styles.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <WorkspaceProvider><App /></WorkspaceProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
