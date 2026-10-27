import { createRequire } from 'node:module'
import express from 'express'
import cors from 'cors'
import { publicRoutes } from './routes/public.js'
import { adminRoutes } from './routes/admin.js'
import { customerRoutes } from './routes/customer.js'
import { paymentRoutes } from './routes/payments.js'
import { webhookRoutes } from './routes/webhooks.js'
import { clerkAuthenticator, requireCustomer, requireAdmin, type Authenticator } from './middleware/auth.js'
const require = createRequire(import.meta.url)
const helmet = require('helmet') as any
const rateLimit = require('express-rate-limit') as any
import type { Environment } from './config/env.js'
import { isDatabaseReady, pingDatabase } from './config/database.js'
import { logger, type Logger } from './lib/logger.js'
import { HttpError } from './lib/http-error.js'
import { requestLogger } from './middleware/request-logger.js'
import { errorHandler, notFound } from './middleware/error-handler.js'

export function createApp(config: Environment, options: { databaseReady?: () => boolean; databasePing?: () => Promise<boolean>; log?: Logger; authenticate?: Authenticator } = {}) {
  const app = express()
  const ready = options.databaseReady ?? isDatabaseReady
  const ping = options.databasePing ?? (options.databaseReady ? async () => options.databaseReady!() : pingDatabase)
  const log = options.log ?? logger
  app.set('env', config.nodeEnv)
  app.disable('x-powered-by')
  app.use(requestLogger(log))
  app.use(helmet())
  app.use(cors({ origin(origin, callback) {
    if (!origin || origin === config.clientOrigin) callback(null, true)
    else callback(new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed'))
  } }))

  app.get('/api/health/live', (_req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json({ status: 'ok', service: 'fashion-api' }) })
  app.get('/api/health', async (_req, res) => {
    const connected = ready() && await ping()
    res.setHeader('Cache-Control', 'no-store')
    const startupError = (globalThis as any).__startupError?.()
    res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable', service: 'fashion-api', database: connected ? 'connected' : 'disconnected', ...(startupError ? { error: startupError } : {}) })
  })
  app.use('/api', (_req, _res, next) => { if (!ready()) throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'Database is not available'); next() })
  app.use('/api/webhooks', webhookRoutes(config))
  app.use(express.json({ limit: '100kb' }))
  app.use('/api', publicRoutes())
  if (options.authenticate && config.nodeEnv !== 'test') throw new Error('Test authentication injection is only available in test mode')
  const auth = requireCustomer(options.authenticate ?? clerkAuthenticator(config))
  const privateLimit = rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Please try again later' } } })
  app.use('/api/me', privateLimit, auth, customerRoutes(config), paymentRoutes(config))
  app.use('/api/admin', privateLimit, auth, requireAdmin, adminRoutes())
  app.use(notFound)
  app.use(errorHandler(log))
  return app
}

