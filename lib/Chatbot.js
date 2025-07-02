"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = Chatbot;
var _react = _interopRequireWildcard(require("react"));
var _ChatMessage = _interopRequireDefault(require("./ChatMessage"));
var _ChatbotModule = _interopRequireDefault(require("./Chatbot.module.css"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var isMobile = function isMobile() {
  return window.innerWidth <= 480;
};
var statusClassMap = {
  connected: _ChatbotModule["default"].statusConnected,
  connecting: _ChatbotModule["default"].statusConnecting,
  error: _ChatbotModule["default"].statusError
};
function Chatbot(_ref) {
  var wsUrl = _ref.wsUrl,
    _ref$headerTitle = _ref.headerTitle,
    headerTitle = _ref$headerTitle === void 0 ? 'AI Assistant' : _ref$headerTitle,
    logoPath = _ref.logoPath,
    _ref$assistantName = _ref.assistantName,
    assistantName = _ref$assistantName === void 0 ? 'AI assistant' : _ref$assistantName;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isOpen = _useState2[0],
    setIsOpen = _useState2[1];
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    isFullscreen = _useState4[0],
    setIsFullscreen = _useState4[1];
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    isMinimized = _useState6[0],
    setIsMinimized = _useState6[1];
  var _useState7 = (0, _react.useState)([{
      id: 1,
      text: "Hello! I'm your ".concat(assistantName, ". How can I help you today?"),
      sender: 'bot',
      timestamp: new Date()
    }]),
    _useState8 = _slicedToArray(_useState7, 2),
    messages = _useState8[0],
    setMessages = _useState8[1];
  var _useState9 = (0, _react.useState)('connecting'),
    _useState0 = _slicedToArray(_useState9, 2),
    connectionStatus = _useState0[0],
    setConnectionStatus = _useState0[1];
  var _useState1 = (0, _react.useState)(null),
    _useState10 = _slicedToArray(_useState1, 2),
    latestBroadcast = _useState10[0],
    setLatestBroadcast = _useState10[1];
  var _useState11 = (0, _react.useState)(false),
    _useState12 = _slicedToArray(_useState11, 2),
    showBroadcastPopup = _useState12[0],
    setShowBroadcastPopup = _useState12[1];
  var wsRef = (0, _react.useRef)(null);
  var messagesEndRef = (0, _react.useRef)(null);
  var inputRef = (0, _react.useRef)(null);
  var fileInputRef = (0, _react.useRef)(null);

  // WebSocket logic
  (0, _react.useEffect)(function () {
    if (!wsUrl) return;
    var ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = function () {
      setConnectionStatus('connected');
      ws.send(JSON.stringify({
        type: 'register',
        clientId: "web-".concat(Date.now())
      }));
    };
    ws.onerror = function () {
      return setConnectionStatus('error');
    };
    ws.onclose = function () {
      return setConnectionStatus('error');
    };
    ws.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'broadcast') {
          var message = data.text || data.message;
          setMessages(function (prev) {
            return [].concat(_toConsumableArray(prev), [{
              id: Date.now(),
              text: message,
              sender: 'system',
              timestamp: new Date()
            }]);
          });
          setLatestBroadcast(message);
          if (!isOpen) {
            setShowBroadcastPopup(true);
          }
        } else if (data.type === 'image') {
          setMessages(function (prev) {
            return [].concat(_toConsumableArray(prev), [{
              id: Date.now(),
              text: "<img src=\"".concat(data.data, "\" alt=\"server image\" style=\"max-width:200px;max-height:200px;\">"),
              sender: 'bot',
              timestamp: new Date()
            }]);
          });
        } else if (data.type === 'markdown') {
          setMessages(function (prev) {
            return [].concat(_toConsumableArray(prev), [{
              id: Date.now(),
              text: "<pre class=\"markdown\">".concat(data.data, "</pre>"),
              sender: 'bot',
              timestamp: new Date()
            }]);
          });
        } else {
          var _message = data.message || data.text || event.data;
          setMessages(function (prev) {
            return [].concat(_toConsumableArray(prev), [{
              id: Date.now(),
              text: _message,
              sender: 'bot',
              timestamp: new Date()
            }]);
          });
        }
      } catch (e) {
        // ignore
      }
    };
    return function () {
      ws.close();
    };
  }, [wsUrl]);
  (0, _react.useEffect)(function () {
    var _messagesEndRef$curre;
    (_messagesEndRef$curre = messagesEndRef.current) === null || _messagesEndRef$curre === void 0 || _messagesEndRef$curre.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, isOpen, isFullscreen, isMinimized]);
  (0, _react.useEffect)(function () {
    var _inputRef$current;
    if (isOpen) (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 || _inputRef$current.focus();
  }, [isOpen]);

  // Show broadcast popup when closed
  (0, _react.useEffect)(function () {
    if (latestBroadcast && !isOpen) {
      setShowBroadcastPopup(true);
    } else {
      setShowBroadcastPopup(false);
    }
  }, [latestBroadcast, isOpen]);
  (0, _react.useEffect)(function () {
    if (isOpen) {
      setShowBroadcastPopup(false);
      setLatestBroadcast(null);
    }
  }, [isOpen]);
  var showFullscreenBtn = !isMobile() && !isFullscreen;
  var showMinimizeBtn = !isMobile() && isFullscreen;

  // Send message
  var handleSend = function handleSend() {
    var input = inputRef.current;
    if (!input) return;
    var value = input.value.trim();
    if (!value) return;
    setMessages(function (prev) {
      return [].concat(_toConsumableArray(prev), [{
        id: Date.now(),
        text: value,
        sender: 'user',
        timestamp: new Date()
      }]);
    });
    input.value = '';
    if (wsRef.current && connectionStatus === 'connected') {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        text: value
      }));
    } else {
      setMessages(function (prev) {
        return [].concat(_toConsumableArray(prev), [{
          id: Date.now(),
          text: "Sorry, I'm having connection issues. Please try again later.",
          sender: 'system',
          timestamp: new Date()
        }]);
      });
    }
  };

  // Handle file upload
  var handleFileChange = function handleFileChange(e) {
    var _e$target$files;
    var file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function () {
        var base64 = reader.result;
        setMessages(function (prev) {
          return [].concat(_toConsumableArray(prev), [{
            id: Date.now(),
            text: "<img src=\"".concat(base64, "\" alt=\"user upload\" style=\"max-width:200px;max-height:200px;\">"),
            sender: 'user',
            timestamp: new Date()
          }]);
        });
        if (wsRef.current && connectionStatus === 'connected') {
          wsRef.current.send(JSON.stringify({
            type: 'image',
            data: base64,
            filename: file.name
          }));
        }
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      var _reader = new FileReader();
      _reader.onload = function () {
        var content = _reader.result;
        setMessages(function (prev) {
          return [].concat(_toConsumableArray(prev), [{
            id: Date.now(),
            text: "<pre class=\"markdown\">".concat(content, "</pre>"),
            sender: 'user',
            timestamp: new Date()
          }]);
        });
        if (wsRef.current && connectionStatus === 'connected') {
          wsRef.current.send(JSON.stringify({
            type: 'markdown',
            data: content,
            filename: file.name
          }));
        }
      };
      _reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Logo fallback logic
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    logoError = _useState14[0],
    setLogoError = _useState14[1];
  var handleFullscreen = function handleFullscreen() {
    setIsFullscreen(function (prev) {
      if (!prev) setIsMinimized(false);
      return !prev;
    });
  };
  var handleMinimize = function handleMinimize() {
    setIsMinimized(function (prev) {
      if (!prev) setIsFullscreen(false);
      return !prev;
    });
  };
  (0, _react.useEffect)(function () {
    var timer;
    if (showBroadcastPopup && !isOpen) {
      timer = setTimeout(function () {
        setShowBroadcastPopup(false);
        setLatestBroadcast(null);
      }, 4000);
    }
    return function () {
      return clearTimeout(timer);
    };
  }, [showBroadcastPopup, isOpen]);
  var handleClose = function handleClose() {
    setIsOpen(false);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: _ChatbotModule["default"].chatbotContainer,
    children: [isOpen ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: [_ChatbotModule["default"].chatWindow, isFullscreen ? _ChatbotModule["default"].fullscreen : '', isMinimized ? _ChatbotModule["default"].minimized : ''].join(' '),
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].header,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].headerTitle,
          children: headerTitle
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: _ChatbotModule["default"].headerRight,
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: _ChatbotModule["default"].connectionStatus,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: [_ChatbotModule["default"].statusDot, statusClassMap[connectionStatus]].join(' ')
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: connectionStatus
            })]
          }), showMinimizeBtn && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            className: _ChatbotModule["default"].minimizeBtn,
            title: "Minimize",
            onClick: handleMinimize,
            children: "\u2013"
          }), showFullscreenBtn && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            className: _ChatbotModule["default"].fullscreenBtn,
            title: "Fullscreen",
            onClick: handleFullscreen,
            children: "\u26F6"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            className: _ChatbotModule["default"].closeButton,
            title: "Close",
            onClick: handleClose,
            children: "\xD7"
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].messages,
        children: [messages.map(function (m) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ChatMessage["default"], {
            message: m
          }, m.id);
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          ref: messagesEndRef
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].inputArea,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          className: _ChatbotModule["default"].input,
          type: "text",
          ref: inputRef,
          placeholder: "Type a message...",
          onKeyDown: function onKeyDown(e) {
            return e.key === 'Enter' && handleSend();
          }
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          type: "file",
          accept: "image/*,.md,.markdown",
          style: {
            display: 'none'
          },
          ref: fileInputRef,
          onChange: handleFileChange
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          className: _ChatbotModule["default"].attachBtn,
          title: "Attach file",
          onClick: function onClick() {
            var _fileInputRef$current;
            return (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click();
          },
          type: "button",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            viewBox: "0 0 24 24",
            fill: "none",
            width: "20",
            height: "20",
            stroke: "#222",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.19 9.19a1 1 0 01-1.41-1.41l9.19-9.19"
            })
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          className: _ChatbotModule["default"].sendButton,
          onClick: handleSend,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            className: _ChatbotModule["default"].sendIcon,
            viewBox: "0 0 24 24",
            fill: "white",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
            })
          })
        })]
      })]
    }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      className: _ChatbotModule["default"].toggleButton,
      onClick: function onClick() {
        return setIsOpen(true);
      },
      children: logoPath && !logoError ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: logoPath,
        alt: "Qsc",
        className: _ChatbotModule["default"].jumpLoop,
        onError: function onError() {
          return setLogoError(true);
        }
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: _ChatbotModule["default"].jumpLoop,
        children: "Qsc"
      })
    }), showBroadcastPopup && !isOpen && latestBroadcast && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: _ChatbotModule["default"].broadcastPopup,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: _ChatbotModule["default"].broadcastIcon,
        children: "\uD83D\uDCE2"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        children: latestBroadcast
      })]
    })]
  });
}