"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Chatbot;
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function Chatbot(_ref) {
  var restUrl = _ref.restUrl,
    _ref$headerTitle = _ref.headerTitle,
    headerTitle = _ref$headerTitle === void 0 ? 'QSC Chatbot' : _ref$headerTitle,
    _ref$attachBtn = _ref.attachBtn,
    attachBtn = _ref$attachBtn === void 0 ? true : _ref$attachBtn,
    logoPath = _ref.logoPath,
    errorMsg = _ref.errorMsg;
  var containerRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var insertBot = function insertBot() {
      var container = containerRef.current;
      if (!container) return;
      // Do nothing if the bot already exists
      if (container.querySelector('qsc-chatbot')) return;
      var el = document.createElement('qsc-chatbot');
      if (restUrl) {
        el.setAttribute('rest-url', restUrl);
      }
      el.setAttribute('header-title', headerTitle);
      if (attachBtn) {
        el.setAttribute('attach-btn', 'true');
      } else {
        el.removeAttribute('attach-btn');
      }
      if (logoPath) el.setAttribute('logo-path', logoPath);
      if (errorMsg) el.setAttribute('error-msg', errorMsg);
      container.appendChild(el);
    };

    // Load the web component script only once per page
    if (!window.customElements.get('qsc-chatbot')) {
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/@quasiris/qsc-chatbot-ui@latest/dist/qsc-chatbot.js';
      script.async = true;
      script.onload = insertBot;
      script.onerror = function (e) {};
      document.head.appendChild(script);
    } else {
      insertBot();
    }
    return function () {
      var container = containerRef.current;
      if (!container) return;
      var botEl = container.querySelector('qsc-chatbot');
      if (botEl) {
        botEl.remove();
      }
    };
  }, [restUrl, headerTitle, attachBtn, logoPath, errorMsg]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    ref: containerRef
  });
}