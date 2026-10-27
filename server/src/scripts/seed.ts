import { loadEnvironment } from '../config/env.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { seedDatabase } from '../seed/index.js'
import { logger } from '../lib/logger.js'
try { const config = loadEnvironment(); await connectDatabase(config); const result = await seedDatabase(); logger.info('seed_complete', result) }
catch { logger.error('seed_failed', { hint: 'Check configuration, source assets, indexes, and replica-set transaction support' }); process.exitCode = 1 }
finally { await disconnectDatabase() }
