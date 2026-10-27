import Stripe from 'stripe'
import mongoose from 'mongoose'
import { Order, WebhookEvent, EmailJob } from '../models/index.js'
import { HttpError } from '../lib/http-error.js'
import { releaseReservation } from './orders.js'
export async function applyStripeEvent(event: Stripe.Event) {
  try {
    await mongoose.connection.transaction(async session => {
      if (await WebhookEvent.exists({ provider: 'stripe', eventId: event.id }).session(session)) return
      if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type)) {
        const checkout = event.data.object as Stripe.Checkout.Session
        const fallback = checkout.metadata?.orderId
        let order = await Order.findOne({ stripeSessionId: checkout.id }).session(session)
        if (!order && fallback && /^[a-f\d]{24}$/i.test(fallback)) {
          order = await Order.findOne({ _id: new mongoose.Types.ObjectId(fallback), stripeSessionId: { $exists: false }, paymentStatus: 'pending' }).session(session)
        }
        // A webhook can beat the API's session save. Retry rather than lose the event.
        if (!order) throw new HttpError(409, 'ORDER_NOT_READY', 'Order session is not ready; retry event')
        if (checkout.metadata?.orderId !== String(order._id) || checkout.amount_total !== order.totalMinor || checkout.currency !== order.currency) throw new HttpError(400, 'PAYMENT_MISMATCH', 'Payment does not match the order')
        if (!order.stripeSessionId) { order.stripeSessionId = checkout.id; await order.save({ session }) }
        const paid = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) && checkout.payment_status === 'paid'
        if (paid) {
          if (order.status === 'cancelled') throw new HttpError(409, 'PAYMENT_REVIEW_REQUIRED', 'Cancelled order payment requires review')
          if (order.paymentStatus !== 'paid') { order.status = 'paid'; order.paymentStatus = 'paid'; order.paidAt = new Date(); await order.save({ session }); await EmailJob.updateOne({ orderId: String(order._id) }, { $setOnInsert: { state: 'pending' } }, { upsert: true, session }) }
        } else if (['checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type) && order.paymentStatus !== 'paid') await releaseReservation(order, session)
      }
      await WebhookEvent.create([{ provider: 'stripe', eventId: event.id }], { session })
    })
  } catch (error) { if (typeof error === 'object' && error && 'code' in error && error.code === 11000 && await WebhookEvent.exists({ provider: 'stripe', eventId: event.id })) return; throw error }
}
