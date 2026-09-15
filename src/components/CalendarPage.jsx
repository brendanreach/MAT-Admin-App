import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
  Trophy,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

import CalendarEventForm from './CalendarEventForm.jsx'
import TournamentForm from './TournamentForm.jsx'

function CalendarPage({
  calendarEvents,
  tournaments,
  onCalendarEventsChanged,
  onTournamentsChanged,
}) {
  const today =
    new Date()

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  )

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(null)

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingEvent,
    setEditingEvent,
  ] = useState(null)

  const [
    editingTournament,
    setEditingTournament,
  ] = useState(null)

  const [
    message,
    setMessage,
  ] = useState('')

  function dateToString(
    date
  ) {
    const year =
      date.getFullYear()

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      )

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      )

    return `${year}-${month}-${day}`
  }

  function stringToDate(
    dateString
  ) {
    if (!dateString) {
      return null
    }

    const date =
      new Date(
        `${dateString}T00:00:00`
      )

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null
    }

    return date
  }

  function addDays(
    date,
    numberOfDays
  ) {
    const result =
      new Date(date)

    result.setDate(
      result.getDate() +
        numberOfDays
    )

    return result
  }

  function daysBetween(
    startDate,
    endDate
  ) {
    const start =
      stringToDate(
        startDate
      )

    const end =
      stringToDate(
        endDate
      )

    if (
      !start ||
      !end
    ) {
      return 0
    }

    const difference =
      end.getTime() -
      start.getTime()

    return Math.max(
      0,
      Math.round(
        difference /
          86400000
      )
    )
  }

  function getDateRange(
    startDate,
    endDate
  ) {
    const start =
      stringToDate(
        startDate
      )

    const end =
      stringToDate(
        endDate ||
          startDate
      )

    if (
      !start ||
      !end
    ) {
      return []
    }

    const dates = []

    const current =
      new Date(start)

    while (
      current <= end
    ) {
      dates.push(
        dateToString(
          current
        )
      )

      current.setDate(
        current.getDate() + 1
      )
    }

    return dates
  }

  function formatDate(
    dateString
  ) {
    const date =
      stringToDate(
        dateString
      )

    if (!date) {
      return 'Date unavailable'
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  function formatDateRange(
    startDate,
    endDate
  ) {
    if (!startDate) {
      return 'Date unavailable'
    }

    if (
      !endDate ||
      endDate === startDate
    ) {
      return formatDate(
        startDate
      )
    }

    return `${formatDate(
      startDate
    )} – ${formatDate(
      endDate
    )}`
  }

  function formatTime(
    timeString
  ) {
    if (!timeString) {
      return ''
    }

    const [
      hours,
      minutes,
    ] =
      timeString
        .slice(0, 5)
        .split(':')
        .map(Number)

    const date =
      new Date()

    date.setHours(
      hours,
      minutes,
      0,
      0
    )

    return date.toLocaleTimeString(
      undefined,
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  }

  function getWeekdayName(
    dateString
  ) {
    const date =
      stringToDate(
        dateString
      )

    if (!date) {
      return ''
    }

    return date.toLocaleDateString(
      undefined,
      {
        weekday: 'long',
      }
    )
  }

  /*
    Recurring events are generated
    dynamically rather than inserting
    hundreds of database rows.

    If a weekly event has no ending
    date, we generate far enough ahead
    for the current calendar view and
    Upcoming Events panel.
  */

  const recurrenceHorizon =
    useMemo(() => {
      const oneYearFromToday =
        new Date(
          today.getFullYear() +
            1,
          today.getMonth(),
          today.getDate()
        )

      const oneYearFromVisibleMonth =
        new Date(
          visibleMonth.getFullYear() +
            1,
          visibleMonth.getMonth(),
          1
        )

      return oneYearFromToday >
        oneYearFromVisibleMonth
        ? oneYearFromToday
        : oneYearFromVisibleMonth
    }, [
      visibleMonth,
    ])

  const combinedEvents =
    useMemo(() => {
      const manualEvents = []

      for (const event of
        calendarEvents || []) {
        if (
          !event.event_date
        ) {
          continue
        }

        const durationDays =
          daysBetween(
            event.event_date,
            event.end_date
          )

        const isRecurring =
          event.recurrence_type ===
          'weekly'

        /*
          Non-recurring event
        */

        if (!isRecurring) {
          const eventDates =
            getDateRange(
              event.event_date,
              event.end_date
            )

          eventDates.forEach(
            (
              date,
              index
            ) => {
              manualEvents.push({
                id:
                  `${event.id}-${date}`,

                source:
                  'calendar',

                title:
                  event.title,

                eventType:
                  event.event_type,

                date,

                startDate:
                  event.event_date,

                endDate:
                  event.end_date,

                occurrenceStart:
                  event.event_date,

                occurrenceEnd:
                  event.end_date ||
                  event.event_date,

                startTime:
                  event.start_time,

                endTime:
                  event.end_time,

                allDay:
                  event.all_day,

                location:
                  event.location,

                notes:
                  event.notes,

                original:
                  event,

                isFirstDay:
                  index === 0,

                isLastDay:
                  index ===
                  eventDates.length -
                    1,

                isMultiDay:
                  eventDates.length >
                  1,

                isRecurring:
                  false,
              })
            }
          )

          continue
        }

        /*
          Weekly recurring event
        */

        const seriesStart =
          stringToDate(
            event.event_date
          )

        if (!seriesStart) {
          continue
        }

        const recurrenceEnd =
          event.recurrence_end_date
            ? stringToDate(
                event.recurrence_end_date
              )
            : recurrenceHorizon

        if (!recurrenceEnd) {
          continue
        }

        const effectiveEnd =
          recurrenceEnd <
          recurrenceHorizon
            ? recurrenceEnd
            : recurrenceHorizon

        let occurrenceStart =
          new Date(
            seriesStart
          )

        while (
          occurrenceStart <=
          effectiveEnd
        ) {
          const occurrenceEnd =
            addDays(
              occurrenceStart,
              durationDays
            )

          const occurrenceStartString =
            dateToString(
              occurrenceStart
            )

          const occurrenceEndString =
            dateToString(
              occurrenceEnd
            )

          const occurrenceDates =
            getDateRange(
              occurrenceStartString,
              occurrenceEndString
            )

          occurrenceDates.forEach(
            (
              date,
              index
            ) => {
              manualEvents.push({
                id:
                  `${event.id}-${occurrenceStartString}-${date}`,

                source:
                  'calendar',

                title:
                  event.title,

                eventType:
                  event.event_type,

                date,

                startDate:
                  event.event_date,

                endDate:
                  event.end_date,

                occurrenceStart:
                  occurrenceStartString,

                occurrenceEnd:
                  occurrenceEndString,

                startTime:
                  event.start_time,

                endTime:
                  event.end_time,

                allDay:
                  event.all_day,

                location:
                  event.location,

                notes:
                  event.notes,

                original:
                  event,

                isFirstDay:
                  index === 0,

                isLastDay:
                  index ===
                  occurrenceDates.length -
                    1,

                isMultiDay:
                  occurrenceDates.length >
                  1,

                isRecurring:
                  true,
              })
            }
          )

          occurrenceStart =
            addDays(
              occurrenceStart,
              7
            )
        }
      }

      const tournamentEvents = []

      for (const tournament of
        tournaments || []) {
        if (
          tournament.event_date
        ) {
          const tournamentDates =
            getDateRange(
              tournament.event_date,
              tournament.end_date
            )

          tournamentDates.forEach(
            (
              date,
              index
            ) => {
              tournamentEvents.push({
                id:
                  `tournament-${tournament.id}-${date}`,

                source:
                  'tournament',

                title:
                  tournament.name,

                eventType:
                  'Tournament',

                date,

                startDate:
                  tournament.event_date,

                endDate:
                  tournament.end_date,

                occurrenceStart:
                  tournament.event_date,

                occurrenceEnd:
                  tournament.end_date ||
                  tournament.event_date,

                startTime:
                  null,

                endTime:
                  null,

                allDay:
                  true,

                location:
                  tournament.location,

                notes:
                  null,

                original:
                  tournament,

                isFirstDay:
                  index === 0,

                isLastDay:
                  index ===
                  tournamentDates.length -
                    1,

                isMultiDay:
                  tournamentDates.length >
                  1,

                isRecurring:
                  false,
              })
            }
          )
        }

        if (
          tournament.registration_deadline
        ) {
          tournamentEvents.push({
            id:
              `deadline-${tournament.id}`,

            source:
              'tournament-deadline',

            title:
              `${tournament.name} Registration Deadline`,

            eventType:
              'Deadline',

            date:
              tournament.registration_deadline,

            startDate:
              tournament.registration_deadline,

            endDate:
              null,

            occurrenceStart:
              tournament.registration_deadline,

            occurrenceEnd:
              tournament.registration_deadline,

            startTime:
              null,

            endTime:
              null,

            allDay:
              true,

            location:
              null,

            notes:
              null,

            original:
              tournament,

            isFirstDay:
              true,

            isLastDay:
              true,

            isMultiDay:
              false,

            isRecurring:
              false,
          })
        }
      }

      return [
        ...manualEvents,
        ...tournamentEvents,
      ].sort(
        (a, b) => {
          const dateCompare =
            a.date.localeCompare(
              b.date
            )

          if (
            dateCompare !== 0
          ) {
            return dateCompare
          }

          if (
            a.eventType ===
              'Tournament' &&
            b.eventType !==
              'Tournament'
          ) {
            return -1
          }

          if (
            b.eventType ===
              'Tournament' &&
            a.eventType !==
              'Tournament'
          ) {
            return 1
          }

          return a.title.localeCompare(
            b.title
          )
        }
      )
    }, [
      calendarEvents,
      tournaments,
      recurrenceHorizon,
    ])

  const eventsByDate =
    useMemo(() => {
      const grouped = {}

      for (const event of
        combinedEvents) {
        if (
          !grouped[
            event.date
          ]
        ) {
          grouped[
            event.date
          ] = []
        }

        grouped[
          event.date
        ].push(
          event
        )
      }

      return grouped
    }, [
      combinedEvents,
    ])

  const calendarDays =
    useMemo(() => {
      const year =
        visibleMonth.getFullYear()

      const month =
        visibleMonth.getMonth()

      const firstDay =
        new Date(
          year,
          month,
          1
        )

      const lastDay =
        new Date(
          year,
          month + 1,
          0
        )

      const cells = []

      for (
        let index = 0;
        index <
        firstDay.getDay();
        index++
      ) {
        cells.push(null)
      }

      for (
        let day = 1;
        day <=
        lastDay.getDate();
        day++
      ) {
        cells.push(
          new Date(
            year,
            month,
            day
          )
        )
      }

      while (
        cells.length %
          7 !==
        0
      ) {
        cells.push(null)
      }

      return cells
    }, [
      visibleMonth,
    ])

  const upcomingEvents =
    useMemo(() => {
      const todayString =
        dateToString(
          new Date()
        )

      const uniqueEvents =
        new Map()

      for (const event of
        combinedEvents) {
        const occurrenceEnd =
          event.occurrenceEnd ||
          event.date

        if (
          occurrenceEnd <
          todayString
        ) {
          continue
        }

        let key

        /*
          Each occurrence of a recurring
          series should appear separately
          in Upcoming Events.
        */

        if (
          event.source ===
            'calendar' &&
          event.isRecurring
        ) {
          key =
            `calendar-${event.original.id}-${event.occurrenceStart}`
        } else if (
          event.source ===
          'calendar'
        ) {
          key =
            `calendar-${event.original.id}`
        } else if (
          event.source ===
          'tournament'
        ) {
          key =
            `tournament-${event.original.id}`
        } else {
          key =
            `deadline-${event.original.id}`
        }

        if (
          uniqueEvents.has(
            key
          )
        ) {
          continue
        }

        const displayDate =
          event.occurrenceStart <
            todayString &&
          occurrenceEnd >=
            todayString
            ? todayString
            : event.occurrenceStart

        uniqueEvents.set(
          key,
          {
            ...event,
            date:
              displayDate ||
              event.date,
          }
        )
      }

      return Array.from(
        uniqueEvents.values()
      )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        )
        .slice(
          0,
          8
        )
    }, [
      combinedEvents,
    ])

  const selectedEvents =
    selectedDate
      ? eventsByDate[
          selectedDate
        ] || []
      : []

  function goPreviousMonth() {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1
        )
    )
  }

  function goNextMonth() {
    setVisibleMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            1,
          1
        )
    )
  }

  function goToday() {
    const now =
      new Date()

    setVisibleMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    )

    setSelectedDate(
      dateToString(
        now
      )
    )
  }

  function openAddEvent(
    dateString = null
  ) {
    setEditingEvent(
      null
    )

    if (dateString) {
      setSelectedDate(
        dateString
      )
    }

    setShowForm(
      true
    )
  }

  function openEditEvent(
    event
  ) {
    if (
      event.source !==
      'calendar'
    ) {
      return
    }

    setEditingEvent(
      event.original
    )

    setShowForm(
      true
    )
  }

  function closeForm() {
    setShowForm(
      false
    )

    setEditingEvent(
      null
    )
  }

  function openTournamentEditor(
    event
  ) {
    if (
      event.source !==
        'tournament' &&
      event.source !==
        'tournament-deadline'
    ) {
      return
    }

    setEditingTournament(
      event.original
    )
  }

  function closeTournamentEditor() {
    setEditingTournament(
      null
    )
  }

  async function handleTournamentSaved(
    tournament
  ) {
    if (
      onTournamentsChanged
    ) {
      await onTournamentsChanged()
    }

    if (
      tournament?.event_date
    ) {
      const date =
        stringToDate(
          tournament.event_date
        )

      if (date) {
        setVisibleMonth(
          new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          )
        )

        setSelectedDate(
          tournament.event_date
        )
      }
    }
  }

  async function deleteEvent(
    event
  ) {
    if (
      event.source !==
      'calendar'
    ) {
      return
    }

    const recurring =
      event.original
        .recurrence_type ===
      'weekly'

    const confirmationMessage =
      recurring
        ? `Delete the entire recurring series "${event.title}"?`
        : `Delete "${event.title}" from the calendar?`

    const confirmed =
      window.confirm(
        confirmationMessage
      )

    if (!confirmed) {
      return
    }

    setMessage('')

    const {
      error,
    } =
      await supabase
        .from(
          'calendar_events'
        )
        .delete()
        .eq(
          'id',
          event.original.id
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    if (
      onCalendarEventsChanged
    ) {
      await onCalendarEventsChanged()
    }
  }

  function handleCalendarChipClick(
    event,
    dateString,
    clickEvent
  ) {
    clickEvent.stopPropagation()

    setSelectedDate(
      dateString
    )

    if (
      event.source ===
      'calendar'
    ) {
      openEditEvent(
        event
      )

      return
    }

    if (
      event.source ===
        'tournament' ||
      event.source ===
        'tournament-deadline'
    ) {
      openTournamentEditor(
        event
      )
    }
  }

  function handleUpcomingClick(
    event
  ) {
    const targetDate =
      event.date

    setSelectedDate(
      targetDate
    )

    const date =
      stringToDate(
        targetDate
      )

    if (!date) {
      return
    }

    setVisibleMonth(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    )
  }

  function getEventClass(
    eventType
  ) {
    switch (
      eventType
    ) {
      case 'Training':
        return 'training'

      case 'Tournament':
        return 'tournament'

      case 'Testing':
        return 'testing'

      case 'Seminar':
        return 'seminar'

      case 'Deadline':
        return 'deadline'

      case 'Closed':
        return 'closed'

      case 'Team Event':
        return 'team-event'

      default:
        return 'other'
    }
  }

  return (
    <div className="mat-page">

      <section className="mat-hero">

        <div>
          <div className="mat-eyebrow">
            Team Schedule
          </div>

          <h1 className="mat-page-title">
            Calendar
          </h1>

          <p className="mat-page-description">
            Trainings,
            tournaments,
            registration
            deadlines and
            important team
            dates.
          </p>
        </div>

        <button
          type="button"
          className="mat-primary-button"
          onClick={() =>
            openAddEvent(
              selectedDate
            )
          }
        >
          <Plus size={19} />
          Add Event
        </button>

      </section>

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      <div className="mat-calendar-layout">

        <section className="mat-calendar-panel">

          <div className="mat-calendar-toolbar">

            <div>
              <h2>
                {visibleMonth.toLocaleDateString(
                  undefined,
                  {
                    month:
                      'long',
                    year:
                      'numeric',
                  }
                )}
              </h2>
            </div>

            <div className="mat-calendar-navigation">

              <button
                type="button"
                className="mat-secondary-button"
                onClick={
                  goPreviousMonth
                }
                aria-label="Previous month"
              >
                <ChevronLeft
                  size={17}
                />
              </button>

              <button
                type="button"
                className="mat-secondary-button"
                onClick={
                  goToday
                }
              >
                Today
              </button>

              <button
                type="button"
                className="mat-secondary-button"
                onClick={
                  goNextMonth
                }
                aria-label="Next month"
              >
                <ChevronRight
                  size={17}
                />
              </button>

            </div>

          </div>

          <div className="mat-calendar-weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="mat-calendar-grid">

            {calendarDays.map(
              (
                date,
                index
              ) => {
                if (!date) {
                  return (
                    <div
                      key={
                        `blank-${index}`
                      }
                      className="mat-calendar-day empty"
                    />
                  )
                }

                const dateString =
                  dateToString(
                    date
                  )

                const dayEvents =
                  eventsByDate[
                    dateString
                  ] || []

                const isToday =
                  dateString ===
                  dateToString(
                    new Date()
                  )

                const isSelected =
                  dateString ===
                  selectedDate

                return (
                  <button
                    type="button"
                    key={
                      dateString
                    }
                    className={`mat-calendar-day ${
                      isToday
                        ? 'today'
                        : ''
                    } ${
                      isSelected
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedDate(
                        dateString
                      )
                    }
                  >

                    <div className="mat-calendar-day-number">
                      {
                        date.getDate()
                      }
                    </div>

                    <div className="mat-calendar-day-events">

                      {dayEvents
                        .slice(
                          0,
                          3
                        )
                        .map(
                          (
                            event
                          ) => (
                            <div
                              key={
                                event.id
                              }
                              className={`mat-calendar-chip ${getEventClass(
                                event.eventType
                              )} ${
                                event.isMultiDay
                                  ? 'multi-day'
                                  : ''
                              } ${
                                event.isFirstDay
                                  ? 'first-day'
                                  : ''
                              } ${
                                event.isLastDay
                                  ? 'last-day'
                                  : ''
                              }`}
                              onClick={(
                                clickEvent
                              ) =>
                                handleCalendarChipClick(
                                  event,
                                  dateString,
                                  clickEvent
                                )
                              }
                              title={`Edit ${event.title}`}
                            >
                              {event.isRecurring && (
                                <Repeat2
                                  size={10}
                                />
                              )}

                              <span>
                                {
                                  event.title
                                }
                              </span>
                            </div>
                          )
                        )}

                      {dayEvents.length >
                        3 && (
                        <div className="mat-calendar-more">
                          +
                          {dayEvents.length -
                            3}{' '}
                          more
                        </div>
                      )}

                    </div>

                  </button>
                )
              }
            )}

          </div>

        </section>

        <aside className="mat-calendar-sidebar">

          {selectedDate && (
            <section className="mat-calendar-side-card">

              <div className="mat-calendar-side-header">

                <div>
                  <span>
                    Selected Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedDate
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  className="mat-primary-button"
                  onClick={() =>
                    openAddEvent(
                      selectedDate
                    )
                  }
                  aria-label="Add event on selected date"
                >
                  <Plus
                    size={16}
                  />
                </button>

              </div>

              {selectedEvents.length ===
              0 ? (
                <div className="mat-calendar-empty">
                  No events
                  scheduled.
                </div>
              ) : (
                <div className="mat-calendar-event-list">

                  {selectedEvents.map(
                    (event) => (
                      <div
                        key={
                          event.id
                        }
                        className="mat-calendar-event-card"
                      >

                        <div className="mat-calendar-event-card-top">

                          <span
                            className={`mat-calendar-event-type ${getEventClass(
                              event.eventType
                            )}`}
                          >
                            {
                              event.eventType
                            }
                          </span>

                          {event.isRecurring && (
                            <span className="mat-calendar-recurring-badge">
                              <Repeat2
                                size={12}
                              />
                              Weekly
                            </span>
                          )}

                        </div>

                        <strong>
                          {
                            event.title
                          }
                        </strong>

                        {event.isRecurring && (
                          <span>
                            <Repeat2
                              size={13}
                            />

                            Every{' '}
                            {getWeekdayName(
                              event.original
                                .event_date
                            )}

                            {event.original
                              .recurrence_end_date
                              ? ` until ${formatDate(
                                  event.original
                                    .recurrence_end_date
                                )}`
                              : ''}
                          </span>
                        )}

                        {event.isMultiDay ? (
                          <span>
                            <CalendarDays
                              size={13}
                            />

                            {formatDateRange(
                              event.occurrenceStart,
                              event.occurrenceEnd
                            )}
                          </span>
                        ) : event.allDay ? (
                          <span>
                            <CalendarDays
                              size={13}
                            />

                            All Day
                          </span>
                        ) : null}

                        {!event.allDay &&
                          event.startTime && (
                            <span>
                              <Clock3
                                size={13}
                              />

                              {formatTime(
                                event.startTime
                              )}

                              {event.endTime
                                ? ` – ${formatTime(
                                    event.endTime
                                  )}`
                                : ''}
                            </span>
                          )}

                        {event.location && (
                          <span>
                            <MapPin
                              size={13}
                            />

                            {
                              event.location
                            }
                          </span>
                        )}

                        {event.notes && (
                          <p>
                            {
                              event.notes
                            }
                          </p>
                        )}

                        <div className="mat-calendar-event-actions">

                          {event.source ===
                            'calendar' && (
                            <>
                              <button
                                type="button"
                                className="mat-calendar-edit-button"
                                onClick={() =>
                                  openEditEvent(
                                    event
                                  )
                                }
                              >
                                <Pencil
                                  size={14}
                                />

                                {event.isRecurring
                                  ? 'Edit Series'
                                  : 'Edit Event'}
                              </button>

                              <button
                                type="button"
                                className="mat-calendar-delete-button"
                                onClick={() =>
                                  deleteEvent(
                                    event
                                  )
                                }
                              >
                                <Trash2
                                  size={14}
                                />

                                {event.isRecurring
                                  ? 'Delete Series'
                                  : 'Delete'}
                              </button>
                            </>
                          )}

                          {(event.source ===
                              'tournament' ||
                            event.source ===
                              'tournament-deadline') && (
                            <button
                              type="button"
                              className="mat-calendar-edit-button"
                              onClick={() =>
                                openTournamentEditor(
                                  event
                                )
                              }
                            >
                              <Pencil
                                size={14}
                              />

                              Edit Tournament
                            </button>
                          )}

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>
          )}

          <section className="mat-calendar-side-card">

            <div className="mat-calendar-side-header">

              <div>
                <span>
                  Coming Up
                </span>

                <strong>
                  Upcoming Events
                </strong>
              </div>

              <CalendarDays
                size={19}
              />

            </div>

            {upcomingEvents.length ===
            0 ? (
              <div className="mat-calendar-empty">
                Nothing
                scheduled yet.
              </div>
            ) : (
              <div className="mat-calendar-upcoming-list">

                {upcomingEvents.map(
                  (event) => (
                    <button
                      type="button"
                      key={
                        event.isRecurring
                          ? `${event.original.id}-${event.occurrenceStart}`
                          : `${event.source}-${event.original.id}`
                      }
                      className="mat-calendar-upcoming"
                      onClick={() =>
                        handleUpcomingClick(
                          event
                        )
                      }
                    >

                      <div className="mat-calendar-upcoming-date">

                        <strong>
                          {stringToDate(
                            event.date
                          )?.toLocaleDateString(
                            undefined,
                            {
                              day:
                                'numeric',
                            }
                          )}
                        </strong>

                        <span>
                          {stringToDate(
                            event.date
                          )?.toLocaleDateString(
                            undefined,
                            {
                              month:
                                'short',
                            }
                          )}
                        </span>

                      </div>

                      <div>

                        <strong>
                          {
                            event.title
                          }
                        </strong>

                        <span>
                          {
                            event.eventType
                          }

                          {event.isRecurring
                            ? ` • Every ${getWeekdayName(
                                event.original
                                  .event_date
                              )}`
                            : event.isMultiDay
                              ? ` • ${formatDateRange(
                                  event.occurrenceStart,
                                  event.occurrenceEnd
                                )}`
                              : ''}
                        </span>

                      </div>

                      {event.isRecurring ? (
                        <Repeat2
                          size={16}
                        />
                      ) : event.eventType ===
                        'Tournament' ? (
                        <Trophy
                          size={16}
                        />
                      ) : null}

                    </button>
                  )
                )}

              </div>
            )}

          </section>

        </aside>

      </div>

      {showForm && (
        <CalendarEventForm
          editingEvent={
            editingEvent
          }
          defaultDate={
            selectedDate
          }
          onClose={
            closeForm
          }
          onSaved={
            onCalendarEventsChanged
          }
        />
      )}

      {editingTournament && (
        <TournamentForm
          editingTournament={
            editingTournament
          }
          onClose={
            closeTournamentEditor
          }
          onSaved={
            handleTournamentSaved
          }
        />
      )}

    </div>
  )
}

export default CalendarPage