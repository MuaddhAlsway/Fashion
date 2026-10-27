import { ZodError } from 'zod'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from '../lib/http-error.js'
import type { Logger } from '../lib/logger.js'

export const notFound: RequestHandler = (_req, _res, next) => { next(new HttpError(404, 'NOT_FOUND', 'Route not found')) }
export function errorHandler(log: Logger): ErrorRequestHandler {
  return (err: unknown, _req, res, next) => {
    if (res.headersSent) { next(err); return }
    let status = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred'
    if (err instanceof HttpError) { status = err.status; code = err.code; message = err.message }
    else if (err instanceof ZodError) { status = 400; code = 'VALIDATION_ERROR'; message = 'Request fields are invalid or unsupported' }
    else if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) { status = 409; code = 'DUPLICATE_RECORD'; message = 'Record already exists' }
    else if (typeof err === 'object' && err !== null && 'type' in err) {
      if (err.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Request body must be valid JSON' }
      if (err.type === 'entity.too.large') { status = 413; code = 'BODY_TOO_LARGE'; message = 'Request body exceeds the allowed size' }
      if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') { status = 415; code = 'UNSUPPORTED_ENCODING'; message = 'Request body encoding is not supported' }
    }
    if (status >= 500) log.error('request_error', { requestId: String(res.locals.requestId ?? ''), code, status })
    res.status(status).json({ error: { code, message }, requestId: res.locals.requestId })
  }
}

