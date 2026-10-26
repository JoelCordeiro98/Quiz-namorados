const CACHE = 'nosso-espaco-v5';
const MEDIA_CACHE = 'nosso-espaco-media-v1';
const MEDIA_CACHE_MAX = 250;
const ASSETS = ['index.html', 'manifest.json'];
// Trecho da URL de fotos/vídeos públicos do Supabase Storage
const STORAGE_HOST = 'supabase.co/storage/v1/object/public/';

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE && k !== MEDIA_CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Mantém o cache de mídia dentro de um limite, removendo as entradas mais antigas
function trimMediaCache(cache) {
  cache.keys().then(function(keys) {
    if (keys.length > MEDIA_CACHE_MAX) {
      var remover = keys.length - MEDIA_CACHE_MAX;
      for (var i = 0; i < remover; i++) cache.delete(keys[i]);
    }
  });
}

self.addEventListener('fetch', function(e) {
  var req = e.request;

  // Fotos/vídeos do Supabase Storage: cache-first no aparelho, pra não baixar de novo
  // toda vez que a Galeria é aberta (isso é o que consome a cota de "Saída em cache").
  // Requisições com "Range" (usadas pelo player de vídeo pra dar seek) não entram no
  // cache, pra não arriscar servir um pedaço errado do arquivo.
  if (req.method === 'GET' && req.url.indexOf(STORAGE_HOST) !== -1 && !req.headers.has('range')) {
    e.respondWith(
      caches.open(MEDIA_CACHE).then(function(cache) {
        return cache.match(req).then(function(cached) {
          if (cached) return cached;
          return fetch(req).then(function(resp) {
            if (resp && resp.ok) {
              cache.put(req, resp.clone());
              trimMediaCache(cache);
            }
            return resp;
          }).catch(function() {
            return cached;
          });
        });
      })
    );
    return;
  }

  e.respondWith(fetch(req).catch(function() { return caches.match(req); }));
});

// ===== NOTIFICAÇÕES PUSH =====
// O Supabase manda um JSON { titulo, corpo, tipo, url }. Todo push precisa virar uma
// notificação visível (o iPhone exige isso, senão cancela a inscrição).
self.addEventListener('push', function(e) {
  var dados = {};
  try { dados = e.data ? e.data.json() : {}; } catch (err) { dados = { corpo: e.data ? e.data.text() : '' }; }
  var titulo = dados.titulo || 'Nosso Espaço ♥';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: dados.corpo || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: dados.tipo || 'geral',
    renotify: true,
    data: { url: dados.url || './' }
  }));
});

// Tocar na notificação abre (ou traz pra frente) o app
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var destino = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(lista) {
    for (var i = 0; i < lista.length; i++) {
      if ('focus' in lista[i]) return lista[i].focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(destino);
  }));
});
