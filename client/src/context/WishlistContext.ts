import { createContext, useContext } from 'react'
import type { StoreProduct } from '../data/content-types'

export const WishlistContext = createContext<{
  items: StoreProduct[]
  itemCount: number
  isSaved: (id: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  storageError: string
} | undefined>(undefined)

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider')
  return context
}
