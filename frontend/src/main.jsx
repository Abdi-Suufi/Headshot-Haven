import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first so page and component stylesheets can override them.
import './styles/global.css';
import './styles/layout.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
