import { createContext } from 'react'
export type CartProduct = {
  id: string
  name: string
  brand: string
  price: number
  image: string
  imageAlt: string
  size: string
}

export type CartItem = CartProduct & {
  quantity: number
}

export type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: CartProduct) => void | Promise<void>
  updateQuantity: (id: string, size: string, quantity: number) => void
  removeItem: (id: string, size: string) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | undefined>(undefined)
