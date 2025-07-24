# QSC Chatbot UI

A professional, modern chatbot web component with real-time WebSocket/REST support.

---

## Installation

**NPM:**
```sh
npm install @quasiris/qsc-chatbot-ui
```

---

## Usage in HTML

You can use the chatbot directly in any HTML page via CDN:

```html
<!-- Add this script tag to load the web component -->
<script src="https://unpkg.com/@quasiris/qsc-chatbot-ui@latest/dist/qsc-chatbot.js"></script>

<!-- Use the custom element anywhere in your HTML -->
<qsc-chatbot
  ws-url="wss://your-websocket-server"
  header-title="Chat Assistant"
  assistant-name="AI Assistant"
  logo-path="./assets/bot.png">
</qsc-chatbot>
```
## Example Usage in Docusaurus

Add the plugin to your `docusaurus.config.js`:

```js
plugins: [
  [
    '@quasiris/qsc-chatbot-ui',
    {
      wsUrl: 'ws://localhost:8000/chat', 
      headerTitle: 'Qsc Chatbot',        
      assistantName: 'Qsc assistant',    
      logoPath: './img/bot.png',        
      restUrl: 'http://localhost:8000/rest', 
      enableRestFallback: true,             
    },
  ],
],
```
---
## API References

- `wsUrl` (string, required): WebSocket endpoint for the chatbot backend.
- `headerTitle` (string, optional): Title displayed in the chatbot header.
- `assistantName` (string, optional): Name used in the welcome message.
- `logoPath` (string, optional): Path to your logo image. If the image fails to load, the fallback "Qsc" text will be shown.
- `restUrl` (string, optional): REST endpoint for fallback if WebSocket is unavailable.
- `enableRestFallback` (boolean, optional): Enable REST fallback (requires `restUrl`).

If the `logoPath` is invalid or the image cannot be loaded, the plugin will automatically display a styled "Qsc" text as a fallback.

---

## Message Types

The chatbot UI supports the following message types in server responses:

- **Bot/Assistant Message**:  
  Sent by the assistant, appears on the left.
  ```json
  {
    "type": "message" | "response",
    "text": "Hi, how can I help you?",
    "sender": "bot",
    "timestamp": 1680000000001
  }
  ```

- **System/Broadcast Message**:  
  Sent by the system or as a broadcast, appears on the left with a "System" label.
  ```json
  {
    "type": "broadcast",
    "text": "System maintenance at 2am.",
    "sender": "system",
    "timestamp": 1680000000002
  }
  ```

---

## Broadcast Messages

- **When the chat window is open:**  
  Broadcast messages are shown as system messages in the chat window, with a "System" label and a 📢 icon.

- **When the chat window is closed:**  
  Broadcast messages trigger a popup notification and a red indicator dot on the toggle button.

**Example broadcast message from server:**
```json
{
  "type": "broadcast",
  "text": "Hello, Qsc Team!",
  "timestamp": 1680000000002
}
```

---

## Screenshots
![QSC Chatbot UI](https://github.com/quasiris/qsc-chatbot-ui/blob/main/assets/QscChatbot.png)
![QSC Chatbot UI 01](https://github.com/quasiris/qsc-chatbot-ui/blob/main/assets/QscChatbot01.png)
![QSC Chatbot UI 02](https://github.com/quasiris/qsc-chatbot-ui/blob/main/assets/QscChatbot02.png)
![QSC Chatbot UI 03](https://github.com/quasiris/qsc-chatbot-ui/blob/main/assets/QscChatbot03.png)

---

## Features

- Modern, clean UI with smooth animations
- Real-time WebSocket communication
- Broadcast notifications when chat is closed
- Connection status indicators
- Message history with timestamps
- Responsive design for all devices



