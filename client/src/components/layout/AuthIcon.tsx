import { Link } from 'react-router'
import { useClerk, useUser } from '@clerk/react'
import { UserRound } from 'lucide-react'

export default function AuthIcon({ closeMenu }: { closeMenu: () => void }) {
  const { user } = useUser()
  const clerk = useClerk()
  if (!user) {
    return <Link className="site-header__icon-button" to="/login" aria-label="Log in" onClick={closeMenu}><UserRound aria-hidden="true" /></Link>
  }
  return (
    <button className="site-header__icon-button site-header__avatar-button" type="button" aria-label="Account" onClick={() => { void clerk.openUserProfile() }}>
      {user.imageUrl ? <img src={user.imageUrl} alt="" className="site-header__avatar" loading="lazy" /> : <UserRound aria-hidden="true" />}
    </button>
  )
}
