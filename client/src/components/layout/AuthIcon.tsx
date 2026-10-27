import { Link } from 'react-router'
import { useUser } from '@clerk/react'
import { UserRound } from 'lucide-react'

export default function AuthIcon({ closeMenu }: { closeMenu: () => void }) {
  const { user } = useUser()
  const clerk = useClerk()
  if (!user) {
    return <Link className="site-header__icon-button" to="/login" aria-label="Log in" onClick={closeMenu}><UserRound aria-hidden="true" /></Link>
  }
  return (
    <Link className="site-header__icon-button site-header__avatar-button" to="/account" aria-label="Account" onClick={closeMenu}>
      {user.imageUrl ? <img src={user.imageUrl} alt="" className="site-header__avatar" loading="lazy" /> : <UserRound aria-hidden="true" />}
    </Link>
  )
}
