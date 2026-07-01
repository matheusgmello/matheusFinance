import { api } from './axios'

export const pushApi = {
  vapidPublicKey: () =>
    api.get<{ publicKey: string }>('/api/v1/push/vapid-public-key').then(r => r.data.publicKey),

  subscribe: (subscription: PushSubscriptionJSON) => {
    const keys = subscription.keys as Record<string, string>
    return api.post('/api/v1/push/subscribe', {
      endpoint: subscription.endpoint,
      p256dh: keys?.p256dh ?? '',
      auth: keys?.auth ?? '',
    })
  },

  unsubscribe: (endpoint: string) =>
    api.delete('/api/v1/push/unsubscribe', { params: { endpoint } }),
}
