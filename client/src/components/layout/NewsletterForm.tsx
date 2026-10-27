import { apiEnabled } from '../../api/config'
import ConnectedNewsletter from '../../api/ConnectedNewsletter'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { submitNewsletterPreview } from '../../services/newsletter'

function NewsletterForm() {
  return apiEnabled ? <ConnectedNewsletter /> : <DemoNewsletterForm />
}
function DemoNewsletterForm() {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    setMessage('')
    if (!input.current?.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address, such as you@example.com.')
      input.current?.focus()
      return
    }
    submitting.current = true
    setPending(true)
    setError('')
    try {
      const result = await submitNewsletterPreview(email)
      setMessage(result === 'duplicate'
        ? 'This address has already been previewed in this tab. No subscription was created.'
        : 'Demo complete. Your address was checked, but no email was sent and you have not been added to a mailing list.')
    } catch {
      setError('The demo could not be completed. Please check your address and try again.')
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return <section className="footer-newsletter" aria-labelledby={`${id}-title`}>
    <div><p className="fashion-footer__eyebrow">The next edit / Newsletter preview</p><h2 id={`${id}-title`}>A little inspiration.<br />In your inbox.</h2><p>Preview our guest signup. No account needed.</p></div>
    <form noValidate onSubmit={handleSubmit} aria-labelledby={`${id}-title`} aria-busy={pending}>
      <label htmlFor={`${id}-email`}>Email address <span>(required)</span></label>
      <div className="footer-newsletter__fields"><input ref={input} id={`${id}-email`} name="email" type="email" required autoComplete="email" maxLength={254} value={email} placeholder="you@example.com" aria-invalid={Boolean(error)} aria-describedby={`${id}-privacy${error ? ` ${id}-error` : ''}`} onChange={event => { setEmail(event.target.value); setError(''); setMessage('') }} /><button type="submit" disabled={pending}>{pending ? 'Checking…' : 'Subscribe'} <span aria-hidden="true">↗</span></button></div>
      <p className="footer-newsletter__note" id={`${id}-privacy`}>By choosing Subscribe, you can preview a newsletter signup. This demo only checks your address; it does not create a subscription. Your address stays in memory in this tab until refresh. Read our <Link to="/privacy">Privacy Policy</Link>.</p>
      <p className="footer-newsletter__error" id={`${id}-error`} role="alert">{error}</p>
      <p className="footer-newsletter__status" role="status" aria-atomic="true">{message}</p>
    </form>
  </section>
}
export default NewsletterForm
