# @quasiris/qsc-chatbot-ui

A Docusaurus plugin to add a customizable chatbot UI to your documentation site. Supports WebSocket and REST API backends, custom branding, and broadcast notifications.

## Installation

```bash
npm install @quasiris/qsc-chatbot-ui
# or
yarn add @quasiris/qsc-chatbot-ui
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
## Example Usage in Html

Add the plugin to your `index.html`:

```html
  <script src="./qsc-chatbot.js"></script>
  <body>
      <qsc-chatbot
        ws-url="ws://localhost:8080/chat"
        header-title="QSC Chatbot"
        assistant-name="QSC Assistant"
      >
      </qsc-chatbot>
    </body>
```

- `wsUrl` (string, required): WebSocket endpoint for the chatbot backend.
- `headerTitle` (string, optional): Title displayed in the chatbot header.
- `assistantName` (string, optional): Name used in the welcome message.
- `logoPath` (string, optional): Path to your logo image. If the image fails to load, the fallback "Qsc" text will be shown.
- `restUrl` (string, optional): REST endpoint for fallback if WebSocket is unavailable.
- `enableRestFallback` (boolean, optional): Enable REST fallback (requires `restUrl`).

## Logo Fallback

If the `logoPath` is invalid or the image cannot be loaded, the plugin will automatically display a styled "Qsc" text as a fallback.


