import React, { useEffect, useRef } from 'react';

interface ChatbotProps {
  restUrl: string;
  headerTitle?: string;
  attachBtn?: boolean;
  logoPath?: string;
  errorMsg?: string;
}

export default function Chatbot({
  restUrl,
  headerTitle = 'QSC Chatbot',
  attachBtn = true,
  logoPath,
  errorMsg,
}: ChatbotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const insertBot = () => {
      const container = containerRef.current;
      if (!container) return;
      // Do nothing if the bot already exists
      if (container.querySelector('qsc-chatbot')) return;

      const el = document.createElement('qsc-chatbot');
      if (restUrl) {
        el.setAttribute('rest-url', restUrl);
      }
      el.setAttribute('header-title', headerTitle);
      if (attachBtn) {
        el.setAttribute('attach-btn', 'true');
      } else {
        el.removeAttribute('attach-btn');
      }
      if (logoPath) el.setAttribute('logo-path', logoPath);
      if (errorMsg) el.setAttribute('error-msg', errorMsg);

      container.appendChild(el);
    };

    // Load the web component script only once per page
    if (!window.customElements.get('qsc-chatbot')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@quasiris/qsc-chatbot-ui@latest/dist/qsc-chatbot.js';
      script.async = true;
      script.onload = insertBot;
      script.onerror = (e) => {
      };
      document.head.appendChild(script);
    } else {
      insertBot();
    }

    return () => {
      const container = containerRef.current;
      if (!container) return;
      const botEl = container.querySelector('qsc-chatbot');
      if (botEl) {
        botEl.remove();
      }
    };
  }, [restUrl, headerTitle, attachBtn, logoPath, errorMsg]);

  return <div ref={containerRef} />;
}
