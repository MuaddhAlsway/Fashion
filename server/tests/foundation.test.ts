import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { loadEnvironment, validateEnvironment } from '../src/config/env.js'
import type { Logger } from '../src/lib/logger.js'

const fixture = { MONGODB_URL: 'mongodb://127.0.0.1:27017/fashion_test', PORT: '5000', NODE_ENV: 'test', CLIENT_ORIGIN: 'http://localhost:5173' }
const config = validateEnvironment(fixture)
const silent: Logger = { info() {}, error() {} }

test('configuration consumes only foundation settings, no deferred credentials', () => {
  assert.equal(config.port, 5000)
  assert.equal(validateEnvironment({ MONGODB_URL: fixture.MONGODB_URL }).clientOrigin, 'http://localhost:5173')
  assert.throws(() => validateEnvironment({}), /MONGODB_URL/)
  for (const port of ['0', '65536', '1.5', 'abc', '1e3']) assert.throws(() => validateEnvironment({ ...fixture, PORT: port }), /PORT/)
  assert.throws(() => validateEnvironment({ ...fixture, NODE_ENV: 'other' }), /NODE_ENV/)
  assert.throws(() => validateEnvironment({ ...fixture, NODE_ENV: 'production', CLIENT_ORIGIN: '' }), /CLIENT_ORIGIN/)
  for (const origin of ['*', 'https://example.com/path', 'https://example.com/', 'https://a.example,https://b.example']) assert.throws(() => validateEnvironment({ ...fixture, CLIENT_ORIGIN: origin }), /CLIENT_ORIGIN/)
  assert.throws(() => validateEnvironment({ ...fixture, MONGODB_URL: 'sensitive-test-sentinel' }), error => error instanceof Error && !error.message.includes('sensitive-test-sentinel'))
})

test('dotenv loads explicit synthetic fixture and respects injected environment', () => {
  const folder = mkdtempSync(join(tmpdir(), 'fashion-env-test-'))
  try {
    const file = join(folder, 'fixture.env')
    writeFileSync(file, 'MONGODB_URL=mongodb://127.0.0.1:27017/fixture\nPORT=5001\nNODE_ENV=test\nCLIENT_ORIGIN=http://localhost:5173\n')
    assert.equal(loadEnvironment(file, {}).port, 5001)
    assert.equal(loadEnvironment(file, { PORT: '5002' }).port, 5002)
  } finally { rmSync(folder, { recursive: true, force: true }) }
})

test('health reports database readiness and liveness separately; headers are present', async () => {
  let connected = true
  const app = createApp(config, { databaseReady: () => connected, log: silent })
  const healthy = await request(app).get('/api/health').expect(200)
  assert.equal(healthy.body.database, 'connected')
  assert.equal(healthy.headers['x-content-type-options'], 'nosniff')
  assert.equal(healthy.headers['x-powered-by'], undefined)
  assert.equal(healthy.headers['cache-control'], 'no-store')
  connected = false
  await request(app).get('/api/health').expect(503)
  await request(app).get('/api/health/live').expect(200)
})

test('CORS allows configured origin and preflight; rejects other origins', async () => {
  const app = createApp(config, { databaseReady: () => true, log: silent })
  const allowed = await request(app).get('/api/health').set('Origin', config.clientOrigin).expect(200)
  assert.equal(allowed.headers['access-control-allow-origin'], config.clientOrigin)
  await request(app).options('/api/health').set('Origin', config.clientOrigin).set('Access-Control-Request-Method', 'GET').expect(204)
  const denied = await request(app).get('/api/health').set('Origin', 'https://other.example').expect(403)
  assert.equal(denied.headers['access-control-allow-origin'], undefined)
  assert.equal(denied.body.error.code, 'ORIGIN_NOT_ALLOWED')
})

test('central handler returns safe JSON for unknown paths and invalid/large bodies', async () => {
  const app = createApp(config, { databaseReady: () => true, log: silent })
  assert.equal((await request(app).get('/missing').expect(404)).body.error.code, 'NOT_FOUND')
  assert.equal((await request(app).post('/missing').set('Content-Type', 'application/json').send('{broken').expect(400)).body.error.code, 'INVALID_JSON')
  assert.equal((await request(app).post('/missing').send({ value: 'x'.repeat(110_000) }).expect(413)).body.error.code, 'BODY_TOO_LARGE')
})

test('unexpected errors and request logs never include bodies, queries or raw errors', async () => {
  const entries: unknown[] = []
  const log: Logger = { info(event, fields) { entries.push({ event, fields }) }, error(event, fields) { entries.push({ event, fields }) } }
  const app = createApp(config, { databaseReady() { throw new Error('sensitive-error-sentinel') }, log })
  const response = await request(app).get('/api/health?token=sensitive-query-sentinel').expect(500)
  assert.equal(response.body.error.code, 'INTERNAL_ERROR')
  assert.equal(response.body.requestId, response.headers['x-request-id'])
  assert.ok(entries.some(entry => JSON.stringify(entry).includes('http_request')))
  const serialized = JSON.stringify([response.body, entries])
  assert.ok(!serialized.includes('sensitive-error-sentinel'))
  assert.ok(!serialized.includes('sensitive-query-sentinel'))
})
