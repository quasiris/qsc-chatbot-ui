import path from 'path';
import type { Plugin } from '@docusaurus/types';

interface PluginOpts {
  restUrl: string;
  headerTitle?: string;
  attachBtn?: boolean;
  logoPath?: string;
  errorMsg?: string;
}

export default function pluginChatbotUI(
  context: unknown,
  opts: Partial<PluginOpts> = {}
): Plugin {
  const { restUrl = '', ...otherOpts } = opts;
  const pluginOptions: PluginOpts = {
    restUrl,
    headerTitle: 'QSC Chatbot',
    attachBtn: false,
    logoPath: '',
    errorMsg: "I'm having trouble connecting. Please try again later.",
    ...otherOpts,
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
              pluginOptions,
            )};`,
          },
        ],
      };
    },
  };
}
