import NewsletterForm from './NewsletterForm'
import { Link } from 'react-router'
import '../../styles/footer.css'

const copyrightYear = new Date().getFullYear()

function Footer() {
  return (
    <footer className="fashion-footer" aria-label="FASHION footer">
      <div className="fashion-footer__top">
        <div className="fashion-footer__intro">
          <p className="fashion-footer__eyebrow">An everyday point of view / FASHION</p>
          <h2>Wear it<br /><em>your way.</em></h2>
          <p className="fashion-footer__description">
            Considered pieces. Unexpected combinations. A wardrobe that feels like you.
          </p>
        </div>

        <div className="fashion-footer__navigation">
          <nav aria-labelledby="footer-shop-title">
            <h3 id="footer-shop-title"><span aria-hidden="true">01 / </span>The wardrobe</h3>
            <ul>
              <li><Link to="/marketplace">Shop all</Link></li>
              <li><Link to="/marketplace?department=women">Women</Link></li>
              <li><Link to="/marketplace?department=men">Men</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-support-title">
            <h3 id="footer-support-title"><span aria-hidden="true">02 / </span>Here to help</h3>
            <ul>
              <li><Link to="/account">Your account</Link></li>
              <li><Link to="/cart">Your shopping bag</Link></li>
              <li><a href="#footer-help">Delivery &amp; returns</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-social-title">
            <h3 id="footer-social-title"><span aria-hidden="true">03 / </span>Inspiration</h3>
            <ul>
              <li><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram <span aria-hidden="true">↗</span><span className="fashion-footer__sr-only"> (opens in a new tab)</span></a></li>
              <li><a href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer">Pinterest <span aria-hidden="true">↗</span><span className="fashion-footer__sr-only"> (opens in a new tab)</span></a></li>
              <li><a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer">TikTok <span aria-hidden="true">↗</span><span className="fashion-footer__sr-only"> (opens in a new tab)</span></a></li>
            </ul>
            <p className="fashion-footer__social-note">Explore the platforms for inspiration.</p>
          </nav>
        </div>
      </div>

      <NewsletterForm />

      <section className="fashion-footer__help" id="footer-help" aria-labelledby="footer-help-title" tabIndex={-1}>
        <h3 id="footer-help-title">A few useful notes</h3>
        <details>
          <summary>Delivery &amp; returns</summary>
          <p>Find sample delivery estimates and return information in the Shipping and Returns sections on each product page. This storefront is a demo; checkout does not place a real order or process a payment.</p>
          <Link to="/marketplace">Browse product information <span aria-hidden="true">↗</span></Link>
        </details>
        <details>
          <summary>Choosing your size</summary>
          <p>Open a product to see its available sizes, fit notes, and care details. Select a size before adding it to your bag. Different sizes are kept as separate items.</p>
        </details>
      </section>

      <Link className="fashion-footer__wordmark" to="/" aria-label="FASHION home">FASHION</Link>
      <div className="fashion-footer__bottom">
        <p>© {copyrightYear} FASHION. All rights reserved.</p>
        <nav className="fashion-footer__legal" aria-label="Legal and contact links">
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </nav>
        <a href="#root">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  )
}

export default Footer



