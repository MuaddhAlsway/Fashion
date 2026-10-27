import test from 'node:test'
import assert from 'node:assert/strict'
import dns from 'node:dns'
import { configureMongoDns, parseMongoDnsServers } from '../src/config/mongodb-dns.js'
import { mongoDiagnostic } from '../src/lib/mongodb-diagnostics.js'

test('DNS configuration validates IPs and configures both Node resolvers', () => {
  assert.deepEqual(parseMongoDnsServers(undefined), [])
  assert.deepEqual(parseMongoDnsServers('1.1.1.1, 8.8.8.8'), ['1.1.1.1', '8.8.8.8'])
  assert.throws(() => parseMongoDnsServers('https://invalid.example'))
  const callback = dns.getServers(), promise = dns.promises.getServers()
  try {
    configureMongoDns(['1.1.1.1', '8.8.8.8'])
    assert.deepEqual(dns.getServers(), ['1.1.1.1', '8.8.8.8'])
    assert.deepEqual(dns.promises.getServers(), ['1.1.1.1', '8.8.8.8'])
  } finally { dns.setServers(callback); dns.promises.setServers(promise) }
})
test('querySrv refusal is a DNS failure, distinct from refused TCP connections', () => {
  assert.equal(mongoDiagnostic({ code: 'ECONNREFUSED', syscall: 'querySrv' }).code, 'MONGODB_DNS_FAILED')
  assert.equal(mongoDiagnostic({ code: 'ECONNREFUSED', syscall: 'connect' }).code, 'MONGODB_CONNECTION_REFUSED')
})
