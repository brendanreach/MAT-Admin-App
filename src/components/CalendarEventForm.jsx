import {
  CalendarDays,
  Clock3,
  MapPin,
  Repeat2,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

const EVENT_TYPES = [
  'Training',
  'Testing',
  'Seminar',
  'Team Event',
  'Deadline',
  'Closed',
  'Other',
]

function CalendarEventForm({
  editingEvent,
  defaultDate,
  onClose,
  onSaved,
}) {
  const [
    title,
    setTitle,
  ] = useState('')

  const [
    eventType,
    setEventType,
  ] = useState('Training')

  const [
    eventDate,
    setEventDate,
  ] = useState(
    defaultDate || ''
  )

  const [
    endDate,
    setEndDate,
  ] = useState('')

  const [
    startTime,
    setStartTime,
  ] = useState('')

  const [
    endTime,
    setEndTime,
  ] = useState('')

  const [
    location,
    setLocation,
  ] = useState('')

  const [
    notes,
    setNotes,
  ] = useState('')

  const [
    allDay,
    setAllDay,
  ] = useState(false)

  const [
    isRecurring,
    setIsRecurring,
  ] = useState(false)

  const [
    recurrenceEndDate,
    setRecurrenceEndDate,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  const weekdayName =
    useMemo(() => {
      if (!eventDate) {
        return ''
      }

      const date =
        new Date(
          `${eventDate}T00:00:00`
        )

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return ''
      }

      return date.toLocaleDateString(
        undefined,
        {
          weekday: 'long',
        }
      )
    }, [
      eventDate,
    ])

  useEffect(() => {
    if (!editingEvent) {
      setTitle('')
      setEventType('Training')
      setEventDate(
        defaultDate || ''
      )
      setEndDate('')
      setStartTime('')
      setEndTime('')
      setLocation('')
      setNotes('')
      setAllDay(false)
      setIsRecurring(false)
      setRecurrenceEndDate('')

      return
    }

    setTitle(
      editingEvent.title ||
        ''
    )

    setEventType(
      editingEvent.event_type ||
        'Training'
    )

    setEventDate(
      editingEvent.event_date ||
        ''
    )

    setEndDate(
      editingEvent.end_date ||
        ''
    )

    setStartTime(
      editingEvent.start_time
        ? String(
            editingEvent.start_time
          ).slice(0, 5)
        : ''
    )

    setEndTime(
      editingEvent.end_time
        ? String(
            editingEvent.end_time
          ).slice(0, 5)
        : ''
    )

    setLocation(
      editingEvent.location ||
        ''
    )

    setNotes(
      editingEvent.notes ||
        ''
    )

    setAllDay(
      Boolean(
        editingEvent.all_day
      )
    )

    setIsRecurring(
      editingEvent.recurrence_type ===
        'weekly'
    )

    setRecurrenceEndDate(
      editingEvent.recurrence_end_date ||
        ''
    )
  }, [
    editingEvent,
    defaultDate,
  ])

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setMessage('')

    if (!title.trim()) {
      setMessage(
        'Please enter an event title.'
      )
      return
    }

    if (!eventDate) {
      setMessage(
        'Please choose a start date.'
      )
      return
    }

    if (
      endDate &&
      endDate < eventDate
    ) {
      setMessage(
        'The event end date cannot be before the start date.'
      )
      return
    }

    if (
      isRecurring &&
      recurrenceEndDate &&
      recurrenceEndDate <
        eventDate
    ) {
      setMessage(
        'The repeat-until date cannot be before the first event.'
      )
      return
    }

    const sameEventDay =
      !endDate ||
      endDate === eventDate

    if (
      !allDay &&
      sameEventDay &&
      startTime &&
      endTime &&
      endTime < startTime
    ) {
      setMessage(
        'The end time cannot be before the start time.'
      )
      return
    }

    setSaving(true)

    const payload = {
      title:
        title.trim(),

      event_type:
        eventType,

      event_date:
        eventDate,

      end_date:
        endDate || null,

      start_time:
        allDay ||
        !startTime
          ? null
          : startTime,

      end_time:
        allDay ||
        !endTime
          ? null
          : endTime,

      location:
        location.trim() ||
        null,

      notes:
        notes.trim() ||
        null,

      all_day:
        allDay,

      recurrence_type:
        isRecurring
          ? 'weekly'
          : 'none',

      recurrence_end_date:
        isRecurring &&
        recurrenceEndDate
          ? recurrenceEndDate
          : null,
    }

    let error

    if (editingEvent) {
      const response =
        await supabase
          .from(
            'calendar_events'
          )
          .update(payload)
          .eq(
            'id',
            editingEvent.id
          )

      error =
        response.error
    } else {
      const response =
        await supabase
          .from(
            'calendar_events'
          )
          .insert([
            payload,
          ])

      error =
        response.error
    }

    if (error) {
      setMessage(
        error.message
      )

      setSaving(false)
      return
    }

    setSaving(false)

    if (onSaved) {
      await onSaved()
    }

    onClose()
  }

  return (
    <div
      className="mat-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="mat-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="mat-modal-header">

          <div>
            <div className="mat-eyebrow">
              Team Calendar
            </div>

            <h2>
              {editingEvent
                ? isRecurring
                  ? 'Edit Recurring Event'
                  : 'Edit Event'
                : 'Add Event'}
            </h2>
          </div>

          <button
            type="button"
            className="mat-history-close"
            onClick={onClose}
            aria-label="Close calendar event form"
          >
            <X size={20} />
          </button>

        </div>

        <form
          className="mat-form"
          onSubmit={
            handleSubmit
          }
        >

          {message && (
            <div className="mat-error">
              {message}
            </div>
          )}

          <div className="mat-form-group">

            <label htmlFor="calendar-event-title">
              Event Title
            </label>

            <input
              id="calendar-event-title"
              className="mat-input"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Example: Competition Team Training"
              autoFocus
              required
            />

          </div>

          <div className="mat-form-group">

            <label htmlFor="calendar-event-type">
              Event Type
            </label>

            <select
              id="calendar-event-type"
              className="mat-input"
              value={eventType}
              onChange={(event) =>
                setEventType(
                  event.target.value
                )
              }
            >
              {EVENT_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}
            </select>

          </div>

          <div className="mat-form-grid">

            <div className="mat-form-group">

              <label htmlFor="calendar-start-date">
                <CalendarDays
                  size={15}
                />

                Start Date
              </label>

              <input
                id="calendar-start-date"
                className="mat-input"
                type="date"
                value={eventDate}
                onChange={(event) => {
                  const newStartDate =
                    event.target.value

                  setEventDate(
                    newStartDate
                  )

                  if (
                    endDate &&
                    newStartDate &&
                    endDate <
                      newStartDate
                  ) {
                    setEndDate('')
                  }

                  if (
                    recurrenceEndDate &&
                    newStartDate &&
                    recurrenceEndDate <
                      newStartDate
                  ) {
                    setRecurrenceEndDate(
                      ''
                    )
                  }
                }}
                required
              />

            </div>

            <div className="mat-form-group">

              <label htmlFor="calendar-end-date">
                <CalendarDays
                  size={15}
                />

                End Date
              </label>

              <input
                id="calendar-end-date"
                className="mat-input"
                type="date"
                value={endDate}
                min={
                  eventDate ||
                  undefined
                }
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="mat-form-group">

            <label className="mat-checkbox-label">

              <input
                type="checkbox"
                checked={
                  allDay
                }
                onChange={(event) =>
                  setAllDay(
                    event.target.checked
                  )
                }
              />

              All-day event

            </label>

          </div>

          {!allDay && (
            <div className="mat-form-grid">

              <div className="mat-form-group">

                <label htmlFor="calendar-start-time">
                  <Clock3
                    size={15}
                  />

                  Start Time
                </label>

                <input
                  id="calendar-start-time"
                  className="mat-input"
                  type="time"
                  value={
                    startTime
                  }
                  onChange={(event) =>
                    setStartTime(
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="mat-form-group">

                <label htmlFor="calendar-end-time">
                  <Clock3
                    size={15}
                  />

                  End Time
                </label>

                <input
                  id="calendar-end-time"
                  className="mat-input"
                  type="time"
                  value={
                    endTime
                  }
                  onChange={(event) =>
                    setEndTime(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>
          )}

          <div className="mat-form-group">

            <label className="mat-checkbox-label">

              <input
                type="checkbox"
                checked={
                  isRecurring
                }
                onChange={(event) => {
                  const checked =
                    event.target.checked

                  setIsRecurring(
                    checked
                  )

                  if (!checked) {
                    setRecurrenceEndDate(
                      ''
                    )
                  }
                }}
              />

              <Repeat2
                size={16}
              />

              Recurring event

            </label>

          </div>

          {isRecurring && (
            <div className="mat-recurring-box">

              <div className="mat-recurring-summary">

                <Repeat2
                  size={18}
                />

                <div>
                  <strong>
                    Repeats every{' '}
                    {weekdayName ||
                      'week'}
                  </strong>

                  <span>
                    The start date
                    determines which
                    day of the week
                    this event repeats.
                  </span>
                </div>

              </div>

              <div className="mat-form-group">

                <label htmlFor="calendar-repeat-until">
                  Repeat Until
                </label>

                <input
                  id="calendar-repeat-until"
                  className="mat-input"
                  type="date"
                  min={
                    eventDate ||
                    undefined
                  }
                  value={
                    recurrenceEndDate
                  }
                  onChange={(event) =>
                    setRecurrenceEndDate(
                      event.target.value
                    )
                  }
                />

                <small className="mat-recurring-help">
                  Optional. Leave this
                  blank to continue
                  repeating every week.
                </small>

              </div>

            </div>
          )}

          <div className="mat-form-group">

            <label htmlFor="calendar-location">
              <MapPin size={15} />
              Location
            </label>

            <input
              id="calendar-location"
              className="mat-input"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(
                  event.target.value
                )
              }
              placeholder="Optional"
            />

          </div>

          <div className="mat-form-group">

            <label htmlFor="calendar-notes">
              Notes
            </label>

            <textarea
              id="calendar-notes"
              className="mat-textarea"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Optional event details..."
              rows={4}
            />

          </div>

          <div className="mat-form-actions">

            <button
              type="button"
              className="mat-secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="mat-primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingEvent
                  ? isRecurring
                    ? 'Save Series'
                    : 'Save Changes'
                  : isRecurring
                    ? 'Create Series'
                    : 'Add Event'}
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default CalendarEventForm