import {
  Award,
  Bell,
  CalendarDays,
  ChevronRight,
  Medal,
  Megaphone,
  Sparkles,
  Target,
  Trophy,
  UserRound,
} from 'lucide-react'

const MILESTONE_CHECKPOINTS = [
  1,
  5,
  10,
  25,
  50,
  100,
]

function AthleteHomePage({
  member,
  tournaments = [],
  tournamentEntries = [],
  tournamentResults = [],
  announcements = [],
  onNavigate,
}) {
  function getTodayString() {
    const now =
      new Date()

    const year =
      now.getFullYear()

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      )

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        '0'
      )

    return `${year}-${month}-${day}`
  }

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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  function getDaysUntil(
    dateString
  ) {
    const targetDate =
      parseDate(
        dateString
      )

    if (!targetDate) {
      return null
    }

    const now =
      new Date()

    now.setHours(
      0,
      0,
      0,
      0
    )

    const difference =
      targetDate.getTime() -
      now.getTime()

    return Math.ceil(
      difference /
        (
          1000 *
          60 *
          60 *
          24
        )
    )
  }

  function getCountdownLabel(
    days
  ) {
    if (
      days === null
    ) {
      return ''
    }

    if (days === 0) {
      return 'Today'
    }

    if (days === 1) {
      return 'Tomorrow'
    }

    if (days > 1) {
      return `${days} days away`
    }

    return ''
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

  function getMedalType(
    result
  ) {
    if (!result) {
      return ''
    }

    if (
      result.result_stage ===
        'Gold' ||
      result.medal ===
        'Gold' ||
      Number(
        result.placement
      ) === 1
    ) {
      return 'Gold'
    }

    if (
      result.result_stage ===
        'Silver' ||
      result.medal ===
        'Silver' ||
      Number(
        result.placement
      ) === 2
    ) {
      return 'Silver'
    }

    if (
      result.result_stage ===
        'Bronze' ||
      result.medal ===
        'Bronze' ||
      Number(
        result.placement
      ) === 3
    ) {
      return 'Bronze'
    }

    return ''
  }

  const today =
    getTodayString()

  const athleteEntryIds =
    tournamentEntries.map(
      (entry) =>
        entry.id
    )

  const athleteResults =
    tournamentResults.filter(
      (result) =>
        athleteEntryIds.includes(
          result.tournament_entry_id
        )
    )

  const goldCount =
    athleteResults.filter(
      (result) =>
        getMedalType(
          result
        ) ===
        'Gold'
    ).length

  const silverCount =
    athleteResults.filter(
      (result) =>
        getMedalType(
          result
        ) ===
        'Silver'
    ).length

  const bronzeCount =
    athleteResults.filter(
      (result) =>
        getMedalType(
          result
        ) ===
        'Bronze'
    ).length

  const totalMedals =
    goldCount +
    silverCount +
    bronzeCount

  const totalEventsEntered =
    tournamentEntries.reduce(
      (
        total,
        entry
      ) =>
        total +
        (
          entry.events
            ?.length ||
          0
        ),
      0
    )

  const upcomingEntries =
    tournamentEntries
      .map(
        (
          entry
        ) => {
          const tournament =
            tournaments.find(
              (item) =>
                item.id ===
                entry.tournament_id
            )

          if (!tournament) {
            return null
          }

          return {
            entry,
            tournament,
          }
        }
      )
      .filter(Boolean)
      .filter(
        ({
          tournament,
        }) =>
          (
            tournament.end_date ||
            tournament.event_date
          ) >= today
      )
      .sort(
        (
          a,
          b
        ) =>
          String(
            a.tournament.event_date ||
              ''
          ).localeCompare(
            String(
              b.tournament.event_date ||
                ''
            )
          )
      )

  const nextTournamentRecord =
    upcomingEntries[0] ||
    null

  const nextTournament =
    nextTournamentRecord
      ?.tournament ||
    null

  const nextTournamentEntry =
    nextTournamentRecord
      ?.entry ||
    null

  const tournamentCountdown =
    nextTournament
      ? getDaysUntil(
          nextTournament.event_date
        )
      : null

  const currentAnnouncements =
    announcements
      .filter(
        (
          announcement
        ) =>
          announcement.is_active !==
          false
      )
      .filter(
        (
          announcement
        ) =>
          !announcement.publish_date ||
          announcement.publish_date <=
            today
      )
      .filter(
        (
          announcement
        ) =>
          !announcement.expiration_date ||
          announcement.expiration_date >=
            today
      )

  const priorityOrder = {
    urgent: 3,
    important: 2,
    normal: 1,
  }

  const importantAnnouncement =
    [
      ...currentAnnouncements,
    ]
      .sort(
        (
          a,
          b
        ) => {
          if (
            Boolean(
              a.featured
            ) !==
            Boolean(
              b.featured
            )
          ) {
            return a.featured
              ? -1
              : 1
          }

          const priorityDifference =
            (
              priorityOrder[
                b.priority
              ] ||
              0
            ) -
            (
              priorityOrder[
                a.priority
              ] ||
              0
            )

          if (
            priorityDifference !==
            0
          ) {
            return priorityDifference
          }

          return String(
            b.publish_date ||
              ''
          ).localeCompare(
            String(
              a.publish_date ||
                ''
            )
          )
        }
      )[0] ||
    null

  const tournamentCount =
    tournamentEntries.length

  const nextTournamentMilestone =
    MILESTONE_CHECKPOINTS.find(
      (checkpoint) =>
        checkpoint >
        tournamentCount
    ) ||
    null

  const nextMedalMilestone =
    MILESTONE_CHECKPOINTS.find(
      (checkpoint) =>
        checkpoint >
        totalMedals
    ) ||
    null

  const nextGoldMilestone =
    MILESTONE_CHECKPOINTS.find(
      (checkpoint) =>
        checkpoint >
        goldCount
    ) ||
    null

  const milestoneOptions = [
    nextTournamentMilestone
      ? {
          id:
            'tournaments',

          label:
            'Tournament Experience',

          current:
            tournamentCount,

          goal:
            nextTournamentMilestone,

          unit:
            'tournaments',

          icon:
            Trophy,
        }
      : null,

    nextMedalMilestone
      ? {
          id:
            'medals',

          label:
            'Medal Collection',

          current:
            totalMedals,

          goal:
            nextMedalMilestone,

          unit:
            'medals',

          icon:
            Medal,
        }
      : null,

    nextGoldMilestone
      ? {
          id:
            'gold',

          label:
            'Gold Medal Collection',

          current:
            goldCount,

          goal:
            nextGoldMilestone,

          unit:
            'gold medals',

          icon:
            Award,
        }
      : null,
  ].filter(Boolean)

  const nextMilestone =
    milestoneOptions
      .sort(
        (
          a,
          b
        ) =>
          (
            a.goal -
            a.current
          ) -
          (
            b.goal -
            b.current
          )
      )[0] ||
    null

  const milestonePercentage =
    nextMilestone
      ? Math.min(
          100,
          Math.round(
            (
              nextMilestone.current /
              nextMilestone.goal
            ) *
              100
          )
        )
      : 100

  if (!member) {
    return (
      <div className="mat-athlete-home">

        <section className="mat-athlete-welcome">

          <div>

            <span className="mat-athlete-eyebrow">
              Athlete View
            </span>

            <h1>
              Athlete Profile Not Linked
            </h1>

            <p>
              Your login has the Athlete
              role, but it is not yet
              linked to a member record.
            </p>

          </div>

          <UserRound
            size={48}
          />

        </section>

      </div>
    )
  }

  return (
    <div className="mat-athlete-home">

      <section className="mat-athlete-welcome mat-athlete-dashboard-welcome">

        <div>

          <span className="mat-athlete-eyebrow">
            My Competition Dashboard
          </span>

          <h1>
            Welcome,{' '}
            {member.first_name}
          </h1>

          <p>
            Stay current on your next
            competition, team updates
            and competition progress.
          </p>

        </div>

        <div className="mat-athlete-welcome-badge">

          <Award
            size={28}
          />

          <span>
            {member.belt_rank ||
              'Belt Rank'}
          </span>

        </div>

      </section>

      <section className="mat-athlete-dashboard-stats">

        <button
          type="button"
          className="mat-athlete-dashboard-stat"
          onClick={() =>
            onNavigate(
              'my-profile'
            )
          }
        >
          <Trophy
            size={20}
          />

          <div>
            <strong>
              {tournamentCount}
            </strong>

            <span>
              Tournaments
            </span>
          </div>
        </button>

        <button
          type="button"
          className="mat-athlete-dashboard-stat"
          onClick={() =>
            onNavigate(
              'my-profile'
            )
          }
        >
          <Target
            size={20}
          />

          <div>
            <strong>
              {totalEventsEntered}
            </strong>

            <span>
              Events Entered
            </span>
          </div>
        </button>

        <button
          type="button"
          className="mat-athlete-dashboard-stat"
          onClick={() =>
            onNavigate(
              'my-profile'
            )
          }
        >
          <Medal
            size={20}
          />

          <div>
            <strong>
              {totalMedals}
            </strong>

            <span>
              Total Medals
            </span>
          </div>
        </button>

        <button
          type="button"
          className="mat-athlete-dashboard-stat"
          onClick={() =>
            onNavigate(
              'my-profile'
            )
          }
        >
          <Award
            size={20}
          />

          <div>
            <strong>
              {goldCount}
            </strong>

            <span>
              Gold Medals
            </span>
          </div>
        </button>

      </section>

      <section className="mat-athlete-dashboard-main">

        <article className="mat-athlete-dashboard-feature mat-athlete-next-tournament">

          <div className="mat-athlete-dashboard-card-top">

            <div>

              <span className="mat-athlete-dashboard-card-label">
                Next Competition
              </span>

              <h2>
                {nextTournament
                  ? nextTournament.name
                  : 'No Tournament Scheduled'}
              </h2>

            </div>

            <div className="mat-athlete-dashboard-card-icon">
              <Trophy
                size={23}
              />
            </div>

          </div>

          {nextTournament ? (
            <>
              <div className="mat-athlete-tournament-countdown">

                <strong>
                  {getCountdownLabel(
                    tournamentCountdown
                  )}
                </strong>

                <span>
                  {formatDate(
                    nextTournament.event_date
                  )}
                </span>

              </div>

              <div className="mat-athlete-dashboard-detail-list">

                {nextTournament.location && (
                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {
                        nextTournament.location
                      }
                    </strong>
                  </div>
                )}

                {nextTournament.registration_deadline && (
                  <div>
                    <span>
                      Registration Deadline
                    </span>

                    <strong>
                      {formatDate(
                        nextTournament.registration_deadline
                      )}
                    </strong>
                  </div>
                )}

              </div>

              {nextTournamentEntry
                ?.events
                ?.length >
                0 && (
                <div className="mat-athlete-home-events">

                  <span>
                    My Events
                  </span>

                  <div>

                    {nextTournamentEntry.events.map(
                      (
                        eventName
                      ) => (
                        <span
                          key={
                            eventName
                          }
                          className="mat-athlete-home-event-pill"
                        >
                          {getEventDisplayName(
                            eventName
                          )}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

              <button
                type="button"
                className="mat-athlete-dashboard-link"
                onClick={() =>
                  onNavigate(
                    'tournaments'
                  )
                }
              >
                View Tournaments

                <ChevronRight
                  size={17}
                />
              </button>
            </>
          ) : (
            <>
              <p className="mat-athlete-dashboard-empty-text">
                You are not currently
                entered in an upcoming
                tournament.
              </p>

              <button
                type="button"
                className="mat-athlete-dashboard-link"
                onClick={() =>
                  onNavigate(
                    'tournaments'
                  )
                }
              >
                View Tournament Schedule

                <ChevronRight
                  size={17}
                />
              </button>
            </>
          )}

        </article>

        <article className="mat-athlete-dashboard-feature">

          <div className="mat-athlete-dashboard-card-top">

            <div>
              <span className="mat-athlete-dashboard-card-label">
                Team Update
              </span>

              <h2>
                {importantAnnouncement
                  ? importantAnnouncement.title
                  : 'No Current Announcements'}
              </h2>
            </div>

            <div className="mat-athlete-dashboard-card-icon">
              <Megaphone
                size={22}
              />
            </div>

          </div>

          {importantAnnouncement ? (
            <>
              <div className="mat-athlete-home-announcement-meta">

                {importantAnnouncement.featured && (
                  <span>
                    Featured
                  </span>
                )}

                {importantAnnouncement.priority ===
                  'urgent' && (
                  <span className="urgent">
                    Urgent
                  </span>
                )}

                {importantAnnouncement.priority ===
                  'important' && (
                  <span className="important">
                    Important
                  </span>
                )}

                <small>
                  {formatDate(
                    importantAnnouncement.publish_date
                  )}
                </small>

              </div>

              <p className="mat-athlete-dashboard-message">
                {
                  importantAnnouncement.message
                }
              </p>
            </>
          ) : (
            <p className="mat-athlete-dashboard-empty-text">
              There are no active team
              announcements right now.
            </p>
          )}

          <button
            type="button"
            className="mat-athlete-dashboard-link"
            onClick={() =>
              onNavigate(
                'announcements'
              )
            }
          >
            View Announcements

            <ChevronRight
              size={17}
            />
          </button>

        </article>

      </section>

      <section className="mat-athlete-dashboard-lower">

        <article className="mat-athlete-milestone-card">

          <div className="mat-athlete-dashboard-card-top">

            <div>
              <span className="mat-athlete-dashboard-card-label">
                Next Milestone
              </span>

              <h2>
                {nextMilestone
                  ? nextMilestone.label
                  : 'Milestones Complete'}
              </h2>
            </div>

            <div className="mat-athlete-dashboard-card-icon">
              <Sparkles
                size={22}
              />
            </div>

          </div>

          {nextMilestone ? (
            <>
              <div className="mat-athlete-home-milestone-count">

                <strong>
                  {
                    nextMilestone.current
                  }
                </strong>

                <span>
                  of{' '}
                  {
                    nextMilestone.goal
                  }{' '}
                  {
                    nextMilestone.unit
                  }
                </span>

              </div>

              <div className="mat-athlete-home-progress">

                <div
                  className="mat-athlete-home-progress-fill"
                  style={{
                    width:
                      `${milestonePercentage}%`,
                  }}
                />

              </div>

              <p>
                {nextMilestone.goal -
                  nextMilestone.current}{' '}
                more{' '}
                {
                  nextMilestone.unit
                }{' '}
                to reach your next
                checkpoint.
              </p>
            </>
          ) : (
            <p>
              You have reached all
              currently configured
              progress checkpoints.
            </p>
          )}

          <button
            type="button"
            className="mat-athlete-dashboard-link"
            onClick={() =>
              onNavigate(
                'my-profile'
              )
            }
          >
            View My Progress

            <ChevronRight
              size={17}
            />
          </button>

        </article>

        <article className="mat-athlete-quick-card">

          <div className="mat-athlete-dashboard-card-top">

            <div>
              <span className="mat-athlete-dashboard-card-label">
                Quick Access
              </span>

              <h2>
                Team Resources
              </h2>
            </div>

            <div className="mat-athlete-dashboard-card-icon">
              <CalendarDays
                size={22}
              />
            </div>

          </div>

          <div className="mat-athlete-home-quick-links">

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'my-profile'
                )
              }
            >
              <UserRound
                size={18}
              />

              <span>
                My Profile
              </span>

              <ChevronRight
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'coaches'
                )
              }
            >
              <UserRound
                size={18}
              />

              <span>
                Coaches
              </span>

              <ChevronRight
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'tournaments'
                )
              }
            >
              <Trophy
                size={18}
              />

              <span>
                Tournaments
              </span>

              <ChevronRight
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'calendar'
                )
              }
            >
              <CalendarDays
                size={18}
              />

              <span>
                Calendar
              </span>

              <ChevronRight
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'announcements'
                )
              }
            >
              <Bell
                size={18}
              />

              <span>
                Announcements
              </span>

              <ChevronRight
                size={16}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'new-member-guide'
                )
              }
            >
              <Award
                size={18}
              />

              <span>
                Team Guide
              </span>

              <ChevronRight
                size={16}
              />
            </button>

          </div>

        </article>

      </section>

    </div>
  )
}

export default AthleteHomePage