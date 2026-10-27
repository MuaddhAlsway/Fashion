import { CartContext, type CartItem, type CartContextValue } from './cart-state'
export type { CartProduct, CartItem, CartContextValue } from './cart-state'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'fashion-cart'

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Partial<CartItem>
  return (
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.name === 'string' && typeof item.brand === 'string' &&
    typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 &&
    typeof item.image === 'string' && typeof item.imageAlt === 'string' &&
    typeof item.size === 'string' && item.size.trim().length > 0 &&
    typeof item.quantity === 'number' && Number.isSafeInteger(item.quantity) && item.quantity > 0
  )
}
function mergeCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()
  for (const item of items) {
    const key = JSON.stringify([item.id, item.size])
    const existing = merged.get(key)
    merged.set(key, existing
      ? { ...existing, quantity: existing.quantity + item.quantity }
      : { ...item })
  }
  return [...merged.values()]
}
function getInitialItems(): CartItem[] {
  try {
    const savedItems = localStorage.getItem(STORAGE_KEY)
    const parsedItems: unknown = savedItems ? JSON.parse(savedItems) : null
    if (Array.isArray(parsedItems)) {
      return mergeCartItems(parsedItems.filter(isCartItem))
    }
  } catch {
    // Storage may be unavailable or contain invalid JSON; start empty.
  }
  return []
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(getInitialItems)
  const initialItems = useRef(items)

  useEffect(() => {
    // Preserve stored data on mount; persist subsequent cart edits.
    if (items === initialItems.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Cart actions still work in memory when storage is unavailable.
    }
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    )

    return {
      items,
      itemCount,
      subtotal,
      addItem(product) {
        if (!isCartItem({ ...product, quantity: 1 })) return
        setItems((currentItems) =>
          mergeCartItems([...currentItems, { ...product, quantity: 1 }]),
        )
      },
      updateQuantity(id, size, quantity) {
        if (!Number.isSafeInteger(quantity)) return
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === id && item.size === size
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        )
      },
      removeItem(id, size) {
        setItems((currentItems) =>
          currentItems.filter((item) => !(item.id === id && item.size === size)),
        )
      },
      clearCart() {
        setItems([])
      },
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}


