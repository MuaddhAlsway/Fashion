import type { StoreProduct } from './content-types'
import relaxedCottonShirtFront from '../assets/relaxed-cotton-shirt-front.jpg'
import relaxedCottonShirtBack from '../assets/relaxed-cotton-shirt-back.jpg'
import tailoredWideLegTrousersFront from '../assets/tailored-wide-leg-trousers-front.jpg'
import tailoredWideLegTrousersBack from '../assets/tailored-wide-leg-trousers-back.jpg'
import structuredEverydayJacketFront from '../assets/structured-everyday-jacket-front.jpg'
import structuredEverydayJacketBack from '../assets/structured-everyday-jacket-back.jpg'
import ribbedKnitTopFront from '../assets/ribbed-knit-top-front.jpg'
import ribbedKnitTopBack from '../assets/ribbed-knit-top-back.jpg'
import midiSlipDressFront from '../assets/midi-slip-dress-front.jpg'
import minimalLeatherSneakersCatalog from '../assets/minimal-leather-sneakers-catalog.jpg'
import minimalLeatherSneakersFront from '../assets/minimal-leather-sneakers-front.jpg'
import oxfordCottonShirtFront from '../assets/oxford-cotton-shirt-front.jpg'
import oxfordCottonShirtBack from '../assets/oxford-cotton-shirt-back.jpg'
import straightLegChinosFront from '../assets/straight-leg-chinos-front.jpg'
import straightLegChinosBack from '../assets/straight-leg-chinos-back.jpg'
import lightweightBomberJacketFront from '../assets/lightweight-bomber-jacket-front.jpg'
import lightweightBomberJacketBack from '../assets/lightweight-bomber-jacket-back.jpg'
import merinoCrewneckSweaterFront from '../assets/merino-crewneck-sweater-front.jpg'
import merinoCrewneckSweaterBack from '../assets/merino-crewneck-sweater-back.jpg'
import classicDenimJeansFront from '../assets/classic-denim-jeans-front.jpg'
import classicDenimJeansBack from '../assets/classic-denim-jeans-back.jpg'
import minimalLeatherSneakersFrontMens from '../assets/minimal-leather-sneakers-front-mens.jpg'
import minimalLeatherSneakersBackMens from '../assets/minimal-leather-sneakers-back-mens.jpg'
import relaxedCottonShirtLeftView from '../assets/relaxed-cotton-shirt-left-view.jpg'
import RelaxedCottonShirt from '../assets/relaxed-cotton-shirt-catalog.jpg'
import TailoredWideLegTrousers from '../assets/tailored-wide-leg-trousers-catalog.jpg'
import StructuredEverydayJacket from '../assets/structured-everyday-jacket-catalog.jpg'
import relaxed from '../assets/RelaxedCottonShirt.png'
import TailoredWideLegTrousersFeatured from '../assets/Tailored Wide-LegTrousers.png'
import StructuredEverydayJacketFeatured from '../assets/StructuredEverydayJacket.png'
import MinimalLeatherSneakersFeatured from '../assets/MinimalLeatherSneakers.png'

