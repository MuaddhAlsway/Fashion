import { apiEnabled } from '../api/config'
import ConnectedPayment from '../api/ConnectedPayment'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { DeliveryDetails } from './CheckoutPage'
import { useCart } from '../context/CartContext'
import '../styles/payment.css'

type PaymentMethod = 'card' | 'apple-pay' | 'mada'

function readDeliveryDetails(value: unknown): DeliveryDetails | undefined {
  if (typeof value !== 'object' || value === null) return
  const candidate = value as Record<string, unknown>
  const fields: (keyof DeliveryDetails)[] = ['fullName', 'phone', 'address', 'city', 'postalCode', 'country']
  if (fields.every((field) => typeof candidate[field] === 'string' && candidate[field].trim().length > 0)) {
    return candidate as DeliveryDetails
  }
}
function PaymentPage() {
  return apiEnabled ? <ConnectedPayment /> : <DemoPaymentPage />
}
function DemoPaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { details?: unknown } | null
  const details = readDeliveryDetails(state?.details)
  const { items, subtotal } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

  if (items.length === 0) {
    return (
      <main className="payment-page">
        <p className="payment-page__eyebrow">Checkout</p>
        <h1>Your bag is empty</h1>
        <Link className="payment-page__link" to="/marketplace">
          Return to marketplace
        </Link>
        <p><Link className="payment-page__link" to="/checkout">Enter delivery details</Link></p>
      </main>
    )
  }

  return (
    <main className="payment-page">
      <header className="payment-page__header">
        <p className="payment-page__eyebrow">FASHION / CHECKOUT</p>
        <h1 className="payment-page__title">Payment</h1>
        <p className="payment-page__description">
          Choose how you’d like to pay. Payment processing will be connected
          later.
        </p>
      </header>

      <div className="payment-page__layout">
        <section className="payment-panel" aria-labelledby="payment-method-title">
          <h2 id="payment-method-title">Payment method</h2>

          <fieldset className="payment-options">
            <legend className="visually-hidden">Choose a payment method</legend>

            <label className="payment-option">
              <input
                type="radio"
                name="payment-method"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <span className="payment-option__content">
                <strong>Credit or debit card</strong>
                <span>Visa, Mastercard, and other supported cards</span>
              </span>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="payment-method"
                value="apple-pay"
                checked={paymentMethod === 'apple-pay'}
                onChange={() => setPaymentMethod('apple-pay')}
              />
              <span className="payment-option__content">
                <strong>Apple Pay</strong>
                <span>Available on supported devices</span>
              </span>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="payment-method"
                value="mada"
                checked={paymentMethod === 'mada'}
                onChange={() => setPaymentMethod('mada')}
              />
              <span className="payment-option__content">
                <strong>mada</strong>
                <span>Saudi debit cards</span>
              </span>
            </label>
          </fieldset>

          <p className="payment-panel__notice" aria-live="polite">
            {paymentMethod === 'card' && 'Card entry will be provided securely when payment is connected.'}
            {paymentMethod === 'apple-pay' && 'Apple Pay will be available after payment integration.'}
            {paymentMethod === 'mada' && 'mada payments will be available after payment integration.'}
          </p>

          <button
            className="payment-page__button"
            type="button"
            disabled={!details}
            onClick={() => {
              if (!details) return
              navigate('/checkout/confirmation', {
                state: { details, paymentMethod },
              })
            }}
          >
            View demo confirmation
          </button>

          <p className="payment-panel__helper">
            This is a preview. No payment will be taken.
          </p>

          <Link className="payment-page__back" to="/checkout">
            Back to delivery details
          </Link>
        </section>

        <aside className="payment-summary" aria-label="Order summary">
          <section className="payment-delivery" aria-labelledby="payment-delivery-title">
            <h2 id="payment-delivery-title">Delivery address</h2>
            {details ? (
              <address className="payment-delivery__address">
                <strong>{details.fullName}</strong>
                <span>{details.phone}</span>
                <span>{details.address}</span>
                <span>{details.city}, {details.postalCode}</span>
                <span>{details.country}</span>
              </address>
            ) : (
              <p className="payment-delivery__missing">
                No delivery details were provided.{' '}
                <Link className="payment-page__link" to="/checkout">Enter delivery details</Link>
              </p>
            )}
          </section>
          <h2>Order summary</h2>

          <ul className="payment-summary__items">
            {items.map((item) => (
              <li className="payment-summary__item" key={`${item.id}-${item.size}`}>
                <img src={item.image} alt={item.imageAlt} />
                <div>
                  <strong>{item.name}</strong>
                  <span>Size {item.size} · Qty {item.quantity}</span>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="payment-summary__total">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>

          <p className="payment-summary__note">
            Shipping and taxes are calculated later.
          </p>
        </aside>
      </div>
    </main>
  )
}

export default PaymentPage


