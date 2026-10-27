// Vite resolves these existing local assets into deployable URLs; no upload server.
const files = import.meta.glob('../assets/*.{png,jpg,jpeg,webp,avif}', { eager: true, query: '?url', import: 'default' })
export const assetOptions = Object.entries(files).map(([path, url]) => ({ name: path.split('/').pop()!, url: url as string })).sort((a, b) => a.name.localeCompare(b.name))
export function isLocalAsset(value: string) { return assetOptions.some((asset) => asset.url === value) }
