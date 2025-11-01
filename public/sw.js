// Simple service worker to fix message port error
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  // Handle messages properly to avoid port closure errors
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Always respond to avoid port closure
  event.ports[0]?.postMessage({ success: true });
});