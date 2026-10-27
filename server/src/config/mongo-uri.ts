import mongoose from 'mongoose'
import { MongoConfigurationError } from '../lib/mongodb-diagnostics.js'
// Parse only. Raw URI/parser exceptions must never appear in errors or logs.
export function databaseNameFromUri(uri: string): string {
  if (!uri.trim()) throw new MongoConfigurationError('MONGODB_URL_MISSING')
  if (/^mongodb(?:\+srv)?:\/\/[^/?#]+(?:\/)?(?:\?[^#]*)?$/.test(uri)) throw new MongoConfigurationError('MONGODB_DATABASE_MISSING')
  try {
    const match = /^mongodb(?:\+srv)?:\/\/[^/?#]+\/([^/?#]+)(?:\?[^#]*)?$/.exec(uri)
    if (!match?.[1]) throw new Error()
    const name = decodeURIComponent(match[1])
    if (!name || name.trim() !== name || /[\/\\. "$*<>:|?\x00]/.test(name)) throw new Error()
    const client = new mongoose.mongo.MongoClient(uri)
    if (client.options.dbName !== name) throw new Error()
    return name
  } catch { throw new MongoConfigurationError('MONGODB_URI_INVALID') }
}
