import { Activity, ArrowUpRight, Clock3 } from 'lucide-react'

export type ActivityEntry = { id: string; message: string; date: string }

type Props = { id: string; items: ActivityEntry[]; loading?: boolean; unavailable?: boolean; session?: boolean }

export default function RecentActivity({ id, items, loading, unavailable, session }: Props) {
  const recent = [...items].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 10)
  return <section className="admin-panel admin-recent" id={id} aria-labelledby={`${id}-title`} aria-busy={loading}>
    <header className="admin-recent__header">
      <div className="admin-recent__heading"><span className="admin-recent__symbol"><Activity size={20} aria-hidden="true" /></span><div><p className="admin-eyebrow">Workspace timeline</p><h2 id={`${id}-title`}>Recent admin activity</h2></div></div>
      <span className="admin-recent__badge">{session ? 'This session' : 'Latest updates'}</span>
    </header>
    {loading || unavailable ? <p className="admin-recent__notice" role="status">{unavailable ? 'Activity is unavailable. Reload the page to try again.' : 'Loading recent activity…'}</p> : recent.length ? <ol className="admin-recent__list">{recent.map((item, index) => <li key={item.id}>
      <span className="admin-recent__marker" aria-hidden="true"><ArrowUpRight size={16} /></span>
      <div className="admin-recent__entry"><p>{item.message}</p><time dateTime={item.date}><Clock3 size={12} aria-hidden="true" />{new Date(item.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
      {index === 0 && <span className="admin-recent__latest">Latest</span>}
    </li>)}</ol> : <div className="admin-recent__empty"><span className="admin-recent__empty-icon"><Activity size={26} aria-hidden="true" /></span><h3>Your workspace starts here</h3><p>{session ? 'Saves and removals made in this session will appear in your timeline.' : 'Recorded admin changes will appear here as your team works.'}</p></div>}
    <footer className="admin-recent__footer"><span className="admin-recent__dot" aria-hidden="true" />{session ? 'Session activity' : 'Recorded activity'}<span>Showing {recent.length} recent {recent.length === 1 ? 'change' : 'changes'}</span></footer>
  </section>
}
