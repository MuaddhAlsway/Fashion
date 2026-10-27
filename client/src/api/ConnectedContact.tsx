import { useState, useRef, type FormEvent } from 'react'
import { useApi } from './ApiContext'
import { useContent } from '../context/ContentContext'
export default function ConnectedContact() {
  const api = useApi(), { data: { website } } = useContent(), content = website.contact
  const [fields, setFields] = useState({ name: '', email: '', subject: '', message: '' }), [message, setMessage] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const lock = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage('')
    try { const result = await api<{ data: { message: string } }>('/api/contact-submissions', { method: 'POST', body: JSON.stringify(fields) }, false); setMessage(result.data.message) }
    catch (err) { setError(err instanceof Error ? err.message : 'Message could not be saved.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <main className="contact-page"><header className="contact-page__header"><p className="contact-page__eyebrow">{content.eyebrow}</p><h1 className="contact-page__title">{content.title} <em>{content.titleAccent}</em></h1><p>{content.description}</p></header><div className="contact-page__layout"><aside><h2>Contact details</h2><p>{content.email}</p><p>{content.address}</p><p>Business details remain draft placeholders until confirmed by the store.</p></aside><section><h2>Leave a message</h2><form className="contact-form" onSubmit={submit} aria-busy={busy}>{(['name', 'email', 'subject', 'message'] as const).map(field => <div className="contact-field" key={field}><label htmlFor={`connected-contact-${field}`}>{field.charAt(0).toUpperCase() + field.slice(1)} (required)</label>{field === 'message' ? <textarea id={`connected-contact-${field}`} required maxLength={5000} rows={6} value={fields[field]} onChange={event => setFields(current => ({ ...current, [field]: event.target.value }))} /> : <input id={`connected-contact-${field}`} required type={field === 'email' ? 'email' : 'text'} maxLength={field === 'email' ? 254 : 160} autoComplete={field === 'email' ? 'email' : field === 'name' ? 'name' : undefined} value={fields[field]} onChange={event => setFields(current => ({ ...current, [field]: event.target.value }))} />}</div>)}<p>Your message will be saved for review. This form does not send an email.</p><button type="submit" className="contact-page__button" disabled={busy}>{busy ? 'Saving…' : 'Save message'}</button><p role="alert">{error}</p><p role="status">{message}</p></form></section></div></main>
}
