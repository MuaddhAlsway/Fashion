import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCart } from '../context/CartContext'
import '../styles/checkout.css'

export type DeliveryDetails = {
  fullName: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

const initialDetails: DeliveryDetails = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal } = useCart()
  const [details, setDetails] = useState(initialDetails)
  const [showReview, setShowReview] = useState(false)

  function updateField(field: keyof DeliveryDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowReview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (items.length === 0) {
    return (
      <main className="checkout">
        <header className="checkout__header">
          <p className="checkout__eyebrow">Checkout</p>
          <h1 className="checkout__title">Your bag is empty</h1>
          <Link className="checkout__button checkout__button--dark" to="/marketplace">
            Shop the collection
          </Link>
        </header>
      </main>
    )
  }

  return (
    <main className="checkout">
      <header className="checkout__header">
        <p className="checkout__eyebrow">FASHION / SECURE CHECKOUT</p>
        <h1 className="checkout__title">
          {showReview ? 'Review your order' : 'Delivery details'}
        </h1>

        <ol className="checkout__steps" aria-label="Checkout progress">
          <li className={!showReview ? 'checkout__step checkout__step--active' : 'checkout__step'}>
            1. Delivery
          </li>
          <li className={showReview ? 'checkout__step checkout__step--active' : 'checkout__step'}>
            2. Review
          </li>
          <li className="checkout__step">3. Payment</li>
        </ol>
      </header>

      <div className="checkout__layout">
        <section className="checkout__main">
          {!showReview ? (
            <form className="checkout-form" onSubmit={handleSubmit}>
              <h2 className="checkout-form__title">Where should we deliver?</h2>

              <label className="checkout-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  required
                  value={details.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                />
              </label>

              <label className="checkout-field">
                <span>Phone number</span>
                <input
                  autoComplete="tel"
                  type="tel"
                  required
                  value={details.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </label>

              <label className="checkout-field">
                <span>Street address</span>
                <input
                  autoComplete="street-address"
                  required
                  value={details.address}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </label>

              <div className="checkout-form__row">
                <label className="checkout-field">
                  <span>City</span>
                  <input
                    autoComplete="address-level2"
                    required
                    value={details.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </label>

                <label className="checkout-field">
                  <span>Postal code</span>
                  <input
                    autoComplete="postal-code"
                    required
                    value={details.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                  />
                </label>
              </div>

              <label className="checkout-field">
                <span>Country</span>
                <input
                  autoComplete="country-name"
                  required
                  value={details.country}
                  onChange={(event) => updateField('country', event.target.value)}
                />
              </label>

              <button className="checkout__button checkout__button--dark" type="submit">
                Continue to review
              </button>
            </form>
          ) : (
            <section className="checkout-review" aria-labelledby="review-title">
              <div className="checkout-review__heading">
                <h2 className="checkout-form__title" id="review-title">
                  Delivery address
                </h2>
                <button
                  className="checkout-review__edit"
                  type="button"
                  onClick={() => setShowReview(false)}
                >
                  Edit
                </button>
              </div>

              <address className="checkout-review__address">
                <strong>{details.fullName}</strong>
                <span>{details.phone}</span>
                <span>{details.address}</span>
                <span>{details.city}, {details.postalCode}</span>
                <span>{details.country}</span>
              </address>

              <div className="checkout-review__notice">
                <strong>Payment is the next step.</strong>
                <p>Your delivery details are ready. Continue to choose a payment method; no payment will be taken.</p>
              </div>

              <button
                className="checkout__button checkout__button--dark"
                type="button"
                onClick={() => navigate('/checkout/payment', { state: { details } })}
              >
                Continue to payment
              </button>

              <Link className="checkout__back-link" to="/cart">
                Return to bag
              </Link>
            </section>
          )}
        </section>

        <aside className="checkout-summary" aria-label="Order summary">
          <h2 className="checkout-summary__title">Order summary</h2>

          <ul className="checkout-summary__items">
            {items.map((item) => (
              <li className="checkout-summary__item" key={`${item.id}-${item.size}`}>
                <img src={item.image} alt={item.imageAlt} />
                <div>
                  <strong>{item.name}</strong>
                  <span>Size {item.size} · Qty {item.quantity}</span>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="checkout-summary__total">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          <p className="checkout-summary__note">
            Shipping and taxes are calculated later.
          </p>
        </aside>
      </div>
    </main>
  )
}

export default CheckoutPage

