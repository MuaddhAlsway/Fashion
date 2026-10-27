import type { StoreProduct } from './content-types'

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function matchesProduct(product: Pick<StoreProduct, 'name' | 'brand' | 'department'>, query: string) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  const haystack = normalize(`${product.name} ${product.brand} ${product.department}`)
  return tokens.every(token => token === 'men' || token === 'women'
    ? normalize(product.department) === token
    : haystack.includes(token))
}
