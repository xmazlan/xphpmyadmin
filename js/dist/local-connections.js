/* global bootstrap */
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
(function (_$) {
  var $ = function $(id) {
    return document.getElementById(id);
  };
  var form = $('profile-form');
  var drawerElement = $('profile-drawer');
  var drawer = new bootstrap.Offcanvas(drawerElement);
  var deleteElement = $('delete-modal');
  var deleteModal = new bootstrap.Modal(deleteElement);
  var csrf = document.body.dataset.token;
  var candidate = null;
  var items = [];
  var selected = null;
  var deleting = null;
  var baseline = '';
  var working = false;
  var returnFocus = null;
  var deleteFocus = null;
  var listGeneration = 0;
  var searchTimer;
  var nullable = function nullable(value) {
    return value.trim() || null;
  };
  function message(element, text) {
    var kind = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'info';
    element.className = text ? 'alert alert-' + kind : '';
    element.textContent = text;
  }
  function api(_x, _x2) {
    return _api.apply(this, arguments);
  }
  function _api() {
    _api = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(endpoint, payload) {
      var response, data, _data$error, _t;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.p = _context9.n) {
          case 0:
            _context9.n = 1;
            return fetch(endpoint, {
              method: 'POST',
              credentials: 'same-origin',
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(_objectSpread({
                token: csrf
              }, payload))
            });
          case 1:
            response = _context9.v;
            _context9.p = 2;
            _context9.n = 3;
            return response.json();
          case 3:
            data = _context9.v;
            _context9.n = 5;
            break;
          case 4:
            _context9.p = 4;
            _t = _context9.v;
            throw new Error('Respons layanan tidak tersedia. Periksa penyimpanan lokal lalu coba lagi.');
          case 5:
            if (data.diagnostics) {
              showDiagnostics(data.diagnostics);
            }
            if (!(!response.ok || !data.ok)) {
              _context9.n = 6;
              break;
            }
            throw new Error(((_data$error = data.error) === null || _data$error === void 0 ? void 0 : _data$error.message) || 'Aksi gagal. Periksa koneksi dan coba lagi.');
          case 6:
            return _context9.a(2, data);
        }
      }, _callee9, null, [[2, 4]]);
    }));
    return _api.apply(this, arguments);
  }
  function showDiagnostics(rows) {
    $('connection-diagnostics').replaceChildren();
    var _iterator = _createForOfIteratorHelper(rows),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var row = _step.value;
        var item = document.createElement('li');
        item.textContent = row.stage + ': ' + row.status + ' · ' + row.duration_ms + ' ms · ' + row.code;
        $('connection-diagnostics').append(item);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  function draft() {
    return {
      method: $('connection-method').value,
      ssh: $('connection-method').value === 'ssh' ? {
        host: $('ssh-host').value.trim(),
        port: Number($('ssh-port').value),
        username: $('ssh-username').value.trim(),
        key: $('ssh-key').value.trim()
      } : null,
      name: form.elements.name.value.trim(),
      host: form.elements.host.value.trim(),
      port: Number(form.elements.port.value),
      username: form.elements.username.value.trim(),
      database: nullable(form.elements.database.value),
      environment: form.elements.environment.value,
      favorite: form.elements.favorite.checked,
      tls: {
        enabled: $('tls-enabled').checked,
        verify: true,
        ca: nullable($('tls-ca').value),
        cert: nullable($('tls-cert').value),
        key: nullable($('tls-key').value)
      }
    };
  }
  function snapshot() {
    return JSON.stringify({
      draft: draft(),
      action: $('password-action').value,
      password: $('password-action').value === 'replace' ? $('profile-password').value : null
    });
  }
  var dirty = function dirty() {
    return snapshot() !== baseline;
  };
  function update() {
    $('ssh-fields').hidden = $('connection-method').value !== 'ssh';
    $('ssh-inspect').disabled = working || !selected || dirty();
    $('tls-files').hidden = !$('tls-enabled').checked;
    var needsSave = !selected || dirty();
    $('connect-profile').disabled = working || needsSave;
    $('dirty-note').textContent = needsSave ? 'Simpan perubahan sebelum Hubungkan.' : 'Profil tersimpan. Hubungkan akan membuka target ini di tab ini.';
  }
  function task(_x3) {
    return _task.apply(this, arguments);
  }
  function _task() {
    _task = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(fn) {
      var notice,
        controls,
        disabled,
        _args0 = arguments,
        _t2;
      return _regenerator().w(function (_context0) {
        while (1) switch (_context0.p = _context0.n) {
          case 0:
            notice = _args0.length > 1 && _args0[1] !== undefined ? _args0[1] : $('drawer-notice');
            if (!working) {
              _context0.n = 1;
              break;
            }
            return _context0.a(2);
          case 1:
            working = true;
            controls = _toConsumableArray(document.querySelectorAll('button, input, select'));
            disabled = controls.map(function (control) {
              return control.disabled;
            });
            controls.forEach(function (control) {
              control.disabled = true;
            });
            message(notice, 'Memproses…');
            _context0.p = 2;
            _context0.n = 3;
            return fn();
          case 3:
            _context0.n = 5;
            break;
          case 4:
            _context0.p = 4;
            _t2 = _context0.v;
            message(notice, _t2.message, 'danger');
          case 5:
            _context0.p = 5;
            working = false;
            controls.forEach(function (control, index) {
              control.disabled = disabled[index];
            });
            update();
            return _context0.f(5);
          case 6:
            return _context0.a(2);
        }
      }, _callee0, null, [[2, 4, 5, 6]]);
    }));
    return _task.apply(this, arguments);
  }
  function button(text, className, action, label) {
    var result = document.createElement('button');
    result.type = 'button';
    result.className = 'btn ' + className;
    result.textContent = text;
    if (label) {
      result.setAttribute('aria-label', label);
    }
    result.addEventListener('click', action);
    return result;
  }
  function cell(row, content) {
    var className = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var td = document.createElement('td');
    td.className = className;
    if (typeof content === 'string') {
      td.textContent = content;
    } else {
      td.append(content);
    }
    row.append(td);
    return td;
  }
  function render() {
    $('profiles').replaceChildren();
    var _iterator2 = _createForOfIteratorHelper(items),
      _step2;
    try {
      var _loop = function _loop() {
        var profile = _step2.value;
        var row = document.createElement('tr');
        var star = button(profile.favorite ? '★' : '☆', 'btn-outline-secondary xpma-star', function () {
          return task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
            return _regenerator().w(function (_context) {
              while (1) switch (_context.n) {
                case 0:
                  _context.n = 1;
                  return api('local-profiles.php', {
                    action: 'favorite',
                    id: profile.id,
                    favorite: !profile.favorite
                  });
                case 1:
                  message($('notice'), 'Favorit diperbarui.', 'success');
                  _context.n = 2;
                  return load();
                case 2:
                  return _context.a(2);
              }
            }, _callee);
          })), $('notice'));
        }, (profile.favorite ? 'Hapus favorit ' : 'Tandai favorit ') + profile.name);
        star.setAttribute('aria-pressed', String(profile.favorite));
        cell(row, star);
        var name = document.createElement('div');
        var title = document.createElement('span');
        title.className = 'xpma-profile-name';
        title.textContent = profile.name;
        var env = document.createElement('span');
        env.className = 'xpma-env xpma-env-' + profile.environment.toLowerCase();
        env.textContent = profile.environment;
        name.append(title, env);
        cell(row, name);
        cell(row, (profile.method === 'ssh' ? 'SSH · ' : 'Direct / VPN · ') + profile.host + ':' + profile.port, 'xpma-host');
        cell(row, profile.username);
        var used = profile.last_used_at ? new Date(profile.last_used_at).toLocaleString('id-ID') : 'Belum digunakan';
        cell(row, used);
        var actions = document.createElement('div');
        actions.className = 'xpma-actions';
        actions.append(button('Hubungkan', 'btn-primary btn-sm', function (event) {
          returnFocus = event.currentTarget;
          if (profile.has_saved_password || profile.session_context) {
            task(function () {
              return connect(profile);
            }, $('notice'));
          } else {
            open(profile, event.currentTarget);
            message($('drawer-notice'), 'Masukkan password, atau pilih input kosong untuk akun tanpa password.');
            $('use-password').checked = true;
          }
        }, 'Hubungkan ' + profile.name));
        actions.append(button('Edit', 'btn-outline-secondary btn-sm', function (event) {
          return open(profile, event.currentTarget);
        }, 'Edit ' + profile.name));
        actions.append(button('Hapus', 'btn-outline-danger btn-sm', function (event) {
          deleting = profile;
          deleteFocus = event.currentTarget;
          $('delete-description').textContent = 'Hapus “' + profile.name + '” (' + profile.host + ':' + profile.port + ')?';
          message($('delete-notice'), '');
          deleteModal.show();
        }, 'Hapus ' + profile.name));
        cell(row, actions);
        $('profiles').append(row);
      };
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    $('profile-table').hidden = items.length === 0;
    $('list-state').hidden = items.length > 0;
    if (items.length === 0) {
      var filtered = $('search').value || $('favorites').checked;
      $('list-state').replaceChildren();
      var title = document.createElement('strong');
      title.textContent = filtered ? 'Tidak ada profil yang cocok' : 'Belum ada koneksi';
      var text = document.createElement('p');
      text.textContent = filtered ? 'Ubah pencarian atau nonaktifkan filter favorit.' : 'Tambahkan profil pertama. Profil dapat disimpan meskipun server offline.';
      $('list-state').append(title, text);
      if (!filtered) {
        $('list-state').append(button('Tambah koneksi', 'btn-primary', function (event) {
          return open(null, event.currentTarget);
        }));
      }
    }
  }
  function load() {
    return _load.apply(this, arguments);
  }
  function _load() {
    _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1() {
      var generation, data, _t3;
      return _regenerator().w(function (_context1) {
        while (1) switch (_context1.p = _context1.n) {
          case 0:
            generation = ++listGeneration;
            $('list-state').hidden = false;
            $('list-state').textContent = 'Memuat profil koneksi…';
            $('profile-table').hidden = true;
            _context1.p = 1;
            _context1.n = 2;
            return api('local-profiles.php', {
              action: 'list',
              search: $('search').value,
              favorites: $('favorites').checked,
              order: $('sort').value
            });
          case 2:
            data = _context1.v;
            if (!(generation !== listGeneration)) {
              _context1.n = 3;
              break;
            }
            return _context1.a(2);
          case 3:
            items = data.profiles;
            render();
            _context1.n = 6;
            break;
          case 4:
            _context1.p = 4;
            _t3 = _context1.v;
            if (!(generation !== listGeneration)) {
              _context1.n = 5;
              break;
            }
            return _context1.a(2);
          case 5:
            $('list-state').textContent = _t3.message + ' Gunakan Muat ulang untuk mencoba lagi.';
          case 6:
            return _context1.a(2);
        }
      }, _callee1, null, [[1, 4]]);
    }));
    return _load.apply(this, arguments);
  }
  function open(profile, trigger) {
    if (working) {
      return;
    }
    selected = profile;
    returnFocus = trigger;
    form.reset();
    $('drawer-title').textContent = profile ? 'Edit koneksi' : 'Tambah koneksi';
    if (profile) {
      for (var _i = 0, _arr = ['name', 'host', 'port', 'username', 'database', 'environment']; _i < _arr.length; _i++) {
        var _profile$name;
        var name = _arr[_i];
        form.elements[name].value = (_profile$name = profile[name]) !== null && _profile$name !== void 0 ? _profile$name : '';
      }
      form.elements.favorite.checked = profile.favorite;
      $('tls-enabled').checked = profile.tls.enabled;
      for (var _i2 = 0, _arr2 = ['ca', 'cert', 'key']; _i2 < _arr2.length; _i2++) {
        var _profile$tls$_name;
        var _name = _arr2[_i2];
        $('tls-' + _name).value = (_profile$tls$_name = profile.tls[_name]) !== null && _profile$tls$_name !== void 0 ? _profile$tls$_name : '';
      }
    }
    $('connection-method').value = (profile === null || profile === void 0 ? void 0 : profile.method) || 'direct';
    for (var _i3 = 0, _arr3 = ['host', 'port', 'username', 'key']; _i3 < _arr3.length; _i3++) {
      var _profile$ssh$_name, _profile$ssh;
      var _name2 = _arr3[_i3];
      $('ssh-' + _name2).value = (_profile$ssh$_name = profile === null || profile === void 0 || (_profile$ssh = profile.ssh) === null || _profile$ssh === void 0 ? void 0 : _profile$ssh[_name2]) !== null && _profile$ssh$_name !== void 0 ? _profile$ssh$_name : _name2 === 'port' ? 22 : '';
    }
    candidate = null;
    $('ssh-approve').hidden = true;
    $('ssh-trust').textContent = '';
    showDiagnostics([]);
    $('password-status').textContent = profile !== null && profile !== void 0 && profile.has_saved_password ? 'Password terenkripsi tersimpan. Nilainya tidak ditampilkan.' : 'Belum ada password tersimpan.';
    $('password-action').options[0].textContent = profile !== null && profile !== void 0 && profile.has_saved_password ? 'Pertahankan password tersimpan (keep)' : 'Jangan simpan password';
    $('password-action').value = 'keep';
    $('profile-password').value = '';
    $('use-password').checked = false;
    message($('drawer-notice'), '');
    baseline = snapshot();
    update();
    drawer.show();
  }
  function close() {
    if (working) {
      return;
    }
    if (dirty() && !window.confirm('Perubahan profil belum disimpan. Tutup dan buang perubahan?')) {
      return;
    }
    baseline = snapshot();
    drawer.hide();
  }
  function sameTarget(profile) {
    var current = draft();
    return ['host', 'port', 'username', 'database', 'tls', 'method', 'ssh'].every(function (key) {
      return JSON.stringify(current[key]) === JSON.stringify(profile[key]);
    });
  }
  function credential(profile) {
    var forTest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if ($('use-password').checked || $('profile-password').value !== '' || $('password-action').value === 'replace') {
      return {
        source: 'input',
        password: $('profile-password').value
      };
    }
    if (!profile || forTest && !sameTarget(profile)) {
      throw new Error('Masukkan password untuk target ini. Password profil lain tidak akan dipakai untuk draft yang berubah.');
    }
    if (profile.session_context) {
      return forTest ? {
        source: 'session',
        profile_id: profile.id,
        revision: profile.connection_revision,
        context: profile.session_context
      } : {
        source: 'session',
        context: profile.session_context
      };
    }
    if (profile.has_saved_password) {
      return forTest ? {
        source: 'saved',
        profile_id: profile.id,
        revision: profile.connection_revision
      } : {
        source: 'saved'
      };
    }
    throw new Error('Password belum tersedia. Masukkan password atau pilih input kosong, lalu coba lagi.');
  }
  function connect(_x4) {
    return _connect.apply(this, arguments);
  }
  function _connect() {
    _connect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(profile) {
      var fromDrawer,
        auth,
        data,
        _args10 = arguments;
      return _regenerator().w(function (_context10) {
        while (1) switch (_context10.n) {
          case 0:
            fromDrawer = _args10.length > 1 && _args10[1] !== undefined ? _args10[1] : false;
            if (fromDrawer) {
              auth = credential(profile);
            } else {
              auth = profile.session_context ? {
                source: 'session',
                context: profile.session_context
              } : {
                source: 'saved'
              };
            }
            _context10.n = 1;
            return api('local-connect.php', {
              action: 'connect',
              profile_id: profile.id,
              revision: profile.connection_revision,
              credential: auth
            });
          case 1:
            data = _context10.v;
            baseline = snapshot();
            window.location.assign(data.url);
          case 2:
            return _context10.a(2);
        }
      }, _callee10);
    }));
    return _connect.apply(this, arguments);
  }
  $('ssh-inspect').addEventListener('click', function () {
    return task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var result;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            if (!(!selected || dirty())) {
              _context2.n = 1;
              break;
            }
            throw new Error('Simpan profil terlebih dahulu.');
          case 1:
            _context2.n = 2;
            return api('local-profiles.php', {
              action: 'ssh_inspect',
              id: selected.id,
              revision: selected.connection_revision
            });
          case 2:
            result = _context2.v;
            candidate = result.candidate;
            $('ssh-trust').textContent = candidate.host + ':' + candidate.port + ' · ' + candidate.algorithm + ' · ' + candidate.status + '\nFingerprint baru: ' + candidate.fingerprint + '\nFingerprint lama: ' + (candidate.old_fingerprint || 'belum ada') + '\nVerifikasi melalui sumber terpisah sebelum menyetujui.';
            $('ssh-approve').textContent = candidate.status === 'changed' ? 'Ganti trust dengan fingerprint baru yang telah diverifikasi' : 'Percayai fingerprint yang telah diverifikasi';
            $('ssh-approve').hidden = candidate.status === 'trusted';
            message($('drawer-notice'), 'Pemeriksaan key tidak melakukan login MySQL.');
          case 3:
            return _context2.a(2);
        }
      }, _callee2);
    })));
  });
  $('ssh-approve').addEventListener('click', function () {
    return task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            if (!(!candidate || !selected || dirty())) {
              _context3.n = 1;
              break;
            }
            throw new Error('Periksa ulang host key profil tersimpan.');
          case 1:
            _context3.n = 2;
            return api('local-profiles.php', {
              action: 'ssh_approve',
              id: selected.id,
              revision: selected.connection_revision,
              nonce: candidate.nonce,
              replace: candidate.status === 'changed'
            });
          case 2:
            candidate = null;
            $('ssh-approve').hidden = true;
            message($('drawer-notice'), 'Host key dipercaya. Konteks lama dicabut; hubungkan kembali.', 'success');
            _context3.n = 3;
            return load();
          case 3:
            selected = items.find(function (profile) {
              return profile.id === selected.id;
            }) || selected;
          case 4:
            return _context3.a(2);
        }
      }, _callee3);
    })));
  });
  $('add-profile').addEventListener('click', function (event) {
    return open(null, event.currentTarget);
  });
  $('close-drawer').addEventListener('click', close);
  drawerElement.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });
  drawerElement.addEventListener('shown.bs.offcanvas', function () {
    $('profile-name').focus();
  });
  drawerElement.addEventListener('hidden.bs.offcanvas', function () {
    var _returnFocus;
    $('profile-password').value = '';
    (_returnFocus = returnFocus) !== null && _returnFocus !== void 0 && _returnFocus.isConnected ? returnFocus.focus() : $('add-profile').focus();
  });
  deleteElement.addEventListener('hidden.bs.modal', function () {
    var _deleteFocus;
    (_deleteFocus = deleteFocus) !== null && _deleteFocus !== void 0 && _deleteFocus.isConnected ? deleteFocus.focus() : $('add-profile').focus();
  });
  deleteElement.addEventListener('shown.bs.modal', function () {
    deleteElement.querySelector('.modal-footer [data-bs-dismiss]').focus();
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  $('profile-password').addEventListener('input', function () {
    $('use-password').checked = true;
  });
  $('password-action').addEventListener('change', function () {
    if ($('password-action').value === 'replace') {
      $('use-password').checked = true;
      $('profile-password').focus();
    }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }
    task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
      var action, password, payload, data;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            action = $('password-action').value;
            password = action === 'replace' ? {
              action: action,
              password: $('profile-password').value
            } : {
              action: action
            };
            payload = {
              action: selected ? 'update' : 'create',
              draft: draft(),
              password: password
            };
            if (selected) {
              payload.id = selected.id;
              payload.revision = selected.connection_revision;
            }
            _context4.n = 1;
            return api('local-profiles.php', payload);
          case 1:
            data = _context4.v;
            selected = data.profile;
            $('drawer-title').textContent = 'Edit koneksi';
            $('password-status').textContent = selected.has_saved_password ? 'Password terenkripsi tersimpan.' : 'Belum ada password tersimpan.';
            $('password-action').options[0].textContent = selected.has_saved_password ? 'Pertahankan password tersimpan (keep)' : 'Jangan simpan password';
            $('password-action').value = 'keep';
            if (action === 'replace') {
              $('profile-password').value = '';
              $('use-password').checked = false;
            }
            baseline = snapshot();
            message($('drawer-notice'), 'Profil disimpan. Anda dapat menutup drawer atau memilih Hubungkan.', 'success');
            _context4.n = 2;
            return load();
          case 2:
            selected = items.find(function (profile) {
              return profile.id === selected.id;
            }) || selected;
          case 3:
            return _context4.a(2);
        }
      }, _callee4);
    })));
  });
  $('test-profile').addEventListener('click', function () {
    if (!form.reportValidity()) {
      return;
    }
    task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      var result;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            _context5.n = 1;
            return api('local-connection-test.php', {
              draft: draft(),
              credential: credential(selected, true)
            });
          case 1:
            result = _context5.v;
            message($('drawer-notice'), 'Tes koneksi berhasil. ' + (result.tls ? 'TLS terverifikasi.' : 'Tanpa TLS sesuai pilihan.') + ' Profil dan target aktif tidak berubah.', 'success');
          case 2:
            return _context5.a(2);
        }
      }, _callee5);
    })));
  });
  $('connect-profile').addEventListener('click', function () {
    if (!selected || dirty()) {
      message($('drawer-notice'), 'Simpan perubahan sebelum Hubungkan.', 'warning');
      return;
    }
    task(function () {
      return connect(selected, true);
    });
  });
  $('confirm-delete').addEventListener('click', function () {
    return task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            _context6.n = 1;
            return api('local-profiles.php', {
              action: 'delete',
              id: deleting.id,
              revision: deleting.connection_revision
            });
          case 1:
            deleteModal.hide();
            message($('notice'), 'Profil “' + deleting.name + '” dihapus dari penyimpanan lokal. Database server tidak dihapus.', 'success');
            _context6.n = 2;
            return load();
          case 2:
            return _context6.a(2);
        }
      }, _callee6);
    })), $('delete-notice'));
  });
  $('reload').addEventListener('click', load);
  $('search').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 200);
  });
  $('favorites').addEventListener('change', load);
  $('sort').addEventListener('change', load);
  (_$ = $('disconnect')) === null || _$ === void 0 || _$.addEventListener('click', function () {
    return task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.n) {
          case 0:
            _context7.n = 1;
            return api('local-connect.php', {
              action: 'disconnect',
              context: document.body.dataset.context
            });
          case 1:
            window.location.assign('local-connections.php?xpma_context=' + encodeURIComponent(document.body.dataset.context));
          case 2:
            return _context7.a(2);
        }
      }, _callee7);
    })), $('notice'));
  });
  $('logout').addEventListener('click', function () {
    if (!window.confirm('Logout akan memutus seluruh konteks sesi, termasuk tab lain. Lanjutkan?')) {
      return;
    }
    task(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.n) {
          case 0:
            _context8.n = 1;
            return api('local-connect.php', {
              action: 'logout'
            });
          case 1:
            baseline = snapshot();
            window.location.assign('local-connections.php');
          case 2:
            return _context8.a(2);
        }
      }, _callee8);
    })), $('notice'));
  });
  window.addEventListener('beforeunload', function (event) {
    if (drawerElement.classList.contains('show') && dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  baseline = snapshot();
  load();
})();