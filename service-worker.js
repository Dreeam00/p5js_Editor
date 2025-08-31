const CACHE_NAME = 'p5-editor-cache-v1';
const urlsToCache = [
  '/p5js_Editor/',
  '/p5js_Editor/index.html',
  '/p5js_Editor/style.css',
  '/p5js_Editor/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
