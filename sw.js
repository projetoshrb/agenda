// Deixa a agenda abrir sem internet. Só guarda os arquivos do próprio app.
// Os dados nunca passam por aqui: o Apps Script é de outro endereço e não é interceptado.
var CACHE = 'agenda-v1';
var ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  // Rede primeiro (pega atualizações); sem internet, usa a cópia guardada.
  e.respondWith(fetch(r).then(function (resp) {
    var cp = resp.clone();
    caches.open(CACHE).then(function (c) { c.put(r, cp); });
    return resp;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('index.html'); }); }));
});
