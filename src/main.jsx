import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './lang.jsx';
import { ContentProvider } from './content/ContentContext.jsx';
import App from './App.jsx';
import './style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </LangProvider>
  </StrictMode>
);
