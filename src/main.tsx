import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './providers/AuthProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);