import { mongoDiagnostic } from './lib/mongodb-diagnostics.js'
import { startReceiptWorker } from './services/email.js'
import type { Server } from 'node:http'
import { createApp } from './app.js'
import { loadEnvironment } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { logger, type Logger } from './lib/logger.js'

const config = loadEnvironment()

let startupStage = 'connect'
let server: Server | undefined
let stopping = false
let stopReceipts: (() => void) | undefined

async function shutdown(failed = false) {
  if (stopping) return
  stopping = true
  stopReceipts?.()
  const timeout = setTimeout(() => { logger.error('shutdown_timeout'); process.exit(1) }, 10_000)
  timeout.unref()
  try {
    if (server?.listening) await new Promise<void>((resolve, reject) => { server!.close(error => error ? reject(error) : resolve()); server!.closeIdleConnections() })
    await disconnectDatabase()
    process.exitCode = failed ? 1 : 0
    logger.info('server_stopped')
  } catch { logger.error('shutdown_failed'); process.exitCode = 1 }
  finally { clearTimeout(timeout) }
}

async function start() {
  try {
    await connectDatabase(config)
    logger.info('database_connected')
  } catch (error) {
    logger.error('startup_failed', { ...mongoDiagnostic(error), startupStage })
    void shutdown(true)
    return
  }
  if (stopping) { await disconnectDatabase(); return }
  startupStage = 'http'
  if (config.emailEnabled) stopReceipts = startReceiptWorker(config)
  const app = createApp(config)
  server = app.listen(config.port, () => logger.info('server_listening', { port: config.port, environment: config.nodeEnv }))
  server.on('error', () => { logger.error('http_server_failed'); void shutdown(true) })
}

const app = createApp(config)

if (process.env.VERCEL) {
  startupStage = 'connect'
  try {
    await connectDatabase(config)
    logger.info('database_connected')
  } catch (error) {
    logger.error('startup_failed', { ...mongoDiagnostic(error), startupStage })
    throw error
  }
}

if (!process.env.VERCEL) {
  process.once('SIGINT', () => { void shutdown() })
  process.once('SIGTERM', () => { void shutdown() })
  process.once('uncaughtException', () => { logger.error('uncaught_exception'); void shutdown(true) })
  process.once('unhandledRejection', () => { logger.error('unhandled_rejection'); void shutdown(true) })
  void start()
}

export default app
