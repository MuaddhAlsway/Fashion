import { MongoReadinessError, type MongoDiagnosticStage } from '../lib/mongodb-diagnostics.js'
import mongoose from 'mongoose'
import { mongoConnectionSettings } from '../config/database.js'
import type { MongoConfiguration } from '../config/mongodb-env.js'

export type MongoReadiness = {
  connected: true; databaseSelectedFromUri: true; ping: true; transactionsSupported: boolean; writablePrimary: boolean
  catalog?: { totalProducts: number; activeProducts: number; originalSeedProductsPresent: number; originalSeedProductsDeleted: number; originalSeedProductsMissing: number; seedMarkerPresent: boolean }
  indexes?: { expected: number; missing: number; ready: boolean; collectionsMissing: number }
}
// Uses an isolated connection, never registers models or calls createIndexes/seed.
export async function checkMongoReadiness(config: MongoConfiguration | string, options: { catalog?: boolean; indexes?: boolean } = {}): Promise<MongoReadiness> {
  const { uri, options: connectionOptions } = mongoConnectionSettings(config)
  const dbName = connectionOptions.dbName
  const connection = mongoose.createConnection(uri, connectionOptions)
  let stage: MongoDiagnosticStage = 'connect'
  let failed = false
  try {
    await connection.asPromise()
    const db = connection.db
    if (!db || db.databaseName !== dbName) throw new Error('Database target mismatch')
    stage = 'ping'
    await db.command({ ping: 1 }, { timeoutMS: 1500 })
    stage = 'topology'
    const hello = await db.command({ hello: 1 }, { timeoutMS: 1500 })
    const report: MongoReadiness = { connected: true, databaseSelectedFromUri: true, ping: true, transactionsSupported: hello.logicalSessionTimeoutMinutes !== undefined && Boolean(hello.setName || hello.msg === 'isdbgrid'), writablePrimary: Boolean(hello.isWritablePrimary || hello.msg === 'isdbgrid') }
    if (options.catalog) {
      stage = 'catalog'
      // Source validation only. The imported default-connection models stay disconnected.
      const { readSeed } = await import('../seed/index.js')
      const ids = readSeed().products.map(product => product.id)
      const products = db.collection('products')
      const [totalProducts, activeProducts, originalPresent, originalDeleted, marker] = await Promise.all([
        products.countDocuments(), products.countDocuments({ deletedAt: null }), products.distinct('id', { id: { $in: ids } }), products.distinct('id', { id: { $in: ids }, deletedAt: { $ne: null } }), db.collection('migrations').findOne({ key: 'frontend-original-v1' }, { projection: { _id: 1 } }),
      ])
      report.catalog = { totalProducts, activeProducts, originalSeedProductsPresent: originalPresent.length, originalSeedProductsDeleted: originalDeleted.length, originalSeedProductsMissing: ids.length - originalPresent.length, seedMarkerPresent: Boolean(marker) }
    }
    if (options.indexes) {
      stage = 'indexes'
      const { models } = await import('../models/index.js')
      let expected = 0, missing = 0, collectionsMissing = 0
      for (const model of models) {
        const definitions = model.schema.indexes()
        let indexes: { key: Record<string, unknown>; unique?: boolean; sparse?: boolean }[]
        try { indexes = await db.collection(model.collection.name).listIndexes().toArray() }
        catch (error) { if (typeof error === 'object' && error && 'code' in error && error.code === 26) { if (definitions.length) collectionsMissing++; expected += definitions.length; missing += definitions.length; continue } throw error }
        for (const [fields, settings] of definitions) {
          expected++
          if (!indexes.some(index => JSON.stringify(Object.entries(index.key)) === JSON.stringify(Object.entries(fields)) && Boolean(index.unique) === Boolean(settings.unique) && Boolean(index.sparse) === Boolean(settings.sparse))) missing++
        }
      }
      report.indexes = { expected, missing, ready: missing === 0 && collectionsMissing === 0, collectionsMissing }
    }
    return report
  } catch (error) { failed = true; throw new MongoReadinessError(stage, error) }
  finally { try { await connection.close() } catch (error) { if (!failed) throw new MongoReadinessError('disconnect', error) } }
}
