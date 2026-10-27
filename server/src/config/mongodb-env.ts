import { parseMongoDnsServers } from './mongodb-dns.js'
import { readServerEnvironment } from './environment-source.js'
import { databaseNameFromUri } from './mongo-uri.js'

export type MongoConfiguration = { mongodbUrl: string; mongodbDnsServers?: string[] }
export function parseMongoConfiguration(values: NodeJS.ProcessEnv): MongoConfiguration {
  const mongodbUrl = values.MONGODB_URL?.trim() ?? ''
  databaseNameFromUri(mongodbUrl)
  return { mongodbUrl, mongodbDnsServers: parseMongoDnsServers(values.MONGODB_DNS_SERVERS) }
}
// Diagnostics use the exact same source and Mongo parser as normal startup,
// without validating credentials for deferred services.
export function loadMongoConfiguration(envFile?: string, inherited: NodeJS.ProcessEnv = process.env): MongoConfiguration {
  return parseMongoConfiguration(readServerEnvironment(envFile, inherited))
}
// Compatibility for code that only needs the URI. Loading does not mutate DNS.
export function loadMongoUri(envFile?: string, inherited: NodeJS.ProcessEnv = process.env): string {
  return loadMongoConfiguration(envFile, inherited).mongodbUrl
}
