import { Resend } from 'resend'
import { EmailJob, Order } from '../models/index.js'
import type { Environment } from '../config/env.js'
import { logger } from '../lib/logger.js'
export async function sendPendingReceipt(config: Environment) {
  if (!config.emailEnabled || !config.resendApiKey || !config.emailFrom) return false
  const job = await EmailJob.findOneAndUpdate({ state: { $ne: 'sent' }, attempts: { $lt: 5 }, $or: [{ state: { $in: ['pending', 'failed'] } }, { state: 'sending', lockedAt: { $lt: new Date(Date.now() - 60000) } }] }, { $set: { state: 'sending', lockedAt: new Date() }, $inc: { attempts: 1 } }, { returnDocument: 'after' })
  if (!job) return false
  try {
    if (job.firstAttemptAt && Date.now() - job.firstAttemptAt.getTime() > 23 * 60 * 60_000) { await EmailJob.updateOne({ _id: job._id }, { $set: { state: 'failed', attempts: 5 } }); return false }
    if (!job.firstAttemptAt) await EmailJob.updateOne({ _id: job._id }, { $set: { firstAttemptAt: new Date() } })
    const order = await Order.findById(job.orderId)
    if (!order || order.paymentStatus !== 'paid') throw new Error('Order not paid')
    const resend = new Resend(config.resendApiKey)
    const sender = config.emailFrom.match(/<([^>]+)>/)?.[1] ?? config.emailFrom
    const domain = sender.split('@')[1]?.toLowerCase()
    const domains = await resend.domains.list()
    if (domains.error || !domains.data?.data.some(item => item.name.toLowerCase() === domain && item.status === 'verified')) throw new Error('Sender domain not verified')
    const response = await resend.emails.send({ from: config.emailFrom, to: order.email, subject: `FASHION order ${order.reference}`, text: `Your payment has been confirmed for order ${order.reference}.\nTotal: ${(order.totalMinor / 100).toFixed(2)} ${order.currency.toUpperCase()}.\nYour order is recorded; shipment tracking is not available yet.` }, { idempotencyKey: `fashion-receipt-${order._id}` })
    if (response.error || !response.data) throw new Error('Email send failed')
    await EmailJob.updateOne({ _id: job._id }, { $set: { state: 'sent', providerId: response.data.id } })
    return true
  } catch { await EmailJob.updateOne({ _id: job._id }, { $set: { state: 'failed' } }); logger.error('receipt_send_failed'); return false }
}
export function startReceiptWorker(config: Environment) {
  let running = false
  const timer = setInterval(() => { if (running) return; running = true; void sendPendingReceipt(config).catch(() => logger.error('receipt_worker_failed')).finally(() => { running = false }) }, 15000)
  timer.unref()
  return () => clearInterval(timer)
}
