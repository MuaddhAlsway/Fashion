import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Cart, Wishlist, Product, Address, Order, Migration, Feedback } from '../models/index.js'
import { owner, type Identity } from '../middleware/auth.js'
import { lineInput, deliveryInput, parse, pagination, slug, text } from '../lib/validation.js'
import { dto, productDto, pathValue, documentId, pageResult } from '../lib/api.js'
import { HttpError } from '../lib/http-error.js'
import { assertAssets } from '../lib/assets.js'
import { createOrder, releaseReservation, idempotencyKey } from '../services/orders.js'
import type { Environment } from '../config/env.js'
export function customerRoutes(config: Environment) {
  const router = Router()
  router.get('/', (_req, res) => { const identity = res.locals.identity as Identity; res.json({ data: { ...identity, role: res.locals.customer.role } }) })
  router.get('/cart', async (_req, res) => {
    const cart = await Cart.findOne({ ownerId: owner(res) }).lean(), items = []
    for (const line of cart?.items ?? []) { const product = await Product.findOne({ id: line.id, deletedAt: null }).lean(); items.push(product ? { ...productDto(product), size: line.size, quantity: line.quantity, available: product.sizes.includes(line.size) } : { id: line.id, size: line.size, quantity: line.quantity, available: false }) }
    res.json({ data: { items, itemCount: items.reduce((n, line) => n + line.quantity, 0) } })
  })
  router.post('/cart/items', async (req, res) => {
    const input = parse(lineInput, req.body), ownerId = owner(res)
    await mongoose.connection.transaction(async session => {
      const product = await Product.findOne({ id: input.id, deletedAt: null }).session(session)
      if (!product || !product.sizes.includes(input.size)) throw new HttpError(400, 'INVALID_PRODUCT_SIZE', 'Choose an available product and size')
      let cart = await Cart.findOne({ ownerId }).session(session)
      if (!cart) cart = new Cart({ ownerId, items: [] })
      const line = cart.items.find(item => item.id === input.id && item.size === input.size)
      if (line) { if (line.quantity + input.quantity > 99) throw new HttpError(400, 'QUANTITY_LIMIT', 'Maximum quantity is 99'); line.quantity += input.quantity }
      else { if (cart.items.length >= 100) throw new HttpError(400, 'CART_LIMIT', 'Maximum of 100 different lines'); cart.items.push(input) }
      await cart.save({ session })
    })
    res.status(204).end()
  })
  router.put('/cart/items/:id/:size', async (req, res) => { const input = parse(z.object({ quantity: z.number().int().min(1).max(99) }).strict(), req.body); const result = await Cart.updateOne({ ownerId: owner(res), items: { $elemMatch: { id: pathValue(req, 'id'), size: pathValue(req, 'size') } } }, { $set: { 'items.$.quantity': input.quantity } }, { runValidators: true }); if (!result.matchedCount) throw new HttpError(404, 'NOT_FOUND', 'Cart item not found'); res.status(204).end() })
  router.delete('/cart/items/:id/:size', async (req, res) => { await Cart.updateOne({ ownerId: owner(res) }, { $pull: { items: { id: pathValue(req, 'id'), size: pathValue(req, 'size') } } }); res.status(204).end() })
  router.delete('/cart', async (_req, res) => { await Cart.updateOne({ ownerId: owner(res) }, { $set: { items: [] } }); res.status(204).end() })
  router.get('/wishlist', async (_req, res) => { const wishlist = await Wishlist.findOne({ ownerId: owner(res) }).lean(); const items = await Product.find({ id: { $in: wishlist?.productIds ?? [] }, deletedAt: null }).lean(); res.json({ data: items.map(productDto) }) })
  router.put('/wishlist/items/:id', async (req, res) => { const id = parse(slug, pathValue(req, 'id')); if (!await Product.exists({ id, deletedAt: null })) throw new HttpError(404, 'NOT_FOUND', 'Product not found'); await Wishlist.updateOne({ ownerId: owner(res) }, { $addToSet: { productIds: id } }, { upsert: true }); res.status(204).end() })
  router.delete('/wishlist/items/:id', async (req, res) => { await Wishlist.updateOne({ ownerId: owner(res) }, { $pull: { productIds: pathValue(req, 'id') } }); res.status(204).end() })
  router.get('/addresses', async (_req, res) => { res.json({ data: (await Address.find({ ownerId: owner(res) }).limit(20).lean()).map(dto) }) })
  router.post('/addresses', async (req, res) => { const details = parse(deliveryInput, req.body); if (await Address.countDocuments({ ownerId: owner(res) }) >= 20) throw new HttpError(400, 'ADDRESS_LIMIT', 'Maximum of 20 saved addresses'); res.status(201).json({ data: dto(await Address.create({ ownerId: owner(res), details })) }) })
  router.put('/addresses/:id', async (req, res) => { const details = parse(deliveryInput, req.body); const record = await Address.findOneAndUpdate({ _id: documentId(pathValue(req, 'id')), ownerId: owner(res) }, { $set: { details } }, { returnDocument: 'after', runValidators: true }); if (!record) throw new HttpError(404, 'NOT_FOUND', 'Address not found'); res.json({ data: dto(record) }) })
  router.delete('/addresses/:id', async (req, res) => { const result = await Address.deleteOne({ _id: documentId(pathValue(req, 'id')), ownerId: owner(res) }); if (!result.deletedCount) throw new HttpError(404, 'NOT_FOUND', 'Address not found'); res.status(204).end() })
  router.post('/orders', async (req, res) => { res.status(201).json({ data: dto(await createOrder(config, res.locals.identity, req.body, req.get('Idempotency-Key'))) }) })
  router.get('/orders', async (req, res) => { const q = parse(pagination, req.query); const filter = { ownerId: owner(res) }; pageResult(res, (await Order.find(filter).sort({ createdAt: -1, _id: 1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean()).map(dto), await Order.countDocuments(filter), q.page, q.limit) })
  router.get('/orders/:id', async (req, res) => { const order = await Order.findOne({ _id: documentId(pathValue(req, 'id')), ownerId: owner(res) }).lean(); if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found'); res.json({ data: dto(order) }) })
  router.post('/orders/:id/cancel', async (req, res) => { await mongoose.connection.transaction(async session => { const order = await Order.findOne({ _id: documentId(pathValue(req, 'id')), ownerId: owner(res) }).session(session); if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found'); if (order.stripeSessionId || order.paymentStatus === 'pending') throw new HttpError(409, 'PAYMENT_IN_PROGRESS', 'Await verified session expiration'); await releaseReservation(order, session) }); res.status(204).end() })
  router.post('/feedback', async (req, res) => {
    const input = parse(z.object({ productId: z.string().trim().min(1), rating: z.number().int().min(1).max(5), comment: z.string().trim().min(1).max(1000), image: z.string().trim().optional() }).strict(), req.body)
    if (!await Product.exists({ id: input.productId, deletedAt: null })) throw new HttpError(404, 'NOT_FOUND', 'Product not found')
    if (input.image) assertAssets([input.image])
    const identity = res.locals.identity as Identity
    const customer = res.locals.customer as { name?: string } | undefined
    const record = await Feedback.create({ productId: input.productId, clerkId: identity.clerkId, name: customer?.name || identity.email || 'Customer', rating: input.rating, comment: input.comment, image: input.image ?? '' })
    res.status(201).json({ data: dto(record) })
  })
  router.post('/shopping-state/import', async (req, res) => {
    const input = parse(z.object({ items: z.array(lineInput).max(100), productIds: z.array(slug).max(1000) }).strict(), req.body)
    const ownerId = owner(res), key = `guest-import:${ownerId}:${idempotencyKey(req.get('Idempotency-Key'))}`
    await mongoose.connection.transaction(async session => {
      if (await Migration.exists({ key }).session(session)) return
      let cart = await Cart.findOne({ ownerId }).session(session)
      if (!cart) cart = new Cart({ ownerId, items: [] })
      for (const line of input.items) {
        const product = await Product.findOne({ id: line.id, deletedAt: null }).session(session)
        if (!product || !product.sizes.includes(line.size)) throw new HttpError(409, 'UNAVAILABLE_PRODUCT', 'Guest data contains unavailable products or sizes; your guest data has been kept')
        const existing = cart.items.find(item => item.id === line.id && item.size === line.size)
        if (existing) { if (existing.quantity + line.quantity > 99) throw new HttpError(400, 'QUANTITY_LIMIT', 'Guest import would exceed the quantity limit'); existing.quantity += line.quantity }
        else cart.items.push(line)
      }
      if (cart.items.length > 100) throw new HttpError(400, 'CART_LIMIT', 'Guest import would exceed the cart line limit')
      await cart.save({ session })
      const available = await Product.find({ id: { $in: input.productIds }, deletedAt: null }).session(session)
      await Wishlist.updateOne({ ownerId }, { $addToSet: { productIds: { $each: available.map(p => p.id) } } }, { session, upsert: true })
      await Migration.create([{ key }], { session })
    })
    res.status(204).end()
  })
  return router
}
