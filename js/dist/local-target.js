/* global CommonParams, jQuery, bootstrap */
'use strict';

function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
(function () {
  if (window.xpmaTargetGuardLoaded) {
    return;
  }
  window.xpmaTargetGuardLoaded = true;
  var leaving = false;
  function positionTarget() {
    var menu = document.getElementById('floating_menubar');
    document.documentElement.style.setProperty('--xpma-menu-height', (menu ? menu.getBoundingClientRect().height : 0) + 'px');
  }
  window.addEventListener('load', positionTarget);
  window.addEventListener('resize', positionTarget);
  function edited() {
    return _toConsumableArray(document.querySelectorAll('.CodeMirror')).some(function (node) {
      var editor = node.CodeMirror;
      return editor && !editor.isClean();
    }) || _toConsumableArray(document.querySelectorAll('textarea[name="sql_query"],textarea[name="sql_query_edit"],#sqlquery')).some(function (node) {
      return node.value !== node.defaultValue;
    });
  }
  function confirmLeave(link) {
    var modal = document.getElementById('xpma-leave-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'xpma-leave-modal';
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      modal.setAttribute('aria-labelledby', 'xpma-leave-title');
      modal.setAttribute('aria-describedby', 'xpma-leave-description');
      modal.innerHTML = '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' + '<div class="modal-header"><h2 class="modal-title fs-5" id="xpma-leave-title">Tinggalkan editor?</h2></div>' + '<div class="modal-body"><p id="xpma-leave-description">Query memiliki perubahan belum disimpan. Buka pengelola koneksi dan tinggalkan editor ini?</p></div>' + '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tetap di editor</button>' + '<button type="button" class="btn btn-primary" data-xpma-leave>Buka Koneksi</button></div></div></div>';
      document.body.append(modal);
    }
    var instance = bootstrap.Modal.getOrCreateInstance(modal);
    modal.querySelector('[data-xpma-leave]').onclick = function () {
      leaving = true;
      window.location.assign(link.href);
    };
    modal.addEventListener('shown.bs.modal', function () {
      modal.querySelector('[data-bs-dismiss]').focus();
    }, {
      once: true
    });
    modal.addEventListener('hidden.bs.modal', function () {
      link.focus();
    }, {
      once: true
    });
    instance.show();
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-xpma-manage]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (edited()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      confirmLeave(link);
    } else {
      leaving = true;
    }
  }, true);
  window.addEventListener('beforeunload', function (event) {
    if (!leaving && edited()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  function revoked(xhr) {
    var _xhr$responseJSON;
    if (xhr.status !== 409 || ((_xhr$responseJSON = xhr.responseJSON) === null || _xhr$responseJSON === void 0 || (_xhr$responseJSON = _xhr$responseJSON.error) === null || _xhr$responseJSON === void 0 ? void 0 : _xhr$responseJSON.category) !== 'reconnect') {
      return;
    }
    var bar = document.getElementById('xpma-target');
    if (!bar) {
      return;
    }
    bar.classList.add('xpma-target-reconnect');
    var notice = bar.querySelector('[data-xpma-reconnect]');
    notice.hidden = false;
    notice.textContent = 'Target ini perlu dihubungkan kembali. Konteks telah kedaluwarsa, dicabut, atau profil berubah. Query Anda tetap di editor.';
    document.querySelectorAll('#page_content button[type="submit"],#page_content input[type="submit"]').forEach(function (button) {
      button.disabled = true;
    });
  }
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ajaxError(function (_event, xhr) {
      return revoked(xhr);
    });
    jQuery(document).ajaxSuccess(function (_event, xhr) {
      var _xhr$responseJSON2;
      positionTarget();
      var params = (_xhr$responseJSON2 = xhr.responseJSON) === null || _xhr$responseJSON2 === void 0 ? void 0 : _xhr$responseJSON2.params;
      var target = params === null || params === void 0 ? void 0 : params.validated_target;
      var bar = document.getElementById('xpma-target');
      if (!bar || !target || params.xpma_context !== CommonParams.get('xpma_context')) {
        return;
      }
      bar.querySelector('[data-xpma-name]').textContent = target.name;
      bar.querySelector('[data-xpma-host]').textContent = target.host + ':' + target.port;
      bar.querySelector('[data-xpma-user]').textContent = target.username;
      var env = bar.querySelector('[data-xpma-env]');
      env.textContent = target.environment;
      env.className = 'xpma-env xpma-env-' + target.environment.toLowerCase();
    });
  }
})();