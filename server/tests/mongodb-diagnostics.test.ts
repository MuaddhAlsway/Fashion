import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mongoDiagnostic, MongoReadinessError, MongoConfigurationError } from '../src/lib/mongodb-diagnostics.js'
import { databaseNameFromUri } from '../src/config/mongo-uri.js'

test('URI failures have distinct safe configuration categories', () => {
  for (const [uri, code] of [['', 'MONGODB_URL_MISSING'], ['mongodb+srv://private.invalid/?authSource=admin', 'MONGODB_DATABASE_MISSING'], ['mongodb://user:secret-sentinel@private.invalid/', 'MONGODB_DATABASE_MISSING'], ['https://private.invalid/db', 'MONGODB_URI_INVALID']]) {
    try { databaseNameFromUri(uri!); assert.fail('URI should be rejected') }
    catch (error) { const result = mongoDiagnostic(error); assert.equal(result.code, code); assert.equal(result.stage, 'configuration'); assert.ok(!JSON.stringify(result).includes('secret-sentinel')); assert.ok(!JSON.stringify(result).includes('private.invalid')) }
  }
})

test('nested driver failures are classified without copying raw messages or hosts', () => {
  const cases: [unknown, string][] = [
    [{ code: 18 }, 'MONGODB_AUTH_FAILED'], [{ code: 13 }, 'MONGODB_READ_FORBIDDEN'], [{ cause: { code: 'ENOTFOUND' } }, 'MONGODB_DNS_FAILED'], [{ cause: { code: 'CERT_HAS_EXPIRED' } }, 'MONGODB_TLS_FAILED'], [{ code: 'EACCES' }, 'MONGODB_CONNECTION_BLOCKED'], [{ code: 'ECONNREFUSED' }, 'MONGODB_CONNECTION_REFUSED'], [{ code: 'ETIMEDOUT' }, 'MONGODB_NETWORK_TIMEOUT'], [{ code: 8000 }, 'MONGODB_ATLAS_REJECTED'], [{ name: 'MongoServerSelectionError' }, 'MONGODB_SERVER_SELECTION_TIMEOUT'], [{ name: 'MongoParseError' }, 'MONGODB_URI_INVALID'], [{ message: 'unknown secret-sentinel' }, 'MONGODB_UNKNOWN_FAILURE'],
  ]
  for (const [error, expected] of cases) {
    const raw = { message: 'mongodb://user:secret-sentinel@private.invalid/database', ...error as object }
    const safe = mongoDiagnostic(new MongoReadinessError('connect', raw))
    assert.equal(safe.code, expected); assert.equal(safe.stage, expected === 'MONGODB_AUTH_FAILED' ? 'authentication' : expected === 'MONGODB_READ_FORBIDDEN' ? 'query' : expected === 'MONGODB_DNS_FAILED' ? 'dns' : 'connect')
    assert.ok(!JSON.stringify(safe).includes('secret-sentinel')); assert.ok(!JSON.stringify(safe).includes('private.invalid')); assert.ok(!JSON.stringify(safe).includes('mongodb://'))
  }
})

test('topology metadata traversal is bounded and recognizes per-server causes', () => {
  const cycle: Record<string, unknown> = { name: 'MongoServerSelectionError', reason: { servers: new Map([['private.invalid:27017', { error: { cause: { code: 'ENOTFOUND' } } }]]) } }
  cycle.cause = cycle
  assert.equal(mongoDiagnostic(new MongoReadinessError('connect', cycle)).code, 'MONGODB_DNS_FAILED')
  assert.equal(mongoDiagnostic(new MongoReadinessError('indexes', { code: 13 })).stage, 'query')
  assert.equal(mongoDiagnostic(new MongoConfigurationError('MONGODB_ENV_UNREADABLE')).code, 'MONGODB_ENV_UNREADABLE')
})
