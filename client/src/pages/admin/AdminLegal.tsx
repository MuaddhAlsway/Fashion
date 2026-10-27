import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import { bodyToSections, text } from '../../data/content-utils'
import type { LegalDocument } from '../../data/content-types'

function LegalEditor({ documentKey, onSaved }: { documentKey: 'privacy' | 'terms'; onSaved: () => void }) {
  const { data, commit } = useContent()
  const [draft, setDraft] = useState<LegalDocument>({ ...data.legal[documentKey] })
  const [error, setError] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sections = bodyToSections(draft.body)
    if (!text(draft.title) || !text(draft.intro) || !sections.length || sections.some(section => !text(section.heading) || !section.paragraphs.length)) { setError('Enter a title, introduction, and body sections with headings and text.'); return }
    try { await commit(current => ({ ...current, legal: { ...current.legal, [documentKey]: draft } }), `Updated legal draft: ${draft.title}`); setError(''); onSaved() }
    catch (err) { setError(err instanceof Error ? err.message : 'Document could not be saved.') }
  }
  return <form className="admin-form admin-panel" onSubmit={save}><h2>Edit document</h2><p>Keep unfinished business details visibly marked. The public draft notice stays in place. This editor does not establish legal policies or publish a reviewed document.</p>{error && <p className="admin-error" role="alert">{error}</p>}<label>Page title<input required value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} /></label><label>Introduction<textarea required rows={3} value={draft.intro} onChange={event => setDraft(current => ({ ...current, intro: event.target.value }))} /></label><label>Document body<textarea required rows={22} value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} aria-describedby="legal-editor-help" /></label><p id="legal-editor-help" className="admin-help">Start each section with ## Heading. Separate paragraphs with a blank line. Contents links are generated automatically. Text is rendered as text, not HTML.</p><button type="submit" className="admin-primary">Save legal draft</button></form>
}
function AdminLegal() {
  const [selected, setSelected] = useState<'privacy' | 'terms'>('privacy')
  const [message, setMessage] = useState('')
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">The small print</p><h1>Legal pages</h1><p>Edit the existing Privacy Policy and Terms &amp; Conditions drafts.</p></div><Link to={selected === 'privacy' ? '/privacy' : '/terms'}>View draft ↗</Link></header><label className="admin-search">Document<select value={selected} onChange={event => { setSelected(event.target.value as 'privacy' | 'terms'); setMessage('') }}><option value="privacy">Privacy Policy</option><option value="terms">Terms &amp; Conditions</option></select></label>{message && <p className="admin-success" role="status">{message}</p>}<LegalEditor key={selected} documentKey={selected} onSaved={() => setMessage('Legal draft saved for this demo session.')} /></section>
}
export default AdminLegal
