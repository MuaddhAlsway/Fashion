import { z } from 'zod'
import type { Request, Response } from 'express'
import { HttpError } from './http-error.js'
export function pathValue(req: Request, key: string) { const value = req.params[key]; if (typeof value !== 'string') throw new HttpError(400, 'INVALID_PATH', 'Invalid path'); return value }
export function documentId(value: string) { if (!/^[a-f\d]{24}$/i.test(value)) throw new HttpError(400, 'INVALID_ID', 'Invalid record identifier'); return value }
export function version(req: Request) { const value = z.coerce.number().int().min(0).safeParse(req.get('If-Match')); if (!value.success || !req.get('If-Match')) throw new HttpError(428, 'VERSION_REQUIRED', 'Supply the record version in If-Match'); return value.data }
export function dto(value: unknown): Record<string, unknown> {
  const source = JSON.parse(JSON.stringify(value)) as Record<string, unknown>
  const { searchText: _search, requestKey: _key, requestHash: _hash, _id, __v, deletedAt: _deleted, stockBySize: _stock, ...rest } = source
  return { ...rest, recordId: String(_id), version: __v ?? 0 }
}
export function productDto(value: unknown) { const data = dto(value); const { priceMinor, ...rest } = data; return { ...rest, price: Number(priceMinor) / 100 } }
export function postDto(value: unknown) { const data = dto(value); return { ...data, dateLabel: new Date(`${data.date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) } }
export function pageResult(res: Response, data: unknown, total: number, page: number, limit: number) { res.json({ data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }) }
export function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
