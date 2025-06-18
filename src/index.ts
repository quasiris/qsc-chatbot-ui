import path from 'path';
import type { Plugin } from '@docusaurus/types';

export default function pluginChatbotUI(
  context: unknown,
  options: {
    wsUrl?: string;
    headerTitle?: string;
    assistantName?: string;
    logoPath?: string;
    restUrl?: string;
    enableWs?: boolean;
    enableRestFallback?: boolean;
  } = {}
): Plugin {
  const pluginOptions = {
    wsUrl: 'ws://localhost:8080/chat',
    restUrl: 'http://localhost:8080/chat',
    headerTitle: 'Qsc Chatbot',
    assistantName: 'Qsc assistant',
    enableWs: true,
    ...options,
  };

  return {
    name: '@quasiris/qsc-chatbot-ui',
    getClientModules() {
      return [path.resolve(__dirname, './client.js')];
    },
    injectHtmlTags() {
      return {
        postBodyTags: [
          {
            tagName: 'script',
            innerHTML: `window.__CHATBOT_PLUGIN_OPTIONS__ = ${JSON.stringify(
              pluginOptions
            )}`,
          },
        ],
      };
    },
  };
}
