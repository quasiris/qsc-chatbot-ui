"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ChatMessage;
var _react = _interopRequireDefault(require("react"));
var _ChatbotModule = _interopRequireDefault(require("./Chatbot.module.css"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ChatMessage(_ref) {
  var message = _ref.message;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "".concat(_ChatbotModule["default"].message, " ").concat(message.sender === 'user' ? _ChatbotModule["default"].userMessage : message.sender === 'bot' ? _ChatbotModule["default"].botMessage : _ChatbotModule["default"].systemMessage),
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: _ChatbotModule["default"].messageContent,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: _ChatbotModule["default"].messageSender,
        children: message.sender === 'user' ? 'You' : message.sender === 'bot' ? 'Qsc assistant' : 'System'
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: _ChatbotModule["default"].messageText,
        children: message.text
      })]
    })
  });
}