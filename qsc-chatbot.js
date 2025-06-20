class QscChatbot extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.messages = [
      { 
        id: 1, 
        text: `Hello! I'm your ${this.getAttribute('assistant-name') || 'AI assistant'}. How can I help you today?`, 
        sender: 'bot',
        timestamp: new Date()
      }
    ];
    this.logoPath = this.getAttribute('logo-path');
    this.headerTitle = this.getAttribute('header-title') || 'AI Assistant';
    this.wsUrl = this.getAttribute('ws-url');
    this.ws = null;
    this.connectionStatus = 'connecting';
    this.unreadCount = 0;
    this.render();
  }

  connectedCallback() {
    if (this.wsUrl) {
      this.initWebSocket();
    }
  }

  disconnectedCallback() {
    if (this.ws) {
      this.ws.close();
    }
  }

  initWebSocket() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.onopen = () => {
      this.connectionStatus = 'connected';
      this.ws.send(JSON.stringify({ type: 'register', clientId: `web-${Date.now()}` }));
      this.render();
    };
    this.ws.onerror = () => {
      this.connectionStatus = 'error';
      this.render();
    };
    this.ws.onclose = () => {
      this.connectionStatus = 'error';
      this.render();
    };
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'broadcast') {
          const message = data.text || data.message;
          
          // Always add broadcast to messages array
          this.messages.push({ 
            id: Date.now(), 
            text: message, 
            sender: 'system',
            timestamp: new Date()
          });
          
          if (!this.isOpen) {
            this.showBroadcastPopup(message);
            this.unreadCount++;
          }
          
          this.renderMessages();
        } 
        else {
          const message = data.message || data.text || event.data;
          this.messages.push({ 
            id: Date.now(), 
            text: message, 
            sender: 'bot',
            timestamp: new Date()
          });
          this.renderMessages();
        }
        
        this.scrollToBottom();
      } catch (e) {
        console.error('Error processing message:', e);
      }
    };
  }

  handleClick(e) {
    const toggleBtn = e.target.closest('.toggle-btn');
    if (toggleBtn) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) this.unreadCount = 0;
      this.render();
      if (this.isOpen) this.scrollToBottom();
      return;
    }
    
   if (e.target.closest('.send-btn')) {
    this.handleSend();
  }
  }

  handleKeyDown(e) {
    if (e.target.classList.contains('chat-input') && e.key === 'Enter') {
      this.handleSend();
    }
  }

  handleSend() {
    const input = this.shadowRoot.querySelector('.chat-input');
    const value = input.value.trim();
    if (!value) return;
    
    this.messages.push({ 
      id: Date.now(), 
      text: value, 
      sender: 'user',
      timestamp: new Date()
    });
    
    input.value = '';
    
    if (this.ws && this.connectionStatus === 'connected') {
      this.ws.send(JSON.stringify({ type: 'message', text: value }));
    } else {
      this.messages.push({ 
        id: Date.now(), 
        text: "Sorry, I'm having connection issues. Please try again later.", 
        sender: 'system',
        timestamp: new Date()
      });
    }
    
    this.renderMessages();
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      const messagesDiv = this.shadowRoot.querySelector('.messages');
      if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 100);
  }

  showBroadcastPopup(message) {
    const oldPopup = this.shadowRoot.querySelector('.broadcast-popup');
    if (oldPopup) oldPopup.remove();
    
    const popup = document.createElement('div');
    popup.className = 'broadcast-popup';
    popup.innerHTML = `
      <div class="broadcast-icon">📢</div>
      <span>${message}</span>
    `;
    
    this.shadowRoot.appendChild(popup);
    setTimeout(() => {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  }
  
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  renderMessages() {
    const messagesDiv = this.shadowRoot.querySelector('.messages');
    if (!messagesDiv) return;
    
    messagesDiv.innerHTML = this.messages.map(m => {
      if (m.sender === 'system') {
        return `
          <div class="message-row system">
            <div class="bubble system">
              <div class="system-icon">📢</div>
              <div class="message-text">${m.text}</div>
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
            </div>
          </div>
        `;
      }
      if (m.sender === 'bot') {
        return `
          <div class="message-row bot">
            <div class="bubble bot">
              <div class="message-text">${m.text}</div>
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
            </div>
          </div>
        `;
      }
      return `
        <div class="message-row user">
          <div class="bubble user">
            <div class="message-text">${m.text}</div>
            <div class="timestamp">${this.formatTime(m.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    this.scrollToBottom();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        --primary: #0078d4;
        --primary-light: #e1f0fa;
        --secondary: #605e5c;
        --background: #ffffff;
        --background-alt: #f5f5f5;
        --text-primary: #323130;
        --text-secondary: #605e5c;
        --success: #107c10;
        --warning: #d83b01;
        --error: #a80000;
        --border-radius: 12px;
        --shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
        
        font-family: 'Segoe UI', system-ui, sans-serif;
      }

      @keyframes smoothJump {
        0%, 100% {
        transform: translateY(0);
        }
        50% {
        transform: translateY(-5px);
        }
      }

      .jumpLoop {
        animation: smoothJump 1s ease-in-out infinite;
      }
      
      .chatbot-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        transition: transform 0.3s ease;
      }
      
      .toggle-btn {
        position: relative;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 64px;
        height: 64px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow);
        transition: var(--transition);
        font-weight: 600;
        font-size: 18px;
      }
      
      .toggle-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      .toggle-btn img.jumpLoop {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
        animation: smoothJump 1s ease-in-out infinite;
      }

      .toggle-btn .qsc-span.jumpLoop {
        display: inline-block;
        animation: smoothJump 1s ease-in-out infinite;
        font-size: 24px;
      }
      
      .unread-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--error);
        color: white;
        border-radius: 50%;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      
      .chat-window {
        background: var(--background);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        width: 380px;
        height: 480px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(20px);
        opacity: 0;
        animation: fadeInUp 0.3s ease forwards;
      }
      
      @keyframes fadeInUp {
        to {
        opacity: 1;
        transform: translateY(0);
        }
      }
      
      .header {
        background: var(--primary);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 10;
      }
      
      .header-title {
        font-weight: 600;
        font-size: 18px;
      }
      
      .header-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .close-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        font-size: 20px;
        font-weight: 300;
      }
      
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        opacity: 0.9;
        background: rgba(0, 0, 0, 0.2);
        padding: 4px 8px;
        border-radius: 20px;
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      
      .status-connected {
        background: var(--success);
      }
      
      .status-connecting {
        background: #ffb900;
        animation: pulse 1.5s infinite;
      }
      
      .status-error {
        background: var(--error);
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }
      
      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        background: var(--background-alt);
      }
      
      .message-row {
        display: flex;
      }
      
      .message-row.bot {
        justify-content: flex-start;
      }
      
      .message-row.user {
        justify-content: flex-end;
      }
      
      .message-row.system {
        justify-content: center;
      }
      
      .bubble {
        padding: 14px 18px;
        border-radius: 18px;
        max-width: 85%;
        position: relative;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        line-height: 1.5;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .bubble.user {
        background: var(--primary);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .bubble.bot {
        background: var(--background);
        color: var(--text-primary);
        border-bottom-left-radius: 4px;
        border: 1px solid rgba(0,0,0,0.05);
      }
      
      .bubble.system {
        background: #fff8e1;
        color: #856404;
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 90%;
      }
      
      .system-icon {
        font-size: 18px;
      }
      
      .message-text {
        flex: 1;
      }
      
      .timestamp {
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 6px;
        text-align: right;
      }
      
      .user .timestamp {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .system .timestamp {
        text-align: right;
      }
      
      .input-area {
        display: flex;
        border-top: 1px solid rgba(0,0,0,0.08);
        padding: 16px;
        background: var(--background);
        gap: 10px;
      }
      
      .chat-input {
        flex: 1;
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 24px;
        padding: 12px 18px;
        font-size: 15px;
        background: var(--background-alt);
        color: var(--text-primary);
        transition: border 0.2s;
      }
      
      .chat-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.2);
      }
      
      .send-btn {
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
      }
      
      .send-btn:hover {
        background: #106ebe;
        transform: scale(1.05);
      }
      
      .send-btn:active {
        transform: scale(0.95);
      }
      
      .send-btn svg {
        width: 20px;
        height: 20px;
      }
      
      .broadcast-popup {
        position: fixed;
        bottom: 100px;
        right: 40px;
        background: #fff8e1;
        color: #856404;
        padding: 14px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        font-size: 14px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
        transition: opacity 0.5s ease;
        border-left: 4px solid #ffb900;
      }
      
      .broadcast-icon {
        min-width: 24px;
        height: 24px;
        background: #ffb900;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #856404;
      }
      
      .fade-out {
        opacity: 0;
      }
      
      @media (max-width: 480px) {
        .chatbot-container {
        bottom: 16px;
        right: 16px;
        }
        
        .chat-window {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        bottom: 0;
        right: 0;
        position: fixed;
        }
        
        .broadcast-popup {
        bottom: 90px;
        right: 20px;
        left: 20px;
        max-width: none;
        }
      }
      </style>
      
      <div class="chatbot-container">
      ${this.isOpen ? `
        <div class="chat-window">
        <div class="header">
          <div class="header-title">${this.headerTitle}</div>
          
          <div class="header-controls">
          <div class="connection-status">
            <div class="status-dot ${this.connectionStatus === 'connected' ? 'status-connected' : 
             this.connectionStatus === 'connecting' ? 'status-connecting' : 'status-error'}"></div>
            <span>${this.connectionStatus}</span>
          </div>
          
          <button class="close-btn" title="Close">
            &times;
          </button>
          </div>
        </div>
        
        <div class="messages">
          ${this.messages.map(m => {
          if (m.sender === 'system') {
            return `
            <div class="message-row system">
              <div class="bubble system">
              <div class="system-icon">📢</div>
              <div class="message-text">${m.text}</div>
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
              </div>
            </div>
            `;
          }
          if (m.sender === 'bot') {
            return `
            <div class="message-row bot">
              <div class="bubble bot">
              <div class="message-text">${m.text}</div>
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
              </div>
            </div>
            `;
          }
          return `
            <div class="message-row user">
            <div class="bubble user">
              <div class="message-text">${m.text}</div>
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
            </div>
            </div>
          `;
          }).join('')}
        </div>
        
        <div class="input-area">
          <input class="chat-input" type="text" placeholder="Type a message..." autofocus>
          <button class="send-btn">
          <svg class="send-icon" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
          </button>
        </div>
        </div>
      ` : `
        <button class="toggle-btn">
        ${
          this.logoPath
          ? `<img src="${this.logoPath}" alt="Qsc" class="jumpLoop">`
          : `<span class="qsc-span jumpLoop">Qsc</span>`
        }
        ${this.unreadCount > 0 ? `<div class="unread-count">${this.unreadCount}</div>` : ''}
        </button>
      `}
      </div>
    `;

    const toggleBtn = this.shadowRoot.querySelector('.toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.handleClick.bind(this));
    }
    
    const sendBtn = this.shadowRoot.querySelector('.send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', this.handleClick.bind(this));
    }
    
    const chatInput = this.shadowRoot.querySelector('.chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', this.handleKeyDown.bind(this));
      if (this.isOpen) chatInput.focus();
    }
    
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        this.render();
      });
    }
  }
}

customElements.define('qsc-chatbot', QscChatbot);