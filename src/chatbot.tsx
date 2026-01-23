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
    let cancelled = false;

    const insertBot = () => {
      const container = containerRef.current;
      if (!container || cancelled) return;
      if (container.querySelector('qsc-chatbot')) return;

      const el = document.createElement('qsc-chatbot');
      if (restUrl) el.setAttribute('rest-url', restUrl);
      el.setAttribute('header-title', headerTitle);
      if (attachBtn) el.setAttribute('attach-btn', 'true');
      else el.removeAttribute('attach-btn');
      if (logoPath) el.setAttribute('logo-path', logoPath);
      if (errorMsg) el.setAttribute('error-msg', errorMsg);

      container.appendChild(el);
    };

    const ensureRegisteredAndInsert = async () => {
      // If custom element already registered, just insert
      if ((window as any).customElements?.get('qsc-chatbot')) {
        insertBot();
        return;
      }

      // Otherwise import the npm package 
      try {
        await import('@quasiris/qsc-chatbot-ui');
        if (!cancelled) insertBot();
      } catch (err) {
        console.error('Failed to import qsc-chatbot-ui', err);
      }
    };

    ensureRegisteredAndInsert();

    return () => {
      cancelled = true;
      const container = containerRef.current;
      if (!container) return;
      const botEl = container.querySelector('qsc-chatbot');
      if (botEl) botEl.remove();
    };
  }, [restUrl, headerTitle, attachBtn, logoPath, errorMsg]);

  return <div ref={containerRef} />;
}
