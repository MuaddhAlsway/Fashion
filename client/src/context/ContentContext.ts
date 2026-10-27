import { createContext, useContext } from 'react'
import type { ContentState } from '../data/content-types'

export const ContentContext = createContext<{
  data: ContentState
  catalogStatus?: 'loading' | 'ready' | 'error'
  catalogSource?: 'api' | 'demo'
  retryCatalog?: () => void
  storageError: string
  commit: (update: (current: ContentState) => ContentState, message: string) => void | Promise<void>
  reset: () => void
} | undefined>(undefined)

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) throw new Error('useContent must be used inside ContentProvider')
  return context
}
