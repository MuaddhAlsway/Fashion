import { SignUp } from '@clerk/react'
import { apiEnabled } from '../api/config'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDemoAuth } from '../context/DemoAuthContext'
import '../styles/auth.css'

function SignupPage() {
  return apiEnabled ? <main className="auth-page"><SignUp routing="hash" signInUrl="/login" fallbackRedirectUrl="/" /></main> : <DemoSignupPage />
}
function DemoSignupPage() {
  const navigate = useNavigate()
  const { signIn } = useDemoAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters for the demo password.')
      return
    }

    signIn({ name: name.trim(), email: email.trim() })
    navigate('/')
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <p className="auth-card__eyebrow">JOIN FASHION</p>
        <h1 className="auth-card__title" id="signup-title">Create account</h1>
        <p className="auth-card__description">
          Create a demo profile to continue exploring the storefront.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Full name</span>
            <input
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              autoComplete="new-password"
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="auth-form__error" role="alert">{error}</p>}

          <p className="auth-form__demo-note">
            Demo only: your password is not saved or verified.
          </p>

          <button className="auth-button" type="submit">
            Create demo account
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  )
}

export default SignupPage