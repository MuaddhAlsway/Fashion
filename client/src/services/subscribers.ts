export type DemoSubscriber = { id: string; email: string; subscribedAt: string; source: 'mock' | 'guest-preview' }

// API boundary: replace these methods with subscriber endpoints later.
// Nothing is written to localStorage, sessionStorage, or a backend.
let subscribers: DemoSubscriber[] = [
  { id: 'mock-1', email: 'alex@example.com', subscribedAt: '2026-10-20T10:00:00Z', source: 'mock' },
  { id: 'mock-2', email: 'sam@example.com', subscribedAt: '2026-10-22T14:30:00Z', source: 'mock' },
  { id: 'mock-3', email: 'taylor@example.com', subscribedAt: '2026-10-24T09:15:00Z', source: 'mock' },
]
const listeners = new Set<() => void>()
function notify() { listeners.forEach(listener => listener()) }
export const subscriberDemoApi = {
  async list(): Promise<DemoSubscriber[]> { return subscribers.map(item => ({ ...item })) },
  async add(email: string): Promise<'preview' | 'duplicate'> {
    const normalized = email.trim().toLowerCase()
    if (subscribers.some(item => item.email === normalized)) return 'duplicate'
    subscribers = [...subscribers, { id: crypto.randomUUID(), email: normalized, subscribedAt: new Date().toISOString(), source: 'guest-preview' }]
    notify()
    return 'preview'
  },
  async remove(id: string): Promise<void> {
    if (!subscribers.some(item => item.id === id)) throw new Error('This demo subscriber is no longer available. Refresh the list.')
    subscribers = subscribers.filter(item => item.id !== id)
    notify()
  },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
}
