import React from 'react';
import { createRoot } from 'react-dom/client';
import Chatbot from './chatbot';

// On page load, read the injected plugin options and mount Chatbot
(window as any).addEventListener('load', () => {
  const opts = (window as any).__CHATBOT_PLUGIN_OPTIONS__;
  if (!opts) {
    console.error('Chatbot plugin options not found');
    return;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Chatbot {...opts} />);
});
