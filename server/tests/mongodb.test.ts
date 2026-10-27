import { loadMongoUri } from '../src/config/mongodb-env.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'
import { databaseNameFromUri } from '../src/config/mongo-uri.js'
import { validateEnvironment } from '../src/config/env.js'
import { connectDatabase, disconnectDatabase, isDatabaseReady, pingDatabase } from '../src/config/database.js'
import { checkMongoReadiness } from '../src/services/mongodb-readiness.js'
import { Product, Cart, Wishlist, Order, Customer, Category, Address, Activity, models } from '../src/models/index.js'
import { readSeed, seedDatabase } from '../src/seed/index.js'
import { createApp } from '../src/application.js'
const silent = { info() {}, error() {} }

test('URI requires an explicit database and never exposes failed values', () => {
  assert.equal(databaseNameFromUri('mongodb://127.0.0.1:27017/fashion_test'), 'fashion_test')
  assert.equal(databaseNameFromUri('mongodb://host-a:27017,host-b:27017/fashion_test?replicaSet=rs0'), 'fashion_test')
  assert.equal(databaseNameFromUri('mongodb+srv://example.invalid/fashion_test?authSource=admin'), 'fashion_test')
  for (const uri of ['mongodb://127.0.0.1', 'mongodb://127.0.0.1/', 'mongodb://127.0.0.1/?authSource=admin', 'mongodb://127.0.0.1/a/b', 'mongodb://127.0.0.1/bad%2Fname', 'mongodb://user:secret-sentinel@host/']) {
    assert.throws(() => databaseNameFromUri(uri), error => error instanceof Error && error.message.includes('MONGODB_URL') && !error.message.includes('secret-sentinel'))
  }
  assert.throws(() => validateEnvironment({ MONGODB_URL: 'mongodb://127.0.0.1' }), /explicit database name/)
})

test('Mongo-only env loader loads a fixture and preserves injected URI precedence', () => {
  const folder = mkdtempSync(resolve('node_modules/.cache/mongodb-env-'))
  const file = resolve(folder, 'fixture.env')
  try {
    writeFileSync(file, 'MONGODB_URL=mongodb://127.0.0.1:27017/file_fixture\nEMAIL_ENABLED=true\n')
    assert.equal(databaseNameFromUri(loadMongoUri(file, {})), 'file_fixture')
    assert.equal(databaseNameFromUri(loadMongoUri(file, { MONGODB_URL: 'mongodb://127.0.0.1:27017/injected_fixture' })), 'injected_fixture')
  } finally { unlinkSync(file); rmdirSync(folder) }
})
test('models enforce document array/money integrity without changing API fields', async () => {
  const source = readSeed().products[0]!
  const { price, ...rest } = source
  const product = new Product({ ...rest, priceMinor: Math.round(price * 100) })
  await product.validate()
  product.sizes = []
  await assert.rejects(product.validate(), /Sizes must be nonempty and unique/)
  product.sizes = ['M', 'M']
  await assert.rejects(product.validate(), /Sizes must be nonempty and unique/)
  await assert.rejects(new Cart({ ownerId: 'user_test', items: [{ id: source.id, size: 'M', quantity: 1 }, { id: source.id, size: 'M', quantity: 1 }] }).validate(), /Cart product\/size pairs/)
  await assert.rejects(new Wishlist({ ownerId: 'user_test', productIds: [source.id, source.id] }).validate(), /Favorite product identifiers/)
  await assert.rejects(new Order({ items: [] }).validate())
  await assert.rejects(new Order({ totalMinor: 1.5 }).validate(), /Amounts must be nonnegative/)
  await assert.rejects(new Order({ items: [{ id: 'product', quantity: 1, priceMinor: -1 }] }).validate())
  for (const model of models) { assert.ok(model.schema.options.timestamps, `${model.modelName} timestamps`); assert.equal(model.schema.options.strict, 'throw') }
  for (const [model, field] of [[Product, 'id'], [Customer, 'clerkId'], [Category, 'id'], [Cart, 'ownerId'], [Wishlist, 'ownerId']] as const) assert.ok(model.schema.indexes().some(([keys, settings]) => keys[field] === 1 && settings.unique))
  assert.ok(Address.schema.indexes().some(([keys]) => keys.ownerId === 1))
  assert.ok(Activity.schema.indexes().some(([keys]) => keys.createdAt === -1))
})

