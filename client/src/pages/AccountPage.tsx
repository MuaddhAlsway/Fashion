import { apiEnabled } from '../api/config'
import ConnectedAccountPage from '../api/ConnectedAccountPage'
import { Link, useNavigate } from 'react-router'
import { useDemoAuth } from '../context/DemoAuthContext'
import '../styles/account.css'

function DemoAccountPage() {
  const { user, signOut } = useDemoAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <main className="account-page">
        <header className="account-page__header">
          <p className="account-page__eyebrow">YOUR FASHION ACCOUNT</p>
          <h1 className="account-page__title">Log in to your account</h1>
          <p className="account-page__description">Sign in to view your profile and order history.</p>
          <Link className="account-button" to="/login">Log in</Link>
        </header>
      </main>
    )
  }

  function handleSignOut() {
    signOut()
    navigate('/')
  }

  return (
    <main className="account-page">
      <header className="account-page__header">
        <div>
          <p className="account-page__eyebrow">YOUR FASHION ACCOUNT</p>
          <h1 className="account-page__title">Hello, {user.name}</h1>
          <p className="account-page__description">Manage your profile and keep track of your orders.</p>
        </div>
        <button className="account-button account-button--secondary" type="button" onClick={handleSignOut}>Log out</button>
      </header>
      <div className="account-page__grid">
        <section className="account-card" aria-labelledby="profile-title">
          <div className="account-card__heading">
            <h2 id="profile-title">Profile details</h2>
            <span className="account-card__tag">Demo profile</span>
          </div>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
          </dl>
          <p className="account-card__note">Profile information is stored locally for this frontend demo.</p>
        </section>
        <section className="account-card" aria-labelledby="orders-title">
          <div className="account-card__heading">
            <h2 id="orders-title">Order history</h2>
            <span className="account-card__tag">0 orders</span>
          </div>
          <div className="account-empty">
            <h3>No orders yet</h3>
            <p>Your placed orders will appear here when order storage is connected.</p>
            <Link className="account-card__link" to="/marketplace">Explore the collection</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function AccountPage() {
  return apiEnabled ? <ConnectedAccountPage /> : <DemoAccountPage />
}
