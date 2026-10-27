import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { CartProvider } from './context/CartContext'
import { DemoAuthProvider } from './context/DemoAuthContext'
import ContentProvider from './context/ContentProvider'
import WishlistProvider from './context/WishlistProvider'
import { apiEnabled } from './api/config'
import ApiRuntime from './api/ApiRuntime'
import ApiContentProvider from './api/ApiContentProvider'
import { ConnectedCart, ConnectedWishlist } from './api/Shopping'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{apiEnabled ?
    <ApiRuntime><ApiContentProvider><ConnectedCart><ConnectedWishlist><App /></ConnectedWishlist></ConnectedCart></ApiContentProvider></ApiRuntime> :
    <CartProvider><DemoAuthProvider><ContentProvider><WishlistProvider><App /></WishlistProvider></ContentProvider></DemoAuthProvider></CartProvider>
  }</StrictMode>,
)
