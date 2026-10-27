import { normalizeSearch } from '../lib/search.js'
import { Router } from 'express'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const rateLimit = require('express-rate-limit') as any
import { Product, Category, Post, SiteBlock, LegalPage, Subscriber, Contact } from '../models/index.js'
import { pagination, newsletterInput, contactInput, parse } from '../lib/validation.js'
import { dto, productDto, postDto, pathValue, pageResult, escapeRegex } from '../lib/api.js'
import { HttpError } from '../lib/http-error.js'
import { approvedAssets, assetsDirectory } from '../lib/assets.js'
export function publicRoutes() {
  const router = Router()
  router.get('/assets/:name', (req, res) => { const name = pathValue(req, 'name'); if (!approvedAssets().includes(name)) throw new HttpError(404, 'NOT_FOUND', 'Image not found'); res.sendFile(name, { root: assetsDirectory }) })
  router.get('/products', async (req, res) => {
    const q = parse(pagination, req.query)
    const filter: Record<string, unknown> = { deletedAt: null }
    if (q.department !== 'all') filter.department = q.department === 'women' ? 'Women' : 'Men'
    if (q.category !== 'all') filter.categoryIds = q.category
    if (q.brand !== 'all') { const brands = await Product.distinct('brand', { deletedAt: null }); filter.brand = brands.find(brand => brand.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === q.brand || brand === q.brand) ?? '__no_match__' }
    const tokens = normalizeSearch(q.q).split(/\s+/).filter(Boolean)
    if (tokens.length) filter.$and = tokens.map(token => token === 'men' || token === 'women' ? { department: token === 'men' ? 'Men' : 'Women' } : { searchText: { $regex: escapeRegex(token) } })
    const sort: Record<string, 1 | -1> = q.sort === 'price-low' ? { priceMinor: 1 as const, id: 1 as const } : q.sort === 'price-high' ? { priceMinor: -1 as const, id: 1 as const } : { catalogOrder: 1 as const, id: 1 as const }
    const [items, total] = await Promise.all([Product.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit).lean(), Product.countDocuments(filter)])
    pageResult(res, items.map(productDto), total, q.page, q.limit)
  })
  router.get('/products/:id', async (req, res) => { const item = await Product.findOne({ id: pathValue(req, 'id'), deletedAt: null }).lean(); if (!item) throw new HttpError(404, 'NOT_FOUND', 'Product not found'); res.json({ data: productDto(item) }) })
  router.get('/categories', async (req, res) => { const q = parse(pagination, req.query); const filter = { deletedAt: null }; const [items, total] = await Promise.all([Category.find(filter).sort({ createdAt: 1, id: 1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(), Category.countDocuments(filter)]); pageResult(res, items.map(dto), total, q.page, q.limit) })
  router.get('/journal', async (req, res) => { const q = parse(pagination, req.query); const filter = { deletedAt: null, ...(q.category !== 'all' ? { category: q.category } : {}) }; const [items, total] = await Promise.all([Post.find(filter).sort({ date: -1, slug: 1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(), Post.countDocuments(filter)]); pageResult(res, items.map(postDto), total, q.page, q.limit) })
  router.get('/journal/:slug', async (req, res) => { const item = await Post.findOne({ slug: pathValue(req, 'slug'), deletedAt: null }).lean(); if (!item) throw new HttpError(404, 'NOT_FOUND', 'Story not found'); res.json({ data: postDto(item) }) })
  router.get('/site-content', async (_req, res) => { const items = await SiteBlock.find().lean(); res.json({ data: Object.fromEntries(items.map(item => [item.key, item.data])), versions: Object.fromEntries(items.map(item => [item.key, item.__v])) }) })
  router.get('/legal/:key', async (req, res) => { const item = await LegalPage.findOne({ key: pathValue(req, 'key') }).lean(); if (!item) throw new HttpError(404, 'NOT_FOUND', 'Page not found'); res.json({ data: dto(item) }) })
  const submissions = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Please try again later' } } })
  router.post('/newsletter/subscriptions', submissions, async (req, res) => { const input = parse(newsletterInput, req.body); await Subscriber.updateOne({ email: input.email }, { $setOnInsert: { email: input.email, noticeVersion: input.noticeVersion, consentAt: new Date(), subscribedAt: new Date(), source: 'website' } }, { upsert: true, strict: true }); res.status(202).json({ data: { message: 'Your signup request has been recorded. No campaign email has been sent.' } }) })
  router.post('/contact-submissions', submissions, async (req, res) => { const input = parse(contactInput, req.body); await Contact.create(input); res.status(201).json({ data: { message: 'Your message has been recorded. Email delivery has not been requested.' } }) })
  return router
}
