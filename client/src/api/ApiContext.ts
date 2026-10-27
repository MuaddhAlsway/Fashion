import { createContext, useContext } from 'react'
export type ApiRequest = <T = unknown>(path: string, options?: RequestInit, authenticated?: boolean) => Promise<T>
export const ApiContext = createContext<ApiRequest | null>(null)
export function useApi() { const api = useContext(ApiContext); if (!api) throw new Error('API provider missing'); return api }
