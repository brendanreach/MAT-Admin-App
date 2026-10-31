import { ChevronRight, MessageCircle, Pin } from 'lucide-react'
import { truncate } from '../lib/homeCarousel.js'

export default function TeamMessagesCard({ topics = [], onNavigate }) {
  return (
    <article className="mat-new-home-card mat-new-home-messages">
      <header>
        <div><MessageCircle size={20} /><span>Team Messages</span></div>
        <button type="button" onClick={() => onNavigate('messages')}>View All <ChevronRight size={15} /></button>
      </header>
      <div className="mat-new-home-message-list">
        {topics.length === 0 ? (
          <div className="mat-new-home-card-empty">No recent team discussions.</div>
        ) : topics.slice(0, 4).map((topic) => (
          <button key={topic.id} type="button" onClick={() => onNavigate('messages')}>
            <span className="mat-new-home-message-icon">{topic.is_pinned ? <Pin size={17} /> : <MessageCircle size={17} />}</span>
            <span className="mat-new-home-message-copy">
              <strong>{topic.title}</strong>
              <span>{truncate(topic.body, 100)}</span>
            </span>
            <span className="mat-new-home-message-count">{topic.discussion_comments?.[0]?.count || 0}</span>
          </button>
        ))}
      </div>
    </article>
  )
}
