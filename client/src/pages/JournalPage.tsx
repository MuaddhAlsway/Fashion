import { useState } from 'react'
import { Link } from 'react-router'
import JournalCard from '../components/journal/JournalCard'
import { useContent } from '../context/ContentContext'
import '../styles/journal.css'

function JournalPage() {
  const { data: { journal: journalStories } } = useContent()
  const [category, setCategory] = useState('All stories')
  const journalCategories = ['All stories', ...new Set(journalStories.map(story => story.category))]
  const leadStory = journalStories[0]
  const stories = journalStories.slice(1).filter((story) => category === 'All stories' || story.category === category)

  if (!leadStory) return <main className="journal-page"><header className="journal-masthead"><h1>The <em>Journal.</em></h1><p>No stories have been published yet.</p></header></main>
  return (
    <main className="journal-page">
      <header className="journal-masthead">
        <div className="journal-masthead__top"><p>FASHION / Notes on getting dressed</p><span>Style. Texture. Perspective.</span></div>
        <h1>The <em>Journal.</em></h1>
        <p className="journal-masthead__intro">A closer look at the pieces we wear, the details we notice, and the ways we make them our own.</p>
      </header>

      <section className="journal-lead" aria-labelledby="journal-lead-title">
        <div className="journal-lead__visual"><img loading="lazy" decoding="async" src={leadStory.image} alt={leadStory.imageAlt} style={{ objectPosition: leadStory.imagePosition }} /></div>
        <div className="journal-lead__content">
          <p className="journal-kicker">01 / The cover story</p>
          <div className="journal-card__meta"><span>{leadStory.category}</span><time dateTime={leadStory.date}>{leadStory.dateLabel}</time></div>
          <h2 id="journal-lead-title">{leadStory.title}</h2>
          <p>{leadStory.excerpt}</p>
          <Link className="journal-link" to={`/journal/${leadStory.slug}`} aria-label={`Read story: ${leadStory.title}`}>Read story <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="journal-stories" aria-labelledby="journal-stories-title">
        <div className="journal-stories__heading"><h2 id="journal-stories-title">More from the journal</h2><p role="status">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</p></div>
        <div className="journal-filters" role="group" aria-label="Filter more journal stories by category">
          {journalCategories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="journal-grid">{stories.map((story) => <JournalCard key={story.slug} story={story} />)}</div>
      </section>
    </main>
  )
}

export default JournalPage
