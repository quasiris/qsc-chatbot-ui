import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import styles from './Chatbot.module.css';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'bot' | 'system';
}

interface Props {
  wsUrl: string;
  restUrl?: string;
  enableRestFallback?: boolean;
  headerTitle?: string;
  logoPath?: string;
  assistantName?: string;
}

export default function Chatbot({
  wsUrl,
  restUrl,
  headerTitle,
  logoPath,
  assistantName,
  enableRestFallback = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: `Hello! I'm your ${assistantName}.`, sender: 'bot' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] =
    useState<'connecting' | 'connected' | 'error'>('connecting');
  const apiMode: 'ws' | 'rest' = 'ws';
  const [latestBroadcast, setLatestBroadcast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl) {
      console.error('Error: wsUrl is required for Chatbot plugin');
    }
    if (enableRestFallback && !restUrl) {
      console.error('Error: restUrl must be provided when enableRestFallback is true');
    }
  }, [wsUrl, restUrl, enableRestFallback]);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      ws.send(JSON.stringify({ type: 'register', clientId: `web-${Date.now()}` }));
    };
    ws.onerror = () => setConnectionStatus('error');
    ws.onclose = () => setConnectionStatus('error');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'response') addBotMessage(data.text);
      if (data.type === 'broadcast') {
        setLatestBroadcast(data.text);
        addSystemMessage(`📢 ${data.text}`);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    if (latestBroadcast && !isOpen) {
      const note = document.createElement('div');
      note.className = styles.broadcastNotification;
      note.textContent = latestBroadcast;
      note.onclick = () => setIsOpen(true);
      document.body.appendChild(note);
      setTimeout(() => {
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 200);
      }, 5000);
    }
  }, [latestBroadcast, isOpen]);

  const addBotMessage = (text: string) =>
    setMessages((prev) => [...prev, { id: Date.now(), text, sender: 'bot' }]);
  const addSystemMessage = (text: string) =>
    setMessages((prev) => [...prev, { id: Date.now(), text, sender: 'system' }]);

  const toggleChat = () => {
    setIsOpen((o) => !o);
    setLatestBroadcast(null);
  };

  const sendRest = async (text: string) => {
    if (!restUrl) return;
    try {
      const res = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', text, id: `${Date.now()}` }),
      });
      const data = await res.json();
      addBotMessage(data.text);
    } catch {
      addBotMessage('Error connecting to server.');
    }
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { id: Date.now(), text: trimmed, sender: 'user' }]);
    setInputValue('');

    if (
      apiMode === 'ws' &&
      connectionStatus === 'connected' &&
      wsRef.current
    ) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'message', text: trimmed, id: `${Date.now()}` }));
      } catch {
        enableRestFallback && sendRest(trimmed);
      }
    } else if (enableRestFallback) {
      sendRest(trimmed);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.chatbotContainer}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h3>{headerTitle}</h3>
              <div className={`${styles.connectionStatus} ${styles[connectionStatus]}`}>
                <div className={styles.statusDot} />
                {connectionStatus.toUpperCase()}
              </div>
            </div>
            <div className={styles.headerRight}>
              <button className={styles.closeButton} onClick={toggleChat}>
                ×
              </button>
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message…"
              className={styles.input}
            />
            <button onClick={handleSend} className={styles.sendButton}>
              Send
            </button>
          </div>
        </div>
      )}

     <button
  className={`${styles.toggleButton} ${isOpen ? styles.hidden : ''}`}
  onClick={toggleChat}
>
  {latestBroadcast && (
    <div className={styles.broadcastIndicator}>📢</div>
  )}
  {logoPath ? (
    <img
      src={logoPath}
      alt="Bot"
      width={48}
      height={48}
      className={styles.jumpLoop}
      onError={(e) => {
        const target = e.currentTarget;
        target.onerror = null;
        target.style.display = 'none';
        const fallback = document.createElement('strong');
        fallback.className = styles.jumpLoop;
        fallback.style.color = 'white';
        fallback.style.fontSize = '23px';
        fallback.textContent = 'Qsc';
        target.parentNode?.appendChild(fallback);
      }}
    />
  ) : (
    <strong
      className={styles.jumpLoop}
      style={{ color: 'white', fontSize: '23px' }}
    >
      Qsc
    </strong>
  )}
</button>

    </div>
  );
}
