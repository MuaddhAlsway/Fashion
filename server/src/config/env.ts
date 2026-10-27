import { parseMongoConfiguration } from './mongodb-env.js'
import { readServerEnvironment } from './environment-source.js'

export type Environment = {
  clerkSecretKey?: string
  clerkWebhookSigningSecret?: string
  stripeSecretKey?: string
  stripeWebhookSecret?: string
  resendApiKey?: string
  emailFrom?: string
  emailEnabled?: boolean
  checkout?: { currency: string; shippingMinor: number; taxBasisPoints: number }
  mongodbDnsServers?: string[]
  mongodbUrl: string
  port: number
  nodeEnv: 'development' | 'test' | 'production'
  clientOrigin: string
}

export function validateEnvironment(source: NodeJS.ProcessEnv): Environment {
  const { mongodbUrl, mongodbDnsServers } = parseMongoConfiguration(source)
  const problems: string[] = []
  const rawPort = source.PORT ?? '5000'
  const port = Number(rawPort)
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) problems.push('PORT must be an integer from 1 to 65535')
  const nodeEnv = source.NODE_ENV ?? 'development'
  if (!['development', 'test', 'production'].includes(nodeEnv)) problems.push('NODE_ENV must be development, test, or production')
  const clientOrigin = source.CLIENT_ORIGIN?.trim() || (nodeEnv === 'production' ? '' : 'http://localhost:5173')
  try {
    const origin = new URL(clientOrigin)
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== clientOrigin || origin.username || origin.password) throw new Error()
  } catch { problems.push('CLIENT_ORIGIN must be one exact HTTP(S) origin without a path or trailing slash') }
  let checkout: Environment['checkout']
  if (source.CHECKOUT_ENABLED && !['true', 'false'].includes(source.CHECKOUT_ENABLED)) problems.push('CHECKOUT_ENABLED must be true or false')
  if (source.CHECKOUT_ENABLED === 'true') {
    const currency = source.CURRENCY?.toLowerCase() ?? '', shippingMinor = Number(source.SHIPPING_MINOR), taxBasisPoints = Number(source.TAX_BASIS_POINTS)
    if (!/^[a-z]{3}$/.test(currency) || !source.SHIPPING_MINOR || !Number.isSafeInteger(shippingMinor) || shippingMinor < 0 || !source.TAX_BASIS_POINTS || !Number.isInteger(taxBasisPoints) || taxBasisPoints < 0 || taxBasisPoints > 10000) problems.push('Enabled checkout requires explicit CURRENCY, SHIPPING_MINOR, TAX_BASIS_POINTS')
    checkout = { currency, shippingMinor, taxBasisPoints }
  }
  if (source.EMAIL_ENABLED && !['true', 'false'].includes(source.EMAIL_ENABLED)) problems.push('EMAIL_ENABLED must be true or false')
  if (source.EMAIL_ENABLED === 'true' && (!source.RESEND_API_KEY || !source.RESEND_FROM_EMAIL)) problems.push('Enabled email requires RESEND_API_KEY and RESEND_FROM_EMAIL')
  if (problems.length) throw new Error(`Invalid environment: ${problems.join('; ')}`)
  return { mongodbDnsServers, clerkSecretKey: source.CLERK_SECRET_KEY, clerkWebhookSigningSecret: source.CLERK_WEBHOOK_SIGNING_SECRET, stripeSecretKey: source.STRIPE_SECRET_KEY, stripeWebhookSecret: source.STRIPE_WEBHOOK_SECRET, resendApiKey: source.RESEND_API_KEY, emailFrom: source.RESEND_FROM_EMAIL, emailEnabled: source.EMAIL_ENABLED === 'true', checkout, mongodbUrl, port, nodeEnv: nodeEnv as Environment['nodeEnv'], clientOrigin }
}

// Explicit path works from src/config and dist/config, independent of shell cwd.
// Calling this function loads configuration. Importing it alone does not read .env.
export function loadEnvironment(envFile?: string, inherited: NodeJS.ProcessEnv = process.env): Environment {
  return validateEnvironment(readServerEnvironment(envFile, inherited))
}
