// Unregister any previously installed service workers
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'all', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        if (client.navigate) client.navigate(client.url);
      });
    })
  );
  return self.clients.claim();
});
