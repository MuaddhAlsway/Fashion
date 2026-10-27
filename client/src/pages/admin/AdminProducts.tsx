import { useState } from 'react'
import { Link } from 'react-router'
import { useContent } from '../../context/ContentContext'
import type { StoreProduct } from '../../data/content-types'
import ProductEditor from '../../components/admin/ProductEditor'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

function AdminProducts() {
  const { data, commit } = useContent()
  const [editing, setEditing] = useState<StoreProduct | 'new' | null>(null)
  const [removing, setRemoving] = useState<StoreProduct | null>(null)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const visible = data.products.filter(product => `${product.name} ${product.brand} ${product.id}`.toLowerCase().includes(query.toLowerCase()))
  return <section><header className="admin-page-header"><div><p className="admin-eyebrow">The wardrobe</p><h1>Products</h1><p>{data.products.length} products in the shared demo catalog.</p></div><button className="admin-primary" type="button" onClick={() => { setEditing('new'); setMessage('') }}>Add product</button></header>
    {message && <p className="admin-success" role="status">{message}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    {editing ? <ProductEditor key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSave={() => { setEditing(null); setMessage('Product saved. The marketplace and product page now use these changes.') }} /> : <>
      <label className="admin-search">Find a product<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, brand or ID" /></label>
      {visible.length ? <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Product catalog"><table><thead><tr><th scope="col">Product</th><th scope="col">Department</th><th scope="col">Price</th><th scope="col">Sizes</th><th scope="col">Actions</th></tr></thead><tbody>{visible.map(product => <tr key={product.id}><th scope="row"><div className="admin-record"><img src={product.image} alt="" /><div>{product.name}<small>{product.brand}</small></div></div></th><td>{product.department}</td><td>${product.price.toFixed(2)}</td><td>{product.sizes.join(', ')}</td><td><div className="admin-actions"><button type="button" aria-label={`Edit ${product.name}`} onClick={() => setEditing(product)}>Edit</button><Link to={`/products/${product.id}`}>View</Link><button type="button" className="admin-text-danger" aria-label={`Remove ${product.name}`} onClick={() => setRemoving(product)}>Remove</button></div></td></tr>)}</tbody></table></div> : <p className="admin-empty">{query ? 'No products match this search.' : 'No products yet. Add a product to start the catalog.'}</p>}
    </>}
    {removing && <ConfirmDialog title={`Remove ${removing.name}?`} onCancel={() => setRemoving(null)} onConfirm={async () => { try { await commit(current => ({ ...current, products: current.products.filter(item => item.id !== removing.id) }), `Removed product: ${removing.name}`); setRemoving(null); setMessage('Product removed from the demo catalog. Existing cart entries are preserved as snapshots.') } catch (err) { setError(err instanceof Error ? err.message : 'Removal failed.'); setRemoving(null) } }}><p>This removes it from the marketplace, detail page and featured products in this demo session.</p></ConfirmDialog>}
  </section>
}
export default AdminProducts
