import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { HttpError } from './http-error.js'
export const assetsDirectory = fileURLToPath(new URL('../../../client/src/assets/', import.meta.url))
export function approvedAssets() { return readdirSync(assetsDirectory).filter(name => /\.(png|jpe?g|webp|avif)$/.test(name)).sort() }
export function assertAssets(values: string[]) { const approved = new Set(approvedAssets()); if (values.some(value => !approved.has(value))) throw new HttpError(400, 'UNKNOWN_ASSET', 'Choose an existing approved image filename') }
// Reads only named public frontend seed modules, never environment/configuration files.
export function sourceText(relative: string) { const path = resolve(assetsDirectory, '../data', relative); if (!existsSync(path)) throw new Error('Seed source missing'); return readFileSync(path, 'utf8') }
