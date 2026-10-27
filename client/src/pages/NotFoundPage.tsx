import { Link } from 'react-router'
import '../styles/not-found.css'

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-page__top"><span>FASHION / An unexpected turn</span><span>Page not found</span></div>
      <div className="not-found-page__layout">
        <div className="not-found-page__code" aria-hidden="true">4<span>0</span>4<span className="not-found-page__stamp">OFF<br />THE EDIT</span></div>
        <section className="not-found-page__message" aria-labelledby="not-found-title">
          <p className="not-found-page__label">404 / Not found</p>
          <h1 id="not-found-title">A little<br /><em>off the page.</em></h1>
          <p>This address isn’t part of the current edit. It may have moved, or the link may be incorrect.</p>
          <div className="not-found-page__links">
            <Link className="not-found-page__primary" to="/marketplace">Explore the collection <span aria-hidden="true">↗</span></Link>
            <Link to="/">Back to home <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default NotFoundPage
