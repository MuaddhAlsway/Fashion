import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { allPages, createApi } from '../api/client'
import { apiBaseUrl, catalogSource } from '../api/config'
import type { StoreProduct, StoreCategory } from '../data/content-types'
import { ContentContext } from './ContentContext'
import { freshContent } from '../data/content-seed'
import { validContent } from '../data/content-utils'
import type { ContentState } from '../data/content-types'

const STORAGE_KEY = 'fashion-admin-content-v1'
type Snapshot = { data: ContentState; storageError: string }
function loadContent(): Snapshot {
  if (typeof window === 'undefined') return { data: freshContent(), storageError: '' }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (validContent(parsed)) return { data: parsed, storageError: '' }
      return { data: freshContent(), storageError: 'Saved demo content was invalid. The original content was restored.' }
    }
    return { data: freshContent(), storageError: '' }
  } catch { return { data: freshContent(), storageError: 'Session storage is unavailable. Changes last only until this page is reloaded.' } }
}

function ContentProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(loadContent)
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>(catalogSource === 'api' ? 'loading' : 'ready')
  const [attempt, setAttempt] = useState(0)
  const current = useRef(snapshot)
  useEffect(() => {
    if (catalogSource !== 'api') return
    let active = true
    const api = createApi(apiBaseUrl, async () => null)
    void Promise.all([allPages<StoreProduct>(api, '/api/products'), allPages<StoreCategory>(api, '/api/categories')]).then(([products, categories]) => {
      if (!active) return
      const next = { ...current.current, data: { ...current.current.data, products, categories } }
      if (!validContent(next.data)) throw new Error('Invalid catalog response')
      current.current = next
      setSnapshot(next)
      setCatalogStatus('ready')
    }).catch(() => { if (active) setCatalogStatus('error') })
    return () => { active = false }
  }, [attempt])
  const retryCatalog = () => { setCatalogStatus('loading'); setAttempt(value => value + 1) }

  const commit = useCallback((update: (data: ContentState) => ContentState, message: string) => {
    const next = update(current.current.data)
    if (!validContent(next)) throw new Error('The update contains invalid content. Check the required fields and image assets.')
    const data = { ...next, activity: [{ id: crypto.randomUUID(), message, date: new Date().toISOString() }, ...current.current.data.activity].slice(0, 50) }
    let storageError = ''
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
    catch { storageError = 'Changes are active in memory, but session storage could not save them. Reloading may restore older content.' }
    const nextSnapshot = { data, storageError }
    current.current = nextSnapshot
    setSnapshot(nextSnapshot)
  }, [])
  const reset = useCallback(() => commit(() => freshContent(), 'Restored original demo content'), [commit])
  return <ContentContext.Provider value={{ ...snapshot, catalogStatus, catalogSource, retryCatalog, commit, reset }}>{children}</ContentContext.Provider>
}

export default ContentProvider
