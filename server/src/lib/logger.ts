export type LogFields = Record<string, string | number | boolean>
export interface Logger {
  info(event: string, fields?: LogFields): void
  error(event: string, fields?: LogFields): void
}
// Pass explicit safe metadata only, never env objects, raw errors, URLs or bodies.
export const logger: Logger = {
  info(event, fields = {}) { console.log(JSON.stringify({ time: new Date().toISOString(), level: 'info', event, ...fields })) },
  error(event, fields = {}) { console.error(JSON.stringify({ time: new Date().toISOString(), level: 'error', event, ...fields })) },
}
