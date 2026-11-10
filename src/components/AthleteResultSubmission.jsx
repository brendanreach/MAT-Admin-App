import { CheckCircle2, ClipboardEdit, Clock3, Send, X, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getTournamentEvents } from '../lib/tournamentEvents.js'
import {
  RESULT_STAGES,
  submitTournamentResults,
  withdrawResultSubmission,
} from '../lib/resultSubmissions.js'

const NO_RESULT = ''

function getEventDisplayName(eventName) {
  return String(eventName || '').replace(/^World Class Poomsae - /, 'World Class Poomsae — ')
}

function formatSubmittedDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function stageLabel(stage) {
  return stage || 'Competed, no result'
}

// Builds the form rows: every event offered at the tournament, plus any event already on the
// athlete's record. Rows start from a pending submission, then the official result.
function buildRows(tournament, entry, results, pending) {
  const officialEvents = entry?.events || []
  const eventNames = [...new Set([...getTournamentEvents(tournament), ...officialEvents])]

  return eventNames.map((eventName) => {
    const official = results.find((result) => result.event_name === eventName)
    const waiting = pending.find((item) => item.event_name === eventName)
    const onRecord = officialEvents.includes(eventName)

    return {
      eventName,
      onRecord,
      officialStage: official?.result_stage || '',
      officialDivision: official?.division || '',
      competed: onRecord || Boolean(waiting),
      stage: waiting ? waiting.result_stage || NO_RESULT : official?.result_stage || NO_RESULT,
      division: waiting ? waiting.division || '' : official?.division || '',
    }
  })
}

export default function AthleteResultSubmission({
  tournament,
  member,
  entry,
  results = [],
  submissions = [],
  onSubmitted,
}) {
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const pending = useMemo(
    () => submissions.filter((item) => item.status === 'pending'),
    [submissions],
  )

  // Most recent rejection per event, unless something newer is pending or approved.
  const rejected = useMemo(() => {
    const latestByEvent = new Map()
    submissions.forEach((item) => {
      const current = latestByEvent.get(item.event_name)
      if (!current || item.submitted_at > current.submitted_at)
        latestByEvent.set(item.event_name, item)
    })
    return [...latestByEvent.values()].filter((item) => item.status === 'rejected')
  }, [submissions])

  function startEditing() {
    setRows(buildRows(tournament, entry, results, pending))
    setNote('')
    setMessage(null)
    setEditing(true)
  }

  function updateRow(eventName, changes) {
    setRows((current) =>
      current.map((row) => (row.eventName === eventName ? { ...row, ...changes } : row)),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const changed = rows.filter(
      (row) =>
        row.competed &&
        (!row.onRecord ||
          row.stage !== row.officialStage ||
          row.division.trim() !== row.officialDivision),
    )

    if (!changed.length) {
      setMessage({ type: 'error', text: 'Nothing has changed from your current record.' })
      return
    }

    setBusy(true)
    setMessage(null)

    try {
      await submitTournamentResults(
        tournament.id,
        member.id,
        changed.map((row) => ({
          event_name: row.eventName,
          result_stage: row.stage || null,
          division: row.division.trim() || null,
          notes: note.trim() || null,
        })),
      )
      setEditing(false)
      setMessage({
        type: 'success',
        text: 'Sent for approval. Your record updates once an admin approves it.',
      })
      await onSubmitted?.()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }

    setBusy(false)
  }

  async function handleWithdraw(submission) {
    if (!window.confirm(`Withdraw your ${getEventDisplayName(submission.event_name)} submission?`))
      return

    setBusy(true)
    setMessage(null)
    try {
      await withdrawResultSubmission(submission.id)
      await onSubmitted?.()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setBusy(false)
  }

  return (
    <div className="mat-tournament-section mat-result-submission">
      <div className="mat-tournament-section-heading">
        <div>
          <h3>Report My Results</h3>
          <p>
            Add or correct your results. An admin reviews every change before it appears on your
            record.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            className="mat-primary-button"
            onClick={startEditing}
            disabled={busy}
          >
            <ClipboardEdit size={17} />
            {entry ? 'Add or Correct Results' : 'Report Results'}
          </button>
        )}
      </div>

      {message && <div className={`mat-registration-message ${message.type}`}>{message.text}</div>}

      {pending.length > 0 && (
        <ul className="mat-result-submission-list">
          {pending.map((item) => (
            <li key={item.id}>
              <Clock3 size={17} className="pending" />
              <div>
                <strong>
                  {getEventDisplayName(item.event_name)}: {stageLabel(item.result_stage)}
                </strong>
                <span>
                  Waiting for approval · sent {formatSubmittedDate(item.submitted_at)}
                  {item.division ? ` · ${item.division}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="mat-registration-undo"
                onClick={() => handleWithdraw(item)}
                disabled={busy}
              >
                Withdraw
              </button>
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <ul className="mat-result-submission-list">
          {rejected.map((item) => (
            <li key={item.id}>
              <XCircle size={17} className="rejected" />
              <div>
                <strong>
                  {getEventDisplayName(item.event_name)}: {stageLabel(item.result_stage)}
                </strong>
                <span>Not approved{item.review_note ? ` · "${item.review_note}"` : ''}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form className="mat-result-submission-form" onSubmit={handleSubmit}>
          {rows.map((row) => (
            <div
              key={row.eventName}
              className={`mat-result-submission-row ${row.competed ? 'selected' : ''}`}
            >
              <label className="mat-result-submission-event">
                <input
                  type="checkbox"
                  checked={row.competed}
                  disabled={row.onRecord || busy}
                  onChange={(event) => updateRow(row.eventName, { competed: event.target.checked })}
                />
                <span>{getEventDisplayName(row.eventName)}</span>
                {row.onRecord && <CheckCircle2 size={15} aria-label="On your record" />}
              </label>

              {row.competed && (
                <div className="mat-result-submission-fields">
                  <select
                    aria-label={`${row.eventName} result`}
                    value={row.stage}
                    onChange={(event) => updateRow(row.eventName, { stage: event.target.value })}
                    disabled={busy}
                  >
                    <option value={NO_RESULT}>Competed, no result</option>
                    {RESULT_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    aria-label={`${row.eventName} division`}
                    placeholder="Division (optional)"
                    maxLength={120}
                    value={row.division}
                    onChange={(event) => updateRow(row.eventName, { division: event.target.value })}
                    disabled={busy}
                  />
                </div>
              )}
            </div>
          ))}

          <label className="mat-result-submission-note">
            <span>Note for the admin (optional)</span>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="e.g. Won bronze in the 12-14 black belt division."
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
            />
          </label>

          <p className="mat-result-submission-hint">
            Events already on your record stay checked. To remove an event, talk to your coach.
          </p>

          <div className="mat-result-submission-actions">
            <button
              type="button"
              className="mat-secondary-button"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              <X size={16} />
              Cancel
            </button>
            <button type="submit" className="mat-primary-button" disabled={busy}>
              <Send size={16} />
              {busy ? 'Sending...' : 'Send for Approval'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
