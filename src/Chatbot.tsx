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
  const [latestBroadcast, setLatestBroadcast] = useState<string | null>(null);
  const [showBroadcastPopup, setShowBroadcastPopup] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          }
        } else if (data.type === 'image') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: `<img src="${data.data}" alt="server image" style="max-width:200px;max-height:200px;">`,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
        } else if (data.type === 'markdown') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: `<pre class="markdown">${data.data}</pre>`,
              sender: 'bot',
              timestamp: new Date(),
            },
          ]);
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
      setLatestBroadcast(null); 
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

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: `<img src="${base64}" alt="user upload" style="max-width:200px;max-height:200px;">`,
            sender: 'user',
            timestamp: new Date(),
          },
        ]);
        if (wsRef.current && connectionStatus === 'connected') {
          wsRef.current.send(JSON.stringify({ type: 'image', data: base64, filename: file.name }));
        }
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: `<pre class="markdown">${content}</pre>`,
            sender: 'user',
            timestamp: new Date(),
          },
        ]);
        if (wsRef.current && connectionStatus === 'connected') {
          wsRef.current.send(JSON.stringify({ type: 'markdown', data: content, filename: file.name }));
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
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
      timer = setTimeout(() => {
        setShowBroadcastPopup(false);
        setLatestBroadcast(null);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [showBroadcastPopup, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

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
              <button className={styles.closeButton} title="Close" onClick={handleClose}>
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
            <input
              type="file"
              accept="image/*,.md,.markdown"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              className={styles.attachBtn}
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.19 9.19a1 1 0 01-1.41-1.41l9.19-9.19" />
              </svg>
            </button>
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
