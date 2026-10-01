import { Link2, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import './AccountAthleteAssignments.css'

const normalizeRoles = (roles) =>
  Array.isArray(roles) ? roles.map((role) => String(role).trim().toLowerCase()).filter(Boolean) : []

export default function AccountAthleteAssignments({ members = [], onChanged }) {
  const [accounts, setAccounts] = useState([])
  const [links, setLinks] = useState([])
  const [accountId, setAccountId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [relationshipType, setRelationshipType] = useState('self')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.rpc('admin_get_account_member_assignments')
    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }
    const rows = data || []
    const accountMap = new Map()
    const normalizedLinks = []
    rows.forEach((row) => {
      if (!accountMap.has(row.account_id)) {
        accountMap.set(row.account_id, {
          id: row.account_id,
          email: row.email,
          display_name: row.display_name,
          roles: row.roles || [],
        })
      }
      if (row.link_id) normalizedLinks.push(row)
    })
    setAccounts([...accountMap.values()])
    setLinks(normalizedLinks)
    setLoading(false)
  }, [])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  async function assignAccount(event) {
    event.preventDefault()
    if (!accountId || !memberId) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase.rpc('admin_assign_account_to_member', {
      requested_account_id: accountId,
      requested_member_id: memberId,
      requested_relationship_type: relationshipType,
    })
    setSaving(false)
    if (error) return setMessage(error.message)
    setMemberId('')
    setMessage('Account linked successfully. The user should sign out and back in to refresh access.')
    await loadAssignments()
    await onChanged?.()
  }

  async function removeLink(linkId) {
    if (!window.confirm('Remove this account-to-athlete link?')) return
    setSaving(true)
    const { error } = await supabase.rpc('admin_remove_account_member_assignment', {
      requested_link_id: linkId,
    })
    setSaving(false)
    if (error) return setMessage(error.message)
    await loadAssignments()
    await onChanged?.()
  }

  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  )

  const visibleAccounts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return accounts
    return accounts.filter((account) =>
      `${account.display_name || ''} ${account.email || ''}`.toLowerCase().includes(query)
    )
  }, [accounts, search])

  return (
    <section className="mat-account-assignment-panel">
      <header className="mat-account-assignment-header">
        <div className="mat-account-assignment-icon"><Link2 size={22} /></div>
        <div>
          <span>Account administration</span>
          <h2>Link Accounts to Athletes</h2>
          <p>Keep the account UUID unchanged. Create a link between the login account and the athlete record instead.</p>
        </div>
      </header>

      {message && <div className="mat-account-assignment-message">{message}</div>}

      <form className="mat-account-assignment-form" onSubmit={assignAccount}>
        <label>
          Account
          <select value={accountId} onChange={(event) => setAccountId(event.target.value)} required>
            <option value="">Select an account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.display_name || account.email} ({account.email})
              </option>
            ))}
          </select>
        </label>
        <label>
          Athlete profile
          <select value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
            <option value="">Select an athlete...</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Relationship
          <select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value)}>
            <option value="self">Self / athlete account</option>
            <option value="parent">Parent or guardian</option>
            <option value="family">Family member</option>
          </select>
        </label>
        <button type="submit" className="mat-primary-button" disabled={saving}>
          <ShieldCheck size={18} />
          {saving ? 'Linking...' : 'Link Account'}
        </button>
      </form>

      <div className="mat-account-assignment-search">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts..." />
      </div>

      {loading ? (
        <div className="mat-account-assignment-empty">Loading account links...</div>
      ) : (
        <div className="mat-account-assignment-list">
          {visibleAccounts.map((account) => {
            const accountLinks = links.filter((link) => link.account_id === account.id)
            return (
              <article key={account.id} className="mat-account-assignment-card">
                <div className="mat-account-assignment-account">
                  <div className="mat-account-assignment-avatar"><UserRound size={19} /></div>
                  <div>
                    <strong>{account.display_name || account.email}</strong>
                    <span>{account.email}</span>
                    <small>{normalizeRoles(account.roles).join(' + ') || 'Pending approval'}</small>
                  </div>
                </div>
                <div className="mat-account-assignment-links">
                  {accountLinks.length === 0 ? (
                    <span className="mat-account-assignment-unlinked">No athlete profile linked</span>
                  ) : accountLinks.map((link) => {
                    const member = memberMap.get(link.member_id)
                    return (
                      <div key={link.link_id}>
                        <span>
                          <strong>{member ? `${member.first_name} ${member.last_name}` : link.member_name || 'Athlete'}</strong>
                          <small>{link.relationship_type}</small>
                        </span>
                        <button type="button" onClick={() => removeLink(link.link_id)} disabled={saving} aria-label="Remove link">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
