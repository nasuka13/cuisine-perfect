// ==========================================
// SERVICE WORKER - PWA
// ==========================================

const CACHE_NAME = 'mes-recettes-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Installation du Service Worker et mise en cache des fichiers de base
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installation en cours...');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Mise en cache des fichiers de l\'application');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activation et nettoyage des anciens caches si nécessaire
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activation en cours...');
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Suppression de l\'ancien cache :', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Interception des requêtes réseau (Stratégie Network First avec repli sur le cache)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // Si la requête réseau réussit, on met à jour le cache dynamiquement (pour les pages HTML/CSS/JS)
                return response;
            })
            .catch(() => {
                // Si le réseau échoue (mode hors-ligne), on cherche dans le cache
                return caches.match(e.request);
            })
    );
});