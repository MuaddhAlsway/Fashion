import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import { categoryError, slugify } from '../../data/content-utils'
import type { StoreCategory } from '../../data/content-types'
import AssetPicker from '../../components/admin/AssetPicker'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

function AdminCategories() {
  const { data, commit } = useContent()
  const [draft, setDraft] = useState<StoreCategory | null>(null)
  const [originalId, setOriginalId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<StoreCategory | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  function field<K extends keyof StoreCategory>(key: K, value: StoreCategory[K]) { setDraft(current => current ? { ...current, [key]: value } : current) }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    const problem = categoryError(draft) || (data.categories.some(item => item.id === draft.id && item.id !== originalId) ? 'That category ID already exists.' : '')
    if (problem) { setError(problem); return }
    try { await commit(current => ({ ...current, categories: originalId ? current.categories.map(item => item.id === originalId ? draft : item) : [...current.categories, draft] }), `${originalId ? 'Updated' : 'Added'} category: ${draft.name}`); setDraft(null); setMessage('Category saved. Homepage cards and marketplace category choices now use these changes.'); setError('') }
    catch (err) { setError(err instanceof Error ? err.message : 'Category could not be saved.') }
  }
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">The storefront edit</p><h1>Marketplace content</h1><p>Manage category cards and filters. Assign products to categories in the product editor.</p></div><button className="admin-primary" type="button" onClick={() => { setOriginalId(null); setDraft({ id: '', name: '', description: '', image: '', imageAlt: '', department: 'all' }); setError(''); setMessage('') }}>Add category</button></header>
    {message && <p role="status" className="admin-success">{message}</p>}{error && <p role="alert" className="admin-error">{error}</p>}
    {draft ? <form className="admin-form admin-panel" onSubmit={save}><h2>{originalId ? 'Edit category' : 'Add category'}</h2><div className="admin-form-grid"><label>Title<input required value={draft.name} onChange={event => setDraft(current => current ? { ...current, name: event.target.value, ...(!originalId ? { id: slugify(event.target.value) } : {}) } : current)} /></label><label>Category ID<input required readOnly={Boolean(originalId)} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.id} onChange={event => field('id', event.target.value)} /></label><label>Department filter<select value={draft.department} onChange={event => field('department', event.target.value as StoreCategory['department'])}><option value="all">All departments</option><option value="women">Women</option><option value="men">Men</option></select></label></div><label>Description<textarea required rows={3} value={draft.description} onChange={event => field('description', event.target.value)} /></label><AssetPicker value={draft.image} onChange={value => field('image', value)} /><label>Image description<input required value={draft.imageAlt} onChange={event => field('imageAlt', event.target.value)} /></label><div className="admin-actions"><button className="admin-primary" type="submit">Save category</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div></form> :
      data.categories.length ? <div className="admin-card-grid">{data.categories.map(category => <article className="admin-panel" key={category.id}><img loading="lazy" decoding="async" className="admin-cover" src={category.image} alt={category.imageAlt} /><h2>{category.name}</h2><p>{category.description}</p><p className="admin-muted">{data.products.filter(product => product.categoryIds.includes(category.id)).length} assigned products · {category.department}</p><div className="admin-actions"><button type="button" onClick={() => { setOriginalId(category.id); setDraft({ ...category }); setError('') }}>Edit {category.name}</button><Link to={`/marketplace?category=${encodeURIComponent(category.id)}`}>View</Link><button className="admin-text-danger" type="button" onClick={() => setRemoving(category)}>Remove {category.name}</button></div></article>)}</div> : <p className="admin-empty">No categories yet. Add a card for the homepage and marketplace.</p>}
    {removing && <ConfirmDialog title={`Remove ${removing.name}?`} onCancel={() => setRemoving(null)} onConfirm={async () => { try { await commit(current => ({ ...current, categories: current.categories.filter(item => item.id !== removing.id), products: current.products.map(product => ({ ...product, categoryIds: product.categoryIds.filter(id => id !== removing.id) })) }), `Removed category: ${removing.name}`); setRemoving(null); setMessage('Category removed. Its products remain in the catalog.') } catch (err) { setError(err instanceof Error ? err.message : 'Removal failed.'); setRemoving(null) } }}><p>The card and filter choice will be removed. Products assigned to it will remain available.</p></ConfirmDialog>}
  </section>
}
export default AdminCategories
