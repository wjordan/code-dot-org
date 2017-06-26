'use strict';

function loadJS(u){var r=document.getElementsByTagName("script")[0],s=document.createElement("script");s.src=u;r.parentNode.insertBefore(s,r);}

function setCookie(key, value, days) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

if (!window.Promise) {
  // Load Promise polyfill
  loadJS('/js/polyfill/promise.min.js');
}
if (!window.fetch) {
  // Load fetch polyfill
  loadJS('/js/polyfill/fetch.js');
}

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
    console.log("Error:", e);
    return false;
  })
  .then(function (isBrotliSupported) {
    console.log("Supported: ", isBrotliSupported);
  });
