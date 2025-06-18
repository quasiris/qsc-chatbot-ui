
import React from 'react';
import { createRoot } from 'react-dom/client';
import Chatbot from './Chatbot';
import './Chatbot.module.css';

(window as any).addEventListener('load', () => {
  const opts = (window as any).__CHATBOT_PLUGIN_OPTIONS__;
  if (!opts) {
    console.error('Chatbot plugin options not found on window');
    return;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<Chatbot {...opts} />);
});