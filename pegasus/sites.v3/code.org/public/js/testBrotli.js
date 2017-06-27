'use strict';

function loadJS(u) {
  var r=document.getElementsByTagName("script")[0],
      s=document.createElement("script");
  s.src=u;
  r.parentNode.insertBefore(s,r);
}

function setCookie(key, value, days) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
  var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
  return keyValue ? keyValue[2] : null;
}

if (!window.Promise) {
  // Load Promise polyfill
  loadJS('/js/polyfill/promise.min.js');
}
if (!window.fetch) {
  // Load fetch polyfill
  loadJS('/js/polyfill/fetch.js');
}

var brCookie = getCookie('br');
if (brCookie !== '0' && brCookie !== '1') {
  fetch('/test.br')
    .then(function (res) {
      if (res.ok) {
        return res.text();
      }
    })
    .then(function (resp) {
      return (resp === 'ok');
    })
    .catch(function (e) {
      return false;
    })
    .then(function (isBrotliSupported) {
      setCookie('br', isBrotliSupported ? 1 : 0, 7);
    });
}
