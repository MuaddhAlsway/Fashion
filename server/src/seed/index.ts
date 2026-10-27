import { normalizeSearch } from '../lib/search.js'
import { readFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import mongoose from 'mongoose'
import { Category, Product, Post, SiteBlock, LegalPage, Migration, ensureIndexes } from '../models/index.js'
import { productInput, categoryInput, postInput, websiteInput, legalInput } from '../lib/validation.js'
import { assertAssets } from '../lib/assets.js'
// ...
const root = process.env.CLIENT_DATA_DIR || resolve(process.cwd(), '..', 'client', 'src', 'data')
function loadSource(name: string): Record<string, unknown> {
  if (!['products', 'journal', 'legal-documents', 'content-seed'].includes(name)) throw new Error('Unsupported seed module')
  const source = readFileSync(resolve(root, `${name}.ts`), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: Record<string, unknown> = {}
  vm.runInNewContext(compiled, { exports, require(specifier: string) {
    if (specifier.startsWith('../assets/')) return { __esModule: true, default: basename(specifier) }
    return loadSource(specifier.replace('./', ''))
  } }, { timeout: 2000 })
  return exports
}
export function readSeed() {
  const raw = JSON.parse(JSON.stringify(loadSource('content-seed').seedContent))
  const products = productInput.array().parse(raw.products)
  const categories = categoryInput.array().parse(raw.categories)
  const journal = postInput.array().parse(raw.journal)
  const website = Object.fromEntries(Object.entries(raw.website).map(([key, value]) => [key, websiteInput.parse(value)]))
  const legal = Object.fromEntries(Object.entries(raw.legal).map(([key, value]) => [key, legalInput.parse(value)]))
  if (products.length !== 12 || new Set(products.map(p => p.id)).size !== 12) throw new Error('Expected original 12-product seed')
  for (const p of products) { assertAssets([p.image, p.featuredImage, ...p.images.map(i => i.src)]); if (p.categoryIds.some(id => !categories.some(c => c.id === id))) throw new Error('Invalid category reference') }
  return { products, categories, journal, website, legal }
}
export async function seedDatabase() {
  const data = readSeed()
  await ensureIndexes()
  let inserted = false
  await mongoose.connection.transaction(async session => {
    if (await Migration.exists({ key: 'frontend-original-v1' }).session(session)) return
    for (const category of data.categories) await Category.updateOne({ id: category.id }, { $setOnInsert: category }, { upsert: true, session })
    for (const [catalogOrder, p] of data.products.entries()) { const { price, ...rest } = p; await Product.updateOne({ id: p.id }, { $setOnInsert: { ...rest, priceMinor: Math.round(price * 100), searchText: normalizeSearch([p.name, p.brand, p.department].join(' ')), catalogOrder } }, { upsert: true, session }) }
    for (const post of data.journal) { const { dateLabel: _label, ...rest } = post; await Post.updateOne({ slug: post.slug }, { $setOnInsert: rest }, { upsert: true, session }) }
    for (const [key, block] of Object.entries(data.website)) await SiteBlock.updateOne({ key }, { $setOnInsert: { key, data: block } }, { upsert: true, session })
    for (const [key, document] of Object.entries(data.legal)) await LegalPage.updateOne({ key }, { $setOnInsert: { key, ...document } }, { upsert: true, session })
    await Migration.create([{ key: 'frontend-original-v1' }], { session }); inserted = true
  })
  return { seeded: inserted, productsInSource: data.products.length }
}
