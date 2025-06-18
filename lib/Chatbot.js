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
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { if (r) i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n;else { var o = function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); }; o("next", 0), o("throw", 1), o("return", 2); } }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
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
function Chatbot(_ref) {
  var wsUrl = _ref.wsUrl,
    restUrl = _ref.restUrl,
    headerTitle = _ref.headerTitle,
    logoPath = _ref.logoPath,
    assistantName = _ref.assistantName,
    _ref$enableRestFallba = _ref.enableRestFallback,
    enableRestFallback = _ref$enableRestFallba === void 0 ? false : _ref$enableRestFallba;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isOpen = _useState2[0],
    setIsOpen = _useState2[1];
  var _useState3 = (0, _react.useState)([{
      id: 1,
      text: "Hello! I'm your ".concat(assistantName, "."),
      sender: 'bot'
    }]),
    _useState4 = _slicedToArray(_useState3, 2),
    messages = _useState4[0],
    setMessages = _useState4[1];
  var _useState5 = (0, _react.useState)(''),
    _useState6 = _slicedToArray(_useState5, 2),
    inputValue = _useState6[0],
    setInputValue = _useState6[1];
  var _useState7 = (0, _react.useState)('connecting'),
    _useState8 = _slicedToArray(_useState7, 2),
    connectionStatus = _useState8[0],
    setConnectionStatus = _useState8[1];
  var apiMode = 'ws';
  var _useState9 = (0, _react.useState)(null),
    _useState0 = _slicedToArray(_useState9, 2),
    latestBroadcast = _useState0[0],
    setLatestBroadcast = _useState0[1];
  var messagesEndRef = (0, _react.useRef)(null);
  var wsRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    if (!wsUrl) {
      console.error('Error: wsUrl is required for Chatbot plugin');
    }
    if (enableRestFallback && !restUrl) {
      console.error('Error: restUrl must be provided when enableRestFallback is true');
    }
  }, [wsUrl, restUrl, enableRestFallback]);
  (0, _react.useEffect)(function () {
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
      var data = JSON.parse(event.data);
      if (data.type === 'response') addBotMessage(data.text);
      if (data.type === 'broadcast') {
        setLatestBroadcast(data.text);
        addSystemMessage("\uD83D\uDCE2 ".concat(data.text));
      }
    };
    return function () {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [wsUrl]);
  (0, _react.useEffect)(function () {
    if (latestBroadcast && !isOpen) {
      var note = document.createElement('div');
      note.className = _ChatbotModule["default"].broadcastNotification;
      note.textContent = latestBroadcast;
      note.onclick = function () {
        return setIsOpen(true);
      };
      document.body.appendChild(note);
      setTimeout(function () {
        note.style.opacity = '0';
        setTimeout(function () {
          return note.remove();
        }, 200);
      }, 5000);
    }
  }, [latestBroadcast, isOpen]);
  var addBotMessage = function addBotMessage(text) {
    return setMessages(function (prev) {
      return [].concat(_toConsumableArray(prev), [{
        id: Date.now(),
        text: text,
        sender: 'bot'
      }]);
    });
  };
  var addSystemMessage = function addSystemMessage(text) {
    return setMessages(function (prev) {
      return [].concat(_toConsumableArray(prev), [{
        id: Date.now(),
        text: text,
        sender: 'system'
      }]);
    });
  };
  var toggleChat = function toggleChat() {
    setIsOpen(function (o) {
      return !o;
    });
    setLatestBroadcast(null);
  };
  var sendRest = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(text) {
      var res, data, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            if (restUrl) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            _context.p = 1;
            _context.n = 2;
            return fetch(restUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'message',
                text: text,
                id: "".concat(Date.now())
              })
            });
          case 2:
            res = _context.v;
            _context.n = 3;
            return res.json();
          case 3:
            data = _context.v;
            addBotMessage(data.text);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            addBotMessage('Error connecting to server.');
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 4]]);
    }));
    return function sendRest(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var handleSend = function handleSend() {
    var trimmed = inputValue.trim();
    if (!trimmed) return;
    setMessages(function (prev) {
      return [].concat(_toConsumableArray(prev), [{
        id: Date.now(),
        text: trimmed,
        sender: 'user'
      }]);
    });
    setInputValue('');
    if (apiMode === 'ws' && connectionStatus === 'connected' && wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          text: trimmed,
          id: "".concat(Date.now())
        }));
      } catch (_unused2) {
        enableRestFallback && sendRest(trimmed);
      }
    } else if (enableRestFallback) {
      sendRest(trimmed);
    }
  };
  (0, _react.useEffect)(function () {
    var _messagesEndRef$curre;
    (_messagesEndRef$curre = messagesEndRef.current) === null || _messagesEndRef$curre === void 0 || _messagesEndRef$curre.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: _ChatbotModule["default"].chatbotContainer,
    children: [isOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: _ChatbotModule["default"].chatWindow,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].header,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: _ChatbotModule["default"].headerLeft,
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
            children: headerTitle
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "".concat(_ChatbotModule["default"].connectionStatus, " ").concat(_ChatbotModule["default"][connectionStatus]),
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: _ChatbotModule["default"].statusDot
            }), connectionStatus.toUpperCase()]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: _ChatbotModule["default"].headerRight,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            className: _ChatbotModule["default"].closeButton,
            onClick: toggleChat,
            children: "\xD7"
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].messages,
        children: [messages.map(function (msg) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ChatMessage["default"], {
            message: msg
          }, msg.id);
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          ref: messagesEndRef
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: _ChatbotModule["default"].inputArea,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          type: "text",
          value: inputValue,
          onChange: function onChange(e) {
            return setInputValue(e.target.value);
          },
          onKeyDown: function onKeyDown(e) {
            return e.key === 'Enter' && handleSend();
          },
          placeholder: "Type a message\u2026",
          className: _ChatbotModule["default"].input
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: handleSend,
          className: _ChatbotModule["default"].sendButton,
          children: "Send"
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
      className: "".concat(_ChatbotModule["default"].toggleButton, " ").concat(isOpen ? _ChatbotModule["default"].hidden : ''),
      onClick: toggleChat,
      children: [latestBroadcast && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: _ChatbotModule["default"].broadcastIndicator,
        children: "\uD83D\uDCE2"
      }), logoPath ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: logoPath,
        alt: "Bot",
        width: 48,
        height: 48,
        className: _ChatbotModule["default"].jumpLoop,
        onError: function onError(e) {
          var _target$parentNode;
          var target = e.currentTarget;
          target.onerror = null;
          target.style.display = 'none';
          var fallback = document.createElement('strong');
          fallback.className = _ChatbotModule["default"].jumpLoop;
          fallback.style.color = 'white';
          fallback.style.fontSize = '23px';
          fallback.textContent = 'Qsc';
          (_target$parentNode = target.parentNode) === null || _target$parentNode === void 0 || _target$parentNode.appendChild(fallback);
        }
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("strong", {
        className: _ChatbotModule["default"].jumpLoop,
        style: {
          color: 'white',
          fontSize: '23px'
        },
        children: "Qsc"
      })]
    })]
  });
}