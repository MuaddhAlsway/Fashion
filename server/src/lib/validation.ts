import { z } from 'zod'

export const text = z.string().trim().min(1).max(500)
export const sizeLabel = z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 _-]{0,29}$/)
export const longText = z.string().trim().min(1).max(50000)
export const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const asset = z.string().min(1).max(200).refine(value => !value.includes('/') && !value.includes('\\') && !value.includes('..') && /\.(png|jpe?g|webp|avif)$/.test(value), 'Use an approved asset filename')
const unique = (values: string[]) => new Set(values).size === values.length
export const productInput = z.object({
  id: slug, name: text, brand: text, price: z.number().positive().max(1000000).refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001), department: z.enum(['Women', 'Men']),
  sizes: z.array(sizeLabel).min(1).max(50).refine(unique), image: asset, imageAlt: text,
  images: z.array(z.object({ src: asset, alt: text, view: text }).strict()).min(1).max(20).refine(images => unique(images.map(i => i.src))),
  description: longText, material: text, fit: text, care: text, categoryIds: z.array(slug).max(50).refine(unique), featured: z.boolean(), featuredImage: asset, featuredAlt: text, label: z.string().trim().max(100),
}).strict()
export const categoryInput = z.object({ id: slug.refine(value => value !== 'all'), name: text, description: longText, image: asset, imageAlt: text, department: z.enum(['all', 'women', 'men']) }).strict()
export const postInput = z.object({ slug, category: text.refine(v => v !== 'All stories'), title: text, excerpt: longText, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v), dateLabel: z.string().max(100).optional(), image: asset, imageAlt: text, imagePosition: z.string().max(40).regex(/^(center|left center|right center|\d{1,3}% (center|\d{1,3}%))$/), sections: z.array(z.object({ heading: text, paragraphs: z.array(longText).min(1).max(50) }).strict()).min(1).max(100) }).strict()
const websiteFields = { eyebrow: z.string().max(500), title: text, description: longText, titleAccent: z.string().max(500).optional(), image: asset.optional(), imageAlt: text.optional(), ctaText: text.optional(), secondaryCta: text.optional(), priceLabel: text.optional(), priceText: text.optional(), email: text.optional(), address: text.optional() }
export const websiteInput = z.object(websiteFields).strict().refine(v => !v.image || Boolean(v.imageAlt), 'Image needs alt text')
export const legalInput = z.object({ title: text, intro: longText, body: longText.refine(v => /^##\s+.+\n[\s\S]*\S/m.test(v), 'Body needs headings and paragraphs') }).strict()
export const deliveryInput = z.object({ fullName: text, phone: z.string().trim().min(3).max(50), address: text, city: text, postalCode: text, country: text }).strict()
export const email = z.email().trim().toLowerCase().max(254)
export const contactInput = z.object({ name: text, email, subject: text, message: longText }).strict()
export const newsletterInput = z.object({ email, consent: z.literal(true), noticeVersion: z.literal('newsletter-v1') }).strict()
export const lineInput = z.object({ id: slug, size: sizeLabel, quantity: z.number().int().min(1).max(99) }).strict()
export const orderInput = z.object({ details: deliveryInput, paymentMethod: z.enum(['card', 'apple-pay', 'mada']) }).strict()
export const pagination = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), q: z.string().max(120).default(''), sort: z.enum(['featured', 'price-low', 'price-high', 'newest', 'oldest', 'email-asc', 'email-desc']).default('featured'), department: z.enum(['all', 'women', 'men']).default('all'), brand: z.string().max(120).default('all'), category: z.string().max(120).default('all') }).strict()
export function parse<T>(schema: z.ZodType<T>, value: unknown): T { return schema.parse(value) }
