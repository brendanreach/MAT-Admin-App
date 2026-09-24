import {
  Archive,
  Bell,
  BellOff,
  ChevronLeft,
  Heart,
  Lock,
  MessageCircle,
  Pencil,
  Pin,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import './MessagesPage.css'

const EMPTY_TOPIC = { title: '', body: '', category_id: '', is_pinned: false }

function formatTimestamp(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function MessagesPage({ accountId, roles = [] }) {
  const isAdmin = roles.map((role) => String(role).toLowerCase()).includes('admin')
  const [categories, setCategories] = useState([])
  const [topics, setTopics] = useState([])
  const [comments, setComments] = useState([])
  const [profiles, setProfiles] = useState({})
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [editingCommentId, setEditingCommentId] = useState('')
  const [topicForm, setTopicForm] = useState(EMPTY_TOPIC)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadBoard = useCallback(async () => {
    setLoading(true)
    setMessage('')
    const [categoriesResult, topicsResult, profilesResult] = await Promise.all([
      supabase.from('discussion_categories').select('*').eq('is_active', true).order('display_order'),
      supabase.from('discussion_topics').select('*, discussion_comments(count)').eq('is_archived', false)
        .order('is_pinned', { ascending: false }).order('last_activity_at', { ascending: false }),
      supabase.rpc('get_discussion_profiles'),
    ])
    const error = categoriesResult.error || topicsResult.error || profilesResult.error
    if (error) setMessage(error.message)
    setCategories(categoriesResult.data || [])
    setTopics(topicsResult.data || [])
    setProfiles(Object.fromEntries((profilesResult.data || []).map((profile) => [profile.account_id, profile.display_name])))
    setLoading(false)
  }, [])

  useEffect(() => { loadBoard() }, [loadBoard])

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId)

  const loadTopic = useCallback(async (topicId) => {
    setSelectedTopicId(topicId)
    setMessage('')
    const [commentsResult, followResult] = await Promise.all([
      supabase.from('discussion_comments').select('*, discussion_reactions(id, reaction, account_id)')
        .eq('topic_id', topicId).is('deleted_at', null).order('created_at'),
      supabase.from('discussion_follows').select('topic_id').eq('topic_id', topicId).eq('account_id', accountId).maybeSingle(),
    ])
    if (commentsResult.error) setMessage(commentsResult.error.message)
    setComments(commentsResult.data || [])
    setFollowing(Boolean(followResult.data))
    await supabase.from('discussion_reads').upsert({ topic_id: topicId, account_id: accountId, last_read_at: new Date().toISOString() })
  }, [accountId])

  const visibleTopics = useMemo(() => {
    const query = search.trim().toLowerCase()
    return topics.filter((topic) => {
      const categoryMatch = categoryFilter === 'all' || topic.category_id === categoryFilter
      const searchMatch = !query || `${topic.title} ${topic.body}`.toLowerCase().includes(query)
      return categoryMatch && searchMatch
    })
  }, [topics, categoryFilter, search])

  async function saveTopic(event) {
    event.preventDefault()
    setSaving(true)
    const payload = { ...topicForm, title: topicForm.title.trim(), body: topicForm.body.trim(), created_by: accountId }
    const { data, error } = await supabase.from('discussion_topics').insert([payload]).select().single()
    setSaving(false)
    if (error) return setMessage(error.message)
    setShowTopicForm(false)
    setTopicForm(EMPTY_TOPIC)
    await loadBoard()
    if (data?.id) await loadTopic(data.id)
  }

  async function saveComment(event) {
    event.preventDefault()
    const body = commentBody.trim()
    if (!body) return
    setSaving(true)
    const request = editingCommentId
      ? supabase.from('discussion_comments').update({ body, is_edited: true, updated_at: new Date().toISOString() }).eq('id', editingCommentId)
      : supabase.from('discussion_comments').insert([{ topic_id: selectedTopicId, created_by: accountId, body }])
    const { error } = await request
    setSaving(false)
    if (error) return setMessage(error.message)
    setCommentBody('')
    setEditingCommentId('')
    await loadTopic(selectedTopicId)
    await loadBoard()
  }

  async function deleteComment(commentId) {
    if (!window.confirm('Remove this comment?')) return
    const { error } = await supabase.from('discussion_comments')
      .update({ deleted_at: new Date().toISOString(), deleted_by: accountId }).eq('id', commentId)
    if (error) return setMessage(error.message)
    await loadTopic(selectedTopicId)
  }

  async function toggleReaction(comment) {
    const existing = (comment.discussion_reactions || []).find((reaction) => reaction.account_id === accountId && reaction.reaction === 'like')
    const { error } = existing
      ? await supabase.from('discussion_reactions').delete().eq('id', existing.id)
      : await supabase.from('discussion_reactions').insert([{ comment_id: comment.id, account_id: accountId, reaction: 'like' }])
    if (error) return setMessage(error.message)
    await loadTopic(selectedTopicId)
  }

  async function toggleFollow() {
    const { error } = following
      ? await supabase.from('discussion_follows').delete().eq('topic_id', selectedTopicId).eq('account_id', accountId)
      : await supabase.from('discussion_follows').insert([{ topic_id: selectedTopicId, account_id: accountId }])
    if (error) return setMessage(error.message)
    setFollowing(!following)
  }

  async function updateTopic(changes) {
    const { error } = await supabase.from('discussion_topics').update(changes).eq('id', selectedTopicId)
    if (error) return setMessage(error.message)
    await loadBoard()
  }

  if (loading) return <main className="mat-page mat-messages-page"><div className="mat-messages-empty">Loading messages...</div></main>

  return (
    <main className="mat-page mat-messages-page">
      <header className="mat-messages-header">
        <div><div className="mat-eyebrow">Team Communication</div><h1 className="mat-page-title">Messages</h1><p className="mat-page-description">Team topics, tournament planning, sales, and general discussion.</p></div>
        {isAdmin && <button className="mat-primary-button" type="button" onClick={() => setShowTopicForm(true)}><Plus size={18} /> New Topic</button>}
      </header>

      {message && <div className="mat-error">{message}</div>}

      {!selectedTopic ? (
        <>
          <div className="mat-messages-toolbar">
            <div className="mat-messages-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search discussions..." /></div>
            <div className="mat-message-categories">
              <button className={categoryFilter === 'all' ? 'active' : ''} onClick={() => setCategoryFilter('all')}>All</button>
              {categories.map((category) => <button key={category.id} className={categoryFilter === category.id ? 'active' : ''} onClick={() => setCategoryFilter(category.id)}>{category.name}</button>)}
            </div>
          </div>
          <section className="mat-topic-list">
            {visibleTopics.length === 0 ? <div className="mat-messages-empty"><MessageCircle size={34} /><strong>No discussions found</strong><span>Try a different filter or search.</span></div> : visibleTopics.map((topic) => {
              const category = categories.find((item) => item.id === topic.category_id)
              const count = topic.discussion_comments?.[0]?.count || 0
              return <button type="button" className="mat-topic-row" key={topic.id} onClick={() => loadTopic(topic.id)}>
                <div className="mat-topic-icon">{topic.is_pinned ? <Pin size={20} /> : <MessageCircle size={20} />}</div>
                <div className="mat-topic-copy"><div className="mat-topic-title-line"><strong>{topic.title}</strong>{topic.is_locked && <Lock size={15} />}</div><p>{topic.body}</p><span>{category?.name || 'General'} • Started by {profiles[topic.created_by] || 'Team member'} • {formatTimestamp(topic.last_activity_at)}</span></div>
                <div className="mat-topic-count"><strong>{count}</strong><span>comments</span></div>
              </button>
            })}
          </section>
        </>
      ) : (
        <section className="mat-discussion-detail">
          <button type="button" className="mat-messages-back" onClick={() => setSelectedTopicId('')}><ChevronLeft size={18} /> All discussions</button>
          <article className="mat-topic-hero">
            <div className="mat-topic-hero-top"><div><span>{categories.find((item) => item.id === selectedTopic.category_id)?.name || 'General'}</span><h2>{selectedTopic.title}</h2></div><button className="mat-follow-button" onClick={toggleFollow}>{following ? <BellOff size={17} /> : <Bell size={17} />}{following ? 'Unfollow' : 'Follow'}</button></div>
            <p>{selectedTopic.body}</p><small>Posted by {profiles[selectedTopic.created_by] || 'Team member'} • {formatTimestamp(selectedTopic.created_at)}</small>
            {isAdmin && <div className="mat-topic-admin-actions"><button onClick={() => updateTopic({ is_pinned: !selectedTopic.is_pinned })}><Pin size={16} />{selectedTopic.is_pinned ? 'Unpin' : 'Pin'}</button><button onClick={() => updateTopic({ is_locked: !selectedTopic.is_locked })}><Lock size={16} />{selectedTopic.is_locked ? 'Unlock' : 'Lock'}</button><button onClick={() => updateTopic({ is_archived: true })}><Archive size={16} />Archive</button></div>}
          </article>

          <div className="mat-comments-heading"><h3>Discussion</h3><span>{comments.length} comments</span></div>
          <div className="mat-comments-list">
            {comments.map((comment) => {
              const own = comment.created_by === accountId
              const likes = (comment.discussion_reactions || []).filter((reaction) => reaction.reaction === 'like')
              const liked = likes.some((reaction) => reaction.account_id === accountId)
              return <article className="mat-comment-card" key={comment.id}>
                <div className="mat-comment-avatar">{(profiles[comment.created_by] || 'T').charAt(0).toUpperCase()}</div>
                <div className="mat-comment-main"><div className="mat-comment-meta"><strong>{profiles[comment.created_by] || 'Team member'}</strong><span>{formatTimestamp(comment.created_at)}{comment.is_edited ? ' • edited' : ''}</span></div><p>{comment.body}</p><div className="mat-comment-actions"><button className={liked ? 'active' : ''} onClick={() => toggleReaction(comment)}><Heart size={15} />{likes.length || 'Like'}</button>{own && <button onClick={() => { setEditingCommentId(comment.id); setCommentBody(comment.body) }}><Pencil size={15} />Edit</button>}{(own || isAdmin) && <button onClick={() => deleteComment(comment.id)}><Trash2 size={15} />Remove</button>}</div></div>
              </article>
            })}
          </div>

          {selectedTopic.is_locked ? <div className="mat-topic-locked"><Lock size={18} /> This discussion is locked.</div> : <form className="mat-comment-form" onSubmit={saveComment}><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Write a comment..." rows="4" required /><div>{editingCommentId && <button type="button" className="mat-secondary-button" onClick={() => { setEditingCommentId(''); setCommentBody('') }}><X size={16} />Cancel edit</button>}<button type="submit" className="mat-primary-button" disabled={saving}><Send size={17} />{editingCommentId ? 'Update comment' : 'Post comment'}</button></div></form>}
        </section>
      )}

      {showTopicForm && <div className="mat-modal-backdrop"><form className="mat-message-modal" onSubmit={saveTopic}><header><div><div className="mat-eyebrow">Admin Topic</div><h2>Create Discussion</h2></div><button type="button" onClick={() => setShowTopicForm(false)}><X size={22} /></button></header><div className="mat-message-modal-body"><label>Category<select value={topicForm.category_id} onChange={(event) => setTopicForm({ ...topicForm, category_id: event.target.value })} required><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Topic title<input value={topicForm.title} onChange={(event) => setTopicForm({ ...topicForm, title: event.target.value })} required /></label><label>Opening message<textarea rows="7" value={topicForm.body} onChange={(event) => setTopicForm({ ...topicForm, body: event.target.value })} required /></label><label className="mat-message-checkbox"><input type="checkbox" checked={topicForm.is_pinned} onChange={(event) => setTopicForm({ ...topicForm, is_pinned: event.target.checked })} /> Pin this topic</label></div><footer><button type="button" className="mat-secondary-button" onClick={() => setShowTopicForm(false)}>Cancel</button><button type="submit" className="mat-primary-button" disabled={saving}>{saving ? 'Creating...' : 'Create Topic'}</button></footer></form></div>}
    </main>
  )
}
