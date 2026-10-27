import { apiEnabled } from '../api/config'
import ConnectedContact from '../api/ConnectedContact'
import { useContent } from '../context/ContentContext'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import '../styles/contact.css'

type ContactFields = { name: string; email: string; subject: string; message: string }
type FieldName = keyof ContactFields
const emptyFields: ContactFields = { name: '', email: '', subject: '', message: '' }
const fieldOrder: FieldName[] = ['name', 'email', 'subject', 'message']

function validateField(field: FieldName, value: string): string {
  if (!value.trim()) return `Please enter your ${field === 'message' ? 'message' : field}.`
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address, such as name@example.com.'
  return ''
}

function ContactPage() {
  return apiEnabled ? <ConnectedContact /> : <DemoContactPage />
}
function DemoContactPage() {
  const { data: { website } } = useContent()
  const content = website.contact
  const [fields, setFields] = useState<ContactFields>(emptyFields)
  const [errors, setErrors] = useState<Partial<ContactFields>>({})
  const [submitted, setSubmitted] = useState(false)
  const inputs = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>>({})
  const confirmation = useRef<HTMLDivElement>(null)

  function updateField(field: FieldName, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validateField(field, value) }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Partial<ContactFields> = {}
    for (const field of fieldOrder) {
      const error = validateField(field, fields[field])
      if (error) nextErrors[field] = error
    }
    setErrors(nextErrors)
    const firstInvalid = fieldOrder.find((field) => nextErrors[field])
    if (firstInvalid) {
      inputs.current[firstInvalid]?.focus()
      return
    }
    setSubmitted(true)
    window.requestAnimationFrame(() => confirmation.current?.focus())
  }

  return (
    <main className="contact-page">
      <header className="contact-page__header">
        <p className="contact-page__eyebrow">{content.eyebrow}</p>
        <h1>{content.title} <em>{content.titleAccent}</em></h1>
        <p>{content.description}</p>
      </header>
      <div className="contact-page__layout">
        <aside className="contact-page__notes" aria-labelledby="contact-details-title">
          <span className="contact-page__index" aria-hidden="true">01 / LET’S TALK</span>
          <h2 id="contact-details-title">A little help.<br />A fresh perspective.</h2>
          <p>From choosing your size to finding your way around the store, the details matter.</p>
          <dl className="contact-page__details">
            <div><dt>Customer care email</dt><dd>{content.email}</dd></div>
            <div><dt>Business address</dt><dd>{content.address}</dd></div>
            <div><dt>Before you write</dt><dd>For fit, materials, delivery, and returns, start with the information on each product page.</dd></div>
          </dl>
          <p className="contact-page__demo-note">Business details above are unfinished placeholders. This form is a local preview, not a monitored support channel.</p>
          <nav className="contact-page__quick-links" aria-label="Contact quick links">
            <Link to="/marketplace">Explore product details <span aria-hidden="true">↗</span></Link>
            <Link to="/account">Visit your account <span aria-hidden="true">↗</span></Link>
          </nav>
        </aside>
        <section className="contact-page__form-panel" aria-labelledby="contact-form-title">
          <p className="contact-page__index" aria-hidden="true">02 / YOUR NOTE</p>
          <h2 id="contact-form-title">What’s on your mind?</h2>
          {submitted ? (
            <div className="contact-page__confirmation" role="status" tabIndex={-1} ref={confirmation}>
              <span aria-hidden="true">↗</span>
              <h3>Your message preview is ready.</h3>
              <p>Thanks, {fields.name.trim()}. Your note about “{fields.subject.trim()}” passed the form checks.</p>
              <p><strong>No message has been sent.</strong> Delivery is not connected in this demo. Your entries remain on this page so you can edit them.</p>
              <button type="button" className="contact-page__button" onClick={() => {
                setSubmitted(false)
                window.requestAnimationFrame(() => inputs.current.message?.focus())
              }}>Edit message <span aria-hidden="true">↗</span></button>
            </div>
          ) : (
            <form className="contact-form" noValidate onSubmit={handleSubmit}>
              <p className="contact-page__form-note">All fields are required. Preview only — nothing is sent or saved.</p>
              <div className="contact-form__row">
                {(['name', 'email'] as const).map((field) => (
                  <div className="contact-field" key={field}>
                    <label htmlFor={`contact-${field}`}>{field === 'name' ? 'Name' : 'Email'}</label>
                    <input id={`contact-${field}`} name={field} type={field === 'email' ? 'email' : 'text'} autoComplete={field} required maxLength={field === 'email' ? 254 : 120}
                      ref={(node) => { inputs.current[field] = node }} value={fields[field]} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `contact-${field}-error` : undefined}
                      onChange={(event) => updateField(field, event.target.value)} onBlur={() => setErrors((current) => ({ ...current, [field]: validateField(field, fields[field]) }))} />
                    {errors[field] && <p className="contact-field__error" id={`contact-${field}-error`}>{errors[field]}</p>}
                  </div>
                ))}
              </div>
              <div className="contact-field">
                <label htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" name="subject" required maxLength={160} ref={(node) => { inputs.current.subject = node }} value={fields.subject} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                  onChange={(event) => updateField('subject', event.target.value)} onBlur={() => setErrors((current) => ({ ...current, subject: validateField('subject', fields.subject) }))} />
                {errors.subject && <p className="contact-field__error" id="contact-subject-error">{errors.subject}</p>}
              </div>
              <div className="contact-field">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" name="message" required rows={5} maxLength={5000} ref={(node) => { inputs.current.message = node }} value={fields.message} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  onChange={(event) => updateField('message', event.target.value)} onBlur={() => setErrors((current) => ({ ...current, message: validateField('message', fields.message) }))} />
                {errors.message && <p className="contact-field__error" id="contact-message-error">{errors.message}</p>}
              </div>
              <button type="submit" className="contact-page__button">Preview message <span aria-hidden="true">↗</span></button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default ContactPage

