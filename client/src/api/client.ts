import { assetOptions } from '../data/assets'
import type { ApiRequest } from './ApiContext'
export function assetUrl(value: string) { return assetOptions.find(asset => asset.name === value)?.url ?? value }
export function hydrate<T>(value: T): T {
  if (Array.isArray(value)) return value.map(hydrate) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, ['image', 'featuredImage', 'src'].includes(key) && typeof field === 'string' ? assetUrl(field) : hydrate(field)])) as T
  return value
}
export function serialize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['recordId', 'version', 'createdAt', 'updatedAt', 'catalogOrder', 'key'].includes(key)).map(([key, field]) => [key, ['image', 'featuredImage', 'src'].includes(key) && typeof field === 'string' ? assetOptions.find(asset => asset.url === field)?.name ?? field : serialize(field)]))
  return value
}
export function createApi(base: string, getToken: () => Promise<string | null>): ApiRequest {
  return async <T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> => {
    const headers = new Headers(options.headers)
    if (options.body) headers.set('Content-Type', 'application/json')
    if (authenticated) { const token = await getToken(); if (!token) throw new Error('Sign in with your verified account to continue.'); headers.set('Authorization', `Bearer ${token}`) }
    const response = await fetch(`${base}${path}`, { ...options, headers, credentials: 'omit', signal: options.signal ?? AbortSignal.timeout(15000) })
    if (response.status === 204) return undefined as T
    let json: { data?: T; error?: { message?: string }; pagination?: unknown }
    try { json = await response.json() } catch { throw new Error('The API returned an invalid response.') }
    if (!response.ok) throw new Error(json.error?.message ?? 'The request could not be completed.')
    return hydrate(json) as T
  }
}
export async function allPages<T>(api: ApiRequest, path: string): Promise<T[]> {
  const records: T[] = []
  for (let page = 1; page <= 1000; page++) {
    const result = await api<{ data: T[]; pagination: { pages: number } }>(`${path}${path.includes('?') ? '&' : '?'}limit=100&page=${page}`, {}, false)
    records.push(...result.data)
    if (page >= result.pagination.pages) return records
  }
  throw new Error('Too many records for this storefront view.')
}
