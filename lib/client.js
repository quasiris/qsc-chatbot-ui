"use strict";

var _react = _interopRequireDefault(require("react"));
var _client = require("react-dom/client");
var _chatbot = _interopRequireDefault(require("./chatbot"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
window.addEventListener('load', function () {
  var opts = window.__QSC_CHATBOT_PLUGIN_OPTIONS__;
  if (!opts) {
    opts = window.__CHATBOT_PLUGIN_OPTIONS__;
  }
  if (!opts) {
    console.error('Chatbot plugin options not found');
    return;
  }
  var container = document.createElement('div');
  document.body.appendChild(container);
  var root = (0, _client.createRoot)(container);
  root.render(/*#__PURE__*/_react["default"].createElement(_chatbot["default"], opts));
});