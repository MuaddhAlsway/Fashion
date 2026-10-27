import { mongoDiagnostic } from './lib/mongodb-diagnostics.js'
import { startReceiptWorker } from './services/email.js'
import type { Server } from 'node:http'
import express from 'express'
import { createApp } from './app.js'
import { loadEnvironment } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { logger } from './lib/logger.js'
import type { Environment } from './config/env.js'

let config: Environment | undefined
let configured = false
let app: ReturnType<typeof createApp> | ReturnType<typeof express>

try {
  config = loadEnvironment()
  app = createApp(config)
  configured = true
} catch (error) {
  logger.error('startup_failed', { stage: 'configuration' })
  app = express()
  app.use((_req, res) => {
    res.status(500).json({ status: 'error', service: 'fashion-api', message: 'Configuration error' })
  })
}

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
    if (configured) await disconnectDatabase()
    process.exitCode = failed ? 1 : 0
    logger.info('server_stopped')
  } catch { logger.error('shutdown_failed'); process.exitCode = 1 }
  finally { clearTimeout(timeout) }
}

async function start() {
  if (!configured || !config) return
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
  if (config!.emailEnabled) stopReceipts = startReceiptWorker(config!)
  server = (app as ReturnType<typeof createApp>).listen(config.port, () => logger.info('server_listening', { port: config.port, environment: config.nodeEnv }))
  server.on('error', () => { logger.error('http_server_failed'); void shutdown(true) })
}

if (configured && config && process.env.VERCEL) {
  startupStage = 'connect'
  connectDatabase(config)
    .then(() => logger.info('database_connected'))
    .catch(error => logger.error('startup_failed', { ...mongoDiagnostic(error), startupStage }))
}

if (configured && !process.env.VERCEL) {
  process.once('SIGINT', () => { void shutdown() })
  process.once('SIGTERM', () => { void shutdown() })
  process.once('uncaughtException', () => { logger.error('uncaught_exception'); void shutdown(true) })
  process.once('unhandledRejection', () => { logger.error('unhandled_rejection'); void shutdown(true) })
  void start()
}

export default app
