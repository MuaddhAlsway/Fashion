/* Interaction checks for the real source components, using test browser APIs. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict'), ts = require('typescript'), React = require('react')
const root = path.resolve(__dirname, '..'), cache = new Map(), stores = new Map(), listeners = new Map(), savedStorage = new Map()
let owner, cursor = 0, effects = [], contentContext, wishlistContext, wishlistValue, contentValue, blocked = false, writes = 0, focused = '', dialogNode, navigation = ''
let location = { pathname: '/', search: '' }, searchParams = new URLSearchParams(), productId = 'relaxed-cotton-shirt'
class MockNode {}
const body = { style: { overflow: 'auto' } }
const localStorage = { getItem: key => { if (blocked) throw Error('blocked'); return savedStorage.get(key) ?? null }, setItem: (key, value) => { if (blocked) throw Error('blocked'); writes++; savedStorage.set(key, value) } }
const change = (old, deps) => !old || deps.some((dep, index) => dep !== old.deps[index])
const hooks = {
  ...React,
  useState(initial) { const i = cursor++, target = owner; if (!(i in target)) target[i] = typeof initial === 'function' ? initial() : initial; return [target[i], value => { target[i] = typeof value === 'function' ? value(target[i]) : value }] },
  useRef(initial) { const i = cursor++; return owner[i] ?? (owner[i] = { current: initial }) },
  useMemo(fn) { return fn() },
  useEffect(fn, deps) { const i = cursor++, target = owner, old = target[i]; if (change(old, deps)) effects.push(() => { old?.cleanup?.(); target[i] = { deps, cleanup: fn() } }) },
  useId() { const i = cursor++; return owner[i] ?? (owner[i] = `test-id-${stores.size}-${i}`) },
  useContext(context) { if (context === contentContext) return contentValue; if (context === wishlistContext) return wishlistValue; return { itemCount: 0, addItem() {} } },
}
const assets = fs.readdirSync(path.join(root, 'src/assets')).map(name => ({ name, url: path.join(root, 'src/assets', name) }))
function load(file) {
  file = path.resolve(root, file)
  if (cache.has(file)) return cache.get(file).exports
    if (file === path.join(root, 'src/api/config.ts')) return { apiEnabled: false, apiBaseUrl: '', clerkPublishableKey: '' }
  if (file.endsWith(path.join('src', 'data', 'assets.ts'))) return { assetOptions: assets, isLocalAsset: value => assets.some(asset => asset.url === value) }
  const m = { exports: {} }; cache.set(file, m)
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  function req(name) {
    if (name === 'react') return hooks
    if (name === 'react-dom') return { createPortal: child => child }
    if (name === 'react-router') return { Link: 'a', useLocation: () => location, useNavigate: () => url => { navigation = url }, useParams: () => ({ productId }), useSearchParams: () => [searchParams, update => { searchParams = typeof update === 'function' ? update(searchParams) : new URLSearchParams(update) }] }
    if (!name.startsWith('.')) return require(name)
    let target = path.resolve(path.dirname(file), name)
    if (/\.(css|png|jpe?g|webp|avif)$/.test(target)) { assert.ok(fs.existsSync(target)); return target }
    if (!path.extname(target)) target += fs.existsSync(target + '.tsx') ? '.tsx' : '.ts'
    return load(target)
  }
  vm.runInNewContext(code, { module: m, exports: m.exports, require: req, Node: MockNode, localStorage, URLSearchParams,
    document: { body, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name), requestAnimationFrame: fn => fn(), matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) }, console,
  }, { filename: file })
  return m.exports
}
function flat(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(flat); return [node, ...flat(node.props?.children)] }
function render(key, Component, props = {}) {
  if (!stores.has(key)) stores.set(key, [])
  owner = stores.get(key); cursor = 0; effects = []
  const result = Component(props), nodes = flat(result)
  for (const node of nodes) if (node.props?.ref) {
    const ref = node.props.ref
    if (node.type === 'dialog') {
      dialogNode = node
      if (!ref.current) ref.current = { open: false, showModal() { this.open = true }, close() { this.open = false; dialogNode.props.onClose() }, getBoundingClientRect: () => ({ left: 10, right: 700, top: 10, bottom: 800 }) }
    } else if (typeof ref === 'object') ref.current = { focus: () => { focused = node.props.id ?? node.props['aria-label'] ?? node.type }, contains: () => false }
  }
  effects.forEach(fn => fn())
  return result
}
contentContext = load('src/context/ContentContext.ts').ContentContext
wishlistContext = load('src/context/WishlistContext.ts').WishlistContext
contentValue = { data: load('src/data/content-seed.ts').freshContent() }
const Provider = load('src/context/WishlistProvider.tsx').default
function wishlist() { wishlistValue = render('wishlist-provider', Provider, { children: null }).props.value; return wishlistValue }
const Navbar = load('src/components/layout/Navbar.tsx').default, Favorite = load('src/components/product/FavoriteButton.tsx').default, WishlistPage = load('src/pages/WishlistPage.tsx').default
function nav() { return flat(render('navbar', Navbar)) }
assert.equal(wishlist().itemCount, 0); assert.equal(writes, 0)
assert.ok(!nav().some(node => node.props?.to === '/wishlist'))
let button = render('favorite', Favorite, { productId }); assert.equal(button.props['aria-pressed'], false); button.props.onClick(); wishlist()
assert.equal(wishlist().itemCount, 1); assert.ok(nav().some(node => node.props?.to === '/wishlist' && node.props['aria-label'] === 'Wishlist, 1 saved product'))
button = render('favorite', Favorite, { productId }); assert.equal(button.props['aria-pressed'], true)
assert.deepEqual(JSON.parse(savedStorage.get('fashion-wishlist')), [productId])
stores.delete('wishlist-provider'); assert.equal(wishlist().itemCount, 1)
let page = flat(render('wishlist-page', WishlistPage)); assert.equal(page.filter(node => node.type === 'article').length, 1)
page.find(node => node.props?.className === 'wishlist-card__remove').props.onClick(); wishlist(); assert.equal(wishlist().itemCount, 0)
assert.ok(!nav().some(node => node.props?.to === '/wishlist')); assert.ok(flat(render('wishlist-page', WishlistPage)).some(node => node.props?.className === 'wishlist-empty'))
wishlist().toggle(productId); wishlist().toggle(productId); assert.equal(wishlist().itemCount, 0, 'Rapid toggles must not duplicate IDs')
const secondId = contentValue.data.products[1].id
savedStorage.set('fashion-wishlist', JSON.stringify([productId, secondId])); listeners.get('storage')({ key: 'fashion-wishlist', newValue: JSON.stringify([productId, secondId]), storageArea: localStorage }); wishlist(); assert.equal(wishlist().itemCount, 2)
listeners.get('storage')({ key: 'fashion-wishlist', newValue: '[]', storageArea: localStorage }); wishlist(); assert.equal(wishlist().itemCount, 0); assert.ok(!nav().some(node => node.props?.to === '/wishlist'))
blocked = true; wishlist().toggle(productId); wishlist(); assert.equal(wishlist().itemCount, 1); assert.ok(wishlist().storageError); blocked = false
wishlist().remove(productId); wishlist()
const { matchesProduct } = load('src/data/product-search.ts'), products = contentValue.data.products
assert.equal(products.filter(product => matchesProduct(product, 'shirt')).length, 2)
assert.equal(products.filter(product => matchesProduct(product, 'FORM & LINE')).length, 6)
assert.equal(products.filter(product => matchesProduct(product, 'men')).length, 6)
assert.equal(products.filter(product => matchesProduct(product, 'women shirt')).length, 1)
assert.equal(products.filter(product => matchesProduct(product, 'not-a-real-product')).length, 0)
const Search = load('src/components/search/SearchDialog.tsx').default
function search() { return flat(render('search', Search)) }
let nodes = search(); nodes.find(node => node.props?.['aria-label'] === 'Search products').props.onClick(); nodes = search()
assert.equal(dialogNode.props.ref.current.open, true); assert.equal(body.style.overflow, 'hidden')
let queryInput = nodes.find(node => node.type === 'input' && node.props.type === 'search')
assert.equal(focused, queryInput.props.id)
queryInput.props.onChange({ target: { value: 'shirt' } }); nodes = search(); assert.equal(nodes.filter(node => node.type === 'a').length, 2)
assert.ok(nodes.some(node => node.props?.to === '/products/relaxed-cotton-shirt'))
nodes.find(node => node.type === 'input').props.onChange({ target: { value: 'no-such-piece' } }); nodes = search(); assert.ok(nodes.some(node => node.props?.className === 'product-search__empty'))
nodes.find(node => node.type === 'button' && node.props.children === 'Clear search').props.onClick(); nodes = search(); assert.equal(nodes.filter(node => node.type === 'a').length, 6)
location = { pathname: '/marketplace', search: '?department=women&category=women' }
nodes.find(node => node.type === 'input').props.onChange({ target: { value: 'shirt' } }); nodes = search()
nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); nodes = search()
const next = new URL(navigation, 'http://example.test'); assert.equal(next.pathname, '/marketplace'); assert.equal(next.searchParams.get('q'), 'shirt'); assert.equal(next.searchParams.get('department'), 'women'); assert.equal(body.style.overflow, 'auto')
assert.equal(dialogNode.props.ref.current.open, false)
nodes.find(node => node.props?.['aria-label'] === 'Search products').props.onClick(); nodes = search(); const dialog = dialogNode.props.ref.current
// Native Escape uses the same close event as the close control.
dialog.close(); search(); assert.equal(dialog.open, false); assert.equal(focused, 'Search products')
const Marketplace = load('src/pages/MarketplacePage.tsx').default
function market() { return flat(render('marketplace', Marketplace)) }
searchParams = new URLSearchParams('q=shirt'); nodes = market(); assert.equal(nodes.filter(node => node.type === 'article').length, 2)
searchParams = new URLSearchParams('q=shirt&department=men'); nodes = market(); assert.equal(nodes.filter(node => node.type === 'article').length, 1)
const brand = nodes.find(node => node.type === 'select' && flat(node).some(child => child.props?.value === 'form-line'))
assert.ok(brand); brand.props.onChange({ target: { value: 'form-line' } }); nodes = market(); assert.equal(nodes.filter(node => node.type === 'article').length, 0)
nodes.find(node => node.type === 'button' && node.props.children === 'Clear search').props.onClick(); nodes = market(); assert.equal(searchParams.get('department'), 'men'); assert.equal(searchParams.has('q'), false); assert.equal(nodes.filter(node => node.type === 'article').length, 3)
for (const file of ['wishlist.css', 'search.css', 'Navbar.css']) require('postcss').parse(fs.readFileSync(path.join(root, 'src/styles', file), 'utf8'))
console.log('Shopping checks passed: favorite toggle/count visibility, remove-last/empty state, reload and cross-tab persistence, storage failure, local search, dialog focus/close, query navigation and combined marketplace filters.')

// Loading, failure and retry must never render stale demo cards as API results.
contentValue.catalogStatus = 'loading'; nodes = market(); assert.equal(nodes.filter(n => n.type === 'article').length, 0)
assert.ok(nodes.some(n => n.props?.role === 'status'))
let retries = 0
contentValue.catalogStatus = 'error'; contentValue.retryCatalog = () => retries++
nodes = market(); assert.ok(nodes.some(n => n.props?.role === 'alert'))
nodes.find(n => n.type === 'button' && n.props.children === 'Retry').props.onClick(); assert.equal(retries, 1)
contentValue.catalogStatus = 'ready'
if (process.env.VERIFY_CATALOG_API) {
  ;(async () => {
    const response = await fetch(process.env.VERIFY_CATALOG_API + '/api/products?limit=100')
    assert.equal(response.status, 200)
    const result = await response.json()
    const { hydrate } = load('src/api/client.ts')
    contentValue.data.products = hydrate(result.data)
    assert.equal(contentValue.data.products.length, 12)
    assert.ok(contentValue.data.products.every(p => assets.some(a => a.url === p.image)))
    stores.delete('marketplace'); searchParams = new URLSearchParams()
    nodes = market(); assert.equal(nodes.filter(n => n.type === 'article').length, 12)
    for (const department of ['women', 'men']) {
      searchParams = new URLSearchParams({ department }); nodes = market()
      assert.equal(nodes.filter(n => n.type === 'article').length, contentValue.data.products.filter(p => p.department.toLowerCase() === department).length)
    }
    searchParams = new URLSearchParams('q=shirt'); nodes = market()
    assert.equal(nodes.filter(n => n.type === 'article').length, 2)
    console.log('Live API component check passed: 12 API products rendered with local images, department filtering and search.')
  })().catch(error => { console.error(error.message); process.exitCode = 1 })
}
