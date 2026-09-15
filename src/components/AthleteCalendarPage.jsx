import {
  CalendarDays,
  Clock3,
  MapPin,
  Repeat2,
  Trophy,
} from 'lucide-react'

function AthleteCalendarPage({
  calendarEvents = [],
  tournaments = [],
}) {
  function parseDate(
    dateString
  ) {
    if (!dateString) {
      return null
    }

    return new Date(
      `${dateString}T00:00:00`
    )
  }

  function formatDate(
    dateString
  ) {
    const date =
      parseDate(
        dateString
      )

    if (!date) {
      return '—'
    }

    return date.toLocaleDateString(
      undefined,
      {
        weekday:
          'short',
        month:
          'short',
        day:
          'numeric',
        year:
          'numeric',
      }
    )
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
      timeString.split(
        ':'
      )

    const date =
      new Date()

    date.setHours(
      Number(
        hours
      ),
      Number(
        minutes
      ),
      0,
      0
    )

    return date.toLocaleTimeString(
      undefined,
      {
        hour:
          'numeric',
        minute:
          '2-digit',
      }
    )
  }

  function getDateRange(
    item
  ) {
    if (
      !item.end_date ||
      item.end_date ===
        item.event_date
    ) {
      return formatDate(
        item.event_date
      )
    }

    return `${formatDate(
      item.event_date
    )} – ${formatDate(
      item.end_date
    )}`
  }

  function getTimeLabel(
    event
  ) {
    if (
      event.all_day
    ) {
      return 'All Day'
    }

    if (
      event.start_time &&
      event.end_time
    ) {
      return `${formatTime(
        event.start_time
      )} – ${formatTime(
        event.end_time
      )}`
    }

    if (
      event.start_time
    ) {
      return formatTime(
        event.start_time
      )
    }

    return ''
  }

  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

  const combinedItems = [
    ...calendarEvents.map(
      (
        event
      ) => ({
        id:
          `calendar-${event.id}`,

        source:
          'calendar',

        title:
          event.title,

        eventType:
          event.event_type ||
          'Team Event',

        event_date:
          event.event_date,

        end_date:
          event.end_date,

        location:
          event.location,

        notes:
          event.notes,

        all_day:
          event.all_day,

        start_time:
          event.start_time,

        end_time:
          event.end_time,

        recurrence_type:
          event.recurrence_type,

        recurrence_end_date:
          event.recurrence_end_date,
      })
    ),

    ...tournaments.map(
      (
        tournament
      ) => ({
        id:
          `tournament-${tournament.id}`,

        source:
          'tournament',

        title:
          tournament.name,

        eventType:
          'Tournament',

        event_date:
          tournament.event_date,

        end_date:
          tournament.end_date,

        location:
          tournament.location,

        notes:
          null,
      })
    ),

    ...tournaments
      .filter(
        (
          tournament
        ) =>
          tournament.registration_deadline
      )
      .map(
        (
          tournament
        ) => ({
          id:
            `deadline-${tournament.id}`,

          source:
            'deadline',

          title:
            `${tournament.name} Registration Deadline`,

          eventType:
            'Deadline',

          event_date:
            tournament.registration_deadline,

          end_date:
            null,

          location:
            null,

          notes:
            `Registration deadline for ${tournament.name}.`,
        })
      ),
  ]
    .filter(
      (
        item
      ) =>
        item.event_date
    )
    .sort(
      (
        a,
        b
      ) =>
        String(
          a.event_date
        ).localeCompare(
          String(
            b.event_date
          )
        )
    )

  const upcomingItems =
    combinedItems.filter(
      (
        item
      ) => {
        const finalDate =
          parseDate(
            item.end_date ||
            item.event_date
          )

        return (
          finalDate &&
          finalDate >= today
        )
      }
    )

  const pastItems =
    combinedItems
      .filter(
        (
          item
        ) => {
          const finalDate =
            parseDate(
              item.end_date ||
              item.event_date
            )

          return (
            finalDate &&
            finalDate < today
          )
        }
      )
      .reverse()
      .slice(
        0,
        10
      )

  function renderEventCard(
    item
  ) {
    const timeLabel =
      item.source ===
        'calendar'
        ? getTimeLabel(
            item
          )
        : ''

    return (
      <article
        key={
          item.id
        }
        className={`mat-athlete-calendar-card mat-athlete-calendar-${item.source}`}
      >

        <div className="mat-athlete-calendar-date-box">

          <span>
            {parseDate(
              item.event_date
            )?.toLocaleDateString(
              undefined,
              {
                month:
                  'short',
              }
            )}
          </span>

          <strong>
            {parseDate(
              item.event_date
            )?.getDate()}
          </strong>

        </div>

        <div className="mat-athlete-calendar-content">

          <div className="mat-athlete-calendar-heading">

            <div>

              <span className="mat-athlete-event-type">
                {
                  item.eventType
                }
              </span>

              <h3>
                {
                  item.title
                }
              </h3>

            </div>

            {item.source ===
              'tournament' && (
              <Trophy
                size={20}
              />
            )}

          </div>

          <div className="mat-athlete-calendar-meta">

            <span>

              <CalendarDays
                size={14}
              />

              {getDateRange(
                item
              )}

            </span>

            {timeLabel && (
              <span>

                <Clock3
                  size={14}
                />

                {
                  timeLabel
                }

              </span>
            )}

            {item.location && (
              <span>

                <MapPin
                  size={14}
                />

                {
                  item.location
                }

              </span>
            )}

          </div>

          {item.recurrence_type ===
            'weekly' && (
            <div className="mat-athlete-calendar-repeat">

              <Repeat2
                size={14}
              />

              Repeats weekly
              {item.recurrence_end_date
                ? ` through ${formatDate(
                    item.recurrence_end_date
                  )}`
                : ''}

            </div>
          )}

          {item.notes && (
            <p>
              {
                item.notes
              }
            </p>
          )}

        </div>

      </article>
    )
  }

  return (
    <div className="mat-athlete-page">

      <section className="mat-athlete-page-hero">

        <div className="mat-athlete-page-icon">

          <CalendarDays
            size={24}
          />

        </div>

        <div>
          <div className="mat-athlete-eyebrow">
            Team Schedule
          </div>

          <h1>
            Calendar
          </h1>

          <p>
            Training, testing, team
            events, tournaments,
            closures and registration
            deadlines.
          </p>
        </div>

      </section>

      <section className="mat-athlete-page-section">

        <div className="mat-athlete-page-section-heading">

          <div>
            <h2>
              Coming Up
            </h2>

            <p>
              Upcoming team dates and
              deadlines.
            </p>
          </div>

          <span>
            {
              upcomingItems.length
            }
          </span>

        </div>

        {upcomingItems.length ===
        0 ? (
          <div className="mat-athlete-empty-card">

            <CalendarDays
              size={30}
            />

            <h3>
              Nothing Scheduled
            </h3>

            <p>
              There are no upcoming
              calendar items right now.
            </p>

          </div>
        ) : (
          <div className="mat-athlete-calendar-list">

            {upcomingItems.map(
              renderEventCard
            )}

          </div>
        )}

      </section>

      {pastItems.length >
        0 && (
        <section className="mat-athlete-page-section">

          <div className="mat-athlete-page-section-heading">

            <div>
              <h2>
                Recent Dates
              </h2>

              <p>
                Recently completed team
                events.
              </p>
            </div>

          </div>

          <div className="mat-athlete-calendar-list mat-athlete-calendar-past">

            {pastItems.map(
              renderEventCard
            )}

          </div>

        </section>
      )}

    </div>
  )
}

export default AthleteCalendarPage