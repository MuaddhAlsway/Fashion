import { Heart } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { useWishlist } from '../../context/WishlistContext'

function FavoriteButton({ productId, overlay = false, showLabel = false }: { productId: string; overlay?: boolean; showLabel?: boolean }) {
  const { data: { products } } = useContent()
  const { isSaved, toggle } = useWishlist()
  const product = products.find(item => item.id === productId)
  if (!product) return null
  const saved = isSaved(productId)
  return <button type="button" className={`favorite-button${overlay ? ' favorite-button--overlay' : ''}${showLabel ? ' favorite-button--label' : ''}`} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved} onClick={() => toggle(productId)}>
    <Heart aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
    {showLabel && <span>{saved ? 'Saved to wishlist' : 'Save to wishlist'}</span>}
  </button>
}
export default FavoriteButton
