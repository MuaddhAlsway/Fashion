import { subscriberDemoApi } from './subscribers'

// Frontend preview only. Replace the subscriber API adapter when a backend exists.
export async function submitNewsletterPreview(email: string): Promise<'preview' | 'duplicate'> {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Enter a valid email address, such as you@example.com.')
  }
  return subscriberDemoApi.add(normalized)
}
