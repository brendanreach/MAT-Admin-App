import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  MapPin,
  Megaphone,
  Trophy,
} from 'lucide-react'

import { useMemo } from 'react'

function getTodayString() {
  const today = new Date()

  const year = today.getFullYear()

  const month = String(
    today.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    today.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function stringToDate(dateString) {
  if (!dateString) {
    return null
  }

  return new Date(
    `${dateString}T00:00:00`
  )
}

function dateToString(date) {
  const year =
    date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(dateString) {
  if (!dateString) {
    return '—'
  }

  const date =
    stringToDate(dateString)

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
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

function formatShortDate(
  dateString
) {
  if (!dateString) {
    return ''
  }

  const date =
    stringToDate(dateString)

  if (!date) {
    return ''
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  )
}

function formatDateRange(
  startDate,
  endDate
) {
  if (
    !endDate ||
    startDate === endDate
  ) {
    return formatDate(
      startDate
    )
  }

  const start =
    stringToDate(startDate)

  const end =
    stringToDate(endDate)

  if (!start || !end) {
    return formatDate(
      startDate
    )
  }

  if (
    start.getFullYear() ===
      end.getFullYear() &&
    start.getMonth() ===
      end.getMonth()
  ) {
    const month =
      start.toLocaleDateString(
        undefined,
        {
          month: 'short',
        }
      )

    return `${month} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
  }

  return `${formatShortDate(
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
    timeString.split(':')

  const date =
    new Date()

  date.setHours(
    Number(hours),
    Number(minutes),
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

function getNextWeeklyOccurrence(
  event,
  today
) {
  if (
    event.recurrence_type !==
    'weekly'
  ) {
    return event.event_date >=
      today
      ? event.event_date
      : null
  }

  const firstDate =
    stringToDate(
      event.event_date
    )

  const todayDate =
    stringToDate(
      today
    )

  if (
    !firstDate ||
    !todayDate
  ) {
    return null
  }

  let occurrence =
    new Date(firstDate)

  while (
    occurrence <
    todayDate
  ) {
    occurrence.setDate(
      occurrence.getDate() +
        7
    )
  }

  const occurrenceString =
    dateToString(
      occurrence
    )

  if (
    event.recurrence_end_date &&
    occurrenceString >
      event.recurrence_end_date
  ) {
    return null
  }

  return occurrenceString
}

function HomePage({
  members,
  tournaments,
  calendarEvents,
  announcements,
  onNavigate,
}) {
  const today =
    getTodayString()

  const upcomingTournaments =
    useMemo(() => {
      return (
        tournaments || []
      )
        .filter(
          (tournament) => {
            const lastDate =
              tournament.end_date ||
              tournament.event_date

            return (
              lastDate >= today
            )
          }
        )
        .sort(
          (a, b) =>
            a.event_date.localeCompare(
              b.event_date
            )
        )
    }, [
      tournaments,
      today,
    ])

  const nextTournament =
    upcomingTournaments[0] ||
    null

  const currentAnnouncements =
    useMemo(() => {
      return (
        announcements || []
      )
        .filter(
          (announcement) => {
            const published =
              announcement.publish_date <=
              today

            const active =
              announcement.is_active

            const notExpired =
              !announcement.expiration_date ||
              announcement.expiration_date >=
                today

            return (
              published &&
              active &&
              notExpired
            )
          }
        )
        .sort(
          (a, b) => {
            const priorityOrder = {
              urgent: 3,
              important: 2,
              normal: 1,
            }

            const priorityDifference =
              priorityOrder[
                b.priority
              ] -
              priorityOrder[
                a.priority
              ]

            if (
              priorityDifference !==
              0
            ) {
              return priorityDifference
            }

            return b.publish_date.localeCompare(
              a.publish_date
            )
          }
        )
    }, [
      announcements,
      today,
    ])

  const importantAnnouncements =
    currentAnnouncements.filter(
      (announcement) =>
        announcement.featured ||
        announcement.priority ===
          'urgent' ||
        announcement.priority ===
          'important'
    )

  const topAnnouncement =
    importantAnnouncements[0] ||
    currentAnnouncements[0] ||
    null

  const upcomingItems =
    useMemo(() => {
      const items = []

      ;(
        calendarEvents || []
      ).forEach(
        (event) => {
          const nextDate =
            getNextWeeklyOccurrence(
              event,
              today
            )

          if (!nextDate) {
            return
          }

          items.push({
            id:
              `calendar-${event.id}-${nextDate}`,

            title:
              event.title,

            date:
              nextDate,

            type:
              event.event_type,

            time:
              event.all_day
                ? ''
                : formatTime(
                    event.start_time
                  ),
          })
        }
      )

      ;(
        tournaments || []
      ).forEach(
        (tournament) => {
          const lastDate =
            tournament.end_date ||
            tournament.event_date

          if (
            lastDate >= today
          ) {
            items.push({
              id:
                `tournament-${tournament.id}`,

              title:
                tournament.name,

              date:
                tournament.event_date,

              type:
                'Tournament',
            })
          }

          if (
            tournament.registration_deadline &&
            tournament.registration_deadline >=
              today
          ) {
            items.push({
              id:
                `deadline-${tournament.id}`,

              title:
                `${tournament.name} Registration Deadline`,

              date:
                tournament.registration_deadline,

              type:
                'Deadline',
            })
          }
        }
      )

      return items
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        )
        .slice(0, 4)
    }, [
      calendarEvents,
      tournaments,
      today,
    ])

  const nextCalendarItem =
    upcomingItems[0] ||
    null

  return (
    <div className="mat-hub">

      <section className="mat-hub-welcome">

        <div className="mat-hub-welcome-content">

          <div className="mat-eyebrow">
            Michigan Academy of Taekwondo
          </div>

          <h1>
            Welcome to MAT
          </h1>

          <p>
            Everything you need for training,
            tournaments and team updates is
            right here.
          </p>

        </div>

      </section>

      <section className="mat-hub-tiles">

        <button
          type="button"
          className="mat-hub-tile"
          onClick={() =>
            onNavigate(
              'announcements'
            )
          }
        >

          <div className="mat-hub-tile-icon">
            <Megaphone
              size={22}
            />
          </div>

          <div className="mat-hub-tile-label">
            Announcements
          </div>

          <div className="mat-hub-tile-body">

            {topAnnouncement ? (
              <>
                <div className="mat-hub-tile-highlight">

                  {topAnnouncement.priority ===
                    'urgent' && (
                    <AlertTriangle
                      size={14}
                    />
                  )}

                  <strong>
                    {
                      topAnnouncement.title
                    }
                  </strong>

                </div>

                <p>
                  {importantAnnouncements.length >
                  0
                    ? `${importantAnnouncements.length} important ${
                        importantAnnouncements.length ===
                        1
                          ? 'update'
                          : 'updates'
                      }`
                    : `${currentAnnouncements.length} current ${
                        currentAnnouncements.length ===
                        1
                          ? 'announcement'
                          : 'announcements'
                      }`}
                </p>
              </>
            ) : (
              <>
                <strong>
                  You're all caught up
                </strong>

                <p>
                  No current announcements.
                </p>
              </>
            )}

          </div>

          <div className="mat-hub-tile-action">
            Open announcements

            <ArrowRight
              size={14}
            />
          </div>

        </button>

        <button
          type="button"
          className="mat-hub-tile"
          onClick={() =>
            onNavigate(
              'tournaments'
            )
          }
        >

          <div className="mat-hub-tile-icon">
            <Trophy
              size={22}
            />
          </div>

          <div className="mat-hub-tile-label">
            Next Tournament
          </div>

          <div className="mat-hub-tile-body">

            {nextTournament ? (
              <>
                <strong>
                  {
                    nextTournament.name
                  }
                </strong>

                <p>
                  {formatDateRange(
                    nextTournament.event_date,
                    nextTournament.end_date
                  )}
                </p>

                {nextTournament.location && (
                  <span className="mat-hub-tile-detail">
                    <MapPin
                      size={13}
                    />

                    {
                      nextTournament.location
                    }
                  </span>
                )}
              </>
            ) : (
              <>
                <strong>
                  No tournament scheduled
                </strong>

                <p>
                  Your next tournament will
                  appear here.
                </p>
              </>
            )}

          </div>

          <div className="mat-hub-tile-action">
            Open tournaments

            <ArrowRight
              size={14}
            />
          </div>

        </button>

        <button
          type="button"
          className="mat-hub-tile"
          onClick={() =>
            onNavigate(
              'calendar'
            )
          }
        >

          <div className="mat-hub-tile-icon">
            <CalendarDays
              size={22}
            />
          </div>

          <div className="mat-hub-tile-label">
            Calendar
          </div>

          <div className="mat-hub-tile-body">

            {nextCalendarItem ? (
              <>
                <strong>
                  {
                    nextCalendarItem.title
                  }
                </strong>

                <p>
                  {formatDate(
                    nextCalendarItem.date
                  )}

                  {nextCalendarItem.time
                    ? ` • ${nextCalendarItem.time}`
                    : ''}
                </p>

                <span className="mat-hub-tile-detail">
                  {
                    nextCalendarItem.type
                  }
                </span>
              </>
            ) : (
              <>
                <strong>
                  Nothing coming up
                </strong>

                <p>
                  Upcoming events will
                  appear here.
                </p>
              </>
            )}

          </div>

          <div className="mat-hub-tile-action">
            Open calendar

            <ArrowRight
              size={14}
            />
          </div>

        </button>

      </section>

      <button
        type="button"
        className="mat-hub-start-card"
        onClick={() =>
          onNavigate(
            'new-member-guide'
          )
        }
      >

        <div className="mat-hub-start-icon">
          <GraduationCap
            size={26}
          />
        </div>

        <div className="mat-hub-start-content">

          <span>
            New to the Competition Team?
          </span>

          <strong>
            Start Here
          </strong>

          <p>
            Learn how tournament registration
            works, find required forms and
            sparring divisions, prepare for
            tournament day, and review useful
            Taekwondo terminology.
          </p>

        </div>

        <div className="mat-hub-start-action">
          <BookOpen
            size={17}
          />

          Open New Member Guide

          <ArrowRight
            size={16}
          />
        </div>

      </button>

      <section className="mat-hub-upcoming">

        <div className="mat-hub-section-header">

          <div>
            <span>
              What's Next
            </span>

            <h2>
              Coming Up
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate(
                'calendar'
              )
            }
          >
            View Calendar

            <ArrowRight
              size={14}
            />
          </button>

        </div>

        {upcomingItems.length ===
        0 ? (
          <div className="mat-hub-upcoming-empty">

            <CalendarDays
              size={24}
            />

            <span>
              Nothing is currently scheduled.
            </span>

          </div>
        ) : (
          <div className="mat-hub-upcoming-grid">

            {upcomingItems.map(
              (item) => {
                const date =
                  stringToDate(
                    item.date
                  )

                return (
                  <div
                    key={
                      item.id
                    }
                    className="mat-hub-upcoming-item"
                  >

                    <div className="mat-hub-upcoming-date">

                      <span>
                        {date.toLocaleDateString(
                          undefined,
                          {
                            month:
                              'short',
                          }
                        )}
                      </span>

                      <strong>
                        {
                          date.getDate()
                        }
                      </strong>

                    </div>

                    <div className="mat-hub-upcoming-content">

                      <strong>
                        {
                          item.title
                        }
                      </strong>

                      <span>
                        {
                          item.type
                        }

                        {item.time
                          ? ` • ${item.time}`
                          : ''}
                      </span>

                    </div>

                  </div>
                )
              }
            )}

          </div>
        )}

      </section>

    </div>
  )
}

export default HomePage