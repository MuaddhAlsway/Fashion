import { apiEnabled } from '../../api/config'
import { useState, type FormEvent } from 'react'
import { useContent } from '../../context/ContentContext'
import type { StoreProduct } from '../../data/content-types'
import { productError, slugify } from '../../data/content-utils'
import AssetPicker from './AssetPicker'
import { assetOptions } from '../../data/assets'

function ProductEditor({ product, onCancel, onSave }: { product: StoreProduct | null; onCancel: () => void; onSave: () => void }) {
  const { data, commit } = useContent()
  const [draft, setDraft] = useState<StoreProduct>(() => product ? JSON.parse(JSON.stringify(product)) : { id: '', name: '', brand: '', price: 0, department: 'Women', sizes: ['S', 'M', 'L'], image: '', imageAlt: '', images: [{ src: '', alt: '', view: 'Front' }], description: '', material: 'See product details.', fit: 'Choose your usual size.', care: 'Follow the garment care label.', categoryIds: [], featured: false, featuredImage: '', featuredAlt: '', label: '' })
  const [sizesText, setSizesText] = useState(draft.sizes.join(', '))
  const [error, setError] = useState('')
  function field<K extends keyof StoreProduct>(key: K, value: StoreProduct[K]) { setDraft(current => ({ ...current, [key]: value })) }
  function imageField(index: number, key: 'src' | 'alt' | 'view', value: string) {
    setDraft(current => {
      const images = current.images.map((image, i) => i === index ? { ...image, [key]: value } : image)
      return { ...current, images, image: images[0].src, imageAlt: images[0].alt, ...(index === 0 ? { featuredImage: images[0].src, featuredAlt: images[0].alt } : {}) }
    })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = { ...draft, sizes: sizesText.split(',').map(size => size.trim()).filter(Boolean) }
    const problem = productError(next) || (data.products.some(item => item.id === next.id && item.id !== product?.id) ? 'That product ID is already in use.' : '') || (new Set(next.images.map(image => image.src)).size !== next.images.length ? 'Choose a different image for each gallery view.' : '')
    if (problem) { setError(problem); return }
    try { await commit(current => ({ ...current, products: product ? current.products.map(item => item.id === product.id ? next : item) : [...current.products, next] }), `${product ? 'Updated' : 'Added'} product: ${next.name}`); onSave() }
    catch (err) { setError(err instanceof Error ? err.message : 'Product could not be saved.') }
  }
  return <form className="admin-form admin-panel" onSubmit={submit}><h2>{product ? 'Edit product' : 'Add product'}</h2><p>{apiEnabled ? 'Catalog edits are saved to the database. Choose existing approved assets.' : 'All catalog fields are stored in this tab only. Choose images already in src/assets.'}</p>{error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-form-grid"><label>Name<input required value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value, ...(!product ? { id: slugify(event.target.value) } : {}) }))} /></label><label>Product ID<input required readOnly={Boolean(product)} value={draft.id} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={event => field('id', event.target.value)} /></label><label>Price (USD)<input required type="number" min="0.01" step="0.01" value={draft.price} onChange={event => field('price', event.target.valueAsNumber)} /></label><label>Brand<input required value={draft.brand} onChange={event => field('brand', event.target.value)} /></label><label>Department<select value={draft.department} onChange={event => field('department', event.target.value as 'Women' | 'Men')}><option>Women</option><option>Men</option></select></label><label>Sizes (comma-separated)<input required value={sizesText} onChange={event => setSizesText(event.target.value)} /></label></div>
    <label>Description<textarea required rows={3} value={draft.description} onChange={event => field('description', event.target.value)} /></label>
    <div className="admin-form-grid">{(['material', 'fit', 'care'] as const).map(key => <label key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}<textarea required rows={2} value={draft[key]} onChange={event => field(key, event.target.value)} /></label>)}</div>
    <fieldset><legend>Marketplace categories</legend>{data.categories.length ? data.categories.map(category => <label className="admin-check" key={category.id}><input type="checkbox" checked={draft.categoryIds.includes(category.id)} onChange={event => field('categoryIds', event.target.checked ? [...draft.categoryIds, category.id] : draft.categoryIds.filter(id => id !== category.id))} />{category.name}</label>) : <p>No categories yet. Add one under Marketplace content.</p>}</fieldset>
    <fieldset><legend>Product images / first image is the catalog cover</legend>{draft.images.map((image, index) => <div className="admin-image-row" key={index}><AssetPicker label={`Image ${index + 1}`} value={image.src} onChange={value => imageField(index, 'src', value)} /><div><label>Image {index + 1} alt text<input required value={image.alt} onChange={event => imageField(index, 'alt', event.target.value)} /></label><label>View label<input required value={image.view} onChange={event => imageField(index, 'view', event.target.value)} /></label><button type="button" disabled={draft.images.length === 1} onClick={() => { const images = draft.images.filter((_, i) => i !== index); setDraft(current => ({ ...current, images, image: images[0].src, imageAlt: images[0].alt })) }}>Remove image {index + 1}</button></div></div>)}<button type="button" onClick={() => field('images', [...draft.images, { src: assetOptions.find(asset => !draft.images.some(image => image.src === asset.url))?.url ?? '', alt: '', view: 'Additional view' }])}>Add gallery image</button></fieldset>
    <label className="admin-check"><input type="checkbox" checked={draft.featured} onChange={event => field('featured', event.target.checked)} />Show in homepage featured products</label><label>Featured badge (optional)<input value={draft.label} onChange={event => field('label', event.target.value)} /></label>
    <div className="admin-actions"><button type="submit" className="admin-primary">Save product</button><button type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}
export default ProductEditor
