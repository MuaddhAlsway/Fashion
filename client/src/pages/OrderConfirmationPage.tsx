import { useState } from 'react'
import { apiEnabled } from '../api/config'
import ConnectedConfirmation from '../api/ConnectedConfirmation'
import { Link, useLocation, useNavigate } from 'react-router'
import { useCart } from '../context/CartContext'
import '../styles/order-confirmation.css'

type DeliveryDetails = {
  fullName: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

type CheckoutState = {
  details?: DeliveryDetails
  paymentMethod?: string
}

function OrderConfirmationPage() {
  return apiEnabled ? <ConnectedConfirmation /> : <DemoOrderConfirmationPage />
}
function DemoOrderConfirmationPage() {
  const [confirmationNumber] = useState(() => 'DEMO-' + Date.now().toString().slice(-8))
  const location = useLocation()
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const state = location.state as CheckoutState | null
  const details = state?.details

  if (!details) {
    return (
      <main className="order-confirmation">
        <p className="order-confirmation__eyebrow">FASHION CHECKOUT</p>
        <h1 className="order-confirmation__title">No order to confirm</h1>
        <p className="order-confirmation__description">
          Complete the checkout steps to see the demo confirmation.
        </p>
        <Link className="order-confirmation__button" to="/checkout">
          Return to checkout
        </Link>
      </main>
    )
  }



  function handleContinueShopping() {
    clearCart()
    navigate('/marketplace')
  }

  return (
    <main className="order-confirmation">
      <div className="order-confirmation__intro">
        <span className="order-confirmation__check" aria-hidden="true">✓</span>
        <p className="order-confirmation__eyebrow">DEMO ORDER</p>
        <h1 className="order-confirmation__title">Thank you, {details.fullName}</h1>
        <p className="order-confirmation__description">
          This is a checkout preview. No payment was processed and no real order
          was placed.
        </p>
        <p className="order-confirmation__number">
          Demo reference: <strong>{confirmationNumber}</strong>
        </p>
      </div>

      <div className="order-confirmation__layout">
        <section className="confirmation-card" aria-labelledby="delivery-title">
          <h2 id="delivery-title">Delivery details</h2>
          <address className="confirmation-address">
            <strong>{details.fullName}</strong>
            <span>{details.phone}</span>
            <span>{details.address}</span>
            <span>{details.city}, {details.postalCode}</span>
            <span>{details.country}</span>
          </address>
        </section>

        <section className="confirmation-card" aria-labelledby="items-title">
          <h2 id="items-title">Items in your bag</h2>

          {items.length ? (
            <ul className="confirmation-items">
              {items.map((item) => (
                <li
                  className="confirmation-item"
                  key={`${item.id}-${item.size}`}
                >
                  <img src={item.image} alt={item.imageAlt} />
                  <div className="confirmation-item__details">
                    <strong>{item.name}</strong>
                    <span>Size {item.size} · Qty {item.quantity}</span>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="confirmation-empty">
              Your bag is empty. This demo reference is not a saved order.
            </p>
          )}

          <div className="confirmation-total">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <p className="confirmation-note">
            Shipping and taxes are not included in this demo.
          </p>
        </section>
      </div>

      <button
        className="order-confirmation__button"
        type="button"
        onClick={handleContinueShopping}
      >
        Continue shopping
      </button>
    </main>
  )
}

export default OrderConfirmationPage