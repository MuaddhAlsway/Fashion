;(async () => {
/* Source-level integration checks; uses only dependencies already in this project. */
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const ts = require('typescript')
const React = require('react')
const router = require('react-router')
const { renderToStaticMarkup } = require('react-dom/server')
const { webcrypto } = require('node:crypto')
const root = path.resolve(__dirname, '..')
const assets = fs.readdirSync(path.join(root, 'src/assets')).filter(name => /\.(png|jpe?g|webp|avif)$/i.test(name)).map(name => ({ name, url: path.join(root, 'src/assets', name) }))
const storage = new Map()
let rejectStorage = false
const sessionStorage = { getItem: key => { if (rejectStorage) throw Error('Storage blocked'); return storage.get(key) ?? null }, setItem: (key, value) => { if (rejectStorage) throw Error('Storage blocked'); storage.set(key, value) }, removeItem: key => storage.delete(key) }
const localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
function loader(react = React, route = '/') {
  const cache = new Map()
  function load(file) {
    file = path.resolve(root, file)
    if (cache.has(file)) return cache.get(file).exports
    if (file === path.join(root, 'src/api/config.ts')) return { apiEnabled: false, apiBaseUrl: '', clerkPublishableKey: '' }
    if (file === path.join(root, 'src/data/assets.ts')) return { assetOptions: assets, isLocalAsset: value => assets.some(asset => asset.url === value) }
    const m = { exports: {} }; cache.set(file, m)
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
    function req(name) {
      if (name === 'react') return react
      if (name === 'react-router') return { ...router, ...(react === React ? {} : { useNavigate: () => () => {} }), BrowserRouter: ({ children }) => React.createElement(router.MemoryRouter, { initialEntries: [route] }, children) }
      if (!name.startsWith('.')) return require(name)
      let target = path.resolve(path.dirname(file), name)
      if (/\.(css|png|jpe?g|webp|avif)$/.test(target)) { assert.ok(fs.existsSync(target), target); return target }
      if (!path.extname(target)) target += fs.existsSync(target + '.tsx') ? '.tsx' : '.ts'
      return load(target)
    }
    vm.runInNewContext(code, { module: m, exports: m.exports, require: req, window: {}, sessionStorage, localStorage, crypto: webcrypto, URLSearchParams, console, setTimeout, clearTimeout }, { filename: file })
    return m.exports
  }
  return load
}
let owner, cursor = 0, currentContent
const stores = new Map()
const hooks = {
  ...React,
  useState(initial) { const i = cursor++, target = owner; if (!(i in target)) target[i] = typeof initial === 'function' ? initial() : initial; return [target[i], value => { target[i] = typeof value === 'function' ? value(target[i]) : value }] },
  useRef(initial) { const i = cursor++; return owner[i] ?? (owner[i] = { current: initial }) },
  useCallback(fn) { return fn }, useMemo(fn) { return fn() }, useEffect() {}, useContext() { return currentContent }, useId() { return 'test-field' },
}
const load = loader(hooks)
const Provider = load('src/context/ContentProvider.tsx').default
const { freshContent } = load('src/data/content-seed.ts')
const { validContent, productError, postError } = load('src/data/content-utils.ts')
function render(key, Component, props = {}) { if (!stores.has(key)) stores.set(key, []); owner = stores.get(key); cursor = 0; return Component(props) }
function content() { currentContent = render('provider', Provider, { children: null }).props.value; return currentContent }
function flatten(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(flatten); return [node, ...flatten(node.props?.children)] }
function input(nodes, label) { const item = nodes.find(node => node.type === 'label' && (node.props.children === label || (Array.isArray(node.props.children) && node.props.children.filter(child => typeof child === 'string' || typeof child === 'number').join('') === label))); assert.ok(item, label); return flatten(item).find(node => ['input', 'textarea', 'select'].includes(node.type)) }
assert.equal(content().data.products.length, 12)
assert.equal(content().data.journal.length, 6)
assert.equal(content().data.categories.length, 2)
assert.equal(content().data.website.aboutStory.description.split(/\n\s*\n/).length, 3)
assert.ok(validContent(freshContent()), 'Original seed must satisfy the same validators as edits')
const ProductEditor = load('src/components/admin/ProductEditor.tsx').default
let saved = 0
function editor() { return flatten(render('product-editor', ProductEditor, { product: null, onSave: () => saved++, onCancel() {} })) }
let nodes = editor()
for (const [label, value] of [['Name', 'Studio Test Shirt'], ['Brand', 'TEST STUDIO'], ['Description', 'A test shirt with an easy silhouette.']]) { input(nodes, label).props.onChange({ target: { value } }); nodes = editor() }
input(nodes, 'Price (USD)').props.onChange({ target: { valueAsNumber: 49.5 } }); nodes = editor()
const picker = nodes.find(node => node.type?.name === 'AssetPicker'); assert.ok(picker)
picker.props.onChange(assets[0].url); nodes = editor()
input(nodes, 'Image 1 alt text').props.onChange({ target: { value: 'Studio test shirt, front view' } }); nodes = editor()
await nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} })
assert.equal(saved, 1); assert.equal(content().data.products.length, 13)
const newProduct = content().data.products.find(product => product.id === 'studio-test-shirt')
assert.equal(newProduct.price, 49.5); assert.equal(newProduct.images.length, 1)
assert.equal(content().data.activity.length, 1)
assert.throws(() => content().commit(data => ({ ...data, products: [...data.products, newProduct] }), 'Duplicate'), /invalid/)
assert.ok(productError({ ...newProduct, price: -1 }))
assert.ok(productError({ ...newProduct, images: [] }))
assert.ok(postError({ ...content().data.journal[0], date: '2026-02-31' }))
content().commit(data => ({ ...data, products: data.products.map(product => product.id === newProduct.id ? { ...product, price: 55 } : product), categories: [...data.categories, { ...data.categories[0], id: 'test-edit', name: 'Test edit' }] }), 'Edited product and added category')
content().commit(data => ({ ...data, products: data.products.map(product => product.id === newProduct.id ? { ...product, categoryIds: ['test-edit'] } : product), website: { ...data.website, hero: { ...data.website.hero, title: 'The session test edit' } }, legal: { ...data.legal, privacy: { ...data.legal.privacy, title: 'Session privacy draft' } }, journal: [...data.journal, { ...data.journal[0], slug: 'test-story', title: 'A test editorial story' }] }), 'Updated shared page content')
assert.equal(content().data.products.find(product => product.id === newProduct.id).price, 55)
stores.delete('provider'); assert.equal(content().data.website.hero.title, 'The session test edit', 'Reload reads session edits')
function publicHtml(route) {
  const source = loader(React, route)
  const App = source('src/App.tsx').default, Content = source('src/context/ContentProvider.tsx').default, Wishlist = source('src/context/WishlistProvider.tsx').default, { CartProvider } = source('src/context/CartContext.tsx'), { DemoAuthProvider } = source('src/context/DemoAuthContext.tsx')
  return renderToStaticMarkup(React.createElement(CartProvider, null, React.createElement(DemoAuthProvider, null, React.createElement(Content, null, React.createElement(Wishlist, null, React.createElement(App))))))
}
assert.ok(publicHtml('/').includes('The session test edit'))
assert.ok(publicHtml('/marketplace').includes('Studio Test Shirt'))
assert.ok(publicHtml('/marketplace?category=test-edit').includes('Studio Test Shirt'))
assert.ok(publicHtml('/products/studio-test-shirt').includes('Studio Test Shirt'))
assert.ok(publicHtml('/journal/test-story').includes('A test editorial story'))
assert.ok(publicHtml('/privacy').includes('Session privacy draft'))
for (const route of ['/about', '/contact', '/terms', '/cart', '/checkout', '/checkout/payment', '/checkout/confirmation', '/login', '/signup', '/account']) assert.ok(publicHtml(route).includes('<footer'), route)
assert.ok(publicHtml('/not-a-real-page').includes('id="not-found-title"'))
assert.ok(publicHtml('/admin/products').includes('Enter demo admin'))
storage.set('fashion-admin-demo-entry', 'yes')
for (const route of ['/admin', '/admin/products', '/admin/categories', '/admin/journal', '/admin/content', '/admin/legal', '/admin/unknown']) {
  const html = publicHtml(route); assert.ok(html.includes('admin-sidebar'), route); assert.ok(!html.includes('class="site-header"'), route); assert.ok(!html.includes('<footer'), route)
}
const Layout = load('src/pages/admin/AdminLayout.tsx').default
function layoutNodes() { return flatten(render('admin-mobile-layout', Layout)) }
let layout = layoutNodes(); const toggle = layout.find(node => node.props?.['aria-controls'] === 'admin-sidebar'); assert.ok(toggle)
toggle.props.onClick(); layout = layoutNodes(); assert.equal(layout.find(node => node.type === 'aside').props['data-open'], true)
layout[0].props.onKeyDown({ key: 'Escape' }); layout = layoutNodes(); assert.equal(layout.find(node => node.type === 'aside').props['data-open'], false)

