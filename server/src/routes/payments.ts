import { Router } from 'express'
import Stripe from 'stripe'
import type { Environment } from '../config/env.js'
import { Order } from '../models/index.js'
import { owner } from '../middleware/auth.js'
import { pathValue, documentId } from '../lib/api.js'
import { HttpError } from '../lib/http-error.js'
export function paymentRoutes(config: Environment) {
  const router = Router()
  router.post('/orders/:id/payment', async (req, res) => {
    if (!config.stripeSecretKey || !config.stripeWebhookSecret || !config.checkout) throw new HttpError(503, 'PAYMENTS_PENDING_CONFIGURATION', 'Payments are disabled until checkout and verified webhook processing are configured')
    const order = await Order.findOne({ _id: documentId(pathValue(req, 'id')), ownerId: owner(res) })
    if (!order) throw new HttpError(404, 'NOT_FOUND', 'Order not found')
    if (order.status !== 'awaiting_payment') throw new HttpError(409, 'INVALID_TRANSITION', 'Order is not awaiting payment')
    const stripe = new Stripe(config.stripeSecretKey)
    if (order.stripeSessionId) { const previous = await stripe.checkout.sessions.retrieve(order.stripeSessionId); if (previous.status !== 'open') throw new HttpError(409, 'PAYMENT_SESSION_CLOSED', 'Wait for verified payment status'); res.json({ data: { url: previous.url } }); return }
    if (order.paymentAttemptedAt && Date.now() - order.paymentAttemptedAt.getTime() > 23 * 60 * 60_000) throw new HttpError(409, 'PAYMENT_REVIEW_REQUIRED', 'A previous payment attempt needs operator reconciliation before retrying')
    const locked = await Order.findOneAndUpdate({ _id: order._id, status: 'awaiting_payment' }, { $set: { paymentStatus: 'pending' }, $min: { paymentAttemptedAt: new Date() } }, { returnDocument: 'after' })
    if (!locked) throw new HttpError(409, 'INVALID_TRANSITION', 'Order is no longer awaiting payment')
    // Wallet/mada preferences are not capability guarantees. Hosted Checkout presents supported methods.
    const checkout = await stripe.checkout.sessions.create({ mode: 'payment', client_reference_id: String(order._id), metadata: { orderId: String(order._id) }, customer_email: order.email, success_url: `${config.clientOrigin}/checkout/confirmation?order=${order._id}`, cancel_url: `${config.clientOrigin}/checkout/payment?order=${order._id}`, line_items: [{ price_data: { currency: order.currency, unit_amount: order.totalMinor, product_data: { name: `FASHION order ${order.reference}` } }, quantity: 1 }] }, { idempotencyKey: `fashion-order-${order._id}` })
    await Order.updateOne({ _id: order._id, status: 'awaiting_payment' }, { $set: { stripeSessionId: checkout.id, paymentStatus: 'pending' } })
    res.status(201).json({ data: { url: checkout.url } })
  })
  return router
}
