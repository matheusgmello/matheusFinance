// Push Notification Handler — importado pelo Workbox SW
// Este script recebe notificações push e mostra ao usuário

self.addEventListener('push', event => {
  let data = { title: 'matheusFinance', body: '', url: '/' }
  try {
    if (event.data) {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existing = windowClients.find(c => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
