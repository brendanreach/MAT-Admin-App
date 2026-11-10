import { Check, CheckCheck, ClipboardCheck, History, Medal, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './TournamentsPage.css'
import './ResultApprovalsPage.css'
import {
  MEDAL_STAGES,
  loadSubmissionsForReview,
  reviewResultSubmission,
} from '../lib/resultSubmissions.js'

function formatDate(value) {
  if (!value) return ''
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function stageLabel(stage) {
  return stage || 'Competed, no result'
}

function StageBadge({ stage }) {
  const isMedal = MEDAL_STAGES.includes(stage)
  return (
    <span className={`mat-approval-stage ${isMedal ? stage.toLowerCase() : ''}`}>
      {isMedal && <Medal size={13} />}
      {stageLabel(stage)}
    </span>
  )
}

export default function ResultApprovalsPage({
  members = [],
  tournaments = [],
  allTournamentEntries = [],
  tournamentResults = [],
  onReviewed,
}) {
  const [view, setView] = useState('pending')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyIds, setBusyIds] = useState([])
  const [rejecting, setRejecting] = useState({ id: '', note: '' })
  const [message, setMessage] = useState(null)

  const load = useCallback(async () => {
    try {
      setSubmissions(await loadSubmissionsForReview(view))
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setLoading(false)
  }, [view])

  useEffect(() => {
    load()
  }, [load])

  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  )
  const tournamentsById = useMemo(
    () => new Map(tournaments.map((tournament) => [tournament.id, tournament])),
    [tournaments],
  )

  // What is officially recorded today for this athlete, tournament and event.
  function getOfficialRecord(submission) {
    const entry = allTournamentEntries.find(
      (item) =>
        item.tournament_id === submission.tournament_id && item.member_id === submission.member_id,
    )
    if (!entry || !(entry.events || []).includes(submission.event_name)) return null
    const result = tournamentResults.find(
      (item) => item.tournament_entry_id === entry.id && item.event_name === submission.event_name,
    )
    return { stage: result?.result_stage || '', division: result?.division || '' }
  }

  function athleteName(memberId) {
    const member = membersById.get(memberId)
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown athlete'
  }

  const groups = useMemo(() => {
    const byTournament = new Map()
    submissions.forEach((submission) => {
      if (!byTournament.has(submission.tournament_id))
        byTournament.set(submission.tournament_id, [])
      byTournament.get(submission.tournament_id).push(submission)
    })
    return [...byTournament.entries()]
      .map(([tournamentId, items]) => ({
        tournament: tournamentsById.get(tournamentId),
        tournamentId,
        items,
      }))
      .sort((a, b) =>
        String(b.tournament?.event_date || '').localeCompare(
          String(a.tournament?.event_date || ''),
        ),
      )
  }, [submissions, tournamentsById])

  async function review(items, approve, note) {
    const ids = items.map((item) => item.id)
    setBusyIds((current) => [...current, ...ids])
    setMessage(null)

    let failed = null
    for (const item of items) {
      try {
        await reviewResultSubmission(item.id, approve, note)
      } catch (error) {
        failed = error.message
        break
      }
    }

    setRejecting({ id: '', note: '' })
    await Promise.all([load(), onReviewed?.()])
    setBusyIds((current) => current.filter((id) => !ids.includes(id)))
    setMessage(
      failed
        ? { type: 'error', text: failed }
        : {
            type: 'success',
            text: `${items.length} result${items.length === 1 ? '' : 's'} ${approve ? 'approved' : 'rejected'}.`,
          },
    )
  }

  function changeView(nextView) {
    setView(nextView)
    setLoading(true)
    setMessage(null)
    setRejecting({ id: '', note: '' })
  }

  function renderSubmission(submission) {
    const official = getOfficialRecord(submission)
    const busy = busyIds.includes(submission.id)
    const unchanged =
      official &&
      official.stage === (submission.result_stage || '') &&
      (!submission.division || submission.division === official.division)

    return (
      <article key={submission.id} className="mat-approval-card">
        <div className="mat-approval-card-main">
          <div className="mat-approval-who">
            <strong>{athleteName(submission.member_id)}</strong>
            <span>{submission.event_name}</span>
          </div>

          <div className="mat-approval-compare">
            <div>
              <small>Reported</small>
              <StageBadge stage={submission.result_stage} />
              {submission.division && <em>{submission.division}</em>}
            </div>
            <div>
              <small>On record</small>
              {official ? (
                <StageBadge stage={official.stage} />
              ) : (
                <span className="mat-approval-none">Not entered</span>
              )}
              {official?.division && <em>{official.division}</em>}
            </div>
          </div>

          {submission.notes && <p className="mat-approval-note">“{submission.notes}”</p>}

          <div className="mat-approval-meta">
            Sent {formatDate(submission.submitted_at)}
            {unchanged && <b>Same as record</b>}
            {view !== 'pending' && (
              <>
                {' · '}
                <span className={`mat-approval-status ${submission.status}`}>
                  {submission.status === 'approved' ? 'Approved' : 'Rejected'}{' '}
                  {formatDate(submission.reviewed_at)}
                </span>
                {submission.review_note && ` · “${submission.review_note}”`}
              </>
            )}
          </div>
        </div>

        {view === 'pending' &&
          (rejecting.id === submission.id ? (
            <div className="mat-approval-reject">
              <input
                type="text"
                placeholder="Reason (optional, shown to the athlete)"
                maxLength={500}
                value={rejecting.note}
                onChange={(event) => setRejecting({ id: submission.id, note: event.target.value })}
                disabled={busy}
                autoFocus
              />
              <div>
                <button
                  type="button"
                  className="mat-secondary-button"
                  onClick={() => setRejecting({ id: '', note: '' })}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mat-approval-reject-button"
                  onClick={() => review([submission], false, rejecting.note)}
                  disabled={busy}
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="mat-approval-actions">
              <button
                type="button"
                className="mat-secondary-button"
                onClick={() => setRejecting({ id: submission.id, note: '' })}
                disabled={busy}
              >
                <X size={16} />
                Reject
              </button>
              <button
                type="button"
                className="mat-primary-button"
                onClick={() => review([submission], true)}
                disabled={busy}
              >
                <Check size={16} />
                {busy ? 'Saving...' : 'Approve'}
              </button>
            </div>
          ))}
      </article>
    )
  }

  return (
    <div className="mat-page">
      <div className="mat-tournament-page-header">
        <div>
          <div className="mat-eyebrow">Admin Review</div>
          <h1 className="mat-section-title">Result Approvals</h1>
          <p className="mat-section-description">
            Results athletes reported for past tournaments. Approved results update the official
            tournament record.
          </p>
        </div>
      </div>

      <div className="mat-tournament-tabs">
        <button
          type="button"
          className={view === 'pending' ? 'active' : ''}
          onClick={() => changeView('pending')}
        >
          <ClipboardCheck size={18} />
          Pending
          {view === 'pending' && !loading && <span>{submissions.length}</span>}
        </button>
        <button
          type="button"
          className={view === 'reviewed' ? 'active' : ''}
          onClick={() => changeView('reviewed')}
        >
          <History size={18} />
          Reviewed
        </button>
      </div>

      {message && (
        <div className={`mat-registration-message ${message.type} mat-approval-message`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="mat-approval-empty">Loading...</div>
      ) : groups.length === 0 ? (
        <div className="mat-tournament-empty">
          <div className="mat-tournament-empty-icon">
            <ClipboardCheck size={34} />
          </div>
          <h2>{view === 'pending' ? 'Nothing waiting for approval' : 'No reviewed results yet'}</h2>
          <p>
            {view === 'pending'
              ? 'When athletes report results for past tournaments, they appear here.'
              : 'Approved and rejected results will be listed here.'}
          </p>
        </div>
      ) : (
        <div className="mat-approval-groups">
          {groups.map(({ tournament, tournamentId, items }) => {
            const groupBusy = items.some((item) => busyIds.includes(item.id))
            return (
              <section key={tournamentId} className="mat-approval-group">
                <header>
                  <div>
                    <h2>{tournament?.name || 'Tournament'}</h2>
                    <span>
                      {tournament ? formatDate(tournament.event_date) : ''} · {items.length} result
                      {items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {view === 'pending' && items.length > 1 && (
                    <button
                      type="button"
                      className="mat-secondary-button"
                      onClick={() => review(items, true)}
                      disabled={groupBusy}
                    >
                      <CheckCheck size={16} />
                      Approve All {items.length}
                    </button>
                  )}
                </header>
                {items.map(renderSubmission)}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
