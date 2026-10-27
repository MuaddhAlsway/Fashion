import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import { bodyToSections, postError, sectionsToBody, slugify } from '../../data/content-utils'
import type { StorePost } from '../../data/content-types'
import AssetPicker from '../../components/admin/AssetPicker'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

function AdminJournal() {
  const { data, commit } = useContent()
  const [draft, setDraft] = useState<StorePost | null>(null)
  const [originalSlug, setOriginalSlug] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [removing, setRemoving] = useState<StorePost | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  function field<K extends keyof StorePost>(key: K, value: StorePost[K]) { setDraft(current => current ? { ...current, [key]: value } : current) }
  function edit(post: StorePost | null) {
    setOriginalSlug(post?.slug ?? null); setError(''); setMessage('')
    setDraft(post ? { ...post } : { slug: '', title: '', category: 'Style notes', excerpt: '', date: new Date().toISOString().slice(0, 10), dateLabel: '', image: '', imageAlt: '', imagePosition: 'center', sections: [] })
    setBody(post ? sectionsToBody(post.sections) : '## A new perspective\n\n')
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return
    const date = new Date(`${draft.date}T12:00:00`)
    const next = { ...draft, sections: bodyToSections(body), dateLabel: Number.isNaN(date.valueOf()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }
    const problem = postError(next) || (data.journal.some(post => post.slug === next.slug && post.slug !== originalSlug) ? 'That story slug already exists.' : '')
    if (problem) { setError(problem); return }
    try { await commit(current => ({ ...current, journal: (originalSlug ? current.journal.map(post => post.slug === originalSlug ? next : post) : [...current.journal, next]).sort((a, b) => b.date.localeCompare(a.date)) }), `${originalSlug ? 'Updated' : 'Added'} journal story: ${next.title}`); setDraft(null); setMessage('Story saved to the frontend journal. The newest dated story is the lead story.'); setError('') }
    catch (err) { setError(err instanceof Error ? err.message : 'Story could not be saved.') }
  }
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">The editorial desk</p><h1>Journal</h1><p>{data.journal.length} stories. Dates are display metadata; saves appear immediately in this demo.</p></div><button className="admin-primary" type="button" onClick={() => edit(null)}>Add story</button></header>{message && <p className="admin-success" role="status">{message}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    {draft ? <form className="admin-form admin-panel" onSubmit={save}><h2>{originalSlug ? 'Edit story' : 'Add story'}</h2><div className="admin-form-grid"><label>Title<input required value={draft.title} onChange={event => setDraft(current => current ? { ...current, title: event.target.value, ...(!originalSlug ? { slug: slugify(event.target.value) } : {}) } : current)} /></label><label>URL slug<input required readOnly={Boolean(originalSlug)} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={event => field('slug', event.target.value)} /></label><label>Category<input required list="admin-journal-categories" value={draft.category} onChange={event => field('category', event.target.value)} /><datalist id="admin-journal-categories">{[...new Set(data.journal.map(post => post.category))].map(category => <option key={category} value={category} />)}</datalist></label><label>Date<input required type="date" value={draft.date} onChange={event => field('date', event.target.value)} /></label></div>
      <label>Excerpt<textarea required rows={3} value={draft.excerpt} onChange={event => field('excerpt', event.target.value)} /></label><label>Story body<textarea required rows={14} value={body} onChange={event => setBody(event.target.value)} aria-describedby="journal-body-help" /></label><p className="admin-help" id="journal-body-help">Start each section with ## Heading on its own line. Separate paragraphs with a blank line. Text is rendered safely; HTML is not executed.</p><AssetPicker label="Cover image" value={draft.image} onChange={value => field('image', value)} /><label>Cover alt text<input required value={draft.imageAlt} onChange={event => field('imageAlt', event.target.value)} /></label><label>Crop focus<select value={draft.imagePosition} onChange={event => field('imagePosition', event.target.value)}><option value="center">Center</option><option value="left center">Left</option><option value="right center">Right</option><option value="75% center">Model on right</option>{!['center','left center','right center','75% center'].includes(draft.imagePosition) && <option value={draft.imagePosition}>{draft.imagePosition} (current)</option>}</select></label><div className="admin-actions"><button type="submit" className="admin-primary">Save story</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div></form> :
      data.journal.length ? <div className="admin-card-grid">{data.journal.map(post => <article className="admin-panel" key={post.slug}><img loading="lazy" decoding="async" className="admin-cover" src={post.image} alt={post.imageAlt} /><p className="admin-eyebrow">{post.category} / {post.dateLabel}</p><h2>{post.title}</h2><p>{post.excerpt}</p><div className="admin-actions"><button type="button" onClick={() => edit(post)}>Edit story</button><Link to={`/journal/${post.slug}`}>Read story</Link><button type="button" className="admin-text-danger" onClick={() => setRemoving(post)}>Remove story</button></div></article>)}</div> : <p className="admin-empty">No stories yet. Add a story to populate the journal.</p>}
    {removing && <ConfirmDialog title="Remove this journal story?" onCancel={() => setRemoving(null)} onConfirm={async () => { try { await commit(current => ({ ...current, journal: current.journal.filter(post => post.slug !== removing.slug) }), `Removed journal story: ${removing.title}`); setRemoving(null); setMessage('Story removed from the demo journal.') } catch (err) { setError(err instanceof Error ? err.message : 'Removal failed.'); setRemoving(null) } }}><p>“{removing.title}” will no longer appear on the journal or its article page in this session.</p></ConfirmDialog>}
  </section>
}
export default AdminJournal
