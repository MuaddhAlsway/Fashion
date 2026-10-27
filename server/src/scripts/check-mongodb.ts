import { mongoDiagnostic } from '../lib/mongodb-diagnostics.js'
import { loadMongoConfiguration } from '../config/mongodb-env.js'
import { checkMongoReadiness } from '../services/mongodb-readiness.js'
import { logger } from '../lib/logger.js'

// Explicit operator command. Never called by startup, install, or test scripts.
// No models/index/collection/seed writes; no URI, host, db name or user records output.
try {
  const args = new Set(process.argv.slice(2))
  if ([...args].some(arg => !['--catalog', '--indexes'].includes(arg))) throw new Error('Unsupported options')
  const report = await checkMongoReadiness(loadMongoConfiguration(), { catalog: args.has('--catalog'), indexes: args.has('--indexes') })
  console.log(JSON.stringify(report))
  if (!report.transactionsSupported || !report.writablePrimary || report.indexes?.ready === false) process.exitCode = 1
} catch (error) {
  logger.error('mongodb_readiness_failed', mongoDiagnostic(error))
  process.exitCode = 1
}