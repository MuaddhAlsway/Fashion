import mongoose from 'mongoose'
import { databaseNameFromUri } from './mongo-uri.js'
import { configureMongoDns } from './mongodb-dns.js'
import type { MongoConfiguration } from './mongodb-env.js'
import { MongoReadinessError } from '../lib/mongodb-diagnostics.js'

mongoose.set('bufferCommands', false)
export function mongoConnectionSettings(config: MongoConfiguration | string) {
  const { mongodbUrl, mongodbDnsServers: configuredServers = [] } = typeof config === 'string' ? { mongodbUrl: config } : config
  // Vercel's default resolver can fail to reach Atlas SRV/direct hosts; use public resolvers there when none are configured.
  const mongodbDnsServers = configuredServers.length ? configuredServers : (process.env.VERCEL ? ['1.1.1.1', '8.8.8.8'] : [])
  configureMongoDns(mongodbDnsServers)
  return { uri: mongodbUrl, options: { dbName: databaseNameFromUri(mongodbUrl), serverSelectionTimeoutMS: 10_000, connectTimeoutMS: 10_000, autoCreate: false, autoIndex: false } }
}
export async function connectDatabase(config: MongoConfiguration | string): Promise<void> {
  const { uri, options } = mongoConnectionSettings(config)
  try { await mongoose.connect(uri, options) }
  catch (error) { throw new MongoReadinessError('connect', error) }
}
export async function disconnectDatabase(): Promise<void> { await mongoose.disconnect() }
export function isDatabaseReady(): boolean { return mongoose.connection.readyState === 1 }
export async function pingDatabase(): Promise<boolean> {
  if (!isDatabaseReady() || !mongoose.connection.db) return false
  try { await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 1500 }); return true }
  catch { return false }
}
