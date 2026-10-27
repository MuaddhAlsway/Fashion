import heroImage from '../assets/herooo.png'
import storyImage from '../assets/bannerstorymodern.png'
import aboutImage from '../assets/hero-about.png'
import womenImage from '../assets/categorywomening.png'
import menImage from '../assets/categoryMening.png'
import { seedProducts } from './products'
import { seedLegal } from './legal-documents'
import { journalStories } from './journal'
import type { ContentState } from './content-types'

export const seedContent: ContentState = {
  products: seedProducts,
  categories: [
    { id: 'women', name: 'Women', description: 'Explore the latest styles', image: womenImage, imageAlt: 'Women’s fashion collection', department: 'women' },
    { id: 'men', name: 'Men', description: 'Discover everyday essentials', image: menImage, imageAlt: 'Men’s fashion collection', department: 'men' },
  ],
  journal: journalStories,
  legal: seedLegal,
  activity: [],
  website: {
    hero: { eyebrow: 'New Collection 2026', title: 'Elevate Your Style With Premium Fashion', description: 'Discover timeless essentials and the latest trends for men and women. Crafted with care to keep you looking your best every season.', image: heroImage, imageAlt: 'Model in a dark flowing coat and cream skirt against a warm and green backdrop', ctaText: 'Shop Now', secondaryCta: 'Learn More', priceLabel: 'Starting from', priceText: '$9.99' },
    homeCategories: { eyebrow: 'Find your style', title: 'Shop by category', description: 'Explore considered styles for every day and every occasion.' },
    homeFeatured: { eyebrow: 'Selected for you', title: 'Featured pieces', description: 'Considered essentials and standout pieces for your wardrobe.', ctaText: 'View all products' },
    brandStory: { eyebrow: 'A study in everyday dressing', title: 'A quieter kind of', titleAccent: 'statement.', description: 'Explore considered pieces made for everyday wear.', image: storyImage, imageAlt: 'Model wearing a sculptural ochre coat against a warm neutral studio backdrop', ctaText: 'Shop the collection' },
    aboutHero: { eyebrow: 'Our story', title: 'Style that feels', titleAccent: 'like you.', description: 'A considered edit for everyday life—easy to combine, comfortable to wear, and open to your own point of view.', image: aboutImage, imageAlt: 'Model in black tailoring beside a vintage convertible on a sunlit street', ctaText: 'Discover the collection' },
    aboutStory: { eyebrow: '01 / Why FASHION', title: 'Fewer rules.', titleAccent: 'More possibility.', description: 'FASHION begins with a simple wardrobe question: what will you reach for again tomorrow?\n\nOur answer is a focused edit from STUDIO EDIT and FORM & LINE: relaxed cotton shirts, easy tailoring, soft knits, and minimal sneakers. Pieces for women and men that work together, without asking you to dress a certain way.\n\nStart with a shape you love. Add a different texture. Make the combination yours.' },
    aboutCta: { eyebrow: 'Your wardrobe. Your point of view.', title: 'Find your everyday favorites.', description: 'Explore the edit. Start with one piece that feels like you.', ctaText: 'Shop the collection' },
    contact: { eyebrow: 'FASHION / A conversation starts here', title: 'Get in', titleAccent: 'touch.', description: 'Questions about a fit, a piece, or your next everyday favorite? Start here.', email: '[Monitored email — to be provided]', address: '[Registered business address — to be provided]' },
  },
}

export function freshContent(): ContentState { return JSON.parse(JSON.stringify(seedContent)) as ContentState }
