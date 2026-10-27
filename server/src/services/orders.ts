import { createHash, randomUUID } from 'node:crypto'
import mongoose, { type ClientSession, type HydratedDocument, type InferSchemaType } from 'mongoose'
import { Cart, Product, Order } from '../models/index.js'
import { HttpError } from '../lib/http-error.js'
import type { Environment } from '../config/env.js'
import type { Identity } from '../middleware/auth.js'
import { orderInput, parse } from '../lib/validation.js'
export type OrderRecord = HydratedDocument<InferSchemaType<typeof Order.schema>>
export function idempotencyKey(value: unknown): string { if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,100}$/.test(value)) throw new HttpError(400, 'IDEMPOTENCY_REQUIRED', 'Supply an Idempotency-Key of 16–100 letters, digits, hyphens or underscores'); return value }
export function calculateTotals(subtotalMinor: number, shippingMinor: number, taxBasisPoints: number) { const taxMinor = Math.round(subtotalMinor * taxBasisPoints / 10000); const totalMinor = subtotalMinor + shippingMinor + taxMinor; if (!Number.isSafeInteger(totalMinor)) throw new HttpError(400, 'INVALID_TOTAL', 'Order total is too large'); return { subtotalMinor, shippingMinor, taxMinor, totalMinor } }
export async function releaseReservation(order: OrderRecord, session: ClientSession) {
  if (order.status === 'cancelled') return
  if (order.status !== 'awaiting_payment' || order.paymentStatus === 'paid') throw new HttpError(409, 'INVALID_TRANSITION', 'Paid orders cannot be cancelled through this operation')
  if (!order.reservationReleased) for (const item of order.items) if (item.tracked) await Product.updateOne({ id: item.id }, { $inc: { [`stockBySize.${item.size}`]: item.quantity, __v: 1 } }, { session })
  order.reservationReleased = true; order.status = 'cancelled'; order.paymentStatus = 'failed'; await order.save({ session })
}
export async function createOrder(config: Environment, identity: Identity, body: unknown, keyValue: unknown) {
  if (!config.checkout) throw new HttpError(503, 'CHECKOUT_DISABLED', 'Checkout awaits approved currency, shipping and tax configuration')
  const input = parse(orderInput, body), key = idempotencyKey(keyValue), hash = createHash('sha256').update(JSON.stringify(input)).digest('hex')
  const previous = await Order.findOne({ ownerId: identity.clerkId, requestKey: key })
  if (previous) { if (previous.requestHash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This key was used for another request'); return previous }
  let result: OrderRecord | undefined
  try {
    await mongoose.connection.transaction(async session => {
      const repeated = await Order.findOne({ ownerId: identity.clerkId, requestKey: key }).session(session)
      if (repeated) { if (repeated.requestHash !== hash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This key was used for another request'); result = repeated; return }
      const cart = await Cart.findOne({ ownerId: identity.clerkId }).session(session)
      if (!cart?.items.length) throw new HttpError(400, 'EMPTY_CART', 'Your bag is empty')
      const items = []
      for (const line of cart.items) {
        const product = await Product.findOne({ id: line.id, deletedAt: null }).session(session)
        if (!product || !product.sizes.includes(line.size)) throw new HttpError(409, 'UNAVAILABLE_PRODUCT', 'A cart product or selected size is no longer available')
        const tracked = product.stockBySize.has(line.size)
        if (tracked) { const changed = await Product.updateOne({ _id: product._id, [`stockBySize.${line.size}`]: { $gte: line.quantity } }, { $inc: { [`stockBySize.${line.size}`]: -line.quantity, __v: 1 } }, { session }); if (!changed.modifiedCount) throw new HttpError(409, 'OUT_OF_STOCK', 'A selected size has insufficient stock') }
        items.push({ id: product.id, name: product.name, brand: product.brand, priceMinor: product.priceMinor, image: product.image, imageAlt: product.imageAlt, size: line.size, quantity: line.quantity, tracked })
      }
      const subtotalMinor = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0)
      const totals = calculateTotals(subtotalMinor, config.checkout!.shippingMinor, config.checkout!.taxBasisPoints)
      const orders = await Order.create([{ ownerId: identity.clerkId, requestKey: key, requestHash: hash, reference: `FASHION-${randomUUID()}`, ...input, email: identity.email, currency: config.checkout!.currency, items, ...totals }], { session })
      result = orders[0]
    })
  } catch (error) { if (typeof error === 'object' && error && 'code' in error && error.code === 11000) { const repeated = await Order.findOne({ ownerId: identity.clerkId, requestKey: key }); if (repeated?.requestHash === hash) return repeated } throw error }
  if (!result) throw new Error('Order transaction failed')
  return result
}
