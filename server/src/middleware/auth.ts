import type { RequestHandler, Request } from 'express'
import { createClerkClient, verifyToken } from '@clerk/express'
import type { Environment } from '../config/env.js'
import { Customer } from '../models/index.js'
import { HttpError } from '../lib/http-error.js'
export type Identity = { clerkId: string; name: string; email: string }
export type Authenticator = (request: Request) => Promise<Identity | null>
export function clerkAuthenticator(config: Environment): Authenticator {
  return async req => {
    if (!config.clerkSecretKey) throw new HttpError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured')
    const authorization = req.get('authorization')
    if (!authorization?.startsWith('Bearer ')) return null
    try {
      const claims = await verifyToken(authorization.slice(7), { secretKey: config.clerkSecretKey, authorizedParties: [config.clientOrigin] })
      if (!claims.sub || !claims.sid || claims.sts === 'pending') return null
      const client = createClerkClient({ secretKey: config.clerkSecretKey })
      const session = await client.sessions.getSession(claims.sid)
      if (session.status !== 'active' || session.userId !== claims.sub) return null
      const user = await client.users.getUser(claims.sub)
      const email = user.emailAddresses.find(item => item.id === user.primaryEmailAddressId && item.verification?.status === 'verified')?.emailAddress
      if (!email) throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'A verified primary email is required')
      return { clerkId: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' '), email: email.toLowerCase() }
    } catch (error) { if (error instanceof HttpError) throw error; return null }
  }
}
export function requireCustomer(authenticate: Authenticator): RequestHandler {
  return async (req, res, next) => {
    const identity = await authenticate(req)
    if (!identity) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue')
    const existing = await Customer.findOne({ clerkId: identity.clerkId })
    if (existing?.deletedAt) throw new HttpError(403, 'ACCOUNT_DISABLED', 'Account is not available')
    const customer = existing ?? await Customer.findOneAndUpdate({ clerkId: identity.clerkId }, { $setOnInsert: { ...identity, role: 'customer' } }, { upsert: true, returnDocument: 'after', runValidators: true })
    res.locals.customer = customer
    res.locals.identity = identity
    next()
  }
}
export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (res.locals.customer?.role !== 'admin') throw new HttpError(403, 'FORBIDDEN', 'Admin access required')
  next()
}
export function owner(res: { locals: Record<string, unknown> }) { return (res.locals.identity as Identity).clerkId }