export const seedProducts: StoreProduct[] = [
  {
    "id": "relaxed-cotton-shirt",
    "brand": "STUDIO EDIT",
    "name": "Relaxed Cotton Shirt",
    "price": 48,
    "department": "Women",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "images": [
      {
        "src": relaxedCottonShirtFront,
        "alt": "Relaxed ivory cotton shirt, front view",
        "view": "Front"
      },
      {
        "src": relaxedCottonShirtBack,
        "alt": "Relaxed ivory cotton shirt, back view",
        "view": "Back"
      },
      {
        "src": relaxedCottonShirtLeftView,
        "alt": "Relaxed ivory cotton shirt, left view",
        "view": "Left"
      }
    ],
    "description": "An airy everyday shirt with a clean collar and an easy, relaxed silhouette.",
    "material": "100% cotton",
    "fit": "Relaxed fit; choose your usual size.",
    "care": "Machine wash cold with similar colors. Line dry.",
    "image": RelaxedCottonShirt,
    "imageAlt": "Relaxed cotton shirt in ivory",
    "categoryIds": [
      "women"
    ],
    "featured": true,
    "featuredImage": relaxed,
    "featuredAlt": "Relaxed cotton shirt in a neutral color",
    "label": "New"
  },
  {
    "id": "wide-leg-trousers",
    "brand": "FORM & LINE",
    "name": "Tailored Wide-Leg Trousers",
    "price": 72,
    "department": "Women",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "images": [
      {
        "src": tailoredWideLegTrousersFront,
        "alt": "Tailored wide-leg trousers, front view",
        "view": "Front"
      },
      {
        "src": tailoredWideLegTrousersBack,
        "alt": "Tailored wide-leg trousers, back view",
        "view": "Back"
      }
    ],
    "description": "A tailored waistband and fluid wide leg make these trousers easy to dress up or down.",
    "material": "70% polyester, 28% viscose, 2% elastane",
    "fit": "High rise with a wide leg; true to size.",
    "care": "Gentle wash cold. Iron on low.",
    "image": TailoredWideLegTrousers,
    "imageAlt": "Tailored wide-leg trousers",
    "categoryIds": [
      "women"
    ],
    "featured": true,
    "featuredImage": TailoredWideLegTrousersFeatured,
    "featuredAlt": "Tailored wide-leg trousers",
    "label": "Bestseller"
  },
  {
    "id": "structured-jacket",
    "brand": "STUDIO EDIT",
    "name": "Structured Everyday Jacket",
    "price": 96,
    "department": "Women",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "images": [
      {
        "src": structuredEverydayJacketFront,
        "alt": "Structured everyday jacket, front view",
        "view": "Front"
      },
      {
        "src": structuredEverydayJacketBack,
        "alt": "Structured everyday jacket, back view",
        "view": "Back"
      }
    ],
    "description": "A versatile layer with a structured shape, clean seams, and room for a light knit underneath.",
    "material": "65% polyester, 35% viscose; polyester lining",
    "fit": "Regular fit with a structured shoulder.",
    "care": "Dry clean only.",
    "image": StructuredEverydayJacket,
    "imageAlt": "Structured everyday jacket",
    "categoryIds": [
      "women"
    ],
    "featured": true,
    "featuredImage": StructuredEverydayJacketFeatured,
    "featuredAlt": "Structured jacket in a dark neutral color",
    "label": "New"
  },
  {
    "id": "ribbed-knit-top",
    "brand": "FORM & LINE",
    "name": "Ribbed Knit Top",
    "price": 42,
    "department": "Women",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "images": [
      {
        "src": ribbedKnitTopFront,
        "alt": "Ivory ribbed knit top, front view",
        "view": "Front"
      },
      {
        "src": ribbedKnitTopBack,
        "alt": "Ivory ribbed knit top, back view",
        "view": "Back"
      }
    ],
    "description": "A soft ribbed staple designed for layering or wearing on its own.",
    "material": "95% cotton, 5% elastane",
    "fit": "Close fit with comfortable stretch.",
    "care": "Gentle wash cold. Reshape and dry flat.",
    "image": ribbedKnitTopFront,
    "imageAlt": "Ivory ribbed knit top",
    "categoryIds": [
      "women"
    ],
    "featured": false,
    "featuredImage": ribbedKnitTopFront,
    "featuredAlt": "Ivory ribbed knit top",
    "label": ""
  },
  {
    "id": "midi-slip-dress",
    "brand": "STUDIO EDIT",
    "name": "Midi Slip Dress",
    "price": 88,
    "department": "Women",
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "images": [
      {
        "src": midiSlipDressFront,
        "alt": "Champagne midi slip dress, front view",
        "view": "Front"
      }
    ],
    "description": "A fluid midi-length slip dress with a soft sheen and an effortless drape.",
    "material": "100% viscose",
    "fit": "Easy fit with a midi-length hem.",
    "care": "Hand wash cold. Hang to dry.",
    "image": midiSlipDressFront,
    "imageAlt": "Champagne midi slip dress",
    "categoryIds": [
      "women"
    ],
    "featured": false,
    "featuredImage": midiSlipDressFront,
    "featuredAlt": "Champagne midi slip dress",
    "label": ""
  },
  {
    "id": "women-leather-sneakers",
    "brand": "FORM & LINE",
    "name": "Minimal Leather Sneakers",
    "price": 84,
    "department": "Women",
    "sizes": [
      "36",
      "37",
      "38",
      "39",
      "40",
      "41"
    ],
    "images": [
      {
        "src": minimalLeatherSneakersCatalog,
        "alt": "White leather sneakers, angled product view",
        "view": "Product view"
      },
      {
        "src": minimalLeatherSneakersFront,
        "alt": "White leather sneakers, front view",
        "view": "Front"
      }
    ],
    "description": "Minimal sneakers with a smooth upper and a cushioned footbed for everyday wear.",
    "material": "Leather upper, textile lining, rubber sole",
    "fit": "True to size; choose your usual shoe size.",
    "care": "Wipe clean with a damp cloth. Air dry.",
    "image": minimalLeatherSneakersCatalog,
    "imageAlt": "Minimal white leather sneakers",
    "categoryIds": [
      "women"
    ],
    "featured": true,
    "featuredImage": MinimalLeatherSneakersFeatured,
    "featuredAlt": "Minimal leather sneakers",
    "label": ""
  },
  {
    "id": "oxford-cotton-shirt",
    "brand": "STUDIO EDIT",
    "name": "Oxford Cotton Shirt",
    "price": 54,
    "department": "Men",
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "images": [
      {
        "src": oxfordCottonShirtFront,
        "alt": "Pale blue Oxford cotton shirt, front view",
        "view": "Front"
      },
      {
        "src": oxfordCottonShirtBack,
        "alt": "Pale blue Oxford cotton shirt, back view",
        "view": "Back"
      }
    ],
    "description": "A classic Oxford shirt with a neat collar and a breathable textured finish.",
    "material": "100% cotton",
    "fit": "Regular fit; choose your usual size.",
    "care": "Machine wash cold. Warm iron if needed.",
    "image": oxfordCottonShirtFront,
    "imageAlt": "Pale blue Oxford cotton shirt",
    "categoryIds": [
      "men"
    ],
    "featured": false,
    "featuredImage": oxfordCottonShirtFront,
    "featuredAlt": "Pale blue Oxford cotton shirt",
    "label": ""
  },
  {
    "id": "straight-leg-chinos",
    "brand": "FORM & LINE",
    "name": "Straight-Leg Chinos",
    "price": 68,
    "department": "Men",
    "sizes": [
      "30",
      "32",
      "34",
      "36",
      "38"
    ],
    "images": [
      {
        "src": straightLegChinosFront,
        "alt": "Sand-colored straight-leg chinos, front view",
        "view": "Front"
      },
      {
        "src": straightLegChinosBack,
        "alt": "Sand-colored straight-leg chinos, back view",
        "view": "Back"
      }
    ],
    "description": "Everyday chinos with a straight leg and a touch of stretch for easy movement.",
    "material": "98% cotton, 2% elastane",
    "fit": "Mid rise with a straight leg.",
    "care": "Machine wash cold inside out. Line dry.",
    "image": straightLegChinosFront,
    "imageAlt": "Sand-colored straight-leg chinos",
    "categoryIds": [
      "men"
    ],
    "featured": false,
    "featuredImage": straightLegChinosFront,
    "featuredAlt": "Sand-colored straight-leg chinos",
    "label": ""
  },
  {
    "id": "lightweight-bomber-jacket",
    "brand": "STUDIO EDIT",
    "name": "Lightweight Bomber Jacket",
    "price": 110,
    "department": "Men",
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "images": [
      {
        "src": lightweightBomberJacketFront,
        "alt": "Dark olive bomber jacket, front view",
        "view": "Front"
      },
      {
        "src": lightweightBomberJacketBack,
        "alt": "Dark olive bomber jacket, back view",
        "view": "Back"
      }
    ],
    "description": "A lightweight bomber with a clean zip front and ribbed trims for casual layering.",
    "material": "100% nylon; polyester lining",
    "fit": "Regular fit with room for a light layer.",
    "care": "Gentle wash cold. Do not tumble dry.",
    "image": lightweightBomberJacketFront,
    "imageAlt": "Dark olive lightweight bomber jacket",
    "categoryIds": [
      "men"
    ],
    "featured": false,
    "featuredImage": lightweightBomberJacketFront,
    "featuredAlt": "Dark olive lightweight bomber jacket",
    "label": ""
  },
  {
    "id": "merino-crewneck-sweater",
    "brand": "FORM & LINE",
    "name": "Merino Crewneck Sweater",
    "price": 92,
    "department": "Men",
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "images": [
      {
        "src": merinoCrewneckSweaterFront,
        "alt": "Charcoal merino crewneck sweater, front view",
        "view": "Front"
      },
      {
        "src": merinoCrewneckSweaterBack,
        "alt": "Charcoal merino crewneck sweater, back view",
        "view": "Back"
      }
    ],
    "description": "A soft crewneck knit that adds lightweight warmth to your everyday wardrobe.",
    "material": "100% merino wool",
    "fit": "Regular fit; choose your usual size.",
    "care": "Hand wash cold with wool detergent. Dry flat.",
    "image": merinoCrewneckSweaterFront,
    "imageAlt": "Charcoal merino crewneck sweater",
    "categoryIds": [
      "men"
    ],
    "featured": false,
    "featuredImage": merinoCrewneckSweaterFront,
    "featuredAlt": "Charcoal merino crewneck sweater",
    "label": ""
  },
  {
    "id": "classic-denim-jeans",
    "brand": "STUDIO EDIT",
    "name": "Classic Denim Jeans",
    "price": 76,
    "department": "Men",
    "sizes": [
      "30",
      "32",
      "34",
      "36",
      "38"
    ],
    "images": [
      {
        "src": classicDenimJeansFront,
        "alt": "Indigo denim jeans, front view",
        "view": "Front"
      },
      {
        "src": classicDenimJeansBack,
        "alt": "Indigo denim jeans, back view",
        "view": "Back"
      }
    ],
    "description": "Classic indigo denim with a straight leg and a comfortable everyday feel.",
    "material": "99% cotton, 1% elastane",
    "fit": "Mid rise with a straight leg.",
    "care": "Wash cold inside out with similar colors. Line dry.",
    "image": classicDenimJeansFront,
    "imageAlt": "Indigo straight-leg denim jeans",
    "categoryIds": [
      "men"
    ],
    "featured": false,
    "featuredImage": classicDenimJeansFront,
    "featuredAlt": "Indigo straight-leg denim jeans",
    "label": ""
  },
  {
    "id": "men-leather-sneakers",
    "brand": "FORM & LINE",
    "name": "Minimal Leather Sneakers",
    "price": 84,
    "department": "Men",
    "sizes": [
      "40",
      "41",
      "42",
      "43",
      "44",
      "45"
    ],
    "images": [
      {
        "src": minimalLeatherSneakersFrontMens,
        "alt": "White leather sneakers, front view",
        "view": "Front"
      },
      {
        "src": minimalLeatherSneakersBackMens,
        "alt": "White leather sneakers, back view",
        "view": "Back"
      }
    ],
    "description": "Clean leather sneakers with a low profile and cushioned comfort for daily wear.",
    "material": "Leather upper, textile lining, rubber sole",
    "fit": "True to size; choose your usual shoe size.",
    "care": "Wipe clean with a damp cloth. Air dry.",
    "image": minimalLeatherSneakersFrontMens,
    "imageAlt": "Minimal white leather sneakers",
    "categoryIds": [
      "men"
    ],
    "featured": false,
    "featuredImage": minimalLeatherSneakersFrontMens,
    "featuredAlt": "Minimal white leather sneakers",
    "label": ""
  }
]

