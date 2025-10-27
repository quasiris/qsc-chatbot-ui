# QSC Chatbot UI

A professional, modern chatbot web component.

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
  rest-url="http://127.0.0.1:3000/api/v1/agent/chat/tenant/code-config",
  header-title="Chat Assistant"
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
      headerTitle: 'Qsc Chatbot',        
      logoPath: './img/bot.png',        
      restUrl: 'http://localhost:8000/rest', 
      attachBtn: true,             
    },
  ],
],
```
---
## API References

- `rest-url` (required) -The URL of your backend chat endpoint. All messages will be sent here.
- `header-title` (Optional) -Text shown at the top of the chat window, e.g. Qsc Chatbot”.
- `attach-btn` (Optional) - Set to "true" if you want users to upload images or Markdown files.
- `logo-path` (Optional) -Path to the image shown on the round toggle button that opens the chat.
- `error-msg` (Optional) -Friendly message shown when the REST call fails (e.g. “Server unreachable”).

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
- Real-time REST communication
- Broadcast notifications when chat is closed
- Message history with timestamps
- Responsive design for all devices



