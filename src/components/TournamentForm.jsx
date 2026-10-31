import './TournamentsPage.css'
import {
  useEffect,
  useState,
} from 'react'

import {
  CalendarDays,
  CircleDollarSign,
  Link2,
  ListChecks,
  MapPin,
  StickyNote,
  Ticket,
  Trophy,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase.js'
import {
  ALL_TOURNAMENT_EVENTS,
  EVENT_GROUPS,
  getEventOptionLabel,
  getTournamentEvents,
} from '../lib/tournamentEvents.js'

const emptyForm = {
  name: '',
  location: '',
  event_date: '',
  end_date: '',
  registration_deadline: '',
  registration_url: '',
  available_events: ALL_TOURNAMENT_EVENTS,
  entry_fee: '',
  spectator_fee: '',
  fee_notes: '',
}

function formatFeeInput(
  amount
) {
  return amount === null ||
    amount === undefined
    ? ''
    : String(amount)
}

/*
  Accepts "sport80.com/event" as well as a full
  address, and always stores an http(s) link.
*/

function normalizeRegistrationUrl(
  value
) {
  const trimmed =
    value.trim()

  if (!trimmed) {
    return null
  }

  return /^https?:\/\//i.test(
    trimmed
  )
    ? trimmed
    : `https://${trimmed}`
}

function isValidRegistrationUrl(
  value
) {
  try {
    const url =
      new URL(value)

    return (
      ['http:', 'https:'].includes(
        url.protocol
      ) &&
      url.hostname.includes('.')
    )
  } catch {
    return false
  }
}

function parseFeeInput(
  value
) {
  return value === ''
    ? null
    : Number(value)
}

