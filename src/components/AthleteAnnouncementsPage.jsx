import {
  AlertTriangle,
  CalendarDays,
  Megaphone,
  Pin,
} from 'lucide-react'

function AthleteAnnouncementsPage({
  announcements = [],
}) {
  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

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
        month:
          'short',
        day:
          'numeric',
        year:
          'numeric',
      }
    )
  }

  const visibleAnnouncements =
    announcements
      .filter(
        (
          announcement
        ) => {
          if (
            announcement.is_active ===
            false
          ) {
            return false
          }

          const publishDate =
            parseDate(
              announcement.publish_date
            )

          const expirationDate =
            parseDate(
              announcement.expiration_date
            )

          if (
            publishDate &&
            publishDate >
              today
          ) {
            return false
          }

          if (
            expirationDate &&
            expirationDate <
              today
          ) {
            return false
          }

          return true
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          const priorityRank = {
            urgent: 3,
            important: 2,
            normal: 1,
          }

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
              priorityRank[
                b.priority
              ] || 0
            ) -
            (
              priorityRank[
                a.priority
              ] || 0
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
      )

  return (
    <div className="mat-athlete-page">

      <section className="mat-athlete-page-hero">

        <div className="mat-athlete-page-icon">

          <Megaphone
            size={24}
          />

        </div>

        <div>
          <div className="mat-athlete-eyebrow">
            Team Updates
          </div>

          <h1>
            Announcements
          </h1>

          <p>
            Important news, reminders,
            deadlines and competition
            team updates.
          </p>
        </div>

      </section>

      {visibleAnnouncements.length ===
      0 ? (
        <div className="mat-athlete-empty-card">

          <Megaphone
            size={30}
          />

          <h3>
            No Current Announcements
          </h3>

          <p>
            There are no active team
            announcements right now.
          </p>

        </div>
      ) : (
        <div className="mat-athlete-announcement-list">

          {visibleAnnouncements.map(
            (
              announcement
            ) => (
              <article
                key={
                  announcement.id
                }
                className={`mat-athlete-announcement-card ${
                  announcement.priority ||
                  'normal'
                } ${
                  announcement.featured
                    ? 'featured'
                    : ''
                }`}
              >

                <div className="mat-athlete-announcement-top">

                  <div>

                    <div className="mat-athlete-announcement-badges">

                      {announcement.featured && (
                        <span className="mat-athlete-badge featured">

                          <Pin
                            size={12}
                          />

                          Featured

                        </span>
                      )}

                      {announcement.priority ===
                        'urgent' && (
                        <span className="mat-athlete-badge urgent">

                          <AlertTriangle
                            size={12}
                          />

                          Urgent

                        </span>
                      )}

                      {announcement.priority ===
                        'important' && (
                        <span className="mat-athlete-badge important">
                          Important
                        </span>
                      )}

                    </div>

                    <h3>
                      {
                        announcement.title
                      }
                    </h3>

                  </div>

                  <span className="mat-athlete-announcement-date">

                    <CalendarDays
                      size={14}
                    />

                    {formatDate(
                      announcement.publish_date
                    )}

                  </span>

                </div>

                <p className="mat-athlete-announcement-message">
                  {
                    announcement.message
                  }
                </p>

                {announcement.expiration_date && (
                  <div className="mat-athlete-announcement-expiration">
                    Available through{' '}
                    {formatDate(
                      announcement.expiration_date
                    )}
                  </div>
                )}

              </article>
            )
          )}

        </div>
      )}

    </div>
  )
}

export default AthleteAnnouncementsPage