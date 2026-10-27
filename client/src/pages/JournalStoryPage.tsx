import { Link, useParams } from 'react-router'
import JournalCard from '../components/journal/JournalCard'
import { useContent } from '../context/ContentContext'
import '../styles/journal.css'

function JournalStoryPage() {
  const { data: { journal: journalStories } } = useContent()
  const { slug } = useParams()
  const story = journalStories.find((item) => item.slug === slug)
  if (!story) return (
    <main className="journal-page journal-missing">
      <p className="journal-kicker">FASHION / Journal</p>
      <h1>Story not found.</h1>
      <p>This story isn’t part of the current edit.</p>
      <Link className="journal-link" to="/journal">Back to the journal <span aria-hidden="true">↗</span></Link>
    </main>
  )

  return (
    <main className="journal-page">
      <article className="journal-article">
        <header className="journal-article__header">
          <Link className="journal-link" to="/journal">← Back to the journal</Link>
          <div className="journal-card__meta"><span>{story.category}</span><time dateTime={story.date}>{story.dateLabel}</time></div>
          <h1>{story.title}</h1>
          <p>{story.excerpt}</p>
        </header>
        <img className="journal-article__image" src={story.image} alt={story.imageAlt} style={{ objectPosition: story.imagePosition }} />
        <div className="journal-article__body">
          {story.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
          <Link className="journal-link" to="/marketplace">Explore the collection <span aria-hidden="true">↗</span></Link>
        </div>
      </article>
      <section className="journal-related" aria-labelledby="journal-related-title">
        <h2 id="journal-related-title">Keep reading</h2>
        <div className="journal-grid journal-grid--related">{journalStories.filter((item) => item.slug !== story.slug).slice(0, 2).map((item) => <JournalCard key={item.slug} story={item} />)}</div>
      </section>
    </main>
  )
}

export default JournalStoryPage
