import creamCampaign from '../assets/Journalone.png'
import motionCampaign from '../assets/Journalfifth.png'
import wardrobeImage from '../assets/Journaltwo.png'
import knitImage from '../assets/Journalthree.png'
import shirtImage from '../assets/Journalfourth.png'
import sculpturalCampaign from '../assets/Journalsixth.png'

export const journalCategories = ['All stories', 'Style notes', 'The wardrobe', 'In detail'] as const
export type JournalCategory = typeof journalCategories[number]

export type JournalStory = {
  slug: string
  category: Exclude<JournalCategory, 'All stories'>
  title: string
  excerpt: string
  date: string
  dateLabel: string
  image: string
  imageAlt: string
  imagePosition: string
  sections: { heading: string; paragraphs: string[] }[]
}

export const journalStories: JournalStory[] = [
  {
    slug: 'a-quieter-kind-of-statement', category: 'Style notes',
    title: 'A quieter kind of statement.',
    excerpt: 'Cream on cream, a shift in texture, an easy silhouette. Dressing with presence can start with less.',
    date: '2026-10-26', dateLabel: '26 October 2026', image: creamCampaign,
    imageAlt: 'Model wearing cream tailoring against a sunlit sand-colored wall', imagePosition: '76% center',
    sections: [
      { heading: 'Start with a shared tone', paragraphs: ['Choose two pieces in nearby shades: an ivory shirt and sand-colored trousers, for example. They do not need to match exactly. A small difference in tone gives the combination depth without adding another color.'] },
      { heading: 'Let texture do the talking', paragraphs: ['A ribbed knit beside a smooth trouser creates a contrast you can feel. Keep the shapes simple so that the texture becomes the detail. A minimal sneaker makes the same outfit feel more relaxed.'] },
      { heading: 'Leave a little room', paragraphs: ['An easy shoulder or a wide leg changes how an outfit moves. Choose one relaxed proportion and give the rest of the look some definition. Try a loose shirt with a neat waistband, then adjust until it feels like you.'] },
    ],
  },
  {
    slug: 'the-everyday-wardrobe', category: 'The wardrobe',
    title: 'The pieces you reach for again.',
    excerpt: 'A shirt, a knit, a pair of jeans. Build around the combinations you already love wearing.',
    date: '2026-10-22', dateLabel: '22 October 2026', image: wardrobeImage,
    imageAlt: 'Flat lay of cream knitwear, a beige jacket, denim, white sneakers, and accessories', imagePosition: 'center',
    sections: [
      { heading: 'Look at what gets worn', paragraphs: ['Start with the pieces that leave your wardrobe most often. Is it their shape, their color, or the way they feel? Those answers are a more useful starting point than a list of things every wardrobe is supposed to contain.'] },
      { heading: 'Think in combinations', paragraphs: ['Before choosing a new piece, imagine it with two things you already own. A relaxed cotton shirt can sit over denim, tuck into a tailored trouser, or become a light layer over a simple top.'] },
      { heading: 'Make space for a favorite', paragraphs: ['An everyday wardrobe does not have to be anonymous. Keep a texture, a proportion, or a color that makes you want to get dressed. The point is to make choosing an outfit easier, not to make every outfit the same.'] },
    ],
  },
  {
    slug: 'a-closer-look-at-knitwear', category: 'In detail',
    title: 'Texture, up close.',
    excerpt: 'A closer look at ribbed knitwear and the small details that change a simple outfit.',
    date: '2026-10-19', dateLabel: '19 October 2026', image: knitImage,
    imageAlt: 'Ivory ribbed knit top with its texture and neckline visible', imagePosition: 'center',
    sections: [
      { heading: 'Notice the surface', paragraphs: ['Ribbing introduces a quiet rhythm to a plain-colored top. Pair it with something smoother to make that texture visible: a clean trouser, a structured jacket, or simple denim.'] },
      { heading: 'Consider the layer', paragraphs: ['Look at how the neckline sits beneath a shirt or jacket. A light knit can add interest without changing the whole outfit. If you prefer to wear it alone, let the sleeve and hem proportions guide the rest of your look.'] },
      { heading: 'Read the care notes', paragraphs: ['Knitwear can use different fibers and constructions, so care instructions are not interchangeable. Check the label on the garment before washing, drying, or ironing. The product page is a useful place to begin that check.'] },
    ],
  },
  {
    slug: 'dressing-in-motion', category: 'Style notes',
    title: 'Made to move through the day.',
    excerpt: 'Strong outerwear, softer layers, and the contrast between structure and movement.',
    date: '2026-10-15', dateLabel: '15 October 2026', image: motionCampaign,
    imageAlt: 'Model in a dark flowing coat and cream skirt against a blurred green and warm backdrop', imagePosition: '72% center',
    sections: [
      { heading: 'Begin with the outer layer', paragraphs: ['A coat or jacket often creates the first impression of an outfit. Think about its shoulder, length, and volume before adding the layers underneath. A simple base gives a more expressive outer layer room to stand out.'] },
      { heading: 'Balance structure with softness', paragraphs: ['Try a defined jacket over a softer knit, or a straight trouser beneath a relaxed shirt. You do not need equal amounts of each. One change in texture or movement can be enough.'] },
      { heading: 'Try the outfit in motion', paragraphs: ['Sit, walk, and reach while trying a new combination. Notice whether the layers sit comfortably together. A look should feel as good during the day as it does in front of the mirror.'] },
    ],
  },
  {
    slug: 'one-shirt-three-directions', category: 'The wardrobe',
    title: 'One shirt. Three directions.',
    excerpt: 'Wear it open, tuck it in, or keep it loose. A familiar piece with a different point of view.',
    date: '2026-10-11', dateLabel: '11 October 2026', image: shirtImage,
    imageAlt: 'Relaxed ivory cotton shirt shown from the front', imagePosition: 'center',
    sections: [
      { heading: 'Open, as a light layer', paragraphs: ['Leave the shirt unbuttoned over a simple top. Pair it with a straight leg and minimal shoes. This is an easy way to bring a little structure to a relaxed base.'] },
      { heading: 'Tucked into tailoring', paragraphs: ['Tuck the shirt into a trouser and gently release a little fabric at the waist. Keep the sleeves neat or roll them once. Let the waistband and collar create the definition.'] },
      { heading: 'Loose over denim', paragraphs: ['Wear the shirt untucked with denim and see where the hem falls. If the combination feels too loose, change one proportion: a straighter jean, a shorter layer, or a partial tuck.'] },
    ],
  },
  {
    slug: 'the-art-of-proportion', category: 'In detail',
    title: 'A different sense of proportion.',
    excerpt: 'Why the space around a silhouette can be as expressive as the details within it.',
    date: '2026-10-07', dateLabel: '7 October 2026', image: sculpturalCampaign,
    imageAlt: 'Model wearing a voluminous ochre coat against a warm neutral studio backdrop', imagePosition: '75% center',
    sections: [
      { heading: 'Choose a focal point', paragraphs: ['A wide sleeve, a longer hem, or a generous shoulder can become the focus of a look. Give that element space by keeping neighboring shapes quieter.'] },
      { heading: 'Look at the whole outline', paragraphs: ['Step back from the mirror and notice the silhouette before the details. Where does the jacket end? How much of the trouser is visible? Small adjustments can make a familiar outfit feel different.'] },
      { heading: 'Keep it personal', paragraphs: ['Proportion is an invitation to experiment. Try the combination, move in it, and keep what feels natural. There is no single correct outline for an everyday wardrobe.'] },
    ],
  },
]
