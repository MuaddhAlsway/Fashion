import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ContentContext } from '../context/ContentContext'
import type { ContentState, StoreProduct, StoreCategory, StorePost, WebsiteBlock, LegalDocument } from '../data/content-types'
import { validContent } from '../data/content-utils'
import { useApi } from './ApiContext'
import { allPages, serialize } from './client'

type Versioned = { version?: number }
export default function ApiContentProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const [data, setData] = useState<ContentState | null>(null)
  const current = useRef<ContentState | null>(null)
  const busy = useRef(false)
  const blockVersions = useRef<Record<string, number>>({})
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const [products, categories, journal, website, privacy, terms] = await Promise.all([
      allPages<StoreProduct>(api, '/api/products'), allPages<StoreCategory>(api, '/api/categories'), allPages<StorePost>(api, '/api/journal'),
      api<{ data: Record<string, WebsiteBlock>; versions: Record<string, number> }>('/api/site-content', {}, false), api<{ data: LegalDocument }>('/api/legal/privacy', {}, false), api<{ data: LegalDocument }>('/api/legal/terms', {}, false),
    ])
    const next = { products, categories, journal, website: website.data, legal: { privacy: privacy.data, terms: terms.data }, activity: [] }
    if (!validContent(next)) throw new Error('API content is incomplete. Run the reviewed seed and check image keys.')
    blockVersions.current = website.versions; current.current = next; setData(next); setError('')
    return next
  }, [api])
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) void load().catch(() => { if (active) setError('Store content could not be loaded. Check the API connection and seed data.') }) }); return () => { active = false } }, [load])
  const commit = useCallback(async (update: (value: ContentState) => ContentState, _message: string) => {
    if (!current.current || busy.current) throw new Error('Wait for the previous save before trying again.')
    busy.current = true
    try {
      const before = current.current, after = update(before)
      const operations: { method: string; path: string; body?: unknown; version?: number }[] = []
      const deletedCategory = before.categories.find(c => !after.categories.some(next => next.id === c.id))
      for (const key of ['categories', 'products', 'journal'] as const) {
        const previous = before[key] as unknown as Record<string, unknown>[], next = after[key] as unknown as Record<string, unknown>[]
        const idKey = key === 'journal' ? 'slug' : 'id', resource = key === 'journal' ? 'journal' : key
        for (const item of next) {
          const old = previous.find(p => p[idKey] === item[idKey])
          if (!old) operations.push({ method: 'POST', path: `/api/admin/${resource}`, body: item })
          else if (JSON.stringify(item) !== JSON.stringify(old) && !(key === 'products' && deletedCategory && JSON.stringify({ ...old, categoryIds: (old.categoryIds as string[]).filter(id => id !== deletedCategory.id) }) === JSON.stringify(item))) operations.push({ method: 'PUT', path: `/api/admin/${resource}/${item[idKey]}`, body: item, version: Number(old.version ?? 0) })
        }
        for (const item of previous) if (!next.some(p => p[idKey] === item[idKey])) operations.push({ method: 'DELETE', path: `/api/admin/${resource}/${item[idKey]}`, version: Number(item.version ?? 0) })
      }
      for (const key of Object.keys(after.website)) if (JSON.stringify(after.website[key]) !== JSON.stringify(before.website[key])) {

        operations.push({ method: 'PUT', path: `/api/admin/site-content/${key}`, body: after.website[key], version: blockVersions.current[key] })
      }
      for (const key of ['privacy', 'terms'] as const) if (JSON.stringify(after.legal[key]) !== JSON.stringify(before.legal[key])) operations.push({ method: 'PUT', path: `/api/admin/legal/${key}`, body: after.legal[key], version: (before.legal[key] as LegalDocument & Versioned).version ?? 0 })
      if (operations.length !== 1) throw new Error('Save one record at a time. No changes were sent.')
      const operation = operations[0]!
      await api(operation.path, { method: operation.method, headers: operation.version === undefined ? {} : { 'If-Match': String(operation.version) }, ...(operation.body ? { body: JSON.stringify(serialize(operation.body)) } : {}) })
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); throw err }
    finally { busy.current = false }
  }, [api, load])
  if (!data) return <main className="admin-gate"><div><h1>FASHION</h1><p role="status">{error || 'Loading the collection…'}</p>{error && <button type="button" onClick={() => { void load().catch(() => setError('Store content could not be loaded. Please try again.')) }}>Retry</button>}</div></main>
  return <ContentContext.Provider value={{ data, storageError: error, commit, reset() { throw new Error('Demo reset is unavailable for persistent content.') } }}>{children}</ContentContext.Provider>
}
