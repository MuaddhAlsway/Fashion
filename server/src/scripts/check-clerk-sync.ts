import mongoose from 'mongoose'
import { loadMongoConfiguration } from '../config/mongodb-env.js'
import { mongoConnectionSettings } from '../config/database.js'
import { mongoDiagnostic, MongoReadinessError, type MongoDiagnosticStage } from '../lib/mongodb-diagnostics.js'

// Read-only operator check. Never prints profiles, identities, environment values or raw errors.
let stage: MongoDiagnosticStage = 'configuration'
try {
  const { uri, options } = mongoConnectionSettings(loadMongoConfiguration())
  stage = 'connect'
  const connection = mongoose.createConnection(uri, options)
  try { await connection.asPromise() } catch (error) { await connection.close().catch(() => {}); throw error }
  try {
    stage = 'query'
    const customers = connection.db!.collection('customers')
    const indexes = await customers.listIndexes().toArray()
    const uniqueClerkId = indexes.some(index => index.unique === true && JSON.stringify(index.key) === JSON.stringify({ clerkId: 1 }))
    const target = process.env.CLERK_VERIFY_USER_ID
    const matches = target ? await customers.countDocuments({ clerkId: target, deletedAt: null }) : undefined
    console.log(JSON.stringify({ connected: true, customerCollectionAvailable: true, uniqueClerkId, ...(target ? { matchingActiveProfiles: matches, exactlyOneProfile: matches === 1 } : { signupVerificationPending: true }) }))
    if (!uniqueClerkId || (target && matches !== 1)) process.exitCode = 1
  } finally { await connection.close() }
} catch (error) {
  console.error(JSON.stringify({ event: 'clerk_sync_check_failed', ...mongoDiagnostic(new MongoReadinessError(stage, error)) }))
  process.exitCode = 1
}
