import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import '../styles/loading-screen.css'

function LoadingTransition() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    // Keep transitions visible even for instantly rendered local pages.
    const timeout = window.setTimeout(() => setVisible(false), 450)
    return () => window.clearTimeout(timeout)
  }, [])
  if (!visible) return null
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-label="Loading page">
      <div className="page-loading__content">
        <span className="page-loading__eyebrow" aria-hidden="true">THE EVERYDAY, ELEVATED</span>
        <span className="page-loading__brand" aria-hidden="true">FASHION</span>
        <span className="page-loading__track" aria-hidden="true"><span /></span>
        <span className="page-loading__label">Loading your next destination…</span>
      </div>
    </div>
  )
}

export default function NavigationLoading() {
  const { pathname } = useLocation()
  // Includes back/forward; filters and anchors do not trigger a page transition.
  return <LoadingTransition key={pathname} />
}
