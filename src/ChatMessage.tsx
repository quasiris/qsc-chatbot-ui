import React from 'react';
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

export default function ChatMessage({ message }: { message: Message }) {
  if (message.sender === 'system') {
    return (
      <div className={styles.messageRow + ' ' + styles.systemRow}>
        <div className={styles.bubble + ' ' + styles.systemBubble}>
          <div className={styles.systemIcon}>📢</div>
          <div className={styles.messageText}>{message.text}</div>
          <div className={styles.timestamp}>{formatTime(message.timestamp)}</div>
        </div>
      </div>
    );
  }
  if (message.sender === 'bot') {
    return (
      <div className={styles.messageRow + ' ' + styles.botRow}>
        <div className={styles.bubble + ' ' + styles.botBubble}>
          <div className={styles.messageText}>{message.text}</div>
          <div className={styles.timestamp}>{formatTime(message.timestamp)}</div>
        </div>
      </div>
    );
  }
  // user
  return (
    <div className={styles.messageRow + ' ' + styles.userRow}>
      <div className={styles.bubble + ' ' + styles.userBubble}>
        <div className={styles.messageText}>{message.text}</div>
        <div className={styles.timestamp}>{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
}