import { createClerkClient } from '@clerk/express'
import mongoose from 'mongoose'
import { loadEnvironment } from '../config/env.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { Customer, ensureIndexes } from '../models/index.js'
import { audit } from '../services/audit.js'
import { logger } from '../lib/logger.js'
// Explicit operator-only procedure, never an HTTP signup/bootstrap endpoint.
try {
  const config = loadEnvironment()
  const userId = process.argv[2], expectedEmail = process.argv[3]?.toLowerCase()
  if (!config.clerkSecretKey || !userId?.startsWith('user_') || !expectedEmail || process.argv[4] !== '--confirm') throw new Error('Invalid promotion arguments')
  const user = await createClerkClient({ secretKey: config.clerkSecretKey }).users.getUser(userId)
  const verified = user.emailAddresses.some(item => item.emailAddress.toLowerCase() === expectedEmail && item.verification?.status === 'verified')
  if (!verified || !user.lastSignInAt) throw new Error('Account must have signed in with verified email')
  await connectDatabase(config); await ensureIndexes()
  await mongoose.connection.transaction(async session => {
    const existing = await Customer.findOne({ clerkId: userId }).session(session)
    if (existing?.deletedAt) throw new Error('Disabled account')
    if (existing?.role === 'admin') return
    await Customer.updateOne({ clerkId: userId }, { $set: { role: 'admin', email: expectedEmail, name: [user.firstName, user.lastName].filter(Boolean).join(' ') } }, { upsert: true, session })
    await audit('operator-cli', 'admin.promote', userId, session)
  })
  logger.info('admin_promotion_complete')
} catch { logger.error('admin_promotion_failed', { hint: 'Supply Clerk user ID, its verified email, --confirm; account must have signed in' }); process.exitCode = 1 }
finally { await disconnectDatabase() }
