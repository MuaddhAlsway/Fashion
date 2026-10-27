export type MongoDiagnosticStage = 'configuration' | 'dns' | 'authentication' | 'query' | 'connect' | 'ping' | 'topology' | 'catalog' | 'indexes' | 'disconnect' | 'unknown'
export class MongoConfigurationError extends Error {
  constructor(public readonly diagnosticCode: 'MONGODB_URL_MISSING' | 'MONGODB_DATABASE_MISSING' | 'MONGODB_URI_INVALID' | 'MONGODB_ENV_UNREADABLE' | 'MONGODB_DNS_INVALID') { super(diagnosticCode === 'MONGODB_DNS_INVALID' ? 'MONGODB_DNS_SERVERS must contain resolver IP addresses' : 'MONGODB_URL must be a valid MongoDB URI with an explicit database name in its path') }
}
export class MongoReadinessError extends Error {
  constructor(public readonly stage: MongoDiagnosticStage, cause: unknown) { super('MongoDB readiness step failed', { cause }) }
}
const hints = {
  MONGODB_DNS_INVALID: 'MONGODB_DNS_SERVERS must contain comma-separated resolver IP addresses, or be blank for system DNS.',
  MONGODB_URL_MISSING: 'MONGODB_URL is missing or empty. Set it privately in server/.env or the server environment.',
  MONGODB_DATABASE_MISSING: 'Add the intended /database name before URI query options; authSource does not select the application database.',
  MONGODB_URI_INVALID: 'Privately check MongoDB URI syntax, placeholders, and percent-encoding of username/password characters.',
  MONGODB_ENV_UNREADABLE: 'The server environment file could not be read. Check file access; do not publish its contents.',
  MONGODB_AUTH_FAILED: 'Atlas rejected database authentication. Check the database user/password and authSource, not the Atlas website login.',
  MONGODB_READ_FORBIDDEN: 'The database user lacks permission for this check. Optional catalog/index checks need database read/list-index privileges.',
  MONGODB_DNS_FAILED: 'Cluster DNS/SRV resolution failed. Check the local DNS/network and MONGODB_DNS_SERVERS in server/.env or this shell; shell settings do not carry into other terminals.',
  MONGODB_TLS_FAILED: 'TLS verification failed. Check system time, trusted certificates and network interception; do not disable certificate verification.',
  MONGODB_CONNECTION_REFUSED: 'The database endpoint refused the connection. Check that the intended cluster/service is running and reachable.',
  MONGODB_CONNECTION_BLOCKED: 'The local operating system or execution sandbox blocked networking. Check local permissions/firewall.',
  MONGODB_NETWORK_TIMEOUT: 'The database network connection failed or timed out. Check Atlas IP access, VPN/firewall and outbound connectivity.',
  MONGODB_SERVER_SELECTION_TIMEOUT: 'No suitable MongoDB server was reachable in time. Check Atlas IP access and cluster/network availability; this alone does not prove an IP-allowlist issue.',
  MONGODB_ATLAS_REJECTED: 'Atlas rejected the request. Privately review database credentials, cluster state and Atlas connection guidance.',
  MONGODB_UNKNOWN_FAILURE: 'This failure could not be safely classified. Check MongoDB configuration and Atlas access privately; do not share raw errors or the URI.',
} as const
export function mongoDiagnostic(error: unknown): { code: keyof typeof hints; stage: MongoDiagnosticStage; hint: string } {
  const stage = error instanceof MongoReadinessError ? error.stage : error instanceof MongoConfigurationError ? 'configuration' : 'unknown'
  const queue: unknown[] = [error], seen = new Set<unknown>(), codes = new Set<string>(), names = new Set<string>()
  let dnsFailure = false
  let configuration: keyof typeof hints | undefined
  // Bounded metadata inspection; never output raw errors/messages/hosts.
  for (let count = 0; queue.length && count < 60; count++) {
    const value = queue.shift()
    if (!value || typeof value !== 'object' || seen.has(value)) continue
    seen.add(value)
    if (value instanceof MongoConfigurationError) configuration = value.diagnosticCode
    const item = value as Record<string, unknown>
    if (typeof item.code === 'string' || typeof item.code === 'number') codes.add(String(item.code))
    if (typeof item.name === 'string') names.add(item.name)
    if (typeof item.syscall === 'string' && /^(query|resolve)/.test(item.syscall)) dnsFailure = true
    queue.push(item.cause, item.reason, item.originalError, item.error)
    if (item.servers instanceof Map) queue.push(...item.servers.values())
    if (Array.isArray(item.errors)) queue.push(...item.errors.slice(0, 10))
  }
  let code: keyof typeof hints = configuration ?? 'MONGODB_UNKNOWN_FAILURE'
  if (!configuration) {
    if (codes.has('18')) code = 'MONGODB_AUTH_FAILED'
    else if (codes.has('13')) code = 'MONGODB_READ_FORBIDDEN'
    else if (dnsFailure || ['ENOTFOUND', 'EAI_AGAIN', 'ENODATA', 'ESERVFAIL', 'EREFUSED'].some(value => codes.has(value))) code = 'MONGODB_DNS_FAILED'
    else if ([...codes].some(value => value.startsWith('ERR_TLS_') || value.startsWith('ERR_SSL_') || ['CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(value))) code = 'MONGODB_TLS_FAILED'
    else if (codes.has('EACCES') || codes.has('EPERM')) code = 'MONGODB_CONNECTION_BLOCKED'
    else if (codes.has('ECONNREFUSED')) code = 'MONGODB_CONNECTION_REFUSED'
    else if (['ETIMEDOUT', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].some(value => codes.has(value))) code = 'MONGODB_NETWORK_TIMEOUT'
    else if (codes.has('8000')) code = 'MONGODB_ATLAS_REJECTED'
    else if (names.has('MongoServerSelectionError') || names.has('MongooseServerSelectionError')) code = 'MONGODB_SERVER_SELECTION_TIMEOUT'
    else if (names.has('MongoParseError')) code = 'MONGODB_URI_INVALID'
  }
  const failureStage = configuration ? 'configuration' : code === 'MONGODB_DNS_FAILED' ? 'dns' : code === 'MONGODB_AUTH_FAILED' ? 'authentication' : code === 'MONGODB_READ_FORBIDDEN' ? 'query' : stage
  return { code, stage: failureStage, hint: hints[code] }
}
