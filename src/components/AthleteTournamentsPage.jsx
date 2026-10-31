import './TournamentsPage.css'
import './AthleteTournamentsPage.css'
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  MapPin,
  Medal,
  Target,
  Ticket,
  Trophy,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { supabase } from '../lib/supabase.js'
import { getEventOptionLabel, getTournamentEventGroups } from '../lib/tournamentEvents.js'

const MEDAL_STAGES = ['Gold', 'Silver', 'Bronze']

function getLocalTodayString() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function formatDate(dateString) {
  if (!dateString) return 'Not set'
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTournamentDate(tournament) {
  if (!tournament?.event_date) return 'Not set'
  if (!tournament.end_date || tournament.end_date === tournament.event_date) {
    return formatDate(tournament.event_date)
  }
  return `${formatDate(tournament.event_date)} – ${formatDate(tournament.end_date)}`
}

function getEventDisplayName(eventName) {
  return String(eventName || '').replace(/^World Class Poomsae - /, 'World Class Poomsae — ')
}

function getResultStage(result) {
  if (!result) return ''
  if (result.result_stage) return result.result_stage
  if (MEDAL_STAGES.includes(result.medal)) return result.medal
  const placement = Number(result.placement)
  if (placement >= 1 && placement <= 3) return MEDAL_STAGES[placement - 1]
  if (result.placement) return `${result.placement}th Place`
  return ''
}

function AthleteTournamentsPage({
  member,
  tournaments = [],
  tournamentEntries = [],
  tournamentResults = [],
  onEntriesChanged,
}) {
  const [viewMode, setViewMode] = useState('upcoming')
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [registrationBusy, setRegistrationBusy] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState(null)
  const [eventDraft, setEventDraft] = useState({ tournamentId: '', events: [] })
  const [editingEventsFor, setEditingEventsFor] = useState('')
  const tournamentDetailRef = useRef(null)
  const todayString = getLocalTodayString()

  useEffect(() => {
    if (!selectedTournamentId) return undefined

    const scrollTimer = window.setTimeout(() => {
      tournamentDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    return () => window.clearTimeout(scrollTimer)
  }, [selectedTournamentId])

  const records = useMemo(
    () => tournaments.map((tournament) => {
      const entry = tournamentEntries.find((item) => item.tournament_id === tournament.id) || null
      const results = entry
        ? tournamentResults.filter((result) => result.tournament_entry_id === entry.id)
        : []
      const medals = { gold: 0, silver: 0, bronze: 0 }

      results.forEach((result) => {
        const stage = getResultStage(result)
        if (MEDAL_STAGES.includes(stage)) medals[stage.toLowerCase()] += 1
      })

      return { tournament, entry, results, medals }
    }),
    [tournaments, tournamentEntries, tournamentResults]
  )

  const upcomingRecords = useMemo(
    () => records
      .filter(({ tournament }) => {
        const finalDate = tournament.end_date || tournament.event_date
        return !finalDate || finalDate >= todayString
      })
      .sort((a, b) => String(a.tournament.event_date || '').localeCompare(String(b.tournament.event_date || ''))),
    [records, todayString]
  )

  const archivedRecords = useMemo(
    () => records
      .filter(({ tournament }) => {
        const finalDate = tournament.end_date || tournament.event_date
        return finalDate && finalDate < todayString
      })
      .sort((a, b) => String(b.tournament.event_date || '').localeCompare(String(a.tournament.event_date || ''))),
    [records, todayString]
  )

  const visibleRecords = viewMode === 'archive' ? archivedRecords : upcomingRecords
  const selectedRecord = visibleRecords.find(({ tournament }) => tournament.id === selectedTournamentId) || null
  const isSelectedArchived = viewMode === 'archive'

  function handleViewChange(nextView) {
    setViewMode(nextView)
    setSelectedTournamentId('')
  }

  function getTournamentStatus({ tournament, entry }) {
    const finalDate = tournament.end_date || tournament.event_date

    if (finalDate && finalDate < todayString) {
      return entry
        ? { label: 'Competed', className: 'mat-tournament-status upcoming' }
        : { label: 'Not Entered', className: 'mat-tournament-status completed' }
    }

    if (entry) {
      return { label: 'Registered', className: 'mat-tournament-status upcoming' }
    }

    if (tournament.registration_deadline && tournament.registration_deadline < todayString) {
      return { label: 'Registration Closed', className: 'mat-tournament-status closed' }
    }

    return { label: 'Not Registered', className: 'mat-tournament-status neutral' }
  }

  function isRegistrationClosed(tournament) {
    return Boolean(tournament.registration_deadline && tournament.registration_deadline < todayString)
  }

  function getDraftEvents(tournament, entry) {
    return eventDraft.tournamentId === tournament.id ? eventDraft.events : entry?.events || []
  }

  function toggleDraftEvent(tournament, entry, eventName) {
    const current = getDraftEvents(tournament, entry)
    setEventDraft({
      tournamentId: tournament.id,
      events: current.includes(eventName)
        ? current.filter((item) => item !== eventName)
        : [...current, eventName],
    })
  }

  function startEditingEvents(tournament, entry) {
    setEventDraft({ tournamentId: tournament.id, events: entry.events || [] })
    setEditingEventsFor(tournament.id)
    setRegistrationMessage(null)
  }

  function cancelEditingEvents() {
    setEventDraft({ tournamentId: '', events: [] })
    setEditingEventsFor('')
  }

  async function saveMyEvents(tournament, entry) {
    const events = getDraftEvents(tournament, entry)
    if (registrationBusy || events.length === 0) return
    setRegistrationBusy(true)
    setRegistrationMessage(null)

    const { error } = await supabase.rpc('update_my_tournament_events', {
      requested_entry_id: entry.id,
      requested_events: events,
    })

    if (error) {
      setRegistrationMessage({ tournamentId: tournament.id, type: 'error', text: error.message })
    } else {
      if (onEntriesChanged) await onEntriesChanged()
      cancelEditingEvents()
      setRegistrationMessage({ tournamentId: tournament.id, type: 'success', text: 'Your events have been updated.' })
    }

    setRegistrationBusy(false)
  }

  async function markRegistered(tournament) {
    const events = getDraftEvents(tournament, null)
    if (!member || registrationBusy || events.length === 0) return
    setRegistrationBusy(true)
    setRegistrationMessage(null)

    const { error } = await supabase.rpc('register_for_tournament', {
      requested_tournament_id: tournament.id,
      requested_member_id: member.id,
      requested_events: events,
    })

    if (error) {
      setRegistrationMessage({
        tournamentId: tournament.id,
        type: 'error',
        text: /register_for_tournament/.test(error.message)
          ? 'Self-registration is not switched on yet. Please ask your coach to add you for now.'
          : error.message,
      })
    } else {
      if (onEntriesChanged) await onEntriesChanged()
      setEventDraft({ tournamentId: '', events: [] })
      setRegistrationMessage({ tournamentId: tournament.id, type: 'success', text: 'You are marked as registered. Your coaches can now see you on the participant list.' })
    }

    setRegistrationBusy(false)
  }

  async function undoRegistration(entry) {
    if (registrationBusy) return
    if (!window.confirm('Remove your registration for this tournament from the MAT app? This does not cancel anything on the tournament organizer\'s site.')) return
    setRegistrationBusy(true)
    setRegistrationMessage(null)

    const { error } = await supabase.rpc('withdraw_tournament_registration', {
      requested_entry_id: entry.id,
    })

    if (error) {
      setRegistrationMessage({ tournamentId: entry.tournament_id, type: 'error', text: error.message })
    } else {
      if (onEntriesChanged) await onEntriesChanged()
      setRegistrationMessage({ tournamentId: entry.tournament_id, type: 'success', text: 'Your registration has been removed from the MAT app.' })
    }

    setRegistrationBusy(false)
  }

  function renderEventPicker(tournament, entry) {
    const selected = getDraftEvents(tournament, entry)
    const groups = getTournamentEventGroups(tournament)

    return (
      <fieldset className="mat-registration-events">
        <legend>
          Which events are you registered for? <span className="mat-registration-required">Required</span>
        </legend>

        <div className="mat-registration-event-groups">
          {groups.map((group) => (
            <div key={group.label} className="mat-registration-event-group">
              {group.events.length > 1 && <span>{group.label}</span>}
              {group.events.map((eventName) => {
                const checked = selected.includes(eventName)
                return (
                  <label key={eventName} className={`mat-tournament-event-option ${checked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDraftEvent(tournament, entry, eventName)}
                    />
                    <span>{getEventOptionLabel(group, eventName)}</span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>

        {selected.length === 0 && (
          <small className="mat-registration-hint">Choose at least one event to continue.</small>
        )}
      </fieldset>
    )
  }

  function renderRegistrationCard({ tournament, entry, results }) {
    if (!member) return null

    const closed = isRegistrationClosed(tournament)
    const canUndo = entry?.self_registered && results.length === 0 && !closed
    const canEditEvents = entry && results.length === 0 && !closed
    const isEditingEvents = canEditEvents && editingEventsFor === tournament.id
    const showPicker = (!entry && !closed) || isEditingEvents
    const draftCount = getDraftEvents(tournament, entry).length
    const registrationLink = tournament.registration_url && (
      <a
        className="mat-secondary-button mat-registration-link"
        href={tournament.registration_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink size={16} />
        {entry ? 'Registration Page' : 'Open Registration Page'}
      </a>
    )

    return (
      <div className={`mat-registration-card ${entry ? 'registered' : closed ? 'closed' : ''} ${showPicker ? 'with-picker' : ''}`}>
        <div className="mat-registration-card-text">
          {entry ? (
            <>
              <strong><CheckCircle2 size={18} /> You are registered</strong>
              <span>
                {entry.self_registered
                  ? 'You marked yourself as registered. Your coaches can see you and your events.'
                  : 'Your coaches entered you in this tournament.'}
              </span>
            </>
          ) : closed ? (
            <>
              <strong>Registration has closed</strong>
              <span>The deadline has passed. Talk to your coach if you still want to compete.</span>
            </>
          ) : (
            <>
              <strong>Want to compete?</strong>
              <span>
                {tournament.registration_url
                  ? '1. Sign up and pay on the tournament\'s registration page. 2. Come back, tick the events you signed up for, and click Registered.'
                  : 'Sign up with the tournament organizer, then tick the events you signed up for and click Registered. Ask your coach if you need the sign-up page.'}
              </span>
            </>
          )}
        </div>

        {showPicker && renderEventPicker(tournament, entry)}

        <div className="mat-registration-card-actions">
          {!closed && registrationLink}

          {!entry && !closed && (
            <button
              type="button"
              className="mat-primary-button"
              onClick={() => markRegistered(tournament)}
              disabled={registrationBusy || draftCount === 0}
              title={draftCount === 0 ? 'Choose at least one event first' : undefined}
            >
              <CheckCircle2 size={16} />
              {registrationBusy ? 'Saving...' : 'Registered'}
            </button>
          )}

          {canEditEvents && !isEditingEvents && (
            <button
              type="button"
              className="mat-secondary-button mat-registration-edit"
              onClick={() => startEditingEvents(tournament, entry)}
            >
              <Target size={16} />
              Change My Events
            </button>
          )}

          {isEditingEvents && (
            <>
              <button
                type="button"
                className="mat-primary-button"
                onClick={() => saveMyEvents(tournament, entry)}
                disabled={registrationBusy || draftCount === 0}
              >
                <CheckCircle2 size={16} />
                {registrationBusy ? 'Saving...' : 'Save Events'}
              </button>
              <button
                type="button"
                className="mat-registration-undo"
                onClick={cancelEditingEvents}
                disabled={registrationBusy}
              >
                Cancel
              </button>
            </>
          )}

          {canUndo && !isEditingEvents && (
            <button
              type="button"
              className="mat-registration-undo"
              onClick={() => undoRegistration(entry)}
              disabled={registrationBusy}
            >
              Undo
            </button>
          )}
        </div>

        {registrationMessage?.tournamentId === tournament.id && (
          <div className={`mat-registration-message ${registrationMessage.type}`}>
            {registrationMessage.text}
          </div>
        )}
      </div>
    )
  }

  function formatFee(amount) {
    if (amount === null || amount === undefined || amount === '') return 'Not set'
    return `$${Number(amount).toFixed(2)}`
  }

  function renderTile(record) {
    const { tournament, entry, medals } = record
    const status = getTournamentStatus(record)
    const isSelected = tournament.id === selectedTournamentId
    const eventCount = entry?.events?.length || 0
    const totalMedals = medals.gold + medals.silver + medals.bronze

    return (
      <button
        type="button"
        key={tournament.id}
        className={`mat-tournament-tile ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedTournamentId(tournament.id)}
      >
        <div className="mat-tournament-tile-top">
          <div className="mat-tournament-icon">
            {viewMode === 'archive' ? <Medal size={23} /> : <Trophy size={23} />}
          </div>
          <span className={status.className}>{status.label}</span>
        </div>

        <h2 className="mat-tournament-name">{tournament.name}</h2>

        <div className="mat-tournament-meta">
          <div>
            <CalendarDays size={16} />
            <span>{formatTournamentDate(tournament)}</span>
          </div>
          <div>
            <MapPin size={16} />
            <span>{tournament.location || 'Location not set'}</span>
          </div>
        </div>

        <div className="mat-tournament-tile-divider" />

        <div className="mat-tournament-tile-stats">
          <div>
            <strong>{eventCount}</strong>
            <span>My Events</span>
          </div>
          {viewMode === 'archive' ? (
            <div>
              <strong>{totalMedals}</strong>
              <span>My Medals</span>
            </div>
          ) : (
            <div>
              <strong>{tournament.registration_deadline ? formatDate(tournament.registration_deadline) : '—'}</strong>
              <span>Registration Deadline</span>
            </div>
          )}
        </div>

        <div className="mat-tournament-view">
          <span>{viewMode === 'archive' ? 'View Results' : 'View Tournament'}</span>
          <ChevronRight size={18} />
        </div>
      </button>
    )
  }

  function renderDetail() {
    const { tournament, entry, results, medals } = selectedRecord
    const eventCount = entry?.events?.length || 0

    return (
      <section className="mat-tournament-detail" ref={tournamentDetailRef}>
        <div className="mat-tournament-detail-hero">
          <div>
            <button type="button" className="mat-tournament-close-detail" onClick={() => setSelectedTournamentId('')}>
              <X size={16} />
              Close Details
            </button>

            <div className="mat-tournament-detail-title-row">
              <div className="mat-tournament-detail-icon">
                {isSelectedArchived ? <Medal size={27} /> : <Trophy size={27} />}
              </div>
              <div>
                <div className="mat-tournament-detail-label">
                  {isSelectedArchived ? 'Tournament History' : 'Tournament Details'}
                </div>
                <h2>{tournament.name}</h2>
              </div>
            </div>

            <div className="mat-tournament-detail-meta">
              <div>
                <CalendarDays size={17} />
                <span>{formatTournamentDate(tournament)}</span>
              </div>
              <div>
                <MapPin size={17} />
                <span>{tournament.location || 'Location not set'}</span>
              </div>
              {!isSelectedArchived && (
                <div>
                  <Clock3 size={17} />
                  <span>Registration Deadline: {formatDate(tournament.registration_deadline)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isSelectedArchived && renderRegistrationCard(selectedRecord)}

        {isSelectedArchived ? (
          <div className="mat-archive-summary">
            <div>
              <Target size={21} />
              <div className="mat-historical-stat-value">{eventCount}</div>
              <span className="mat-historical-stat-label">Events</span>
            </div>
            <div className="gold">
              <Medal size={21} />
              <div className="mat-historical-stat-value">{medals.gold}</div>
              <span className="mat-historical-stat-label">Gold</span>
            </div>
            <div className="silver">
              <Medal size={21} />
              <div className="mat-historical-stat-value">{medals.silver}</div>
              <span className="mat-historical-stat-label">Silver</span>
            </div>
            <div className="bronze">
              <Medal size={21} />
              <div className="mat-historical-stat-value">{medals.bronze}</div>
              <span className="mat-historical-stat-label">Bronze</span>
            </div>
          </div>
        ) : (
          <div className="mat-tournament-detail-stats">
            <div className="mat-tournament-detail-stat">
              <div className="mat-tournament-small-icon athletes">
                <Target size={20} />
              </div>
              <div>
                <div className="mat-historical-stat-value">{eventCount}</div>
                <span className="mat-historical-stat-label">My Events</span>
              </div>
            </div>
            <div className="mat-tournament-detail-stat">
              <div className="mat-tournament-small-icon outstanding">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <div className="mat-historical-stat-value">{formatFee(tournament.entry_fee)}</div>
                <span className="mat-historical-stat-label">Entry Fee (per athlete)</span>
              </div>
            </div>
            <div className="mat-tournament-detail-stat">
              <div className="mat-tournament-small-icon paid">
                <Ticket size={20} />
              </div>
              <div>
                <div className="mat-historical-stat-value">{formatFee(tournament.spectator_fee)}</div>
                <span className="mat-historical-stat-label">Spectator Fee</span>
              </div>
            </div>
          </div>
        )}

        {!isSelectedArchived && (
          <div className="mat-tournament-fee-note">
            <CircleDollarSign size={16} />
            <span>
              {tournament.fee_notes ||
                'Fees are paid directly to the tournament organizer during registration. MAT does not collect them.'}
            </span>
          </div>
        )}

        <div className="mat-tournament-section">
          <div className="mat-tournament-section-heading">
            <div>
              <h3>{isSelectedArchived ? 'My Results' : 'My Entry'}</h3>
              <p>
                {entry?.division_age_group
                  ? `Competition Age: ${entry.division_age_group}`
                  : isSelectedArchived
                    ? 'Your events and recorded results from this tournament.'
                    : 'The events your coaches have entered you in.'}
              </p>
            </div>
            <span className="mat-tournament-count">{eventCount}</span>
          </div>

          {!entry ? (
            <div className="mat-tournament-no-athletes">
              <Trophy size={30} />
              <div className="mat-historical-stat-value">
                {isSelectedArchived
                  ? 'You were not entered in this tournament.'
                  : 'You are not registered yet. Once you have signed up, choose your events and click Registered above.'}
              </div>
            </div>
          ) : eventCount === 0 ? (
            <div className="mat-tournament-no-athletes">
              <Target size={30} />
              <div className="mat-historical-stat-value">No events have been recorded for this entry.</div>
            </div>
          ) : (
            <div className="mat-athlete-tournament-events">
              {entry.events.map((eventName) => {
                const result = results.find((item) => item.event_name === eventName)
                const stage = getResultStage(result)
                const isMedal = MEDAL_STAGES.includes(stage)

                return (
                  <div key={eventName} className="mat-athlete-tournament-event">
                    <div>
                      <strong>{getEventDisplayName(eventName)}</strong>
                      {result?.division && <span>{result.division}</span>}
                    </div>
                    {stage && (
                      <span className={`mat-athlete-result-badge ${isMedal ? stage.toLowerCase() : ''}`}>
                        {isMedal && <Medal size={13} />}
                        {stage}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {entry?.notes && (
            <div className="mat-athlete-tournament-note">
              <strong>Entry Note</strong>
              <p>{entry.notes}</p>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="mat-page">
      <div className="mat-tournament-page-header">
        <div>
          <div className="mat-eyebrow">Competition Schedule</div>
          <h1 className="mat-section-title">Tournaments</h1>
          <p className="mat-section-description">
            View upcoming competitions, your entries, and your tournament results.
          </p>
        </div>
      </div>

      {!member && (
        <div className="mat-athlete-link-missing">
          <h2>Athlete Profile Not Linked</h2>
          <p>
            You can view the team tournament schedule, but registration status cannot be matched to your profile.
          </p>
        </div>
      )}

      <div className="mat-tournament-tabs">
        <button
          type="button"
          className={viewMode === 'upcoming' ? 'active' : ''}
          onClick={() => handleViewChange('upcoming')}
        >
          <Trophy size={18} />
          Upcoming
          <span>{upcomingRecords.length}</span>
        </button>
        <button
          type="button"
          className={viewMode === 'archive' ? 'active' : ''}
          onClick={() => handleViewChange('archive')}
        >
          <Archive size={18} />
          History
          <span>{archivedRecords.length}</span>
        </button>
      </div>

      {visibleRecords.length === 0 ? (
        <div className="mat-tournament-empty">
          <div className="mat-tournament-empty-icon">
            {viewMode === 'archive' ? <Archive size={34} /> : <Trophy size={34} />}
          </div>
          <h2>{viewMode === 'archive' ? 'No tournament history yet' : 'No upcoming tournaments'}</h2>
          <p>
            {viewMode === 'archive'
              ? 'Completed tournaments will automatically appear here.'
              : 'No future tournaments are currently scheduled.'}
          </p>
        </div>
      ) : (
        <div className="mat-tournament-grid">
          {visibleRecords.map(renderTile)}
        </div>
      )}

      {selectedRecord && renderDetail()}
    </div>
  )
}

export default AthleteTournamentsPage
