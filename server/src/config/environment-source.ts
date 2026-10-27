import { config as dotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { MongoConfigurationError } from '../lib/mongodb-diagnostics.js'

// One explicit server-side source for runtime and diagnostics. Never logs values.
export function readServerEnvironment(envFile = fileURLToPath(new URL('../../.env', import.meta.url)), inherited: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const values: NodeJS.ProcessEnv = Object.fromEntries(Object.entries(inherited).filter(([, value]) => value !== undefined))
  const result = dotenv({ path: envFile, processEnv: values, quiet: true })
  if (result.error && (result.error as NodeJS.ErrnoException).code !== 'ENOENT') throw new MongoConfigurationError('MONGODB_ENV_UNREADABLE')
  return values
}
