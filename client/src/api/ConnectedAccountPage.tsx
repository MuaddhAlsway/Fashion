import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useClerk, useUser } from '@clerk/react'
import ConnectedOrderHistory from './ConnectedOrderHistory'
import '../styles/account.css'

export default function ConnectedAccountPage() {
  const { user } = useUser()
  const clerk = useClerk()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')

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

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setAvatarError('')
    try {
      await user.setProfileImage({ file })
    } catch {
      setAvatarError('Avatar could not be updated. Try another image.')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function handleSignOut() {
    void clerk.signOut()
    navigate('/')
  }

  const name = user.fullName || user.username || 'Customer'
  const email = user.primaryEmailAddress?.emailAddress ?? ''
  const avatar = user.imageUrl

  return (
    <main className="account-page">
      <header className="account-page__header">
        <div className="account-profile">
          <div className="account-avatar">
            {avatar ? <img src={avatar} alt={`${name} avatar`} className="account-avatar__image" /> : <span className="account-avatar__initial">{name.charAt(0).toUpperCase()}</span>}
            <label className="account-avatar__button" title="Change avatar">
              <input ref={fileInput} type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} hidden />
              {uploading ? '…' : '✎'}
            </label>
          </div>
          <div>
            <p className="account-page__eyebrow">YOUR FASHION ACCOUNT</p>
            <h1 className="account-page__title">Hello, {name}</h1>
            <p className="account-page__description">Manage your profile and keep track of your orders.</p>
          </div>
        </div>
        <button className="account-button account-button--secondary" type="button" onClick={handleSignOut}>Log out</button>
      </header>
      <div className="account-page__grid">
        <ConnectedOrderHistory />
        <section className="account-card" aria-labelledby="profile-title">
          <div className="account-card__heading">
            <h2 id="profile-title">Profile details</h2>
            <span className="account-card__tag">Verified profile</span>
          </div>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{name}</dd></div>
            <div><dt>Email</dt><dd>{email}</dd></div>
          </dl>
          {avatarError && <p className="account-card__note" role="alert">{avatarError}</p>}
          <p className="account-card__note">Your profile and avatar are managed through your verified Clerk account.</p>
        </section>
      </div>
    </main>
  )
}
