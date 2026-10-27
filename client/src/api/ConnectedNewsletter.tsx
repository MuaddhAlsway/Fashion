import { useId, useState, useRef, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useApi } from './ApiContext'
export default function ConnectedNewsletter() {
  const api = useApi(), id = useId(), lock = useRef(false)
  const [email, setEmail] = useState(''), [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage('')
    try { const result = await api<{ data: { message: string } }>('/api/newsletter/subscriptions', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), consent, noticeVersion: 'newsletter-v1' }) }, false); setMessage(result.data.message) }
    catch (err) { setError(err instanceof Error ? err.message : 'Signup could not be recorded. Please retry.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="footer-newsletter" aria-labelledby={`${id}-title`}><div><p className="fashion-footer__eyebrow">The next edit</p><h2 id={`${id}-title`}>A little inspiration.<br />In your inbox.</h2><p>Record your guest newsletter signup. No account needed.</p></div><form onSubmit={submit} aria-busy={busy}><label htmlFor={`${id}-email`}>Email address (required)</label><div className="footer-newsletter__fields"><input id={`${id}-email`} type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /><button disabled={busy} type="submit">{busy ? 'Saving…' : 'Subscribe'}</button></div><label><span><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} style={{ width: 'auto', minHeight: 0 }} /> I agree to my address being saved for newsletter updates.</span></label><p className="footer-newsletter__note">Your signup is stored by the website. Campaign sending is not enabled. Read the <Link to="/privacy">Privacy Policy</Link>.</p><p role="alert">{error}</p><p role="status">{message}</p></form></section>
}
