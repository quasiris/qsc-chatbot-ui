import { marked } from 'marked';
import createDOMPurify from 'dompurify';
const DOMPurify = createDOMPurify(window);
class QscChatbot extends HTMLElement {
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.isOpen=false; this.isFullscreen=false; this.isMinimized=false;
    this.messages=[]; this.ws=null; this.es=null;
    this.connectionStatus='connecting'; this.unreadCount=0;
    this.restClientId = null;
    this.editingId = null;
    this._copyTimers = {}; 
     this._copySVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9"></path>
      </svg>
    `;
    this._checkSVG = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    `;
  }

  async connectedCallback() {
    this.logoPath=this.getAttribute('logo-path');
    this.headerTitle=this.getAttribute('header-title')||'AI Assistant';
    this.assistantName=this.getAttribute('assistant-name')||'AI assistant';
    this.wsUrl=this.getAttribute('ws-url');
    this.restUrl=this.getAttribute('rest-url');
    this.enableRestFallback=this.hasAttribute('enable-rest-fallback');
    
    const rawWelcome = `**Hello!** I'm your ${this.assistantName}. How can I help you today?`;
    let welcomeHtml = '';
    try {
          const raw = marked.parse(rawWelcome);
          welcomeHtml = `<div class="markdown">${DOMPurify.sanitize(raw)}</div>`;
        } catch {
          welcomeHtml = `<pre class="markdown">${rawWelcome}</pre>`;
        }

    this.messages = [{
      id: 1,
      text: welcomeHtml,       
      sender: 'bot',
      timestamp: new Date(),
    }];
    this.render();

    if (this.wsUrl) this.initWebSocket();
    else if (this.restUrl && this.enableRestFallback) {
      this.useRest=true;
      this.restClientId = `rest-${Date.now()}`; 
      this.es = new EventSource(this.restUrl);
      this.es.onopen = () => {
        this.connectionStatus = 'connected';
        this.render();
      };
      this.es.onerror = () => {
        this.connectionStatus = 'error';
        this.render();
      };
      this.es.onmessage = e => {
        const raw = e.data.trim();
        if (!raw.startsWith('{')) return;
        let msg;
        try {
          msg = JSON.parse(raw);
        } catch {
          return;
        }
        if (msg.type === 'broadcast') {
          this._pushSystem(msg.text);
        }
        else {
          this._pushBot(msg);
        }
      };
    } else this.useRest=false;
  }

  disconnectedCallback() { if(this.ws) this.ws.close(); if(this.es) this.es.close(); }

  initWebSocket() {
    this.ws=new WebSocket(this.wsUrl);
    this.ws.onopen=_=>{ this.connectionStatus='connected';
      this.ws.send(JSON.stringify({type:'register',clientId:`web-${Date.now()}`})); this.render();
    };
    this.ws.onerror=_=>{ this.connectionStatus='error'; this.render(); };
    this.ws.onclose=_=>{ this.connectionStatus='error'; this.render(); };
    this.ws.onmessage=e=>{ let d; try { d=JSON.parse(e.data);}catch{return;}
      if(d.type==='broadcast') this._pushSystem(d.text);
      else this._pushBot(d);
    };
  }

  _pushSystem(txt) {
    this.messages.push({id:Date.now(),text:txt,sender:'system',timestamp:new Date()});
    if(!this.isOpen){ this.showBroadcastPopup(txt); this.unreadCount++; }
    this.renderMessages();
  }

  _pushBot(d) {
    this.messages = this.messages.filter(m => !m.isLoading); 
    let html = '';
    if(d.type==='image'){ 
      html=`<img src="${d.data}" style="max-width:200px;max-height:200px;">`;
    }else if(d.type==='markdown') {
      try {
          const raw = marked.parse(d.data);
          html = `<div class="markdown">${DOMPurify.sanitize(raw)}</div>`;
        } catch {
          html = `<pre class="markdown">${d.data}</pre>`;
        }
    } else {
      html = d.text || '';
    }
    this.messages.push({id:Date.now(),text:html,sender:'bot',timestamp:new Date()});
    this.renderMessages();
  }

  async handleSend() {
    const input = this.shadowRoot.querySelector('.chat-input');
    const value = input.value.trim();
    if (!value) return;

    if (this.editingId) {
      const idx = this._findIndexById(this.editingId);
      if (idx === -1) {
        this.editingId = null;
      } else {
        this.messages[idx].text = value;
        this.messages[idx].timestamp = new Date();
        this._removeMessagesAfterIndex(idx);
        const loadingId = Date.now() + '-loading';
        this.messages.push({
          id: loadingId,
          text: `
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          `,
          sender: 'bot',
          timestamp: new Date(),
          isLoading: true
        });
        this.renderMessages();
        this.scrollToBottom();

        const originalEditId = this.editingId;
        this.editingId = null;
        input.value = '';
        input.placeholder = 'Type a message...';

        if (this.useRest) {
          try {
            const res = await fetch(this.restUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'message', text: value, id: `rest-${Date.now()}`, editedFrom: originalEditId })
            });
            const data = await res.json();
            this.handleRestBotResponse(data);
          } catch (err) {
            this._pushSystem("Sorry, can't reach server.");
          }
        } else if (this.ws && this.connectionStatus === 'connected') {
          this.ws.send(JSON.stringify({ type: 'message', text: value, editedFrom: originalEditId }));
        } else {
          this._pushSystem("Connection error.");
        }
        return;
      }
    }

    this.messages.push({ id: Date.now(), text: value, sender: 'user', timestamp: new Date() });
    const loadingId = Date.now() + '-loading';
    this.messages.push({
      id: loadingId,
      text: `
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      `,
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true
    });

    this.renderMessages();
    this.scrollToBottom();
    input.value = '';

    if (this.useRest) {
      try {
        const res = await fetch(this.restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', text: value, id: `rest-${Date.now()}` })
        });
        const data = await res.json();
        this.handleRestBotResponse(data);
      } catch {
        this._pushSystem("Sorry, can't reach server.");
      }
      return;
    }
    if (this.ws && this.connectionStatus === 'connected') {
      this.ws.send(JSON.stringify({ type: 'message', text: value }));
    } else this._pushSystem("Connection error.");
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
    if (e.target.classList.contains('chat-input') && e.key === 'Enter' && !e.shiftKey) {
      this.handleSend();
    }
  }

  handleRestBotResponse(data) {
    this.messages = this.messages.filter(m => !m.isLoading);
    let html = '';
    if (data.type === 'image') {
      html = `<img src="${data.data}" alt="server image" style="max-width:200px;max-height:200px;">`;
    } else if (data.type === 'markdown') {
      try {
          const raw = marked.parse(data.data);
          html = `<div class="markdown">${DOMPurify.sanitize(raw)}</div>`;
        } catch {
          // fallback for unexpected parse errors
          html = `<pre class="markdown">${data.data}</pre>`;
        }
    } else {
      html = data.text || data.message || data.data;
    }
    this.messages.push({ id: Date.now(), text: html, sender: 'bot', timestamp: new Date() });
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
  _stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  _attachCodeCopyButtons() {
  const container = this.shadowRoot.querySelector('.messages');
  if (!container) return;

  const pres = Array.from(container.querySelectorAll('.message-text .markdown pre'));

  pres.forEach(pre => {
    if (pre._qsc_copy_attached) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-code-btn';
    btn.title = 'Copy code';

    btn.innerHTML = `
       ${this._copySVG}
    `;

    btn.addEventListener('click', async (evt) => {
      evt.stopPropagation();
      try {
        await this._copyCodeFromElement(pre);
        btn.classList.add('copied');
        const iconContainer = btn.querySelector('svg');
        if (iconContainer) iconContainer.outerHTML = this._checkSVG;

        setTimeout(() => {
          btn.classList.remove('copied');
          if (btn.querySelector('svg')) btn.querySelector('svg').outerHTML = this._copySVG;
        }, 1200);
      } catch (err) {
          btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        btn.classList.add('copy-failed');
        setTimeout(() => {
          btn.classList.remove('copy-failed');
          btn.innerHTML = this._copySVG;
        }, 1200);
      }
    });

    pre.style.position = pre.style.position || 'relative';
    pre.appendChild(btn);
    pre._qsc_copy_attached = true;
  });
}


  async _copyCodeFromElement(preEl) {
    const codeEl = preEl.querySelector('code') || preEl;
    const text = codeEl.textContent || codeEl.innerText || '';
    if (!text) throw new Error('No code to copy');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      return new Promise((resolve, reject) => {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          ta.remove();
          ok ? resolve() : reject(new Error('execCommand failed'));
        } catch (e) {
          reject(e);
        }
      });
    }
}

  _findIndexById(id) {
    return this.messages.findIndex(m => String(m.id) === String(id));
  }

  _removeMessagesAfterIndex(idx) {
    if (idx < 0) return;
    this.messages = this.messages.slice(0, idx + 1);
  }
  

  _handleEdit(id) {
    const idx = this._findIndexById(id);
    if (idx === -1) return;
    const msg = this.messages[idx];
    if (msg.sender !== 'user') return;
    const chatInput = this.shadowRoot.querySelector('.chat-input');
    const plain = this._stripHtml(msg.text);
    if (chatInput) {
      chatInput.value = plain;
      chatInput.focus();
      this.editingId = id;
      chatInput.placeholder = 'Edit message...';
    }
  }
  async _handleCopy(id) {
    const idx = this._findIndexById(id);
    if (idx === -1) return;
    const msg = this.messages[idx];
    const textToCopy = this._stripHtml(msg.text);

    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } else {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
          success = document.execCommand('copy');
        } catch (e) {
          success = false;
        }
        ta.remove();
      }
    } catch (err) {
      try {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        success = document.execCommand('copy');
        ta.remove();
      } catch (e) {
        success = false;
      }
    }

    const btn = this.shadowRoot && this.shadowRoot.querySelector(`.copy-btn[data-msg-id="${id}"]`);
    if (!btn) return;

    if (this._copyTimers[id]) {
      clearTimeout(this._copyTimers[id]);
      delete this._copyTimers[id];
    }

    const originalHtml = btn.innerHTML;
    const originalClass = btn.className;

    if (success) {
      btn.innerHTML = this._checkSVG;
      btn.className = originalClass + ' copied';
    } else {
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      btn.className = originalClass + ' copy-failed';
    }
    this._copyTimers[id] = setTimeout(() => {
      try {
        btn.innerHTML = originalHtml;
        btn.className = originalClass;
      } catch (e) {
      }
      delete this._copyTimers[id];
    }, 1000);
  }

  renderMessages() {
    const messagesDiv = this.shadowRoot.querySelector('.messages');
    if (!messagesDiv) return;
    messagesDiv.innerHTML = this.messages.map(m => {
      const showCopy = (!m.isLoading) || Boolean(m.copied);
      const actionsHtml = `
      <div class="message-actions" data-msg-id="${m.id}">
        ${showCopy ? `<button class="message-action-btn copy-btn" data-msg-id="${m.id}" title="Copy" aria-label="Copy message">
            ${this._copySVG}
          </button>` : ''}

        ${m.sender === 'user' && !m.isLoading ? `<button class="message-action-btn edit-btn" data-msg-id="${m.id}" title="Edit"> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
      </svg></button>` : ''}
      </div>
    `;
      if (m.sender === 'system') {
        return `
          <div class="message-row system">
              <div class="bubble system">
                <div class="system-icon">📢</div>
                <div class="message-text" data-msg-id="${m.id}">${m.text}</div>
                <div class="timestamp">${this.formatTime(m.timestamp)}</div>
              </div>
          </div>
        `;
      }
      if (m.sender === 'bot') {
        return `
          <div class="message-row bot">
              <div class="bubble bot">
                <div class="message-text" data-msg-id="${m.id}">${m.text}</div>
                <div class="timestamp">${this.formatTime(m.timestamp)}</div>
              </div>
              ${actionsHtml}
          </div>
        `;
      }
      return `
        <div class="message-row user">
            <div class="bubble user">
              <div class="message-text" data-msg-id="${m.id}"><p>${m.text}</p></div>
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
            </div>
              ${actionsHtml}
        </div>
      `;
    }).join('');
    const container = this.shadowRoot.querySelector('.messages');
  if (container && !container._qsc_actions_bound) {
    container.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.copy-btn');
      if (copyBtn) { this._handleCopy(copyBtn.dataset.msgId); return; }
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) { this._handleEdit(editBtn.dataset.msgId); return; }
    });
    container._qsc_actions_bound = true;
  }
    this.scrollToBottom();
    this._attachCodeCopyButtons();
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
        bottom: 30px;
        right: 24px;
        z-index: 9999;
        transition: transform 0.3s ease;
      }
     .typing-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 20px;
        padding: 0 10px;
        background: #f1f1f1;
        border-radius: 20px;
      }

      .typing-indicator span {
        display: inline-block;
        width: 5px;
        height: 5px;
        margin: 0 2px;
        background-color: var(--primary);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out both;
      }

      .typing-indicator span:nth-child(1) {
        animation-delay: 0s;
      }
      .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes bounce {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0.3;
        } 
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .message-actions {
        display: inline-flex;
        gap: 1px;
        pointer-events: none;    
        height: fit-content !important;   
        opacity: 1 !important;
        transform: translateY(4px);
        transition: opacity .14s ease, transform .14s ease;
      }
        .message-action-btn svg {
          width: 14px;
          height: 14px;
          display: block;
        }
      .message-action-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        width: 28px;
        height: 22px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .message-action-btn.copied {
        background: rgba(16,124,16,0.08);
        color: #107c10;
      }

      .message-action-btn.copy-failed {
        background: rgba(168,0,0,0.06);
        color: var(--error);
      }

      .message-action-btn:hover { background: rgba(0,0,0,0.04); }
      .message-row:hover .message-actions,
      .message-row:focus-within .message-actions {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      @media (max-width: 480px) {
        .message-actions {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
      }
      .message-actions { background: transparent; }

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
        overflow-x: hidden;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;
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
        padding: 10px 12px;
        border-radius: 18px;
        max-width: 87%;
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
        max-width: 95%;
      }
      
      .system-icon {
        font-size: 16px;
      }
      .message-text {
        flex: 1;
        font-size: 13px;
        font-family: monospace;
      } 
      .message-text p {
        margin: 0 !important;
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
      
      .attach-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin-right: 4px;
      }
      .attach-btn svg {
        width: 20px;
        height: 20px;
        stroke: #222;
        fill: none;
        display: block;
      }
      .attach-btn:hover {
        background: rgba(0,0,0,0.04);
      }
      
      .broadcast-popup {
        position: fixed;
        bottom: 127px;
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
      
      .markdown {
        background: #fff;
        border-radius: 8px;
        padding: 2px;
        font-family: monospace;
        max-width: 100%;
        overflow-x: auto;
        color: black !important;
      }
      .markdown pre {
        position: relative;
        padding: 5px;
        background-color: #f0f0f0;
        border-radius: 15px;
        overflow-x: auto;
      }
        .copy-code-btn {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(0,0,0,0.06);
        border: none;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        z-index: 10;
      }

      .copy-code-btn svg { width: 14px; height: 14px; }

      .copy-code-btn.copied {
        background: rgba(16,124,16,0.08);
        color: #107c10;
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
        
        .fullscreen-btn,
        .minimize-btn {
          display: none !important;
        }
      }
      .chat-window.fullscreen .message-actions {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
        z-index: 9999 !important;              
      }

      .chat-window.fullscreen .message-row:hover .message-actions,
      .chat-window.fullscreen .message-row:focus-within .message-actions {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
      }
      .chat-window.fullscreen .message-actions {
        gap: 6px;
        font-size: 12px;
      }

      .chat-window.fullscreen {
        width: 100vw !important;
        height: auto !important;
        border-radius: 0 !important;
        position: fixed !important;
        top: 0;left: 0; right: 0; bottom: 0;
        z-index: 2147483647 !important;
        overflow: visible !important; 
      }
      .chat-window.minimized {
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .fullscreen-btn, .minimize-btn {
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
        font-size: 18px;
        margin-left: 4px;
      }
      .fullscreen-btn:hover, .minimize-btn:hover {
        background: rgba(255,255,255,0.2);
      }
      </style>
      
      <div class="chatbot-container">
        ${this.isOpen ? `
          <div class="chat-window${this.isFullscreen ? ' fullscreen' : ''}${this.isMinimized ? ' minimized' : ''}">
            <div class="header">
              <div class="header-title">${this.headerTitle}</div>
              
              <div class="header-controls">
                <div class="connection-status">
                  <div class="status-dot ${this.connectionStatus === 'connected' ? 'status-connected' : 
                    this.connectionStatus === 'connecting' ? 'status-connecting' : 'status-error'}"></div>
                  <span>${this.connectionStatus}</span>
                </div>
                ${this.isFullscreen
                  ? `<button class="minimize-btn" title="Minimize">&#8211;</button>`
                  : `<button class="fullscreen-btn" title="Fullscreen">&#x26F6;</button>`
                }
                <button class="close-btn" title="Close">&times;</button>
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
              <textarea class="chat-input" rows="1" placeholder="Type a message..." autofocus></textarea>
              <input class="file-input" type="file" accept="image/*,.md,.markdown" style="display:none">
              <button class="attach-btn" title="Attach file">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.19 9.19a1 1 0 01-1.41-1.41l9.19-9.19" />
                </svg>
              </button>
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
    this.renderMessages();
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
    
    const fullscreenBtn = this.shadowRoot.querySelector('.fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.isFullscreen = !this.isFullscreen;
        if (this.isFullscreen) this.isMinimized = false;
        this.render();
      });
    }
    const minimizeBtn = this.shadowRoot.querySelector('.minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) this.isFullscreen = false;
        this.render();
      });
    }
    
    const fileInput = this.shadowRoot.querySelector('.file-input');
    const attachBtn = this.shadowRoot.querySelector('.attach-btn');
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result;
            this.messages.push({
              id: Date.now(),
              text: `<img src="${base64}" alt="user upload" style="max-width:200px;max-height:200px;">`,
              sender: 'user',
              timestamp: new Date()
            });
            this.renderMessages();
            this.scrollToBottom();
            if (this.ws && this.connectionStatus === 'connected') {
              this.ws.send(JSON.stringify({ type: 'image', data: base64, filename: file.name }));
            } else if (this.useRest) {
              try {
               const response = await fetch(this.restUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: this.restClientId, type: 'image', data: base64, filename: file.name })
                });
                const data = await response.json();  
                this.handleRestBotResponse(data);
              } catch (err) {
                console.error('Error sending image via REST:', err);
              }
            }
          };
          reader.readAsDataURL(file);
        } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
          const reader = new FileReader();
          reader.onload = async () => {
            const content = reader.result;
            let html;
            try {
              const raw = marked.parse(content);
              html = `<div class="markdown">${DOMPurify.sanitize(raw)}</div>`;
            } catch {
              html = `<pre class="markdown">${content}</pre>`;
            }
            this.messages.push({
              id: Date.now(),
              text: html,
              sender: 'user',
              timestamp: new Date()
            });
            this.renderMessages();
            this.scrollToBottom();
            if (this.ws && this.connectionStatus === 'connected') {
              this.ws.send(JSON.stringify({ type: 'markdown', data: content, filename: file.name }));
            } else if (this.useRest) {
              try {
                const response = await fetch(this.restUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: Date.now(), type: 'markdown', data: content, filename: file.name })
                });
                const data = await response.json();
                this.handleRestBotResponse(data);
              } catch (err) {
                console.error('Error sending markdown via REST:', err);
              }
            }
          };
          reader.readAsText(file);
        }
        fileInput.value = '';
      });
    }
  }
}

customElements.define('qsc-chatbot', QscChatbot);

