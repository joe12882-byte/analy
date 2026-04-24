import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import { AuthProvider } from './components/AuthProvider';
import './index.css';

import ErrorBoundary from './components/Common/ErrorBoundary';

console.log("Analy starting...");

// Global error handlers for catch-all diagnostics
window.addEventListener('error', (event) => {
  console.error("Global window error:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : JSON.stringify(reason);
  const stack = reason instanceof Error ? reason.stack : 'No stack';
  console.error("Unhandled promise rejection:", message, "\nStack:", stack);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
