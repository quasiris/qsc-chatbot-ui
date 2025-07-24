import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './qsc-chatbot.js', 
  output: {
    file: 'dist/qsc-chatbot.js', 
    format: 'iife',
    name: 'QscChatbot', 
  },
  plugins: [resolve(), commonjs()]
};
