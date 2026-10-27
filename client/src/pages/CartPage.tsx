import { Link } from 'react-router'
import { useCart } from '../context/CartContext'
import '../styles/cart.css'

function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <p className="cart-page__eyebrow">Your selection</p>
        <h1 className="cart-page__title">Shopping bag</h1>
        <p className="cart-page__count">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </header>

      {items.length === 0 ? (
        <section className="cart-empty">
          <h2>Your bag is empty</h2>
          <p>Explore the collection and find something you love.</p>
          <Link className="cart-button cart-button--dark" to="/marketplace">
            Shop the collection
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Items in your bag">
            {items.map((item) => (
              <article
                className="cart-item"
                key={`${item.id}-${item.size}`}
              >
                <img
                  className="cart-item__image"
                  src={item.image}
                  alt={item.imageAlt}
                />

                <div className="cart-item__details">
                  <p className="cart-item__brand">{item.brand}</p>
                  <h2 className="cart-item__name">{item.name}</h2>
                  <p className="cart-item__meta">Size: {item.size}</p>
                  <p className="cart-item__price">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="cart-item__controls">
                    <label>
                      <span className="visually-hidden">
                        Quantity for {item.name}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.id, item.size, event.target.valueAsNumber)}
                      />
                    </label>

                    <button
                      className="cart-item__remove"
                      type="button"
                      aria-label={`Remove ${item.name}, size ${item.size}`} onClick={() => removeItem(item.id, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="cart-item__total">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </article>
            ))}
          </section>

          <aside className="cart-summary">
            <h2 className="cart-summary__title">Order summary</h2>
            <div className="cart-summary__row">
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <p className="cart-summary__note">
              Shipping and taxes are calculated at checkout.
            </p>
            <Link className="cart-button cart-button--dark" to="/checkout">
  Continue to checkout
</Link>
            <p className="cart-summary__note" id="checkout-note">Checkout is a placeholder; no payment will be taken.</p>
            <button className="cart-item__remove" type="button" onClick={clearCart}>Clear bag</button>
            <Link className="cart-summary__continue" to="/marketplace">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  )
}

export default CartPage
