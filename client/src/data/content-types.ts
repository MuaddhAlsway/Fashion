export type ProductImage = { src: string; alt: string; view: string }
export type StoreProduct = {
  id: string; name: string; brand: string; price: number; department: 'Women' | 'Men'; sizes: string[]
  image: string; imageAlt: string; images: ProductImage[]; description: string; material: string; fit: string; care: string
  categoryIds: string[]; featured: boolean; featuredImage: string; featuredAlt: string; label: string
}
export type StoreCategory = { id: string; name: string; description: string; image: string; imageAlt: string; department: 'all' | 'women' | 'men' }
export type StorePost = { slug: string; category: string; title: string; excerpt: string; date: string; dateLabel: string; image: string; imageAlt: string; imagePosition: string; sections: { heading: string; paragraphs: string[] }[] }
export type WebsiteBlock = { eyebrow: string; title: string; description: string; titleAccent?: string; image?: string; imageAlt?: string; ctaText?: string; secondaryCta?: string; priceLabel?: string; priceText?: string; email?: string; address?: string }
export type LegalDocument = { title: string; intro: string; body: string }
export type ContentState = {
  products: StoreProduct[]; categories: StoreCategory[]; journal: StorePost[]
  website: Record<string, WebsiteBlock>; legal: { privacy: LegalDocument; terms: LegalDocument }
  activity: { id: string; message: string; date: string }[]
}
