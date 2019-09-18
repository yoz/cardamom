const CACHE = 'v2';

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
      '/cardamom/index.html',
      '/cardamom/data/dances.json',
      '/cardamom/handlebars.js',
      '/cardamom/template_card_2.html',
      '/cardamom/template_whole_2.html',
      '/cardamom/underscore.js',
    ]).catch((err) => {
      console.log('precache fail', err);
    });
  });
}

function fromCache(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.match(request).then((matched) => {
      return matched || Promise.reject('no match sorry');
    });
  })
    .catch((err) => {
      console.log('cache fail', err);
    });
}

function update(request) {
  return caches.open(CACHE).then((cache) => {
    return cache.add(request);
  })
    .catch((err) => {
      console.log('update fail', err, request);
    });
}
