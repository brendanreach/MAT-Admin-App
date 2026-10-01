import { MessageCircle, MessagesSquare } from 'lucide-react'
import { useState } from 'react'
import DirectMessages from './DirectMessages.jsx'
import DiscussionsPage from './DiscussionsPage.jsx'
import './MessagesPage.css'
import './DirectMessages.css'

export default function MessagesPage({ accountId, roles = [] }) {
  const [section, setSection] = useState('discussions')

  return (
    <div className="mat-messaging-shell">
      <div className="mat-messaging-section-tabs" role="tablist" aria-label="Messages sections">
        <button
          type="button"
          role="tab"
          aria-selected={section === 'discussions'}
          className={section === 'discussions' ? 'active' : ''}
          onClick={() => setSection('discussions')}
        >
          <MessagesSquare size={18} />
          Discussions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === 'direct'}
          className={section === 'direct' ? 'active' : ''}
          onClick={() => setSection('direct')}
        >
          <MessageCircle size={18} />
          Direct Messages
        </button>
      </div>

      {section === 'discussions' ? (
        <DiscussionsPage accountId={accountId} roles={roles} />
      ) : (
        <DirectMessages accountId={accountId} roles={roles} />
      )}
    </div>
  )
}
