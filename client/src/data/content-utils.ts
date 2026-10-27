import type { ContentState, StoreCategory, StorePost, StoreProduct } from './content-types'
import { isLocalAsset } from './assets'

export function slugify(value: string) { return value.toLowerCase().trim().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
export function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
export function productError(product: StoreProduct): string {
  if (!text(product.id) || slugify(product.id) !== product.id || !text(product.name) || !text(product.description) || !text(product.brand)) return 'Enter a unique URL-safe ID, product name, description, and brand.'
  if (!Number.isFinite(product.price) || product.price <= 0) return 'Price must be a positive number.'
  if (!['Women', 'Men'].includes(product.department)) return 'Select a valid department.'
  if (!Array.isArray(product.sizes) || !product.sizes.length || product.sizes.some(size => !text(size)) || new Set(product.sizes).size !== product.sizes.length) return 'Enter at least one size without duplicates.'
  if (!Array.isArray(product.images) || !product.images.length || product.images.some(image => !isLocalAsset(image.src) || !text(image.alt) || !text(image.view))) return 'Each product image needs a local asset, descriptive alt text, and view label.'
  if (new Set(product.images.map(image => image.src)).size !== product.images.length) return 'Choose a different asset for each gallery view.'
  if (![product.material, product.fit, product.care].every(text) || typeof product.featured !== 'boolean' || !isLocalAsset(product.featuredImage) || !text(product.featuredAlt) || typeof product.label !== 'string') return 'Complete product details and featured image metadata.'
  if (!isLocalAsset(product.image) || !text(product.imageAlt) || !Array.isArray(product.categoryIds) || product.categoryIds.some(id => !text(id))) return 'Choose a cover image, alt text and valid categories.'
  return ''
}
export function categoryError(category: StoreCategory): string {
  return category.id === 'all' || !text(category.id) || slugify(category.id) !== category.id || !text(category.name) || !text(category.description) || !text(category.imageAlt) || !isLocalAsset(category.image) || !['all', 'women', 'men'].includes(category.department) ? 'Complete the ID, title, description, department, local image, and alt text.' : ''
}
export function postError(post: StorePost): string {
  if (!text(post.slug) || slugify(post.slug) !== post.slug || !text(post.title) || !text(post.category) || !text(post.excerpt) || !text(post.imageAlt) || !isLocalAsset(post.image)) return 'Complete the URL-safe slug, title, category, excerpt, image and descriptive alt text.'
  if (post.category === 'All stories') return 'Choose a specific category; All stories is reserved for the filter.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || Number.isNaN(Date.parse(post.date)) || new Date(post.date).toISOString().slice(0, 10) !== post.date) return 'Enter a valid publication date.'
  if (!Array.isArray(post.sections) || !post.sections.length || post.sections.some(section => !text(section.heading) || !section.paragraphs?.length || section.paragraphs.some(paragraph => !text(paragraph)))) return 'Add a body with headings and paragraphs.'
  return ''
}
export function bodyToSections(body: string) {
  return body.split(/^##\s+/m).filter(part => part.trim()).map((part, index) => {
    const lines = part.trim().split('\n')
    const heading = lines.shift()?.trim() || `Section ${index + 1}`
    return { heading, paragraphs: lines.join('\n').trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) }
  })
}
export function sectionsToBody(sections: StorePost['sections']) { return sections.map(section => `## ${section.heading}\n\n${section.paragraphs.join('\n\n')}`).join('\n\n') }

export function validContent(value: unknown): value is ContentState {
  try {
    const data = value as ContentState
    return Array.isArray(data.products) && data.products.every(p => !productError(p)) && new Set(data.products.map(p => p.id)).size === data.products.length &&
      Array.isArray(data.categories) && data.categories.every(c => !categoryError(c)) && new Set(data.categories.map(c => c.id)).size === data.categories.length &&
      Array.isArray(data.journal) && data.journal.every(p => !postError(p)) && new Set(data.journal.map(p => p.slug)).size === data.journal.length &&
      ['hero', 'homeCategories', 'homeFeatured', 'brandStory', 'aboutHero', 'aboutStory', 'aboutCta', 'contact'].every(key => Object.values(data.website[key]).every(value => typeof value === 'string') && text(data.website[key].title) && text(data.website[key].description) && (!('image' in data.website[key]) || (isLocalAsset(data.website[key].image!) && text(data.website[key].imageAlt)))) &&
      ['privacy', 'terms'].every(key => { const doc = data.legal[key as 'privacy' | 'terms']; return text(doc.title) && text(doc.intro) && text(doc.body) }) &&
      Array.isArray(data.activity) && data.activity.every(item => text(item.id) && text(item.message) && text(item.date))
  } catch { return false }
}
