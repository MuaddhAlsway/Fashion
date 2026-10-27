import type { ClientSession } from 'mongoose'
import { Activity } from '../models/index.js'
export async function audit(actorId: string, action: string, entityId: string, session?: ClientSession) {
  await Activity.create([{ actorId, action, entityId }], { session })
}
