import { Router, raw } from 'express'
import mongoose from 'mongoose'
import { verifyWebhook } from '@clerk/express/webhooks'
import Stripe from 'stripe'
import type { Environment } from '../config/env.js'
import { Customer, WebhookEvent } from '../models/index.js'
import { HttpError } from '../lib/http-error.js'
import { applyStripeEvent } from '../services/payments.js'
export function webhookRoutes(config: Environment) {
  const router = Router()
  router.post('/stripe', raw({ type: 'application/json', limit: '100kb' }), async (req, res) => {
    if (!config.stripeSecretKey || !config.stripeWebhookSecret) throw new HttpError(503, 'WEBHOOK_DISABLED', 'Stripe webhook verification is pending configuration')
    let event: Stripe.Event
    try { event = new Stripe(config.stripeSecretKey).webhooks.constructEvent(req.body, req.get('stripe-signature') ?? '', config.stripeWebhookSecret) }
    catch { throw new HttpError(400, 'INVALID_SIGNATURE', 'Webhook signature is invalid') }
    await applyStripeEvent(event); res.json({ data: { received: true } })
  })
  router.post('/clerk', raw({ type: 'application/json', limit: '100kb' }), async (req, res) => {
    if (!config.clerkWebhookSigningSecret) throw new HttpError(503, 'WEBHOOK_DISABLED', 'Clerk webhook verification is not configured')
    let event: Awaited<ReturnType<typeof verifyWebhook>>
    try { event = await verifyWebhook(req, { signingSecret: config.clerkWebhookSigningSecret }) }
    catch { throw new HttpError(400, 'INVALID_SIGNATURE', 'Webhook signature is invalid') }
    const eventId = req.get('svix-id')
    if (!eventId) throw new HttpError(400, 'INVALID_EVENT', 'Missing event identifier')
    try {
      await mongoose.connection.transaction(async session => {
        if (await WebhookEvent.exists({ provider: 'clerk', eventId }).session(session)) return
        if (event.type === 'user.created' || event.type === 'user.updated' || event.type === 'user.deleted') {
          const clerkId = event.data.id
          if (typeof clerkId !== 'string' || !clerkId.trim()) throw new HttpError(400, 'INVALID_EVENT', 'Missing user identifier')
          const timestamp = event.timestamp
          if (!Number.isSafeInteger(timestamp) || timestamp <= 0) throw new HttpError(400, 'INVALID_EVENT', 'Invalid event timestamp')
          const existing = await Customer.findOne({ clerkId }).session(session)
          if (!existing || existing.identityUpdatedAt <= timestamp) {
            if (event.type === 'user.deleted') await Customer.updateOne({ clerkId }, { $set: { deletedAt: new Date(timestamp), email: '', name: '', imageUrl: '', identityUpdatedAt: timestamp }, $setOnInsert: { role: 'customer' } }, { upsert: true, session, runValidators: true })
            else if (!existing?.deletedAt) {
              if (!Array.isArray(event.data.email_addresses) || [event.data.first_name, event.data.last_name].some(value => value != null && typeof value !== 'string') || (event.data.image_url != null && typeof event.data.image_url !== 'string')) throw new HttpError(400, 'INVALID_EVENT', 'Invalid profile fields')
              const primary = event.data.email_addresses.find(email => email.id === event.data.primary_email_address_id && email.verification?.status === 'verified')
              await Customer.updateOne({ clerkId }, { $set: { name: [event.data.first_name, event.data.last_name].filter(Boolean).join(' '), email: typeof primary?.email_address === 'string' ? primary.email_address.toLowerCase() : '', imageUrl: event.data.image_url ?? '', identityUpdatedAt: timestamp }, $setOnInsert: { role: 'customer' } }, { upsert: true, session, runValidators: true })
            }
          }
        }
        await WebhookEvent.create([{ provider: 'clerk', eventId }], { session })
      })
    } catch (error) { if (!(typeof error === 'object' && error && 'code' in error && error.code === 11000 && await WebhookEvent.exists({ provider: 'clerk', eventId }))) throw error }
    res.json({ data: { received: true } })
  })
  return router
}
