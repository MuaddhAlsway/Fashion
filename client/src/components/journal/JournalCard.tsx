import { Link } from 'react-router'
import type { StorePost as JournalStory } from '../../data/content-types'

function JournalCard({ story }: { story: JournalStory }) {
  return (
    <article className="journal-card" aria-labelledby={`story-${story.slug}`}>
      <div className="journal-card__visual">
        <img src={story.image} alt={story.imageAlt} style={{ objectPosition: story.imagePosition }} loading="lazy" />
      </div>
      <div className="journal-card__meta"><span>{story.category}</span><time dateTime={story.date}>{story.dateLabel}</time></div>
      <h3 id={`story-${story.slug}`}>{story.title}</h3>
      <p>{story.excerpt}</p>
      <Link className="journal-link" to={`/journal/${story.slug}`} aria-label={`Read story: ${story.title}`}>Read story <span aria-hidden="true">↗</span></Link>
    </article>
  )
}

export default JournalCard
