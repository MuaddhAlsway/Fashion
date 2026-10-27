import { mkdtempSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHmac } from 'node:crypto'
import request from 'supertest'
import mongoose from 'mongoose'
import Stripe from 'stripe'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { createApp } from '../src/app.js'
import { validateEnvironment } from '../src/config/env.js'
import { seedDatabase, readSeed } from '../src/seed/index.js'
import { Customer, Product, Category, Cart, Order, Subscriber, Activity, EmailJob, WebhookEvent } from '../src/models/index.js'
import { calculateTotals } from '../src/services/orders.js'
import type { Logger } from '../src/lib/logger.js'
const silent: Logger = { info() {}, error() {} }

test('seed source preserves actual 12 products and separate image roles', () => {
  const source = readSeed()
  assert.equal(source.products.length, 12)
  assert.equal(source.categories.length, 2)
  assert.equal(source.journal.length, 6)
  assert.notEqual(source.products[0]!.image, source.products[0]!.images[0]!.src)
  assert.equal(source.products.find(p => p.id === 'midi-slip-dress')!.images.length, 1)
  assert.deepEqual(calculateTotals(4800, 500, 1000), { subtotalMinor: 4800, shippingMinor: 500, taxMinor: 480, totalMinor: 5780 })
})

test('isolated replica-set API, authorization, state and webhook integration', { timeout: 240000 }, async t => {
  const mongo = await MongoMemoryReplSet.create({ instanceOpts: [{ dbPath: mkdtempSync(resolve('node_modules/.cache/fashion-db-')), args: ['--setParameter', 'diagnosticDataCollectionEnabled=false'] }], replSet: { count: 1, args: ['--setParameter', 'diagnosticDataCollectionEnabled=false'] }, binary: { version: '8.0.20', downloadDir: resolve('node_modules/.cache/mongodb') } })
  try {
    await mongoose.connect(mongo.getUri(), { dbName: 'fashion_test' })
    await seedDatabase()
    await Product.updateOne({ id: 'relaxed-cotton-shirt' }, { $set: { name: 'An admin edit' } })
    await seedDatabase()
    assert.equal(await Product.countDocuments(), 12)
    assert.equal((await Product.findOne({ id: 'relaxed-cotton-shirt' }))!.name, 'An admin edit')
    await Product.updateOne({ id: 'relaxed-cotton-shirt' }, { $set: { name: 'Relaxed Cotton Shirt' } })
    await Customer.create([{ clerkId: 'customer-a', email: 'a@example.com', role: 'customer' }, { clerkId: 'customer-b', email: 'b@example.com', role: 'customer' }, { clerkId: 'admin-a', email: 'admin@example.com', role: 'admin' }, { clerkId: 'staff-a', email: 'staff@example.com', role: 'staff' }])
    const signingSecret = 'whsec_' + Buffer.from('synthetic-clerk-test-secret').toString('base64')
    const config = validateEnvironment({ MONGODB_URL: mongo.getUri('fashion_test'), NODE_ENV: 'test', CLIENT_ORIGIN: 'http://localhost:5173', CHECKOUT_ENABLED: 'true', CURRENCY: 'usd', SHIPPING_MINOR: '500', TAX_BASIS_POINTS: '0', STRIPE_SECRET_KEY: 'sk_test_synthetic_not_real', STRIPE_WEBHOOK_SECRET: 'whsec_synthetic_stripe_secret', CLERK_WEBHOOK_SIGNING_SECRET: signingSecret })
    const app = createApp(config, { log: silent, authenticate: async req => { const id = req.get('X-Test-Identity'); return id && ['customer-a', 'customer-b', 'admin-a', 'staff-a'].includes(id) ? { clerkId: id, name: id, email: `${id}@example.com` } : null } })
    const a = (method: 'get' | 'post' | 'put' | 'delete', path: string) => request(app)[method](path).set('X-Test-Identity', 'customer-a')
    await t.test('private routes require identity and admin role; clients cannot assign roles', async () => {
      await request(app).get('/api/me').expect(401)
      await a('get', '/api/admin/dashboard').expect(403)
      await request(app).get('/api/admin/dashboard').set('X-Test-Identity', 'staff-a').expect(403)
      await request(app).get('/api/admin/dashboard').set('X-Test-Identity', 'admin-a').expect(200)
      await a('post', '/api/me/cart/items').send({ id: 'relaxed-cotton-shirt', size: 'M', quantity: 1, role: 'admin', price: 1 }).expect(400)
    })
    await t.test('catalog search/filter/pagination validation', async () => {
      assert.equal((await request(app).get('/api/products?department=men&q=shirt').expect(200)).body.pagination.total, 1)
      assert.equal((await request(app).get('/api/products').expect(200)).body.pagination.total, 12)
      await request(app).get('/api/products?limit=100000').expect(400)
      await request(app).get('/api/products?q[$ne]=x').expect(400)
    })
    await t.test('cart merge, strict size/quantity and wishlist idempotency', async () => {
      for (let i = 0; i < 2; i++) await a('post', '/api/me/cart/items').send({ id: 'relaxed-cotton-shirt', size: 'M', quantity: 1 }).expect(204)
      const cart = (await a('get', '/api/me/cart').expect(200)).body.data.items
      assert.equal(cart.length, 1); assert.equal(cart[0].quantity, 2)
      await a('post', '/api/me/cart/items').send({ id: 'relaxed-cotton-shirt', size: 'INVALID', quantity: 1 }).expect(400)
      for (let i = 0; i < 2; i++) await a('put', '/api/me/wishlist/items/relaxed-cotton-shirt').expect(204)
      assert.equal((await a('get', '/api/me/wishlist')).body.data.length, 1)
    })
    let orderId = ''
    const details = { fullName: 'Test Customer', phone: '123456789', address: 'Test Street', city: 'Test City', postalCode: '12345', country: 'Test Country' }
    await t.test('order snapshot reprices/idempotency/ownership and finite stock', async () => {
      await Product.updateOne({ id: 'relaxed-cotton-shirt' }, { $set: { 'stockBySize.M': 3 } })
      const body = { details, paymentMethod: 'card' }
      const response = await a('post', '/api/me/orders').set('Idempotency-Key', 'order_request_test_0001').send(body).expect(201)
      orderId = response.body.data.recordId
      assert.equal(response.body.data.totalMinor, 10100)
      const repeat = await a('post', '/api/me/orders').set('Idempotency-Key', 'order_request_test_0001').send(body).expect(201)
      assert.equal(repeat.body.data.recordId, orderId)
      assert.equal((await Product.findOne({ id: 'relaxed-cotton-shirt' }))!.stockBySize.get('M'), 1)
      await a('post', '/api/me/orders').set('Idempotency-Key', 'order_request_test_0002').send(body).expect(409)
      await request(app).get(`/api/me/orders/${orderId}`).set('X-Test-Identity', 'customer-b').expect(404)
      await a('post', '/api/me/orders').set('Idempotency-Key', 'order_request_test_0001').send({ ...body, paymentMethod: 'mada' }).expect(409)
    })
    await t.test('addresses owner-only and public signup does not expose duplicates', async () => {
      const address = await a('post', '/api/me/addresses').send(details).expect(201)
      await request(app).delete(`/api/me/addresses/${address.body.data.recordId}`).set('X-Test-Identity', 'customer-b').expect(404)
      for (let i = 0; i < 2; i++) await request(app).post('/api/newsletter/subscriptions').send({ email: 'guest@example.com', consent: true, noticeVersion: 'newsletter-v1' }).expect(202)
      assert.equal(await Subscriber.countDocuments({ email: 'guest@example.com' }), 1)
      await request(app).post('/api/newsletter/subscriptions').send({ email: 'guest@example.com' }).expect(400)
    })
    await t.test('signed Stripe events verify totals, mark paid once and queue one receipt', async () => {
      await Order.updateOne({ _id: orderId }, { $set: { stripeSessionId: 'cs_synthetic' } })
      const event = { id: 'evt_synthetic_paid', object: 'event', type: 'checkout.session.completed', data: { object: { id: 'cs_synthetic', metadata: { orderId }, amount_total: 10100, currency: 'usd', payment_status: 'paid' } } }
      const payload = JSON.stringify(event), stripe = new Stripe('sk_test_synthetic')
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: config.stripeWebhookSecret! })
      await request(app).post('/api/webhooks/stripe').set('Content-Type', 'application/json').set('stripe-signature', 'invalid').send(payload).expect(400)
      for (let i = 0; i < 2; i++) await request(app).post('/api/webhooks/stripe').set('Content-Type', 'application/json').set('stripe-signature', signature).send(payload).expect(200)
      assert.equal((await Order.findById(orderId))!.paymentStatus, 'paid')
      assert.equal(await EmailJob.countDocuments({ orderId }), 1)
      assert.equal(await WebhookEvent.countDocuments({ provider: 'stripe', eventId: event.id }), 1)
      await a('post', `/api/me/orders/${orderId}/cancel`).expect(409)
    })
    await t.test('Clerk signature/duplicate sync preserves server-owned roles', async () => {
      const now = Math.floor(Date.now() / 1000), id = 'msg_synthetic_event', body = JSON.stringify({ type: 'user.updated', timestamp: Date.now(), data: { id: 'admin-a', first_name: 'Admin', last_name: 'Test', primary_email_address_id: 'email_1', email_addresses: [{ id: 'email_1', email_address: 'admin@example.com', verification: { status: 'verified' } }], public_metadata: { role: 'customer' } } })
      const signature = createHmac('sha256', Buffer.from(signingSecret.replace('whsec_', ''), 'base64')).update(`${id}.${now}.${body}`).digest('base64')
      await request(app).post('/api/webhooks/clerk').set('Content-Type', 'application/json').send(body).expect(400)
      for (let i = 0; i < 2; i++) await request(app).post('/api/webhooks/clerk').set('Content-Type', 'application/json').set('svix-id', id).set('svix-timestamp', String(now)).set('svix-signature', `v1,${signature}`).send(body).expect(200)
      assert.equal((await Customer.findOne({ clerkId: 'admin-a' }))!.role, 'admin')
    })
    await t.test('Clerk signed lifecycle: one customer, update, delete, replay, stale events and invalid payload', async () => {
      const userId = 'user_synthetic_signup', timestamp = Date.now()
      const data = { id: userId, first_name: 'Synthetic', last_name: 'Customer', image_url: 'https://example.com/avatar.png', primary_email_address_id: 'email_new', email_addresses: [{ id: 'email_new', email_address: 'NEW@example.com', verification: { status: 'verified' } }], public_metadata: { role: 'admin' }, private_metadata: { role: 'admin' }, password: 'never-store-this' }
      const deliver = (id: string, type: string, data: unknown, eventTime = timestamp) => {
        const now = Math.floor(Date.now() / 1000), body = JSON.stringify({ type, timestamp: eventTime, data })
        const signature = createHmac('sha256', Buffer.from(signingSecret.replace('whsec_', ''), 'base64')).update(`${id}.${now}.${body}`).digest('base64')
        return request(app).post('/api/webhooks/clerk').set('Content-Type', 'application/json').set('svix-id', id).set('svix-timestamp', String(now)).set('svix-signature', `v1,${signature}`).send(body)
      }
      await request(app).get('/api/webhooks/clerk').expect(404)
      const rejected = await request(app).post('/api/webhooks/clerk').set('Content-Type', 'application/json').set('svix-id', 'msg_tampered').set('svix-timestamp', String(Math.floor(Date.now() / 1000))).set('svix-signature', 'v1,aW52YWxpZA==').send(JSON.stringify({ type: 'user.created', timestamp, data }))
      assert.equal(rejected.status, 400)
      assert.equal(await Customer.countDocuments({ clerkId: userId }), 0)
      await deliver('msg_create_new', 'user.created', data).expect(200)
      await deliver('msg_create_new', 'user.created', data).expect(200)
      await deliver('msg_create_distinct_retry', 'user.created', data).expect(200)
      assert.equal(await Customer.countDocuments({ clerkId: userId }), 1)
      let profile = (await Customer.findOne({ clerkId: userId }).lean())!
      assert.equal(profile.role, 'customer'); assert.equal(profile.email, 'new@example.com')
      assert.equal(profile.imageUrl, data.image_url)
      assert.equal('password' in profile, false); assert.equal('public_metadata' in profile, false)
      await deliver('msg_update_new', 'user.updated', { ...data, first_name: 'Updated' }, timestamp + 10).expect(200)
      await deliver('msg_old_new', 'user.updated', data, timestamp + 1).expect(200)
      assert.equal((await Customer.findOne({ clerkId: userId }))!.name, 'Updated Customer')
      await deliver('msg_delete_new', 'user.deleted', { id: userId }, timestamp + 20).expect(200)
      await deliver('msg_delete_new', 'user.deleted', { id: userId }, timestamp + 20).expect(200)
      await deliver('msg_late_new', 'user.updated', data, timestamp + 30).expect(200)
      profile = (await Customer.findOne({ clerkId: userId }).lean())!
      assert.ok(profile.deletedAt); assert.equal(profile.email, ''); assert.equal(profile.name, ''); assert.equal(profile.imageUrl, '')
      assert.equal(await Customer.countDocuments({ clerkId: userId }), 1)
      await deliver('msg_invalid_timestamp', 'user.created', data, -1).expect(400)
      assert.equal(await WebhookEvent.countDocuments({ eventId: 'msg_invalid_timestamp' }), 0)
      await deliver('msg_invalid_profile', 'user.created', { ...data, id: 'user_invalid', email_addresses: null }, timestamp).expect(400)
      assert.equal(await Customer.countDocuments({ clerkId: 'user_invalid' }), 0)
      await deliver('msg_delete_first', 'user.deleted', { id: 'user_deleted_before_create' }, timestamp + 40).expect(200)
      await deliver('msg_create_after_delete', 'user.created', { ...data, id: 'user_deleted_before_create' }, timestamp).expect(200)
      assert.ok((await Customer.findOne({ clerkId: 'user_deleted_before_create' }))!.deletedAt)
    })
    await t.test('admin optimistic concurrency/category cleanup and seed tombstones', async () => {
      const category = await Category.findOne({ id: 'women' })
      await request(app).delete('/api/admin/categories/women').set('X-Test-Identity', 'admin-a').set('If-Match', String(category!.__v)).expect(204)
      assert.equal(await Product.countDocuments({ categoryIds: 'women' }), 0)
      await seedDatabase(); assert.ok((await Category.findOne({ id: 'women' }))!.deletedAt)
      assert.ok(await Activity.countDocuments() > 0)
    })
  } finally { await mongoose.disconnect(); await mongo.stop() }
})
