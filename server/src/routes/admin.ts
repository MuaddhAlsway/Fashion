import { normalizeSearch } from '../lib/search.js'
import type { Environment } from '../config/env.js'
import { Resend } from 'resend'
import { Router } from 'express'
import mongoose, { type Model } from 'mongoose'
import { z } from 'zod'
import { Product, Category, Post, SiteBlock, LegalPage, Subscriber, Contact, Activity, Order } from '../models/index.js'
import { productInput, categoryInput, postInput, websiteInput, legalInput, pagination, parse, sizeLabel } from '../lib/validation.js'
import { productDto, postDto, dto, pathValue, documentId, version, pageResult, escapeRegex } from '../lib/api.js'
import { HttpError } from '../lib/http-error.js'
import { assertAssets, approvedAssets } from '../lib/assets.js'
import { audit } from '../services/audit.js'
import { owner } from '../middleware/auth.js'
import { releaseReservation } from '../services/orders.js'
export function adminRoutes(config: Environment) {
  const router = Router()
  const resources = [
    { name: 'products', model: Product, schema: productInput, key: 'id', serialize: productDto },
    { name: 'categories', model: Category, schema: categoryInput, key: 'id', serialize: dto },
    { name: 'journal', model: Post, schema: postInput, key: 'slug', serialize: postDto },
  ]
  for (const resource of resources) {
    const model = resource.model as unknown as Model<Record<string, unknown>>
    router.get(`/${resource.name}`, async (req, res) => { const q = parse(pagination, req.query); const filter: Record<string, unknown> = { deletedAt: null }; if (q.q) filter.$or = ['name', 'title', 'brand', resource.key].map(key => ({ [key]: { $regex: escapeRegex(q.q), $options: 'i' } })); const [items, total] = await Promise.all([model.find(filter).sort({ createdAt: -1, _id: 1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(), model.countDocuments(filter)]); pageResult(res, items.map(resource.serialize), total, q.page, q.limit) })
    async function validate(body: unknown) {
      const input = resource.schema.parse(body) as Record<string, unknown>
      const images = [input.image, input.featuredImage, ...((input.images ?? []) as { src: string }[]).map(image => image.src)].filter((v): v is string => typeof v === 'string')
      assertAssets(images)
      if (resource.name === 'products') { const ids = input.categoryIds as string[]; if (await Category.countDocuments({ id: { $in: ids }, deletedAt: null }) !== ids.length) throw new HttpError(400, 'INVALID_CATEGORIES', 'Unknown category'); input.priceMinor = Math.round(Number(input.price) * 100); delete input.price; input.searchText = normalizeSearch([input.name, input.brand, input.department].join(' ')) }
      delete input.dateLabel
      return input
    }
    router.post(`/${resource.name}`, async (req, res) => { const input = await validate(req.body); let result: unknown; await mongoose.connection.transaction(async session => { const records = await model.create([input], { session }); result = records[0]; await audit(owner(res), `${resource.name}.create`, String(input[resource.key]), session) }); res.status(201).json({ data: resource.serialize(result) }) })
    router.put(`/${resource.name}/:id`, async (req, res) => { const id = pathValue(req, 'id'), expected = version(req), input = await validate(req.body); if (input[resource.key] !== id) throw new HttpError(400, 'IMMUTABLE_ID', 'Record identifier cannot change'); let result: unknown; await mongoose.connection.transaction(async session => { result = await model.findOneAndUpdate({ [resource.key]: id, deletedAt: null, __v: expected }, { $set: input, $inc: { __v: 1 } }, { session, returnDocument: 'after', runValidators: true }); if (!result) throw new HttpError(409, 'VERSION_CONFLICT', 'Record changed or no longer exists; reload before editing'); await audit(owner(res), `${resource.name}.update`, id, session) }); res.json({ data: resource.serialize(result) }) })
    router.delete(`/${resource.name}/:id`, async (req, res) => { const id = pathValue(req, 'id'), expected = version(req); await mongoose.connection.transaction(async session => { const result = await model.findOneAndUpdate({ [resource.key]: id, deletedAt: null, __v: expected }, { $set: { deletedAt: new Date() }, $inc: { __v: 1 } }, { session }); if (!result) throw new HttpError(409, 'VERSION_CONFLICT', 'Record changed or no longer exists'); if (resource.name === 'categories') await Product.updateMany({ categoryIds: id }, { $pull: { categoryIds: id }, $inc: { __v: 1 } }, { session }); await audit(owner(res), `${resource.name}.delete`, id, session) }); res.status(204).end() })
  }
  router.put('/products/:id/inventory', async (req, res) => {
    const stock = parse(z.object({ stockBySize: z.record(sizeLabel, z.number().int().min(0).max(1000000)) }).strict(), req.body)
    const product = await Product.findOne({ id: pathValue(req, 'id'), deletedAt: null })
    if (!product) throw new HttpError(404, 'NOT_FOUND', 'Product not found')
    if (Object.keys(stock.stockBySize).some(size => !product.sizes.includes(size))) throw new HttpError(400, 'INVALID_SIZE', 'Inventory size is not available')
    const expected = version(req)
    await mongoose.connection.transaction(async session => { const changed = await Product.updateOne({ _id: product._id, __v: expected }, { $set: stock, $inc: { __v: 1 } }, { session }); if (!changed.modifiedCount) throw new HttpError(409, 'VERSION_CONFLICT', 'Reload inventory before editing'); await audit(owner(res), 'inventory.update', product.id, session) })
    res.json({ data: { stockBySize: stock.stockBySize } })
  })
  router.get('/assets', (_req, res) => { res.json({ data: approvedAssets() }) })
  router.get('/site-content', async (_req, res) => { res.json({ data: (await SiteBlock.find().lean()).map(dto) }) })
  router.put('/site-content/:key', async (req, res) => {
    const key = pathValue(req, 'key'), expected = version(req), input = parse(websiteInput, req.body)
    if (input.image) assertAssets([input.image])
    const existing = await SiteBlock.findOne({ key }).lean()
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Content block not found')
    const allowed = Object.keys(existing.data)
    if (Object.keys(input).some(field => !allowed.includes(field)) || allowed.some(field => !(field in input))) throw new HttpError(400, 'UNKNOWN_FIELD', 'Field is not supported by this block')
    let result: unknown
    await mongoose.connection.transaction(async session => { result = await SiteBlock.findOneAndUpdate({ key, __v: expected }, { $set: { data: input }, $inc: { __v: 1 } }, { returnDocument: 'after', session }); if (!result) throw new HttpError(409, 'VERSION_CONFLICT', 'Reload content before editing'); await audit(owner(res), 'content.update', key, session) })
    res.json({ data: dto(result) })
  })
  router.get('/legal/:key', async (req, res) => { const doc = await LegalPage.findOne({ key: pathValue(req, 'key') }).lean(); if (!doc) throw new HttpError(404, 'NOT_FOUND', 'Document not found'); res.json({ data: dto(doc) }) })
  router.put('/legal/:key', async (req, res) => { const key = pathValue(req, 'key'), expected = version(req), input = parse(legalInput, req.body); let result: unknown; await mongoose.connection.transaction(async session => { result = await LegalPage.findOneAndUpdate({ key, __v: expected }, { $set: input, $inc: { __v: 1 } }, { session, returnDocument: 'after', runValidators: true }); if (!result) throw new HttpError(409, 'VERSION_CONFLICT', 'Reload document before editing'); await audit(owner(res), 'legal.update', key, session) }); res.json({ data: dto(result) }) })
  router.get('/newsletter-subscribers', async (req, res) => { const q = parse(pagination, req.query); const filter = q.q ? { email: { $regex: escapeRegex(q.q), $options: 'i' } } : {}; const sort: Record<string, 1 | -1> = q.sort === 'email-asc' ? { email: 1 } : q.sort === 'email-desc' ? { email: -1 } : { subscribedAt: q.sort === 'oldest' ? 1 : -1, _id: 1 }; const [items, total, subscriberCount] = await Promise.all([Subscriber.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit).lean(), Subscriber.countDocuments(filter), Subscriber.countDocuments()]); res.json({ data: items.map(dto), subscriberCount, pagination: { total, page: q.page, limit: q.limit } }) })
  router.delete('/newsletter-subscribers/:id', async (req, res) => { const id = documentId(pathValue(req, 'id')); await mongoose.connection.transaction(async session => { const removed = await Subscriber.findByIdAndDelete(id, { session }); if (!removed) throw new HttpError(404, 'NOT_FOUND', 'Subscriber not found'); await audit(owner(res), 'subscriber.delete', id, session) }); res.status(204).end() })
  router.get('/contact-submissions', async (req, res) => { const q = parse(pagination, req.query); pageResult(res, (await Contact.find().sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean()).map(dto), await Contact.countDocuments(), q.page, q.limit) })
  router.post('/contact-submissions/:id/reply', async (req, res) => {
    if (!config.emailEnabled || !config.resendApiKey || !config.emailFrom) throw new HttpError(503, 'EMAIL_DISABLED', 'Email is disabled until a verified sender is configured')
    const id = documentId(pathValue(req, 'id')), input = parse(z.object({ message: z.string().min(1).max(5000) }).strict(), req.body)
    const contact = await Contact.findById(id).lean()
    if (!contact) throw new HttpError(404, 'NOT_FOUND', 'Contact submission not found')
    const resend = new Resend(config.resendApiKey)
    const html = `<div style="font-family:Outfit,Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f7f5f2;color:#211f1b;"><h1 style="font-family:Prata,Georgia,serif;font-weight:400;margin:0 0 1rem;">FASHION</h1><p style="color:#77736c;margin:0 0 1.5rem;">Reply to your message</p><div style="background:#fff;padding:1.5rem;border:1px solid #e7e3dc;margin-bottom:1.5rem;"><p style="margin:0 0 1rem;">Hi ${contact.name},</p><p style="white-space:pre-wrap;margin:0;">${input.message}</p></div><p style="font-size:0.85rem;color:#77736c;">Thank you for contacting FASHION. We will get back to you if you have further questions.</p></div>`
    const response = await resend.emails.send({ from: config.emailFrom, to: contact.email, subject: 'Re: Your message to FASHION', html, text: input.message })
    if (response.error || !response.data) throw new HttpError(502, 'EMAIL_SEND_FAILED', 'Email could not be sent')
    await audit(owner(res), 'contact.reply', id)
    res.json({ data: { sent: true, providerId: response.data.id } })
  })
  router.get('/orders', async (req, res) => { const q = parse(pagination, req.query); pageResult(res, (await Order.find().sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean()).map(dto), await Order.countDocuments(), q.page, q.limit) })
  router.put('/orders/:id/status', async (req, res) => { const input = parse(z.object({ status: z.enum(['fulfilled', 'cancelled']) }).strict(), req.body), id = documentId(pathValue(req, 'id')); await mongoose.connection.transaction(async session => { const order = await Order.findById(id).session(session); if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found'); if (input.status === 'fulfilled') { if (order.status !== 'paid') throw new HttpError(409, 'INVALID_TRANSITION', 'Only paid orders can be fulfilled'); order.status = 'fulfilled'; await order.save({ session }) } else { if (order.stripeSessionId || order.paymentStatus === 'pending') throw new HttpError(409, 'PAYMENT_IN_PROGRESS', 'Wait for verified payment session expiration'); await releaseReservation(order, session) } await audit(owner(res), `order.${input.status}`, id, session) }); res.json({ data: { status: input.status } }) })
  router.get('/activity', async (req, res) => { const q = parse(pagination, req.query); pageResult(res, (await Activity.find().sort({ createdAt: -1, _id: 1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean()).map(dto), await Activity.countDocuments(), q.page, q.limit) })
  router.get('/dashboard', async (_req, res) => { const [products, categories, journal, activity] = await Promise.all([Product.countDocuments({ deletedAt: null }), Category.countDocuments({ deletedAt: null }), Post.countDocuments({ deletedAt: null }), Activity.countDocuments()]); res.json({ data: { products, categories, journal, activity } }) })
  return router
}
