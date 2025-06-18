import React from 'react';
import styles from './Chatbot.module.css';

interface Message { id: string|number; text: string; sender: 'user'|'bot'|'system'; }

export default function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`${styles.message} ${
      message.sender === 'user' ? styles.userMessage : message.sender === 'bot' ? styles.botMessage : styles.systemMessage
    }`}>
      <div className={styles.messageContent}>
        <div className={styles.messageSender}>
          {message.sender === 'user' ? 'You' : message.sender === 'bot' ? 'Qsc assistant' : 'System'}
        </div>
        <div className={styles.messageText}>{message.text}</div>
      </div>
    </div>
  );
}