test('Mongo-only read-only readiness, target selection, seed reruns and clean close', { timeout: 240000 }, async t => {
  const mongo = await MongoMemoryReplSet.create({ instanceOpts: [{ dbPath: mkdtempSync(resolve('node_modules/.cache/mongodb-readiness-')), args: ['--setParameter', 'diagnosticDataCollectionEnabled=false'] }], replSet: { count: 1 }, binary: { version: '8.0.20', downloadDir: resolve('node_modules/.cache/mongodb') } })
  const uri = mongo.getUri('fashion_readiness_test')
  try {
    await t.test('unseeded check does not create databases, collections or indexes', async () => {
      const result = await checkMongoReadiness(uri, { catalog: true, indexes: true })
      assert.equal(result.databaseSelectedFromUri, true); assert.equal(result.ping, true); assert.equal(result.transactionsSupported, true)
      assert.equal(result.catalog?.totalProducts, 0); assert.equal(result.catalog?.seedMarkerPresent, false); assert.equal(result.indexes?.ready, false)
      const check = mongoose.createConnection(uri, { autoCreate: false, autoIndex: false })
      try { await check.asPromise(); assert.equal((await check.db!.listCollections({}, { nameOnly: true }).toArray()).length, 0) } finally { await check.close() }
    })
    await connectDatabase(uri)
    assert.equal(mongoose.connection.db?.databaseName, 'fashion_readiness_test')
    assert.equal(isDatabaseReady(), true); assert.equal(await pingDatabase(), true)
    await t.test('explicit seed preserves records and the read-only check cannot repair indexes', async () => {
      await seedDatabase()
      const initialIds = (await Product.find().sort({ id: 1 }).lean()).map(item => String(item._id))
      await Product.updateOne({ id: 'relaxed-cotton-shirt' }, { $set: { name: 'Admin edited title' } })
      await seedDatabase()
      assert.equal((await Product.findOne({ id: 'relaxed-cotton-shirt' }))!.name, 'Admin edited title')
      assert.deepEqual((await Product.find().sort({ id: 1 }).lean()).map(item => String(item._id)), initialIds)
      const beforeCollections = await mongoose.connection.db!.listCollections({}, { nameOnly: true }).toArray()
      const result = await checkMongoReadiness(uri, { catalog: true, indexes: true })
      assert.equal(result.catalog?.originalSeedProductsPresent, 12); assert.equal(result.catalog?.activeProducts, 12); assert.equal(result.catalog?.seedMarkerPresent, true)
      assert.equal(result.indexes?.missing, 0)
      assert.deepEqual(await mongoose.connection.db!.listCollections({}, { nameOnly: true }).toArray(), beforeCollections)
      await Product.updateOne({ id: 'midi-slip-dress' }, { $set: { deletedAt: new Date() } })
      await seedDatabase()
      const tombstones = await checkMongoReadiness(uri, { catalog: true })
      assert.equal(tombstones.catalog?.originalSeedProductsPresent, 12); assert.equal(tombstones.catalog?.originalSeedProductsDeleted, 1); assert.equal(tombstones.catalog?.activeProducts, 11)
    })
    await t.test('health returns unavailable when a ping fails despite connected state', async () => {
      const config = validateEnvironment({ MONGODB_URL: uri, NODE_ENV: 'test' })
      const app = createApp(config, { databaseReady: () => true, databasePing: async () => false, log: silent })
      assert.equal((await request(app).get('/api/health').expect(503)).body.database, 'disconnected')
      await request(app).get('/api/health/live').expect(200)
    })
  } finally { await disconnectDatabase(); await mongo.stop() }
  assert.equal(isDatabaseReady(), false); assert.equal(await pingDatabase(), false)
})
