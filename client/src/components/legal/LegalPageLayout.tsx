import type { ReactNode } from 'react'
import { Link } from 'react-router'
import '../../styles/legal.css'

type LegalSection = { id: string; title: string; content: ReactNode }
type LegalPageLayoutProps = { title: string; number: string; intro: string; sections: LegalSection[] }

function LegalPageLayout({ title, number, intro, sections }: LegalPageLayoutProps) {
  return (
    <main className="legal-page">
      <header className="legal-page__header">
        <p className="legal-page__eyebrow">FASHION / Document {number}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <aside className="legal-page__draft" aria-label="Draft document notice">
          <strong>Draft / demo content</strong>
          <p>This page is a frontend placeholder, not a finalized business policy. Bracketed details and launch policies must be completed for the actual store before publication.</p>
          <span>Effective date: [Not set — draft]</span>
        </aside>
      </header>
      <div className="legal-page__layout">
        <nav className="legal-page__contents" aria-labelledby="legal-contents-title">
          <h2 id="legal-contents-title">On this page</h2>
          <ol>{sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol>
        </nav>
        <div className="legal-page__body">
          {sections.map((section, index) => (
            <section className="legal-page__section" id={section.id} key={section.id} tabIndex={-1} aria-labelledby={`${section.id}-title`}>
              <span className="legal-page__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.content}
            </section>
          ))}
          <div className="legal-page__end"><Link to="/contact">Contact information <span aria-hidden="true">↗</span></Link><a href="#root">Back to top ↑</a></div>
        </div>
      </div>
    </main>
  )
}

export default LegalPageLayout
