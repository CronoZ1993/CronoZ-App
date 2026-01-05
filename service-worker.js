// service-worker.js
const CACHE_NAME = 'cronoz-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/firebase-config.js',
  '/app.js',
  '/auth.js',
  '/contacts.js',
  '/utils.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições não GET
  if (event.request.method !== 'GET') return;

  // Ignorar requisições do Firebase
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retornar resposta do cache
        if (response) {
          return response;
        }

        // Não está no cache - buscar da rede
        return fetch(event.request)
          .then(response => {
            // Verificar se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar a resposta
            const responseToCache = response.clone();

            // Adicionar ao cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback para página offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Fallback para ícone padrão
            if (event.request.url.includes('assets/')) {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FFD700"/><text x="50" y="50" text-anchor="middle" dy=".3em" font-size="40" fill="#000">Z</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  }
});

// Notificações push
self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: 'CronoZ',
    body: 'Você tem uma nova notificação!',
    icon: 'assets/icons/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: 'assets/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.url
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          if (event.notification.data) {
            client.navigate(event.notification.data);
          }
        } else {
          clients.openWindow(event.notification.data || '/');
        }
      })
  );
});

// Função de sincronização de contatos
async function syncContacts() {
  console.log('Sincronizando contatos...');
  // Implementação da sincronização offline
}