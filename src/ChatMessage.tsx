import React from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import styles from './Chatbot.module.css';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp?: Date;
}

function formatTime(date?: Date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMessageHTML(raw: string) {
  const html = marked.parse(raw);
  return DOMPurify.sanitize(html);
}

export default function ChatMessage({ message }: { message: Message }) {
  const safeHTML = renderMessageHTML(message.text);

  if (message.sender === 'system') {
    return (
      <div className={styles.messageRow + ' ' + styles.systemRow}>
        <div className={styles.bubble + ' ' + styles.systemBubble}>
          <div className={styles.systemIcon}>📢</div>
          <div className={styles.messageText} dangerouslySetInnerHTML={{ __html: safeHTML }} />
          <div className={styles.timestamp}>{formatTime(message.timestamp)}</div>
        </div>
      </div>
    );
  }

  if (message.sender === 'bot') {
    return (
      <div className={styles.messageRow + ' ' + styles.botRow}>
        <div className={styles.bubble + ' ' + styles.botBubble}>
          <div className={styles.messageText} dangerouslySetInnerHTML={{ __html: safeHTML }} />
          <div className={styles.timestamp}>{formatTime(message.timestamp)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messageRow + ' ' + styles.userRow}>
      <div className={styles.bubble + ' ' + styles.userBubble}>
        <div className={styles.messageText} dangerouslySetInnerHTML={{ __html: safeHTML }} />
        <div className={styles.timestamp}>{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
}
