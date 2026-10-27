import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'
import type { Logger } from '../lib/logger.js'

export function requestLogger(log: Logger): RequestHandler {
  return (req, res, next) => {
    const started = performance.now()
    const requestId = randomUUID()
    res.locals.requestId = requestId
    res.setHeader('X-Request-Id', requestId)
    res.on('finish', () => {
      log.info('http_request', { requestId, method: req.method, route: typeof req.route?.path === 'string' ? req.route.path : 'unmatched', status: res.statusCode, durationMs: Math.round(performance.now() - started) })
    })
    next()
  }
}
