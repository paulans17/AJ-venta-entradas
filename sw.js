/* Service worker — Venta de entradas AJ
   Solo cachea los estáticos de la app. Las búsquedas y confirmaciones van
   SIEMPRE a la red (no hay cola offline: el número tiene que salir del
   servidor para que no se repita).
   IMPORTANTE: sube el número de CACHE cada vez que cambie JS/CSS/HTML; si
   este archivo no cambia, los móviles se quedan con el código viejo (bug
   real encontrado en la app de staff, D27). */
const CACHE = 'venta-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/config.js',
  './js/dni.js',
  './js/api.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Solo los archivos de la propia app; las llamadas al Web App no se tocan.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // Red primero, caché como respaldo si no hay conexión.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
