import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MapPin,
  Medal,
  Trophy,
  UserCheck,
} from 'lucide-react'

function AthleteTournamentsPage({
  member,
  tournaments = [],
  tournamentEntries = [],
  tournamentResults = [],
}) {
  function parseDate(dateString) {
    if (!dateString) {
      return null
    }

    return new Date(
      `${dateString}T00:00:00`
    )
  }

  function formatDate(dateString) {
    const date =
      parseDate(dateString)

    if (!date) {
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

  function getTournamentDate(
    tournament
  ) {
    if (
      tournament.end_date &&
      tournament.end_date !==
        tournament.event_date
    ) {
      return `${formatDate(
        tournament.event_date
      )} – ${formatDate(
        tournament.end_date
      )}`
    }

    return formatDate(
      tournament.event_date
    )
  }

  function getEventDisplayName(
    eventName
  ) {
    if (
      eventName ===
      'World Class Poomsae - Individual'
    ) {
      return 'World Class Poomsae — Individual'
    }

    if (
      eventName ===
      'World Class Poomsae - Mixed Pairs'
    ) {
      return 'World Class Poomsae — Mixed Pairs'
    }

    if (
      eventName ===
      'World Class Poomsae - Team'
    ) {
      return 'World Class Poomsae — Team'
    }

    return eventName
  }

  function getResultStage(result) {
    if (!result) {
      return ''
    }

    if (result.result_stage) {
      return result.result_stage
    }

    if (result.medal === 'Gold') {
      return 'Gold'
    }

    if (result.medal === 'Silver') {
      return 'Silver'
    }

    if (result.medal === 'Bronze') {
      return 'Bronze'
    }

    if (
      Number(
        result.placement
      ) === 1
    ) {
      return 'Gold'
    }

    if (
      Number(
        result.placement
      ) === 2
    ) {
      return 'Silver'
    }

    if (
      Number(
        result.placement
      ) === 3
    ) {
      return 'Bronze'
    }

    if (result.placement) {
      return `${result.placement}th Place`
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

  const tournamentRecords =
    tournaments.map(
      (tournament) => {
        const entry =
          tournamentEntries.find(
            (item) =>
              item.tournament_id ===
              tournament.id
          ) ||
          null

        const results =
          entry
            ? tournamentResults.filter(
                (result) =>
                  result.tournament_entry_id ===
                  entry.id
              )
            : []

        return {
          tournament,
          entry,
          results,
        }
      }
    )

  const upcoming =
    tournamentRecords
      .filter(
        ({
          tournament,
        }) => {
          const finalDate =
            parseDate(
              tournament.end_date ||
                tournament.event_date
            )

          return (
            finalDate &&
            finalDate >= today
          )
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          String(
            a.tournament
              .event_date ||
              ''
          ).localeCompare(
            String(
              b.tournament
                .event_date ||
                ''
            )
          )
      )

  const history =
    tournamentRecords
      .filter(
        ({
          tournament,
        }) => {
          const finalDate =
            parseDate(
              tournament.end_date ||
                tournament.event_date
            )

          return (
            finalDate &&
            finalDate < today
          )
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          String(
            b.tournament
              .event_date ||
              ''
          ).localeCompare(
            String(
              a.tournament
                .event_date ||
                ''
            )
          )
      )

  function renderTournamentCard(
    record,
    isHistory = false
  ) {
    const {
      tournament,
      entry,
      results,
    } =
      record

    const deadline =
      parseDate(
        tournament.registration_deadline
      )

    const deadlinePassed =
      deadline &&
      deadline < today

    return (
      <article
        key={
          tournament.id
        }
        className={`mat-athlete-tournament-card ${
          entry
            ? 'registered'
            : ''
        }`}
      >
        <div className="mat-athlete-tournament-header">

          <div>

            <div className="mat-athlete-tournament-label">

              {entry ? (
                <span className="mat-athlete-registration-badge registered">

                  <UserCheck
                    size={13}
                  />

                  Registered

                </span>
              ) : (
                <span className="mat-athlete-registration-badge">

                  {isHistory
                    ? 'Not Entered'
                    : 'Not Registered'}

                </span>
              )}

            </div>

            <h2>
              {
                tournament.name
              }
            </h2>

          </div>

          <div className="mat-athlete-tournament-icon">

            <Trophy
              size={22}
            />

          </div>

        </div>

        <div className="mat-athlete-tournament-meta">

          <span>

            <CalendarDays
              size={15}
            />

            {getTournamentDate(
              tournament
            )}

          </span>

          {tournament.location && (
            <span>

              <MapPin
                size={15}
              />

              {
                tournament.location
              }

            </span>
          )}

          {tournament.registration_deadline && (
            <span
              className={
                deadlinePassed
                  ? 'deadline-passed'
                  : ''
              }
            >

              <Clock3
                size={15}
              />

              Registration Deadline:{' '}
              {formatDate(
                tournament.registration_deadline
              )}

            </span>
          )}

          {tournament.entry_fee !==
            null &&
            tournament.entry_fee !==
              undefined && (
            <span>

              <CircleDollarSign
                size={15}
              />

              Entry Fee: $
              {Number(
                tournament.entry_fee ||
                  0
              ).toFixed(2)}

            </span>
          )}

        </div>

        {entry && (
          <div className="mat-athlete-tournament-entry">

            <div className="mat-athlete-tournament-entry-heading">

              <div>

                <CheckCircle2
                  size={17}
                />

                <strong>
                  My Entry
                </strong>

              </div>

              {entry.division_age_group && (
                <span>
                  Competition Age:{' '}
                  {
                    entry.division_age_group
                  }
                </span>
              )}

            </div>

            {entry.events?.length >
            0 ? (
              <div className="mat-athlete-tournament-events">

                {entry.events.map(
                  (eventName) => {
                    const result =
                      results.find(
                        (item) =>
                          item.event_name ===
                          eventName
                      )

                    const stage =
                      getResultStage(
                        result
                      )

                    const medal =
                      stage ===
                        'Gold' ||
                      stage ===
                        'Silver' ||
                      stage ===
                        'Bronze'

                    return (
                      <div
                        key={
                          eventName
                        }
                        className="mat-athlete-tournament-event"
                      >

                        <div>

                          <strong>
                            {getEventDisplayName(
                              eventName
                            )}
                          </strong>

                          {result
                            ?.division && (
                            <span>
                              {
                                result.division
                              }
                            </span>
                          )}

                        </div>

                        {stage && (
                          <span
                            className={`mat-athlete-result-badge ${
                              medal
                                ? stage.toLowerCase()
                                : ''
                            }`}
                          >

                            {medal && (
                              <Medal
                                size={13}
                              />
                            )}

                            {
                              stage
                            }

                          </span>
                        )}

                      </div>
                    )
                  }
                )}

              </div>
            ) : (
              <div className="mat-muted">
                No events have been
                recorded for this entry.
              </div>
            )}

            {entry.notes && (
              <div className="mat-athlete-tournament-note">

                <strong>
                  Entry Note
                </strong>

                <p>
                  {
                    entry.notes
                  }
                </p>

              </div>
            )}

          </div>
        )}

      </article>
    )
  }

  return (
    <div className="mat-athlete-page">

      <section className="mat-athlete-page-hero">

        <div className="mat-athlete-page-icon">

          <Trophy
            size={24}
          />

        </div>

        <div>

          <div className="mat-athlete-eyebrow">
            Competition Schedule
          </div>

          <h1>
            Tournaments
          </h1>

          <p>
            View upcoming competitions,
            registration deadlines and
            your tournament entries.
          </p>

        </div>

      </section>

      {!member && (
        <div className="mat-athlete-link-missing">

          <h2>
            Athlete Profile Not Linked
          </h2>

          <p>
            You can view the team
            tournament schedule, but
            registration status cannot
            be matched to your profile.
          </p>

        </div>
      )}

      <section className="mat-athlete-page-section">

        <div className="mat-athlete-page-section-heading">

          <div>

            <h2>
              Upcoming Tournaments
            </h2>

            <p>
              Competitions currently on
              the team schedule.
            </p>

          </div>

          <span>
            {
              upcoming.length
            }
          </span>

        </div>

        {upcoming.length ===
        0 ? (
          <div className="mat-athlete-empty-card">

            <Trophy
              size={30}
            />

            <h3>
              No Upcoming Tournaments
            </h3>

            <p>
              No future tournaments are
              currently scheduled.
            </p>

          </div>
        ) : (
          <div className="mat-athlete-tournament-list">

            {upcoming.map(
              (record) =>
                renderTournamentCard(
                  record
                )
            )}

          </div>
        )}

      </section>

      {history.length >
        0 && (
        <section className="mat-athlete-page-section">

          <div className="mat-athlete-page-section-heading">

            <div>

              <h2>
                Tournament History
              </h2>

              <p>
                Previous competitions
                and your recorded
                results.
              </p>

            </div>

            <span>
              {
                history.length
              }
            </span>

          </div>

          <div className="mat-athlete-tournament-list">

            {history.map(
              (record) =>
                renderTournamentCard(
                  record,
                  true
                )
            )}

          </div>

        </section>
      )}

    </div>
  )
}

export default AthleteTournamentsPage