content().commit(data => ({ ...data, products: data.products.filter(product => product.id !== newProduct.id), categories: data.categories.filter(category => category.id !== 'test-edit'), journal: data.journal.filter(post => post.slug !== 'test-story') }), 'Removed test records')
assert.equal(content().data.products.length, 12); assert.ok(!publicHtml('/marketplace').includes('Studio Test Shirt'))
// Exercise the category and journal forms rather than only mutating the store.
const Categories = load('src/pages/admin/AdminCategories.tsx').default
function categoriesPage() { return flatten(render('categories-page', Categories)) }
nodes = categoriesPage(); nodes.find(node => node.type === 'button' && node.props.children === 'Add category').props.onClick(); nodes = categoriesPage()
for (const [label, value] of [['Title', 'Studio category'], ['Description', 'A category created from the editor.'], ['Image description', 'Studio category campaign']]) { input(nodes, label).props.onChange({ target: { value } }); nodes = categoriesPage() }
nodes.find(node => node.type?.name === 'AssetPicker').props.onChange(assets[0].url); nodes = categoriesPage()
await nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); content()
assert.ok(content().data.categories.some(category => category.id === 'studio-category'))
nodes = categoriesPage(); nodes.find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.join('') === 'Remove Studio category').props.onClick(); nodes = categoriesPage()
let confirmation = nodes.find(node => node.type?.name === 'ConfirmDialog'); assert.ok(confirmation)
confirmation.props.onCancel(); content(); assert.ok(content().data.categories.some(category => category.id === 'studio-category'))
nodes = categoriesPage(); nodes.find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.join('') === 'Remove Studio category').props.onClick(); nodes = categoriesPage(); nodes.find(node => node.type?.name === 'ConfirmDialog').props.onConfirm(); content()
assert.ok(!content().data.categories.some(category => category.id === 'studio-category'))
const Journal = load('src/pages/admin/AdminJournal.tsx').default
function journalPage() { return flatten(render('journal-page', Journal)) }
nodes = journalPage(); nodes.find(node => node.type === 'button' && node.props.children === 'Add story').props.onClick(); nodes = journalPage()
for (const [label, value] of [['Title', 'A new studio story'], ['Category', 'Studio notes'], ['Excerpt', 'An editorial test from the form.'], ['Story body', '## An opening note\n\nA paragraph written in the editor.'], ['Cover alt text', 'A studio campaign']]) { input(nodes, label).props.onChange({ target: { value } }); nodes = journalPage() }
nodes.find(node => node.type?.name === 'AssetPicker').props.onChange(assets[1].url); nodes = journalPage()
await nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); content()
assert.ok(content().data.journal.some(post => post.slug === 'a-new-studio-story'))
assert.ok(publicHtml('/journal/a-new-studio-story').includes('A paragraph written in the editor.'))
const Website = load('src/pages/admin/AdminWebsite.tsx').default
let websiteNodes = flatten(render('website-page', Website)); const websiteForm = websiteNodes.find(node => node.type?.name === 'WebsiteEditor')
function websiteEditor() { return flatten(render('website-editor', websiteForm.type, websiteForm.props)) }
nodes = websiteEditor(); input(nodes, 'Main title').props.onChange({ target: { value: 'A website form update' } }); nodes = websiteEditor(); await nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); content()
assert.ok(publicHtml('/').includes('A website form update'))
const Legal = load('src/pages/admin/AdminLegal.tsx').default
const legalNodes = flatten(render('legal-page', Legal)); const legalForm = legalNodes.find(node => node.type?.name === 'LegalEditor')
function legalEditor() { return flatten(render('legal-editor', legalForm.type, legalForm.props)) }
nodes = legalEditor(); input(nodes, 'Page title').props.onChange({ target: { value: 'Legal editor preview' } }); nodes = legalEditor(); await nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); content()
assert.ok(publicHtml('/privacy').includes('Legal editor preview'))

content().commit(data => ({ ...data, products: [], categories: [], journal: [] }), 'Empty demo')
assert.ok(publicHtml('/journal').includes('No stories have been published'))
assert.ok(publicHtml('/marketplace').includes('No products match'))
content().reset(); assert.equal(content().data.products.length, 12)
rejectStorage = true
content().commit(data => ({ ...data, website: { ...data.website, hero: { ...data.website.hero, title: 'Memory-only edit' } } }), 'Memory edit')
assert.equal(content().data.website.hero.title, 'Memory-only edit'); assert.ok(content().storageError.includes('memory'))
rejectStorage = false
storage.set('fashion-admin-content-v1', '{invalid json')
stores.delete('provider'); assert.equal(content().data.products.length, 12); assert.ok(content().storageError)
for (const file of fs.readdirSync(path.join(root, 'src/styles')).filter(name => name.endsWith('.css'))) require('postcss').parse(fs.readFileSync(path.join(root, 'src/styles', file), 'utf8'))
console.log('Admin integration checks passed: existing seed, product form and validation, CRUD, session reload, storefront edits, article/legal rendering, admin gate/layout, public 404, empty states, storage failures and CSS syntax.')



})().catch(error => { console.error(error); process.exitCode = 1 })
