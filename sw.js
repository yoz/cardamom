const CACHE = 'v1';

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fromCache(event.request));
  event.waitUntil(update(event.request));
});

function precache() {
  return caches.open(CACHE).then((cache) => {
    return cache.addAll([
      '/cardamom/app.js',
      '/cardamom/cardreader.js',
      '/cardamom/cards.css',
      '/cardamom/cards2.html',
      '/cardamom/data/dances.json',
      '/cardamom/handlebars.js',
      '/cardamom/template_card.html',
      '/cardamom/template_whole.html',
      '/cardamom/underscore.js',
    ]);
  });
}

function fromCache(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.match(request).then((matched) => {
      return matched || Promise.reject('no match sorry');
    });
  });
}

function update(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.add(request);
  });
}
