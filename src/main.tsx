import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { ConfiguratorProvider } from './contexts/configurator';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ConfiguratorProvider>
        <App />
      </ConfiguratorProvider>
    </React.StrictMode>
  );
} else {
  throw new Error('Root element not found');
}
