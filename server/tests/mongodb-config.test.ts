import assert from 'node:assert/strict'
import { test } from 'node:test'
import dns from 'node:dns'
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnvironment } from '../src/config/env.js'
import { loadMongoConfiguration } from '../src/config/mongodb-env.js'
import { mongoConnectionSettings } from '../src/config/database.js'
import { mongoDiagnostic, MongoReadinessError } from '../src/lib/mongodb-diagnostics.js'

test('runtime and diagnostics share file, inherited precedence and both resolver settings', () => {
  const folder = mkdtempSync(resolve('node_modules/.cache/shared-env-')), file = resolve(folder, 'fixture.env')
  const callbacks = dns.getServers(), promises = dns.promises.getServers()
  try {
    writeFileSync(file, 'MONGODB_URL=mongodb://127.0.0.1:27017/from_file\nMONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8\n')
    for (const inherited of [{}, { MONGODB_URL: 'mongodb://127.0.0.1:27017/from_shell', MONGODB_DNS_SERVERS: '9.9.9.9' }, { MONGODB_DNS_SERVERS: '' }, { MONGODB_DNS_SERVERS: undefined }]) {
      const runtime = loadEnvironment(file, inherited), diagnostic = loadMongoConfiguration(file, inherited)
      assert.equal(runtime.mongodbUrl, diagnostic.mongodbUrl)
      assert.deepEqual(runtime.mongodbDnsServers, diagnostic.mongodbDnsServers)
      const connection = mongoConnectionSettings(diagnostic)
      assert.equal(connection.uri, runtime.mongodbUrl)
      assert.equal(connection.options.autoCreate, false); assert.equal(connection.options.autoIndex, false)
      if (diagnostic.mongodbDnsServers?.length) {
        assert.deepEqual(dns.getServers(), diagnostic.mongodbDnsServers)
        assert.deepEqual(dns.promises.getServers(), diagnostic.mongodbDnsServers)
      }
    }
    assert.deepEqual(loadMongoConfiguration(file, {}).mongodbDnsServers, ['1.1.1.1', '8.8.8.8'])
    assert.deepEqual(loadMongoConfiguration(file, { MONGODB_DNS_SERVERS: '' }).mongodbDnsServers, [])
    assert.ok(loadMongoConfiguration(file, { EMAIL_ENABLED: 'true' }).mongodbUrl)
    assert.throws(() => loadEnvironment(file, { EMAIL_ENABLED: 'true' }), /Enabled email/)
  } finally { dns.setServers(callbacks); dns.promises.setServers(promises); unlinkSync(file); rmdirSync(folder) }
})
test('failure stages distinguish DNS, connect, authentication, query and configuration', () => {
  assert.equal(mongoDiagnostic(new MongoReadinessError('connect', { code: 'ECONNREFUSED', syscall: 'querySrv' })).stage, 'dns')
  assert.equal(mongoDiagnostic(new MongoReadinessError('connect', { code: 'ECONNREFUSED', syscall: 'connect' })).stage, 'connect')
  assert.equal(mongoDiagnostic(new MongoReadinessError('connect', { code: 18 })).stage, 'authentication')
  assert.equal(mongoDiagnostic(new MongoReadinessError('query', { code: 13 })).stage, 'query')
  assert.equal(mongoDiagnostic(new MongoReadinessError('query', new Error('private-error'))).stage, 'query')
  let failure: unknown
  try { loadMongoConfiguration(resolve('node_modules/.cache/nonexistent.env'), { MONGODB_URL: 'mongodb://127.0.0.1:27017/test', MONGODB_DNS_SERVERS: 'not-an-ip-secret-sentinel' }) } catch (error) { failure = error }
  const diagnostic = mongoDiagnostic(failure)
  assert.equal(diagnostic.code, 'MONGODB_DNS_INVALID'); assert.equal(diagnostic.stage, 'configuration')
  assert.ok(!JSON.stringify(diagnostic).includes('secret-sentinel'))
})
