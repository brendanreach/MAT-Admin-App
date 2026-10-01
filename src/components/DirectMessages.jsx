import {
  ArrowLeft,
  Ban,
  Flag,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import './DirectMessages.css'

function formatTimestamp(value) {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  return date.toLocaleString('en-US', sameDay
    ? { hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function DirectMessages({ accountId, roles = [] }) {
  const isAdmin = roles.map((role) => String(role).toLowerCase()).includes('admin')
  const [conversations, setConversations] = useState([])
  const [directory, setDirectory] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageBody, setMessageBody] = useState('')
  const [editingMessageId, setEditingMessageId] = useState('')
  const [search, setSearch] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const bottomRef = useRef(null)

  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_my_direct_conversations')
    if (error) setErrorMessage(error.message)
    setConversations(data || [])
    setLoading(false)
  }, [])

  const loadDirectory = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_direct_message_directory')
    if (error) setErrorMessage(error.message)
    setDirectory(data || [])
  }, [])

  const loadMessages = useCallback(async (conversationId) => {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at')
    if (error) setErrorMessage(error.message)
    setMessages(data || [])
    await supabase.from('direct_message_reads').upsert({
      conversation_id: conversationId,
      account_id: accountId,
      last_read_at: new Date().toISOString(),
    })
  }, [accountId])

  useEffect(() => {
    loadConversations()
    loadDirectory()
  }, [loadConversations, loadDirectory])

  useEffect(() => {
    if (!selectedConversation?.conversation_id) return undefined
    loadMessages(selectedConversation.conversation_id)
    const channel = supabase
      .channel(`direct-messages-${selectedConversation.conversation_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${selectedConversation.conversation_id}`,
      }, () => {
        loadMessages(selectedConversation.conversation_id)
        loadConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedConversation?.conversation_id, loadMessages, loadConversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startConversation(otherAccountId) {
    setSaving(true)
    setErrorMessage('')
    const { data, error } = await supabase.rpc('create_or_get_direct_conversation', {
      other_account_id: otherAccountId,
    })
    setSaving(false)
    if (error) return setErrorMessage(error.message)
    setShowNewConversation(false)
    await loadConversations()
    const person = directory.find((item) => item.account_id === otherAccountId)
    setSelectedConversation({
      conversation_id: data,
      other_account_id: otherAccountId,
      other_display_name: person?.display_name || 'Team member',
      other_role_label: person?.role_label || 'Team member',
    })
  }

  async function sendMessage(event) {
    event.preventDefault()
    const body = messageBody.trim()
    if (!body || !selectedConversation) return
    setSaving(true)
    const request = editingMessageId
      ? supabase.from('direct_messages').update({ body, edited_at: new Date().toISOString() }).eq('id', editingMessageId)
      : supabase.from('direct_messages').insert([{
          conversation_id: selectedConversation.conversation_id,
          sender_id: accountId,
          body,
        }])
    const { error } = await request
    setSaving(false)
    if (error) return setErrorMessage(error.message)
    setMessageBody('')
    setEditingMessageId('')
    await loadMessages(selectedConversation.conversation_id)
    await loadConversations()
  }

  async function deleteMessage(messageId) {
    if (!window.confirm('Remove this message?')) return
    const { error } = await supabase
      .from('direct_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
    if (error) return setErrorMessage(error.message)
    await loadMessages(selectedConversation.conversation_id)
  }

  async function blockAccount() {
    if (!window.confirm(`Block ${selectedConversation.other_display_name}? This prevents new messages in either direction.`)) return
    const { error } = await supabase.from('direct_message_blocks').insert([{
      blocked_by: accountId,
      blocked_account: selectedConversation.other_account_id,
    }])
    if (error) return setErrorMessage(error.message)
    setSelectedConversation(null)
    await loadDirectory()
    await loadConversations()
  }

  async function reportConversation() {
    const reason = window.prompt('Briefly describe the concern for an administrator:')
    if (!reason?.trim()) return
    const { error } = await supabase.from('direct_message_reports').insert([{
      conversation_id: selectedConversation.conversation_id,
      reported_by: accountId,
      reason: reason.trim(),
    }])
    if (error) return setErrorMessage(error.message)
    window.alert('The conversation was reported to an administrator.')
  }

  const filteredDirectory = useMemo(() => {
    const query = search.trim().toLowerCase()
    return directory.filter((person) => !query || `${person.display_name} ${person.role_label}`.toLowerCase().includes(query))
  }, [directory, search])

  const groupedDirectory = useMemo(() => filteredDirectory.reduce((groups, person) => {
    const label = person.role_label || 'Athletes and Parents'
    groups[label] = [...(groups[label] || []), person]
    return groups
  }, {}), [filteredDirectory])

  if (loading) return <div className="mat-direct-empty">Loading direct messages...</div>

  return (
    <main className="mat-direct-page">
      {errorMessage && <div className="mat-error">{errorMessage}</div>}
      <div className={`mat-direct-layout ${selectedConversation ? 'conversation-open' : ''}`}>
        <aside className="mat-direct-sidebar">
          <header>
            <div><h2>Direct Messages</h2><p>Private one-to-one conversations</p></div>
            <button type="button" onClick={() => setShowNewConversation(true)} aria-label="New conversation"><Plus size={20} /></button>
          </header>
          <div className="mat-direct-conversation-list">
            {conversations.length === 0 ? (
              <div className="mat-direct-empty small"><MessageCircle size={28} /><span>No conversations yet</span></div>
            ) : conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.conversation_id}
                className={selectedConversation?.conversation_id === conversation.conversation_id ? 'active' : ''}
                onClick={() => setSelectedConversation(conversation)}
              >
                <span className="mat-direct-avatar">{conversation.other_display_name?.charAt(0).toUpperCase() || 'T'}</span>
                <span className="mat-direct-conversation-copy">
                  <strong>{conversation.other_display_name}</strong>
                  <span>{conversation.last_message_body || 'Start the conversation'}</span>
                </span>
                <span className="mat-direct-conversation-meta">
                  <small>{formatTimestamp(conversation.last_message_at)}</small>
                  {Number(conversation.unread_count) > 0 && <b>{conversation.unread_count}</b>}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="mat-direct-chat">
          {!selectedConversation ? (
            <div className="mat-direct-empty"><MessageCircle size={42} /><strong>Select a conversation</strong><span>Choose an existing conversation or start a new one.</span></div>
          ) : (
            <>
              <header className="mat-direct-chat-header">
                <button type="button" className="mat-direct-back" onClick={() => setSelectedConversation(null)}><ArrowLeft size={20} /></button>
                <span className="mat-direct-avatar">{selectedConversation.other_display_name?.charAt(0).toUpperCase() || 'T'}</span>
                <div><strong>{selectedConversation.other_display_name}</strong><span>{selectedConversation.other_role_label}</span></div>
                <div className="mat-direct-chat-tools">
                  <button type="button" onClick={reportConversation} title="Report conversation"><Flag size={17} /></button>
                  <button type="button" onClick={blockAccount} title="Block account"><Ban size={17} /></button>
                </div>
              </header>

              <div className="mat-direct-message-list">
                {messages.map((message) => {
                  const own = message.sender_id === accountId
                  return (
                    <div key={message.id} className={`mat-direct-message-row ${own ? 'own' : ''}`}>
                      <div className="mat-direct-message-bubble">
                        <p>{message.body}</p>
                        <span>{formatTimestamp(message.created_at)}{message.edited_at ? ' • edited' : ''}</span>
                        {own && <div className="mat-direct-message-actions">
                          <button type="button" onClick={() => { setEditingMessageId(message.id); setMessageBody(message.body) }}><Pencil size={13} /> Edit</button>
                          <button type="button" onClick={() => deleteMessage(message.id)}><Trash2 size={13} /> Remove</button>
                        </div>}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form className="mat-direct-compose" onSubmit={sendMessage}>
                {editingMessageId && <button type="button" className="mat-direct-cancel-edit" onClick={() => { setEditingMessageId(''); setMessageBody('') }}><X size={16} /> Cancel edit</button>}
                <div><textarea rows="2" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Write a message..." required /><button type="submit" disabled={saving} aria-label="Send message"><Send size={20} /></button></div>
              </form>
            </>
          )}
        </section>
      </div>

      {showNewConversation && (
        <div className="mat-modal-backdrop">
          <section className="mat-direct-new-modal">
            <header><div><h2>New Conversation</h2><p>Select an approved team account.</p></div><button type="button" onClick={() => setShowNewConversation(false)}><X size={21} /></button></header>
            <div className="mat-direct-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people..." autoFocus /></div>
            <div className="mat-direct-directory">
              {Object.entries(groupedDirectory).map(([label, people]) => (
                <section key={label}><h3>{label}</h3>{people.map((person) => (
                  <button type="button" key={person.account_id} disabled={saving} onClick={() => startConversation(person.account_id)}><span className="mat-direct-avatar">{person.display_name?.charAt(0).toUpperCase() || 'T'}</span><span><strong>{person.display_name}</strong><small>{person.role_label}</small></span></button>
                ))}</section>
              ))}
              {filteredDirectory.length === 0 && <div className="mat-direct-empty small">No approved accounts found.</div>}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
