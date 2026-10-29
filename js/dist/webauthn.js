function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * @param {ArrayBuffer} buffer
 *
 * @return {string}
 */
var arrayBufferToBase64 = function arrayBufferToBase64(buffer) {
  var bytes = new Uint8Array(buffer);
  var string = '';
  var _iterator = _createForOfIteratorHelper(bytes),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _byte = _step.value;
      string += String.fromCharCode(_byte);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return window.btoa(string);
};

/**
 * @param {string} string
 *
 * @return {Uint8Array}
 */
var base64ToUint8Array = function base64ToUint8Array(string) {
  return Uint8Array.from(window.atob(string), function (_char) {
    return _char.charCodeAt(0);
  });
};

/**
 * @param {JQuery<HTMLElement>} $input
 *
 * @return {void}
 */
var handleCreation = function handleCreation($input) {
  var $form = $input.parents('form');
  $form.find('input[type=submit]').hide();
  var creationOptionsJson = $input.attr('data-creation-options');
  var creationOptions = JSON.parse(creationOptionsJson);
  var publicKey = creationOptions;
  publicKey.challenge = base64ToUint8Array(creationOptions.challenge);
  publicKey.user.id = base64ToUint8Array(creationOptions.user.id);
  if (creationOptions.excludeCredentials) {
    var excludedCredentials = [];
    var _iterator2 = _createForOfIteratorHelper(creationOptions.excludeCredentials),
      _step2;
    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var value = _step2.value;
        var excludedCredential = value;
        excludedCredential.id = base64ToUint8Array(value.id);
        excludedCredentials.push(excludedCredential);
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    publicKey.excludeCredentials = excludedCredentials;
  }

  // eslint-disable-next-line compat/compat
  navigator.credentials.create({
    publicKey: publicKey
  }).then(function (credential) {
    var credentialJson = JSON.stringify({
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64(credential.response.attestationObject)
      }
    });
    $input.val(credentialJson);
    $form.trigger('submit');
  })["catch"](function (error) {
    return Functions.ajaxShowMessage(error, false, 'error');
  });
};

/**
 * @param {JQuery<HTMLElement>} $input
 *
 * @return {void}
 */
var handleRequest = function handleRequest($input) {
  var $form = $input.parents('form');
  $form.find('input[type=submit]').hide();
  var requestOptionsJson = $input.attr('data-request-options');
  var requestOptions = JSON.parse(requestOptionsJson);
  var publicKey = requestOptions;
  publicKey.challenge = base64ToUint8Array(requestOptions.challenge);
  if (requestOptions.allowCredentials) {
    var allowedCredentials = [];
    var _iterator3 = _createForOfIteratorHelper(requestOptions.allowCredentials),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var value = _step3.value;
        var allowedCredential = value;
        allowedCredential.id = base64ToUint8Array(value.id);
        allowedCredentials.push(allowedCredential);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
    publicKey.allowCredentials = allowedCredentials;
  }

  // eslint-disable-next-line compat/compat
  navigator.credentials.get({
    publicKey: publicKey
  }).then(function (credential) {
    var credentialJson = JSON.stringify({
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        signature: arrayBufferToBase64(credential.response.signature),
        userHandle: arrayBufferToBase64(credential.response.userHandle)
      }
    });
    $input.val(credentialJson);
    $form.trigger('submit');
  })["catch"](function (error) {
    return Functions.ajaxShowMessage(error, false, 'error');
  });
};
AJAX.registerOnload('webauthn.js', function () {
  if (!navigator.credentials || !navigator.credentials.create || !navigator.credentials.get || !window.PublicKeyCredential) {
    Functions.ajaxShowMessage(Messages.webAuthnNotSupported, false, 'error');
    return;
  }
  var $creationInput = $('#webauthn_creation_response');
  if ($creationInput.length > 0) {
    handleCreation($creationInput);
  }
  var $requestInput = $('#webauthn_request_response');
  if ($requestInput.length > 0) {
    handleRequest($requestInput);
  }
});