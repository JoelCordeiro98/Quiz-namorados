const CACHE = 'nosso-espaco-v4';
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
