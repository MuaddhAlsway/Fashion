import { MongoConfigurationError } from '../lib/mongodb-diagnostics.js'
import dns from 'node:dns'
import { isIP } from 'node:net'

export function parseMongoDnsServers(value: string | undefined): string[] {
  if (!value?.trim()) return []
  const servers = value.split(',').map(server => server.trim())
  if (servers.some(server => !isIP(server))) throw new MongoConfigurationError('MONGODB_DNS_INVALID')
  return servers
}
// Node maintains separate callback and promise resolvers. Configure both before connecting.
export function configureMongoDns(servers: string[]) {
  if (!servers.length) return
  dns.setServers(servers)
  dns.promises.setServers(servers)
}
