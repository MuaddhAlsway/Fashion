import { SignIn } from '@clerk/react'
import { apiEnabled } from '../api/config'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDemoAuth } from '../context/DemoAuthContext'
import '../styles/auth.css'

function LoginPage() {
  return apiEnabled ? <main className="auth-page"><SignIn routing="hash" signUpUrl="/signup" fallbackRedirectUrl="/" /></main> : <DemoLoginPage />
}
function DemoLoginPage() {
  const navigate = useNavigate()
  const { user, signIn } = useDemoAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < 1) {
      setError('Enter any password to continue in this demo.')
      return
    }

    signIn({
      name: user?.name ?? email.split('@')[0],
      email: email.trim(),
    })
    navigate('/')
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="auth-card__eyebrow">WELCOME BACK</p>
        <h1 className="auth-card__title" id="login-title">Log in</h1>
        <p className="auth-card__description">
          Sign in to your demo FASHION profile.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="auth-form__error" role="alert">{error}</p>}

          <p className="auth-form__demo-note">
            Demo only: any non-empty password works; no credentials are checked.
          </p>

          <button className="auth-button" type="submit">
            Log in
          </button>
        </form>

        <p className="auth-card__switch">
          New to FASHION? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage