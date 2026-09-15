import {
  CalendarDays,
  Medal,
  Trophy,
  X,
} from 'lucide-react'

function AthleteHistoryModal({
  member,
  tournaments,
  allTournamentEntries,
  tournamentResults,
  onClose,
}) {
  if (!member) {
    return null
  }

  const athleteEntries =
    allTournamentEntries
      .filter(
        (entry) =>
          entry.member_id === member.id
      )
      .map((entry) => {
        const tournament =
          tournaments.find(
            (item) =>
              item.id ===
              entry.tournament_id
          )

        const results =
          tournamentResults.filter(
            (result) =>
              result.tournament_entry_id ===
              entry.id
          )

        return {
          ...entry,
          tournament,
          results,
        }
      })
      .filter(
        (entry) => entry.tournament
      )
      .sort((a, b) => {
        const dateA =
          a.tournament?.event_date || ''
        const dateB =
          b.tournament?.event_date || ''

        return dateB.localeCompare(dateA)
      })

  const allResults =
    athleteEntries.flatMap(
      (entry) => entry.results
    )

  const goldCount =
    allResults.filter(
      (result) =>
        result.medal === 'Gold'
    ).length

  const silverCount =
    allResults.filter(
      (result) =>
        result.medal === 'Silver'
    ).length

  const bronzeCount =
    allResults.filter(
      (result) =>
        result.medal === 'Bronze'
    ).length

  function formatDate(dateString) {
    if (!dateString) {
      return 'Date unavailable'
    }

    const date = new Date(
      `${dateString}T00:00:00`
    )

    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  function placementLabel(placement) {
    if (!placement) {
      return null
    }

    const number = Number(placement)

    if (number === 1) {
      return '1st Place'
    }

    if (number === 2) {
      return '2nd Place'
    }

    if (number === 3) {
      return '3rd Place'
    }

    return `${number}th Place`
  }

  return (
    <div
      className="mat-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="mat-history-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="mat-history-header">
          <div>
            <div className="mat-eyebrow">
              Athlete Competition History
            </div>

            <h2>
              {member.first_name}{' '}
              {member.last_name}
            </h2>

            <p>
              Tournament registrations,
              events and competitive
              results.
            </p>
          </div>

          <button
            type="button"
            className="mat-history-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mat-history-stats">
          <div>
            <Trophy size={20} />
            <strong>
              {athleteEntries.length}
            </strong>
            <span>Tournaments</span>
          </div>

          <div className="gold">
            <Medal size={20} />
            <strong>{goldCount}</strong>
            <span>Gold</span>
          </div>

          <div className="silver">
            <Medal size={20} />
            <strong>{silverCount}</strong>
            <span>Silver</span>
          </div>

          <div className="bronze">
            <Medal size={20} />
            <strong>{bronzeCount}</strong>
            <span>Bronze</span>
          </div>
        </div>

        <div className="mat-history-body">
          {athleteEntries.length ===
          0 ? (
            <div className="mat-history-empty">
              <Trophy size={34} />

              <strong>
                No tournament history yet
              </strong>

              <span>
                This athlete has not been
                registered for a tournament.
              </span>
            </div>
          ) : (
            athleteEntries.map(
              (entry) => (
                <div
                  key={entry.id}
                  className="mat-history-tournament"
                >
                  <div className="mat-history-tournament-header">
                    <div>
                      <strong>
                        {
                          entry.tournament
                            .name
                        }
                      </strong>

                      <span>
                        <CalendarDays
                          size={14}
                        />

                        {formatDate(
                          entry.tournament
                            .event_date
                        )}
                      </span>
                    </div>

                    {entry.results.length >
                      0 && (
                      <div className="mat-history-result-count">
                        {
                          entry.results
                            .length
                        }{' '}
                        result
                        {entry.results
                          .length !== 1
                          ? 's'
                          : ''}
                      </div>
                    )}
                  </div>

                  {entry.events?.length >
                  0 ? (
                    <div className="mat-history-events">
                      {entry.events.map(
                        (eventName) => {
                          const result =
                            entry.results.find(
                              (item) =>
                                item.event_name ===
                                eventName
                            )

                          return (
                            <div
                              key={
                                eventName
                              }
                              className="mat-history-event"
                            >
                              <div className="mat-history-event-name">
                                <strong>
                                  {
                                    eventName
                                  }
                                </strong>

                                {result?.division && (
                                  <span>
                                    {
                                      result.division
                                    }
                                  </span>
                                )}
                              </div>

                              <div className="mat-history-event-result">
                                {result ? (
                                  <>
                                    {result.medal &&
                                      result.medal !==
                                        'None' && (
                                        <span
                                          className={`mat-medal-badge ${result.medal.toLowerCase()}`}
                                        >
                                          <Medal
                                            size={
                                              13
                                            }
                                          />

                                          {
                                            result.medal
                                          }
                                        </span>
                                      )}

                                    {result.placement && (
                                      <span className="mat-history-placement">
                                        {placementLabel(
                                          result.placement
                                        )}
                                      </span>
                                    )}

                                    {!result.placement &&
                                      (!result.medal ||
                                        result.medal ===
                                          'None') && (
                                        <span className="mat-muted">
                                          Result recorded
                                        </span>
                                      )}
                                  </>
                                ) : (
                                  <span className="mat-muted">
                                    No result
                                    recorded
                                  </span>
                                )}
                              </div>

                              {result?.notes && (
                                <div className="mat-history-notes">
                                  {
                                    result.notes
                                  }
                                </div>
                              )}
                            </div>
                          )
                        }
                      )}
                    </div>
                  ) : (
                    <div className="mat-history-no-events">
                      No events were
                      recorded for this
                      tournament.
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default AthleteHistoryModal