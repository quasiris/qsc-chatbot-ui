import React from 'react';
import { createRoot } from 'react-dom/client';
import Chatbot from './chatbot';

window.addEventListener('load', () => {
  let opts = (window as any).__QSC_CHATBOT_PLUGIN_OPTIONS__;
  if (!opts) {
    opts = (window as any).__CHATBOT_PLUGIN_OPTIONS__;
  }
  if (!opts) {
    console.error('Chatbot plugin options not found');
    return;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(React.createElement(Chatbot, opts));
});
