import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import type { WebsiteBlock } from '../../data/content-types'
import { text } from '../../data/content-utils'
import AssetPicker from '../../components/admin/AssetPicker'

const labels: Record<string, string> = { hero: 'Homepage / Hero', homeCategories: 'Homepage / Category heading', homeFeatured: 'Homepage / Featured heading', brandStory: 'Homepage / Campaign banner', aboutHero: 'About / Hero and first carousel image', aboutStory: 'About / Brand purpose', aboutCta: 'About / Closing invitation', contact: 'Contact / Introduction and business details' }
const fieldLabels: Record<string, string> = { eyebrow: 'Collection label', title: 'Main title', titleAccent: 'Accent title', description: 'Description / paragraphs', imageAlt: 'Image alt text', ctaText: 'Primary link label', secondaryCta: 'Secondary link label', priceLabel: 'Price card label', priceText: 'Price card display text', email: 'Contact email or marked placeholder', address: 'Business address or marked placeholder' }
function WebsiteEditor({ blockKey, onSaved }: { blockKey: string; onSaved: () => void }) {
  const { data, commit } = useContent()
  const [draft, setDraft] = useState<WebsiteBlock>({ ...data.website[blockKey] })
  const [error, setError] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text(draft.title) || !text(draft.description) || (draft.image && !text(draft.imageAlt))) { setError('Enter a title, description, and alt text for any image.'); return }
    try { await commit(current => ({ ...current, website: { ...current.website, [blockKey]: draft } }), `Updated website block: ${labels[blockKey]}`); setError(''); onSaved() }
    catch (err) { setError(err instanceof Error ? err.message : 'Content could not be saved.') }
  }
  return <form className="admin-form admin-panel" onSubmit={save}><h2>{labels[blockKey]}</h2>{error && <p role="alert" className="admin-error">{error}</p>}
    {Object.entries(draft).filter(([key]) => key !== 'image').map(([key, value]) => <label key={key}>{fieldLabels[key] ?? key}{key === 'description' || key === 'address' ? <textarea required={key === 'description'} rows={key === 'description' ? 5 : 2} value={value} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} /> : <input required={['title', 'imageAlt', 'ctaText', 'secondaryCta'].includes(key)} value={value} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} />}</label>)}
    {'image' in draft && <AssetPicker value={draft.image ?? ''} onChange={image => setDraft(current => ({ ...current, image }))} />}
    <p className="admin-help">Website images use existing local assets. Link destinations and layouts remain controlled by the app. The About carousel’s other two images, its motion, and detailed informational sections remain unchanged.</p><button className="admin-primary" type="submit">Save website content</button>
  </form>
}
function AdminWebsite() {
  const { data } = useContent()
  const [selected, setSelected] = useState('hero')
  const [message, setMessage] = useState('')
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">Words & imagery</p><h1>Website content</h1><p>These blocks are read directly by the existing storefront components.</p></div><Link to={selected.startsWith('about') ? '/about' : selected === 'contact' ? '/contact' : '/'}>View page ↗</Link></header><label className="admin-search">Content block<select value={selected} onChange={event => { setSelected(event.target.value); setMessage('') }}>{Object.keys(data.website).map(key => <option key={key} value={key}>{labels[key] ?? key}</option>)}</select></label>{message && <p className="admin-success" role="status">{message}</p>}<WebsiteEditor key={selected} blockKey={selected} onSaved={() => setMessage('Website content saved. Open the public page in this tab to preview it.')} /></section>
}
export default AdminWebsite
