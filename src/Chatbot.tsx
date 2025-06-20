import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import styles from './Chatbot.module.css';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp?: Date;
}

interface Props {
  wsUrl: string;
  headerTitle?: string;
  logoPath?: string;
  assistantName?: string;
}

const isMobile = () => window.innerWidth <= 480;

const statusClassMap = {
  connected: styles.statusConnected,
  connecting: styles.statusConnecting,
  error: styles.statusError,
};

export default function Chatbot({
  wsUrl,
  headerTitle = 'AI Assistant',
  logoPath,
  assistantName = 'AI assistant',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hello! I'm your ${assistantName}. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestBroadcast, setLatestBroadcast] = useState<string | null>(null);
  const [showBroadcastPopup, setShowBroadcastPopup] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // WebSocket logic
  useEffect(() => {
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnectionStatus('connected');
      ws.send(JSON.stringify({ type: 'register', clientId: `web-${Date.now()}` }));
    };
    ws.onerror = () => setConnectionStatus('error');
    ws.onclose = () => setConnectionStatus('error');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'broadcast') {
          const message = data.text || data.message;
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: message, sender: 'system', timestamp: new Date() },
          ]);
          setLatestBroadcast(message);
          if (!isOpen) {
            setShowBroadcastPopup(true);
            setUnreadCount((c) => c + 1);
          }
        } else {
          const message = data.message || data.text || event.data;
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: message, sender: 'bot', timestamp: new Date() },
          ]);
        }
      } catch (e) {
        // ignore
      }
    };
    return () => {
      ws.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isFullscreen, isMinimized]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Show broadcast popup when closed
  useEffect(() => {
    if (latestBroadcast && !isOpen) {
      setShowBroadcastPopup(true);
    } else {
      setShowBroadcastPopup(false);
    }
  }, [latestBroadcast, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowBroadcastPopup(false);
      setUnreadCount(0);
    }
  }, [isOpen]);

  const showFullscreenBtn = !isMobile() && !isFullscreen;
  const showMinimizeBtn = !isMobile() && isFullscreen;

  // Send message
  const handleSend = () => {
    const input = inputRef.current;
    if (!input) return;
    const value = input.value.trim();
    if (!value) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: value, sender: 'user', timestamp: new Date() },
    ]);
    input.value = '';
    if (wsRef.current && connectionStatus === 'connected') {
      wsRef.current.send(JSON.stringify({ type: 'message', text: value }));
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Sorry, I'm having connection issues. Please try again later.",
          sender: 'system',
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Logo fallback logic
  const [logoError, setLogoError] = useState(false);

  const handleFullscreen = () => {
    setIsFullscreen((prev) => {
      if (!prev) setIsMinimized(false);
      return !prev;
    });
  };

  const handleMinimize = () => {
    setIsMinimized((prev) => {
      if (!prev) setIsFullscreen(false);
      return !prev;
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showBroadcastPopup && !isOpen) {
      timer = setTimeout(() => setShowBroadcastPopup(false), 4000);
    }
    return () => clearTimeout(timer);
  }, [showBroadcastPopup, isOpen]);

  return (
    <div className={styles.chatbotContainer}>
      {isOpen ? (
        <div
          className={[
            styles.chatWindow,
            isFullscreen ? styles.fullscreen : '',
            isMinimized ? styles.minimized : '',
          ].join(' ')}
        >
          <div className={styles.header}>
            <div className={styles.headerTitle}>{headerTitle}</div>
            <div className={styles.headerRight}>
              <div className={styles.connectionStatus}>
                <span className={[styles.statusDot, statusClassMap[connectionStatus]].join(' ')}></span>
                <span>{connectionStatus}</span>
              </div>
              {showMinimizeBtn && (
                <button className={styles.minimizeBtn} title="Minimize" onClick={handleMinimize}>
                  &#8211;
                </button>
              )}
              {showFullscreenBtn && (
                <button className={styles.fullscreenBtn} title="Fullscreen" onClick={handleFullscreen}>
                  &#x26F6;
                </button>
              )}
              <button className={styles.closeButton} title="Close" onClick={() => setIsOpen(false)}>
                &times;
              </button>
            </div>
          </div>
          <div className={styles.messages}>
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputArea}>
            <input
              className={styles.input}
              type="text"
              ref={inputRef}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className={styles.sendButton} onClick={handleSend}>
              <svg className={styles.sendIcon} viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.toggleButton} onClick={() => setIsOpen(true)}>
          {logoPath && !logoError ? (
            <img
              src={logoPath}
              alt="Qsc"
              className={styles.jumpLoop}
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className={styles.jumpLoop}>Qsc</span>
          )}
          {unreadCount > 0 ? <div className={styles.broadcastIndicator}>{unreadCount}</div> : ''}
        </button>
      )}
      {showBroadcastPopup && !isOpen && latestBroadcast && (
        <div className={styles.broadcastPopup}>
          <div className={styles.broadcastIcon}>📢</div>
          <span>{latestBroadcast}</span>
        </div>
      )}
    </div>
  );
}
