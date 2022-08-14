const cacheName = 'low-calorie-draw-v1';

const assets = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/constants.js',
    '/lib/Emitter.js',
    '/lib/point-distance.js',
    '/lib/util.js',
    '/icons/icon.png'
];

self.addEventListener('install', installEvent => {
    installEvent.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(assets))
    )
});

self.addEventListener('fetch', fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request)
            .then(res => res || fetch(fetchEvent.request))
    )
});