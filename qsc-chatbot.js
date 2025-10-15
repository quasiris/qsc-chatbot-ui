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
    this.tenant = null;
    this.code = null;
    this.sessionId = null;
    this.receivedModels = [];      
    this.selectedModel = null;
    this.showModelMenu = false;
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
  _startNewChat() {
    this.sessionId = null;
    try {
      localStorage.removeItem('qsc_session_id');
    } catch (e) {
    }

    // Reset to welcome message
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

    // Reset selected model 
    this.selectedModel = null; 
    this.receivedModels = []; 

    // Close any open dropdowns
    this.showModelMenu = false;

    this.renderMessages({ autoScroll: 'bottom' });
    this.render();

    if (this.ws) {
      this.ws.send(JSON.stringify({ 
        type: 'new_session', 
        tenant: this.tenant, 
        code: this.code 
      }));
    }
  }
  async connectedCallback() {
    this.logoPath=this.getAttribute('logo-path');
    this.headerTitle=this.getAttribute('header-title') || 'AI Assistant';
    this.assistantName=this.getAttribute('assistant-name') || 'AI assistant';
    this.wsUrl=this.getAttribute('ws-url');
    this.connectedStatus=this.getAttribute('connected-status') === 'true';
    this.enableRestFallback=this.hasAttribute('enable-rest-fallback');
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tenant');
      const c = params.get('code');
      if (t) this.tenant = t;
      if (c) this.code = c;
    } catch (e) {
      // ignore if URLSearchParams not available
    }
    const baseRestUrl = this.getAttribute('rest-url')?.replace(/\/+$/, '') || '';
    // Encode tenant and code
    const tenantEnc = encodeURIComponent(this.tenant ?? '');
    const codeEnc = encodeURIComponent(this.code ?? '');

    // Build full URL with path params included
    if(tenantEnc && codeEnc)
      this.restUrl = `${baseRestUrl}/${tenantEnc}/${codeEnc}`;
    else  
      this.restUrl = baseRestUrl;
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
      const base = this.restUrl.replace(/\/+$/, '');
      const tenantEnc = encodeURIComponent(this.tenant ?? '');
      const codeEnc   = encodeURIComponent(this.code ?? '');
      const url = new URL(`${base}/${tenantEnc}/${codeEnc}`);
      if (this.sessionId) url.searchParams.set("session_id", this.sessionId);
      if (this.connectedStatus){
        this.es = new EventSource(url.toString());
   
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
            let text= msg.text || msg.message || msg.data
            this._pushSystem(text);
          }
          else {
            this._pushBot(msg);
          }
        };
      }
    } else this.useRest=false;
  }

  disconnectedCallback() { if(this.ws) this.ws.close(); if(this.es) this.es.close(); }

  initWebSocket() {
    this.ws=new WebSocket(this.wsUrl);
    this.ws.onopen=_=>{ this.connectionStatus='connected';
     if(this.connectedStatus){this.ws.send(JSON.stringify({type:'register',clientId:`web-${Date.now()}`})); this.render();}
    };
    this.ws.onerror=_=>{this.connectionStatus='error'; this.render(); };
    this.ws.onclose=_=>{this.connectionStatus='error'; this.render(); };
    this.ws.onmessage=e=>{ let d; try { d=JSON.parse(e.data);}catch{return;}
      if(d.type==='broadcast') {
        let msg= d.text || d.message || d.data
        this._pushSystem(msg);}
      else this._pushBot(d);
    };
  }
  _setModels(modelsFromServer) {
    if (!modelsFromServer || !Array.isArray(modelsFromServer) || modelsFromServer.length === 0) {
      this.receivedModels = [];
      this.selectedModel = null;
      this.showModelMenu = false;
      return;
    }

    this.receivedModels = modelsFromServer.map((m, i) => {
      if (typeof m === 'string') {
        return { model: m, label: String(m) };
      } else if (m && typeof m === 'object') {
        return { model: m.model, label: String(m.label) || String(m)};
      } else {
        return { model: m, label: String(m) };
      }
    });

    if (this.selectedModel) {
      const keep = this.receivedModels.find(x => String(x.model) === String(this.selectedModel.model)
                                              || String(x.label) === String(this.selectedModel.label));
      if (keep) {
        this.selectedModel = keep;
        return;
      }
    }
    this.selectedModel =  this.receivedModels.find(x => String(x.label).toLowerCase() === 'default') || null;
    this.render();
  }

  _selectModel(model) {
    this.selectedModel = model;
    this.showModelMenu = false;
    this.render();
  }
  _removeSelectedModel() {
    this.selectedModel = null;
    this.render();
  }
  _pushSystem(txt) {
    this.messages.push({id:Date.now(),text:txt,sender:'system',timestamp:new Date()});
    if(!this.isOpen){ this.showBroadcastPopup(txt); this.unreadCount++; }
    this.renderMessages({ autoScroll: 'bottom' });
  }
  async _sendActionPrompt(promptText) {
    if (!promptText) throw new Error('Empty prompt');

    this.messages.push({ id: `action-${Date.now()}`, text: promptText, sender: 'user', timestamp: new Date() });

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

    this.renderMessages({ autoScroll: 'bottom' });

    if (this.useRest) {
      try {
        const res = await fetch(this.restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', text: promptText, id: `rest-${Date.now()}` })
        });
        const data = await res.json();
        this.handleRestBotResponse(data);
      } catch (err) {
        this._pushSystem("Sorry, can't reach server.");
      }
      return;
    }

    if (this.ws && this.connectionStatus === 'connected') {
      this.ws.send(JSON.stringify({ type: 'message', text: promptText }));
    } else {
      this._pushSystem("Connection error.");
    }
  }

 _renderModelDropdown() {
  const dropdownContainer = this.shadowRoot.querySelector('.model-dropdown-container');
  if (!dropdownContainer) return;

  if (this.receivedModels && this.receivedModels.length > 0 && this.showModelMenu) {
    dropdownContainer.innerHTML = `
      <div class="model-dropdown">
          ${this.receivedModels.map(model => `
                        <button class="model-item ${this.selectedModel && this.selectedModel.model === model.model ? 'selected' : ''}" 
                                data-model="${model.model}">
                          <span>${model.label}</span>
                          ${this.selectedModel && this.selectedModel.model === model.model ? '✓' : ''}
                        </button>
                      `).join('')}
      </div>
    `;

    dropdownContainer.querySelectorAll('.model-item').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const modelValue = option.getAttribute('data-model');
        const selected = this.receivedModels.find(m => m.model === modelValue);
        if (selected) 
          this._selectModel(selected);
      });
    });
  } else {
    dropdownContainer.innerHTML = '';
  }
}
  
  _pushBot(d) {
    this.messages = this.messages.filter(m => !m.isLoading); 
    let html = '';
    if(d.type==='image'){ 
      html=`<img src="${d.data}" style="max-width:200px;max-height:200px;">`;
    }else if(d.type==='markdown') {
      try {
         const decoded = (new DOMParser())
        .parseFromString(String(d.data || ''), 'text/html')
        .documentElement.textContent || String(d.data || '');

          marked.setOptions({ gfm: true, breaks: true });

          // convert markdown to HTML and sanitize
          const converted = marked.parse(decoded);
          const clean = DOMPurify.sanitize(converted);

          html = `<div class="markdown">${clean}</div>`;

        } catch (err) {
          // fallback: preserve raw markdown in a pre block
          html = `<pre class="markdown">${DOMPurify.sanitize(String(d.data || ''))}</pre>`;
        }
    } else {
      html = d.text || '';
    }
    this.sessionId = d.session_id
    if (Array.isArray(d.models) && d.models.length > 0) {
      this._setModels(d.models);
    }
    this.messages.push({id:Date.now(),text:html,sender:'bot',timestamp:new Date()});
    this.renderMessages({ autoScroll: 'bottom' });
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
        this.renderMessages({ autoScroll: 'bottom' });

        const originalEditId = this.editingId;
        this.editingId = null;
        input.value = '';
        input.style.height = '1px';
        input.placeholder = 'Type a message...';
        const modelToSend = this.selectedModel ? (this.selectedModel.model || this.selectedModel.name) : undefined;
        if (this.useRest) {
          try {
            const res = await fetch(this.restUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'message', text: value, id: `rest-${Date.now()}`,tenant: this.tenant,code: this.code, sessionId: this.sessionId, editedFrom: originalEditId, model: modelToSend  })
            });
            if (!this.es) {
              try {
                const data = await res.json();
                this.handleRestBotResponse(data);
              } catch (e) {
                console.warn('REST edit response parsing failed or deferred to SSE', e);
              }
            }
          } catch (err) {
            this._pushSystem("Sorry, can't reach server.");
          }
        } else if (this.ws) {
          this.ws.send(JSON.stringify({ type: 'message', text: value,tenant: this.tenant,code: this.code, sessionId: this.sessionId, editedFrom: originalEditId, model: modelToSend  }));
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

    this.renderMessages({ autoScroll: 'bottom' });
     input.value = '';
    input.style.height = 'auto';

    const modelToSend = this.selectedModel ? (this.selectedModel.model || this.selectedModel.name) : undefined;

    if (this.useRest) {
      try {
        const sessionId = localStorage.getItem('qsc_session_id') || this.sessionId || this._getSessionId();
        const res = await fetch(this.restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', text: value,tenant: this.tenant,code: this.code, sessionId: sessionId, id: `rest-${Date.now()}`, model: modelToSend  })
        });
        const data = await res.json();
        this.handleRestBotResponse(data);
      } catch {
        this._pushSystem("Sorry, can't reach server.");
      }
      return;
    }
    if (this.ws && this.connectionStatus === 'connected') {
      this.ws.send(JSON.stringify({ type: 'message', text: value,tenant: this.tenant,code: this.code, sessionId: this.sessionId, model: modelToSend }));
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
  _autoResizeChatInput() {
    const input = this.shadowRoot && this.shadowRoot.querySelector('.chat-input');
    if (!input) return;
    input.style.height = '1px';
    input.style.height = (input.scrollHeight) + 'px';
  }
  handleKeyDown(e) {
   if (!e.target.classList.contains('chat-input')) return;
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setTimeout(() => this._autoResizeChatInput(), 0);
      } else {
        e.preventDefault();
        this.handleSend();
      }
    }
  }

  handleRestBotResponse(data) {
    this.messages = this.messages.filter(m => !m.isLoading);
    if (data.session_id && !this.sessionId) {
      this.sessionId = data.session_id;
      localStorage.setItem('qsc_session_id', this.sessionId);
    }
    if (Array.isArray(data.models) && data.models.length > 0) {
      this._setModels(data.models);
    }
    let html = '';
    if (data.type === 'image') {
      html = `<img src="${data.data}" alt="server image" style="max-width:200px;max-height:200px;">`;
    } else if (data.type === 'markdown') {
      try {
          // Utility: escape HTML attributes safely
          function escapeAttr(s) {
            if (s == null) return "";
            return String(s)
              .replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          }

          let raw = marked.parse(data.data);

        

          raw = raw.replace(
            /\[\[QSCACTION:([^:]+):([^:]+):([\s\S]*?)\]\]/g,
            function (_, type, label, actionText) {
              const t = escapeAttr(type.trim());
              const l = escapeAttr(label.trim());
              const a = escapeAttr(actionText.trim());
              return `<button class="action-button" data-action-type="${t}" data-action="${a}">${l}</button>`;
            }
          );
          raw = raw.replace(/((?:<button[^>]*>.*?<\/button>(?:\s*(?:<br\s*\/?>|\s)*)?)+)/gs, match => {
            const btns = Array.from(match.matchAll(/<button[^>]*>.*?<\/button>/gs), m => m[0]);
            if (!btns.length) return match;
            return `<div class="qsc-actions">${btns.join('')}</div>`;
          });
          const safeHtml = DOMPurify.sanitize(raw);
          html = `<div class="markdown">${safeHtml}</div>`;

        } catch {
          // fallback for unexpected parse errors
          html = `<pre class="markdown">${data.data}</pre>`;
        }
    } else if(data.type==='broadcast') {
        let msg= data.text || data.message || data.data
        this._pushSystem(msg);
        return;
      }
         else {
      html = data.text || data.message || data.data;
    }
    this.messages.push({ id: Date.now(), text: html, sender: 'bot', timestamp: new Date() });
    this.renderMessages({ autoScroll: 'bottom' });
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
  _getSessionId() {
    try {
      const key = 'qsc_session_id';
      let id = localStorage.getItem(key);
      if (!id) {
        id = 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return 'sess-ephemeral-' + Date.now().toString(36);
    }
  }

  _splitIntoJsonAndTextSegments(raw) {
    const n = raw.length;
    let i = 0;
    let buf = '';
    const segments = [];

    const pushTextBuf = () => {
      if (buf.length) {
        segments.push({ type: 'text', content: buf });
        buf = '';
      }
    };

    while (i < n) {
      const ch = raw[i];

      if ((ch === '{' || ch === '[')) {
        pushTextBuf();

        const start = i;
        const stack = [ch];
        i++; 
        let inString = false;
        let escaped = false;

        for (; i < n; i++) {
          const c = raw[i];

          if (inString) {
            if (escaped) {
              escaped = false;
              continue;
            }
            if (c === '\\') {
              escaped = true;
              continue;
            }
            if (c === '"') {
              inString = false;
              continue;
            }
            continue;
          } else {
            if (c === '"') {
              inString = true;
              continue;
            }
            if (c === '{' || c === '[') {
              stack.push(c);
              continue;
            }
            if (c === '}' || c === ']') {
              const last = stack[stack.length - 1];
              if ((c === '}' && last === '{') || (c === ']' && last === '[')) {
                stack.pop();
              } else {
                stack.pop();
              }
              if (stack.length === 0) {
                i++;
                break;
              }
              continue;
            }
          }
        }
        const jsonSub = raw.slice(start, i);
        segments.push({ type: 'json', content: jsonSub });
        continue;
      }

      buf += ch;
      i++;
    }

    pushTextBuf();

    return segments
      .map(s => ({ type: s.type, content: (s.content || '') }))
      .filter(s => s.content.trim().length > 0);
  }
  _splitAndRenderMultipleJsons() {
    const container = this.shadowRoot.querySelector('.messages');
    if (!container) return;

    const codeNodes = Array.from(container.querySelectorAll('pre code'))
      .filter(code => {
        const cls = String(code.className || '').toLowerCase();
        const txt = (code.textContent || '').trim();
        return cls.includes('language-json') || txt.startsWith('{') || txt.startsWith('[');
      });

    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    codeNodes.forEach(codeEl => {
      const preEl = codeEl.closest('pre');
      if (!preEl) return;

      const raw = codeEl.textContent || '';
      const segments = this._splitIntoJsonAndTextSegments(raw);

      if (segments.length <= 1) return;

      let html = '';
      segments.forEach(seg => {
        if (seg.type === 'text') {
          const text = seg.content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
          if (text.length === 0) {
            html += `<p>${esc(seg.content)}</p>`;
          } else {
            text.forEach(p => { html += `<p>${esc(p)}</p>`; });
          }
        } else if (seg.type === 'json') {
          let pretty = seg.content;
          try {
            const parsed = JSON.parse(seg.content);
            pretty = JSON.stringify(parsed, null, 2);
          } catch (e) {
            pretty = seg.content.trim();
          }
          html += `<pre style="position: relative;"><code class="language-json">${esc(pretty)}</code></pre>\n`;
        }
      });

      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      Array.from(wrapper.childNodes).forEach(node => {
        preEl.parentNode.insertBefore(node, preEl);
      });
      // remove the original pre (and its code child)
      preEl.remove();
    });
  }

  _formatAndHighlightJson() {
    const container = this.shadowRoot.querySelector('.messages');
    if (!container) return;

    // find candidate <pre><code> blocks
    const codeEls = Array.from(container.querySelectorAll('pre code'))
      .filter(code => {
        const cls = String(code.className || '').toLowerCase();
        const txt = (code.textContent || '').trim();
        return cls.includes('language-json') || txt.startsWith('{') || txt.startsWith('[');
      });

    const esc = s => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    codeEls.forEach(codeEl => {
      if (codeEl._qsc_json_highlighted) return;

      let raw = codeEl.textContent || '';
      let pretty = raw;

      try {
        const parsed = JSON.parse(raw);
        pretty = JSON.stringify(parsed, null, 2);
      } catch {
        pretty = raw.trim();
      }

      const keyStore = [];
      const strStore = [];

      pretty = pretty.replace(/"((?:\\.|[^"\\])*)"\s*(?=:)/g, (m) => {
        const idx = keyStore.length;
        keyStore.push(m); 
        return `@@KEY${idx}@@`;
      });

      pretty = pretty.replace(/"((?:\\.|[^"\\])*)"/g, (m) => {
        const idx = strStore.length;
        strStore.push(m); 
        return `@@STR${idx}@@`;
      });

      let html = esc(pretty);

      html = html.replace(/\b-?\d+(\.\d+)?([eE][+\-]?\d+)?\b/g, `<span class="json-number">$&</span>`);

      html = html.replace(/\b(true|false|null)\b/g, `<span class="json-boolean">$1</span>`);

      html = html.replace(/([{}\[\],:])/g, `<span class="json-punctuation">$1</span>`);

      keyStore.forEach((orig, i) => {
        const replacement = `<span class="json-key">${esc(orig)}</span>`;
        html = html.replace(new RegExp(esc(`@@KEY${i}@@`), 'g'), replacement);
      });

      strStore.forEach((orig, i) => {
        const replacement = `<span class="json-string">${esc(orig)}</span>`;
        html = html.replace(new RegExp(esc(`@@STR${i}@@`), 'g'), replacement);
      });

      codeEl.innerHTML = html;
      codeEl._qsc_json_highlighted = true;
    });
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
  
  _createXSVG() {
    return `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
  }
  _escapeHtml(str = '') {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  async _handleSave(id) {
    const idx = this._findIndexById(id);
    if (idx === -1) return;
    const ta = this.shadowRoot.querySelector(`.inline-edit-textarea[data-msg-id="${id}"]`);
    if (!ta) return;

    const newVal = ta.value.trim();
    if (!newVal) {
      return;
    }

    this.messages[idx].text = newVal;
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

    const originalEditId = id;
    this.editingId = null;
    this.renderMessages({ autoScroll: 'bottom' });
    const modelToSend = this.selectedModel ? (this.selectedModel.model || this.selectedModel.name) : undefined;

    if (this.useRest) {
      try {
        const res = await fetch(this.restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', text: newVal, id: `rest-${Date.now()}`, editedFrom: originalEditId, model: modelToSend })
        });
        const data = await res.json();
        this.handleRestBotResponse(data);
      } catch (err) {
        this._pushSystem("Sorry, can't reach server.");
      }
    } else if (this.ws && this.connectionStatus === 'connected') {
      this.ws.send(JSON.stringify({ type: 'message', text: newVal, editedFrom: originalEditId, model: modelToSend }));
    } else {
      this._pushSystem("Connection error.");
    }
  }

  _handleCancel(id) {
    if (String(this.editingId) !== String(id)) {
      this.editingId = null;
    } else {
      this.editingId = null;
    }
    this.renderMessages({ autoScroll: 'bottom' });
  }

  _handleEdit(id) {
    const idx = this._findIndexById(id);
    if (idx === -1) return;
    const msg = this.messages[idx];
    if (msg.sender !== 'user') return;

    if (this.editingId && this.editingId !== id) {
      this.editingId = null;
    }

    this.editingId = (this.editingId === id) ? null : id;
    this.renderMessages({ autoScroll: 'intoView', targetId: id });

    const msgEl = this.shadowRoot.querySelector(`.message-text[data-msg-id="${id}"]`);
    if (!msgEl) {
      
      return;
    }
    msgEl.dataset._originalHtml = msgEl.innerHTML;

    const plain = this._stripHtml(msg.text);

    msgEl.innerHTML = '';

    const ta = document.createElement('textarea');
    ta.className = 'inline-edit';
    ta.value = plain;
    ta.rows = 4;
    ta.setAttribute('aria-label', 'Edit message');
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveBtn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelBtn.click();
      }
    });

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'inline-edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'message-action-btn save-btn copied'; 
    saveBtn.title = 'Save';
    saveBtn.setAttribute('aria-label', 'Save message');
    saveBtn.innerHTML = this._checkSVG;

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'message-action-btn cancel-btn';
    cancelBtn.title = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.innerHTML = this._createXSVG();

    actionsWrap.appendChild(saveBtn);
    actionsWrap.appendChild(cancelBtn);

    msgEl.appendChild(ta);
    msgEl.appendChild(actionsWrap);

    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;

    cancelBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      this.editingId = null;
      // restore original content
      if (msgEl && msgEl.dataset && msgEl.dataset._originalHtml) {
        msgEl.innerHTML = msgEl.dataset._originalHtml;
        delete msgEl.dataset._originalHtml;
      }
      this.renderMessages({ autoScroll: 'intoView', targetId: id });
    });

    saveBtn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const newVal = ta.value.trim();
      if (!newVal) {
        return;
      }

      this.messages[idx].text = newVal;
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

      this.renderMessages({ autoScroll: 'bottom'});

      const originalEditId = id;
      this.editingId = null;
          const modelToSend = this.selectedModel ? (this.selectedModel.model || this.selectedModel.name) : undefined;

      if (this.useRest) {
        try {
          const res = await fetch(this.restUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'message', text: newVal, id: `rest-${Date.now()}`, editedFrom: originalEditId,model:modelToSend })
          });
          const data = await res.json();
          this.handleRestBotResponse(data);
        } catch (err) {
          this._pushSystem("Sorry, can't reach server.");
        }
      } else if (this.ws && this.connectionStatus === 'connected') {
        this.ws.send(JSON.stringify({ type: 'message', text: newVal, editedFrom: originalEditId, model :modelToSend  }));
      } else {
        this._pushSystem("Connection error.");
      }
    });
    if (this.editingId) {
      const bubble = this.shadowRoot.querySelector(`[data-msg-id="${id}"]`);
      if (bubble) {
        bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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

  renderMessages(opts = {}) {
    const { autoScroll = 'bottom', targetId = null } = opts;
    const messagesDiv = this.shadowRoot.querySelector('.messages');
    if (!messagesDiv) return;

    messagesDiv.innerHTML = this.messages.map(m => {
      const isEditing = String(m.id) === String(this.editingId);
      const messageContent = (m.sender === 'user' && isEditing)
        ? `<textarea class="inline-edit inline-edit-textarea" data-msg-id="${m.id}" rows="3">${this._stripHtml(m.text)}</textarea>`
        : (m.sender === 'user'
            ? `<div class="message-text" data-msg-id="${m.id}">${
                m.isHtml ? m.text : `<p>${this._escapeHtml(m.text)}</p>`
              }</div>`
            : `<div class="message-text" data-msg-id="${m.id}">${m.text}</div>`);

      let actionsHtml = '';
      const showCopy = (!m.isLoading) || Boolean(m.copied);

      if (m.sender === 'user' && isEditing) {
        actionsHtml = `
          <div class="message-actions" data-msg-id="${m.id}">
            <button class="message-action-btn save-btn" data-msg-id="${m.id}" data-action="save" title="Save" aria-label="Save">
              ${this._checkSVG}
            </button>
            <button class="message-action-btn cancel-btn" data-msg-id="${m.id}" data-action="cancel" title="Cancel" aria-label="Cancel">
              ${this._createXSVG()}
            </button>
          </div>
        `;
      } else {
        actionsHtml = `
          <div class="message-actions" data-msg-id="${m.id}">
            ${showCopy ? `<button class="message-action-btn copy-btn" data-msg-id="${m.id}" title="Copy" aria-label="Copy message">${this._copySVG}</button>` : ''}
            ${m.sender === 'user' && !m.isLoading ? `<button class="message-action-btn edit-btn" data-msg-id="${m.id}" title="Edit" aria-label="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                </svg>
              </button>` : ''}
          </div>
        `;
      }

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
              ${messageContent}
              <div class="timestamp">${this.formatTime(m.timestamp)}</div>
            </div>
            ${actionsHtml}
          </div>
        `;
      }

      return `
        <div class="message-row user">
          <div class="bubble user">
            ${messageContent}
            <div class="timestamp">${this.formatTime(m.timestamp)}</div>
          </div>
          ${actionsHtml}
        </div>
      `;
    }).join('');

    const container = this.shadowRoot.querySelector('.messages');
    if (container && !container._qsc_actions_bound) {
      container.addEventListener('click', (e) => {
        const saveBtn = e.target.closest('.save-btn') || e.target.closest('[data-action="save"]');
        if (saveBtn) { this._handleSave(saveBtn.dataset.msgId); return; }

        const cancelBtn = e.target.closest('.cancel-btn') || e.target.closest('[data-action="cancel"]');
        if (cancelBtn) { this._handleCancel(cancelBtn.dataset.msgId); return; }

        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) { this._handleCopy(copyBtn.dataset.msgId); return; }
        
        const actionBtn = e.target.closest('.action-button');
        if (actionBtn) {
          const action = e.target.getAttribute('data-action');
          if (action) {
            this._sendActionPrompt(action);
          } return; }

        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) { this._handleEdit(editBtn.dataset.msgId); return; }
      });
      container._qsc_actions_bound = true;
    }

    if (this.editingId) {
      const ta = this.shadowRoot.querySelector(`.inline-edit-textarea[data-msg-id="${this.editingId}"]`);
      if (ta) {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = ta.value.length;
        const keyHandler = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this._handleSave(this.editingId);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this._handleCancel(this.editingId);
          }
        };
        ta.removeEventListener('keydown', ta._qsc_keyHandler);
        ta.addEventListener('keydown', keyHandler);
        ta._qsc_keyHandler = keyHandler;
      }
    }
    this._splitAndRenderMultipleJsons(); 
    this._formatAndHighlightJson();   
    this._attachCodeCopyButtons();


    if (autoScroll === 'bottom') {
    this.scrollToBottom();
  } else if (autoScroll === 'intoView' && targetId) {
    const el = this.shadowRoot.querySelector(`[data-msg-id="${targetId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
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
      .qsc-actions {
        display: inline-flex;      
        gap: 8px;
        justify-content: center;
        align-items: center;
        width: 100%;               
        margin-bottom: 6px;
      }
     .action-button {
        padding: 8px 16px;
        margin: 4px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        background: linear-gradient(90deg,#0072ff,#7dd3fc);
        color: #012;
        transition: background 0.2s ease;
        margin: 0; 
      }
      .markdown table td img {
        width: 180px;
        height: auto;
        object-fit: cover;
        border: 1px solid #e6eef9;
        border-radius: 8px;
        padding: 4px;
        display: block;
        margin: 0 auto 8px auto;
      }
      .markdown table td{
        border-radius: 14px;
        padding: 12px;
        border: none;
      }
      .markdown table td:has(strong) {
        border: 1px solid rgba(0, 0, 0, 0.04);
      }
      .model-selection-container {
        display: flex;
        align-items: center;
      }
      .new-chat-btn {
        background: transparent;
        border: 1.5px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        margin-right: 8px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .new-chat-btn:hover {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.5);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .new-chat-btn:active {
        transform: translateY(0);
      }

      .new-chat-icon {
        width: 16px;
        height: 16px;
        position: relative;
      }

      .new-chat-icon::before,
      .new-chat-icon::after {
        content: '';
        position: absolute;
        background: currentColor;
        border-radius: 1px;
      }

      .new-chat-icon::before {
        width: 10px;
        height: 2px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .new-chat-icon::after {
        width: 2px;
        height: 10px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .btn-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .model-toggle-btn.model-selected {
        background-color: rgb(0, 120, 212) !important;
      }
      .floating-new-chat {
        position: absolute;
        top: 12px;
        right: 80px;
        z-index: 100;
      }

      .floating-new-chat .new-chat-btn {
        background: rgba(255,255,255,0.95);
        color: var(--primary);
        border: 1.5px solid var(--primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-right: 0;
      }

      .floating-new-chat .new-chat-btn:hover {
        background: var(--primary);
        color: white;
        box-shadow: 0 4px 12px rgba(0,120,212,0.3);
      }
      .model-toggle-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid rgba(0,0,0,0.1);
        background: var(--background);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-secondary);
        transition: var(--transition);
        flex-shrink: 0;
      }

      .model-toggle-btn:hover {
        background: var(--background-alt);
        border-color: var(--primary);
        color: var(--primary);
      }

      .model-dropdown {
        position: absolute;
        bottom: 12%;
        left: 0;
        background: var(--background);
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 8px;
        box-shadow: var(--shadow);
        padding: 6px;
        z-index: 1000;
        min-width: 180px;
        max-height: 200px;
        overflow-y: auto;
      }

      .model-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        font-size: 13px;
        color: var(--text-primary);
        transition: background 0.2s;
      }

      .model-item:hover {
        background: rgba(0,0,0,0.04);
      }

      .model-item.selected {
        background: var(--primary-light);
        color: var(--primary);
        font-weight: 600;
      }

      .model-chip-container {
        position: relative;
        flex: 1;
      }

      .json-key { color: #a71d5d; }       
      .json-string { color: #183691; }    
      .json-number { color: #0086b3; }    
      .json-boolean { color: #795da3; }   
      .json-punctuation { color: #333; }
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
      .inline-edit {
        width: 100%;
        min-height: 64px;
        max-height: 220px;
        resize: vertical;
        padding: 8px 10px;
        font-size: 14px;
        border-radius: 10px;
        border: 1px solid rgba(0,0,0,0.08);
        box-sizing: border-box;
        background: var(--background-alt);
        color: var(--text-primary);
        font-family: inherit;
      }

      .inline-edit:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0,120,212,0.08);
      }

      .inline-edit-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        align-items: center;
      }

      .cancel-btn {
        background: rgba(0,0,0,0.04);
        border-radius: 6px;
        padding: 6px;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .inline-edit-actions svg,
      .inline-edit textarea svg {
        width: 14px;
        height: 14px;
        display: block;
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
        border-radius: 9px;
        padding: 12px 16px 12px 16px;
        line-height: 20px;
        font-size: 13px;
        box-sizing: border-box;
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
        gap: 6px;
        font-size: 12px;            
      }

      .chat-window.fullscreen .message-row:hover .message-actions,
      .chat-window.fullscreen .message-row:focus-within .message-actions {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
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
              ${this.connectedStatus ? `
                <div class="connection-status">
                  <div class="status-dot ${this.connectionStatus === 'connected' ? 'status-connected' : 
                    this.connectionStatus === 'connecting' ? 'status-connecting' : 'status-error'}"></div>
                  <span>${this.connectionStatus}</span>
                </div>
                ` : ``}
                <button class="new-chat-btn" title="Start new chat">
                  <span class="new-chat-icon"></span>
                  <span>New</span>
                </button>
                ${this.isFullscreen
                  ? `<button class="minimize-btn" title="Minimize">&#8211;</button>`
                  : `<button class="fullscreen-btn" title="Fullscreen">&#x26F6;</button>`
                }
                <button class="close-btn" title="Close">&times;</button>
              </div>
            </div>
            <div class="messages"></div>            
            <div class="input-area" role="region" aria-label="Chat input area">
              <div class="model-selection-container">
                <button class="model-toggle-btn  ${this.selectedModel ? 'model-selected' : ''} ${!this.receivedModels || this.receivedModels.length === 0 ? 'btn-disabled' : ''}" title="Select model">
                  &#128161;
                </button>
                <div class="model-dropdown-container">
                </div>
                </div>
              
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
    
    // Add event listeners for new chat buttons
    const newChatButtons = this.shadowRoot.querySelectorAll('.new-chat-btn');
    newChatButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this._startNewChat();
      });
    });

    // Close dropdown when clicking outside
    if (this.showModelMenu) {
      setTimeout(() => {
        const closeDropdown = (e) => {
          if (!this.shadowRoot.contains(e.target)) {
            this.showModelMenu = false;
            this.render();
            document.removeEventListener('click', closeDropdown);
          }
        };
        document.addEventListener('click', closeDropdown);
      }, 0);
    }
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
      chatInput.addEventListener('input', () => this._autoResizeChatInput());
      // initial resize
      setTimeout(() => this._autoResizeChatInput(), 0);
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
              timestamp: new Date(),
              isHtml: true
            });
            this.renderMessages({ autoScroll: 'bottom' });
            const sessionId = localStorage.getItem('qsc_session_id') || this.sessionId || this._getSessionId();
            const modelToSend = this.selectedModel ? (this.selectedModel.model || this.selectedModel.name) : undefined;

            if (this.ws && this.connectionStatus === 'connected') {
              this.ws.send(JSON.stringify({ type: 'image', data: base64, filename: file.name,model :modelToSend }));
            } else if (this.useRest) {
              try {
               const response = await fetch(this.restUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: this.restClientId, type: 'image', data: base64, filename: file.name,session_id: sessionId,model :modelToSend })
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
              timestamp: new Date(),
              isHtml: true
            });
            this.renderMessages({ autoScroll: 'bottom' });
            const sessionId = localStorage.getItem('qsc_session_id') || this.sessionId || this._getSessionId();
            const modelToSend = this.selectedModel ? (this.selectedModel.model || this.selectedModel.name) : undefined;

            if (this.ws && this.connectionStatus === 'connected') {
              this.ws.send(JSON.stringify({ type: 'markdown', data: content, filename: file.name,model :modelToSend }));
            } else if (this.useRest) {
              try {
                const response = await fetch(this.restUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: Date.now(), type: 'markdown', data: content, filename: file.name, session_id: sessionId , model:modelToSend})
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
    // Model dropdown toggle
    const modelToggleBtn = this.shadowRoot.querySelector('.model-toggle-btn');
    if (modelToggleBtn) {
      modelToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showModelMenu = !this.showModelMenu;
         this._renderModelDropdown(); 
      });
    }
    document.addEventListener('click', () => {
      if (this.showModelMenu) {
        this.showModelMenu = false;
        this._renderModelDropdown(); // Only render the dropdown part
      }
    });
  }
}

customElements.define('qsc-chatbot', QscChatbot);

