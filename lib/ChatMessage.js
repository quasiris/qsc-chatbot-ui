"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ChatMessage;
var _react = _interopRequireDefault(require("react"));
var _dompurify = _interopRequireDefault(require("dompurify"));
var _marked = require("marked");
var _ChatbotModule = _interopRequireDefault(require("./Chatbot.module.css"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}
function renderMessageHTML(raw) {
  var html = _marked.marked.parse(raw);
  return _dompurify["default"].sanitize(html);
}
function ChatMessage(_ref) {
  var message = _ref.message;
  var safeHTML = renderMessageHTML(message.text);
  if (message.sender === 'system') {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: _ChatbotModule["default"].messageRow + ' ' + _ChatbotModule["default"].systemRow,
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].bubble + ' ' + _ChatbotModule["default"].systemBubble,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].systemIcon,
          children: "\uD83D\uDCE2"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].messageText,
          dangerouslySetInnerHTML: {
            __html: safeHTML
          }
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].timestamp,
          children: formatTime(message.timestamp)
        })]
      })
    });
  }
  if (message.sender === 'bot') {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: _ChatbotModule["default"].messageRow + ' ' + _ChatbotModule["default"].botRow,
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].bubble + ' ' + _ChatbotModule["default"].botBubble,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].messageText,
          dangerouslySetInnerHTML: {
            __html: safeHTML
          }
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].timestamp,
          children: formatTime(message.timestamp)
        })]
      })
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: _ChatbotModule["default"].messageRow + ' ' + _ChatbotModule["default"].userRow,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: _ChatbotModule["default"].bubble + ' ' + _ChatbotModule["default"].userBubble,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: _ChatbotModule["default"].messageText,
        dangerouslySetInnerHTML: {
          __html: safeHTML
        }
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: _ChatbotModule["default"].timestamp,
        children: formatTime(message.timestamp)
      })]
    })
  });
}