function TournamentForm({
  editingTournament,
  onClose,
  onSaved,
}) {
  const [
    formData,
    setFormData,
  ] = useState(emptyForm)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  useEffect(() => {
    if (!editingTournament) {
      setFormData(
        emptyForm
      )
      return
    }

    setFormData({
      name:
        editingTournament.name ||
        '',

      location:
        editingTournament.location ||
        '',

      event_date:
        editingTournament.event_date ||
        '',

      end_date:
        editingTournament.end_date ||
        '',

      registration_deadline:
        editingTournament.registration_deadline ||
        '',

      registration_url:
        editingTournament.registration_url ||
        '',

      available_events:
        getTournamentEvents(
          editingTournament
        ),

      entry_fee:
        formatFeeInput(
          editingTournament.entry_fee
        ),

      spectator_fee:
        formatFeeInput(
          editingTournament.spectator_fee
        ),

      fee_notes:
        editingTournament.fee_notes ||
        '',

    })
  }, [
    editingTournament,
  ])

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    )
  }

  function toggleAvailableEvent(
    eventName
  ) {
    setFormData(
      (current) => ({
        ...current,
        available_events:
          current.available_events.includes(
            eventName
          )
            ? current.available_events.filter(
                (item) =>
                  item !==
                  eventName
              )
            : ALL_TOURNAMENT_EVENTS.filter(
                (item) =>
                  item ===
                    eventName ||
                  current.available_events.includes(
                    item
                  )
              ),
      })
    )
  }

  function setAllAvailableEvents(
    selectAll
  ) {
    setFormData(
      (current) => ({
        ...current,
        available_events:
          selectAll
            ? ALL_TOURNAMENT_EVENTS
            : [],
      })
    )
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setMessage('')

    if (
      formData.end_date &&
      formData.end_date <
        formData.event_date
    ) {
      setMessage(
        'The tournament end date cannot be before the start date.'
      )
      return
    }

    if (
      formData.registration_deadline &&
      formData.event_date &&
      formData.registration_deadline >
        formData.event_date
    ) {
      setMessage(
        'The registration deadline cannot be after the tournament start date.'
      )
      return
    }

    if (
      formData.available_events.length ===
      0
    ) {
      setMessage(
        'Choose at least one event that is offered at this tournament.'
      )
      return
    }

    const registrationUrl =
      normalizeRegistrationUrl(
        formData.registration_url
      )

    if (
      registrationUrl &&
      !isValidRegistrationUrl(
        registrationUrl
      )
    ) {
      setMessage(
        'The registration link does not look like a web address. Copy it from your browser address bar, e.g. https://www.example.com/register.'
      )
      return
    }

    setSaving(true)

    const tournamentData = {
      name:
        formData.name.trim(),

      location:
        formData.location.trim() ||
        null,

      event_date:
        formData.event_date,

      end_date:
        formData.end_date ||
        null,

      registration_deadline:
        formData.registration_deadline ||
        null,

      registration_url:
        registrationUrl,

      available_events:
        formData.available_events,

      entry_fee:
        parseFeeInput(
          formData.entry_fee
        ),

      spectator_fee:
        parseFeeInput(
          formData.spectator_fee
        ),

      fee_notes:
        formData.fee_notes.trim() ||
        null,

    }

    let data
    let error

    if (
      editingTournament
    ) {
      const response =
        await supabase
          .from(
            'tournaments'
          )
          .update(
            tournamentData
          )
          .eq(
            'id',
            editingTournament.id
          )
          .select()
          .single()

      data =
        response.data

      error =
        response.error
    } else {
      const response =
        await supabase
          .from(
            'tournaments'
          )
          .insert([
            tournamentData,
          ])
          .select()
          .single()

      data =
        response.data

      error =
        response.error
    }

    if (error) {
      setMessage(
        /registration_url|available_events/.test(
          error.message
        )
          ? 'The registration link and event list need a database update first. Run supabase/tournament-registration.sql in the Supabase SQL editor, then try again.'
          : /spectator_fee|fee_notes/.test(
                error.message
              )
            ? 'Spectator fee and fee notes need a database update first. Run supabase/tournament-fees.sql in the Supabase SQL editor, then try again.'
            : error.message
      )

      setSaving(false)
      return
    }

    setSaving(false)

    if (onSaved) {
      await onSaved(
        data
      )
    }

    onClose()
  }

  return (
    <div
      className="mat-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="mat-tournament-form-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="mat-tournament-form-header">

          <h2>
            {editingTournament
              ? 'Edit Tournament'
              : 'Create Tournament'}
          </h2>

          <button
            type="button"
            className="mat-tournament-form-close"
            onClick={onClose}
            aria-label="Close tournament form"
          >
            <X size={24} />
          </button>

        </div>

        <form
          className="mat-tournament-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="mat-tournament-form-field">

            <label htmlFor="tournament-name">
              <span className="mat-tournament-form-label-icon">
                <Trophy size={21} />
              </span>

              <span>
                Tournament Name
              </span>
            </label>

            <input
              id="tournament-name"
              className="mat-tournament-form-input"
              name="name"
              type="text"
              placeholder="Enter tournament name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="tournament-location">

              <span className="mat-tournament-form-label-icon">
                <MapPin size={21} />
              </span>

              <span>
                Location
              </span>

            </label>

            <input
              id="tournament-location"
              className="mat-tournament-form-input"
              name="location"
              type="text"
              placeholder="Enter location (city, state)"
              value={
                formData.location
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="event-date">

              <span className="mat-tournament-form-label-icon">
                <CalendarDays size={21} />
              </span>

              <span>
                Start Date
              </span>

            </label>

            <input
              id="event-date"
              className="mat-tournament-form-input"
              name="event_date"
              type="date"
              value={
                formData.event_date
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="end-date">

              <span className="mat-tournament-form-label-icon">
                <CalendarDays size={21} />
              </span>

              <span>
                End Date
              </span>

            </label>

            <input
              id="end-date"
              className="mat-tournament-form-input"
              name="end_date"
              type="date"
              min={
                formData.event_date ||
                undefined
              }
              value={
                formData.end_date
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="registration-deadline">

              <span className="mat-tournament-form-label-icon">
                <CalendarDays size={21} />
              </span>

              <span>
                Registration Deadline
              </span>

            </label>

            <input
              id="registration-deadline"
              className="mat-tournament-form-input"
              name="registration_deadline"
              type="date"
              max={
                formData.event_date ||
                undefined
              }
              value={
                formData.registration_deadline
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="registration-url">

              <span className="mat-tournament-form-label-icon">
                <Link2 size={21} />
              </span>

              <span>
                Registration Link (optional)
              </span>

            </label>

            <input
              id="registration-url"
              className="mat-tournament-form-input"
              name="registration_url"
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder="Paste the tournament's sign-up page, e.g. https://..."
              value={
                formData.registration_url
              }
              onChange={
                handleChange
              }
            />

            <small className="mat-tournament-form-hint">
              Athletes see an "Open Registration Page" button on this tournament.
            </small>

          </div>

          <fieldset className="mat-tournament-form-events">

            <legend>
              <span className="mat-tournament-form-label-icon">
                <ListChecks size={21} />
              </span>

              <span>
                Events Offered
              </span>
            </legend>

            <div className="mat-tournament-form-events-bar">
              <small>
                Athletes can only choose from these events when they register.{' '}
                {
                  formData.available_events.length
                }{' '}
                of{' '}
                {
                  ALL_TOURNAMENT_EVENTS.length
                }{' '}
                selected.
              </small>

              <button
                type="button"
                onClick={() =>
                  setAllAvailableEvents(
                    formData.available_events.length <
                      ALL_TOURNAMENT_EVENTS.length
                  )
                }
              >
                {formData.available_events.length <
                ALL_TOURNAMENT_EVENTS.length
                  ? 'Select all'
                  : 'Clear all'}
              </button>
            </div>

            <div className="mat-tournament-form-event-groups">
              {EVENT_GROUPS.map(
                (group) => (
                  <div
                    key={
                      group.label
                    }
                    className="mat-tournament-form-event-group"
                  >
                    {group.events.length >
                      1 && (
                      <span>
                        {
                          group.label
                        }
                      </span>
                    )}

                    {group.events.map(
                      (eventName) => {
                        const checked =
                          formData.available_events.includes(
                            eventName
                          )

                        return (
                          <label
                            key={
                              eventName
                            }
                            className={`mat-tournament-event-option ${
                              checked
                                ? 'selected'
                                : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleAvailableEvent(
                                  eventName
                                )
                              }
                            />

                            <span>
                              {getEventOptionLabel(
                                group,
                                eventName
                              )}
                            </span>
                          </label>
                        )
                      }
                    )}
                  </div>
                )
              )}
            </div>

          </fieldset>

          <div className="mat-tournament-form-fee-heading">
            <strong>
              Tournament Costs
            </strong>

            <span>
              For athletes and parents to plan ahead. These are paid to the tournament organizer, not to MAT.
            </span>
          </div>

          <div className="mat-tournament-form-fee-grid">

            <div className="mat-tournament-form-field">

              <label htmlFor="entry-fee">

                <span className="mat-tournament-form-label-icon">
                  <CircleDollarSign size={21} />
                </span>

                <span>
                  Entry Fee (per athlete)
                </span>

              </label>

              <input
                id="entry-fee"
                className="mat-tournament-form-input"
                name="entry_fee"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={
                  formData.entry_fee
                }
                onChange={
                  handleChange
                }
              />

            </div>

            <div className="mat-tournament-form-field">

              <label htmlFor="spectator-fee">

                <span className="mat-tournament-form-label-icon">
                  <Ticket size={21} />
                </span>

                <span>
                  Spectator Fee
                </span>

              </label>

              <input
                id="spectator-fee"
                className="mat-tournament-form-input"
                name="spectator_fee"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={
                  formData.spectator_fee
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="fee-notes">

              <span className="mat-tournament-form-label-icon">
                <StickyNote size={21} />
              </span>

              <span>
                Cost Notes (optional)
              </span>

            </label>

            <textarea
              id="fee-notes"
              className="mat-tournament-form-input mat-tournament-form-textarea"
              name="fee_notes"
              rows={3}
              placeholder="e.g. Register and pay on Sport:80. Spectator wristbands sold at the door."
              value={
                formData.fee_notes
              }
              onChange={
                handleChange
              }
            />

          </div>

          {message && (
            <div className="mat-tournament-form-error">
              {message}
            </div>
          )}

          <div className="mat-tournament-form-actions">

            <button
              type="button"
              className="mat-tournament-form-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="mat-tournament-form-submit"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingTournament
                  ? 'Save Changes'
                  : 'Create Tournament'}
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default TournamentForm