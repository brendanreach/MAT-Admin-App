import {
  AlertTriangle,
  Archive,
  CalendarDays,
  Megaphone,
  Pencil,
  Plus,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

import AnnouncementForm from './AnnouncementForm.jsx'

function getTodayString() {
  const today =
    new Date()

  const year =
    today.getFullYear()

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}

function formatDate(
  dateString
) {
  if (!dateString) {
    return ''
  }

  const date =
    new Date(
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

function AnnouncementsPage({
  announcements,
  onAnnouncementsChanged,
}) {
  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingAnnouncement,
    setEditingAnnouncement,
  ] = useState(null)

  const [
    view,
    setView,
  ] = useState('current')

  const [
    message,
    setMessage,
  ] = useState('')

  const today =
    getTodayString()

  const currentAnnouncements =
    useMemo(() => {
      return (
        announcements || []
      ).filter(
        (announcement) => {
          const hasStarted =
            announcement.publish_date <=
            today

          const hasNotExpired =
            !announcement.expiration_date ||
            announcement.expiration_date >=
              today

          return (
            announcement.is_active &&
            hasStarted &&
            hasNotExpired
          )
        }
      )
    }, [
      announcements,
      today,
    ])

  const scheduledAnnouncements =
    useMemo(() => {
      return (
        announcements || []
      ).filter(
        (announcement) =>
          announcement.is_active &&
          announcement.publish_date >
            today
      )
    }, [
      announcements,
      today,
    ])

  const archivedAnnouncements =
    useMemo(() => {
      return (
        announcements || []
      ).filter(
        (announcement) => {
          const expired =
            announcement.expiration_date &&
            announcement.expiration_date <
              today

          return (
            !announcement.is_active ||
            expired
          )
        }
      )
    }, [
      announcements,
      today,
    ])

  let visibleAnnouncements =
    currentAnnouncements

  if (
    view === 'scheduled'
  ) {
    visibleAnnouncements =
      scheduledAnnouncements
  }

  if (
    view === 'archive'
  ) {
    visibleAnnouncements =
      archivedAnnouncements
  }

  function openCreateForm() {
    setEditingAnnouncement(
      null
    )
    setShowForm(true)
  }

  function openEditForm(
    announcement
  ) {
    setEditingAnnouncement(
      announcement
    )
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingAnnouncement(
      null
    )
  }

  async function archiveAnnouncement(
    announcement
  ) {
    const confirmed =
      window.confirm(
        `Archive "${announcement.title}"?`
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
          'announcements'
        )
        .update({
          is_active: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          announcement.id
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    if (
      onAnnouncementsChanged
    ) {
      await onAnnouncementsChanged()
    }
  }

  function getPriorityClass(
    priority
  ) {
    if (
      priority === 'urgent'
    ) {
      return 'urgent'
    }

    if (
      priority ===
      'important'
    ) {
      return 'important'
    }

    return 'normal'
  }

  return (
    <div className="mat-page">

      <section className="mat-hero">

        <div>
          <div className="mat-eyebrow">
            Team Communication
          </div>

          <h1 className="mat-page-title">
            Announcements
          </h1>

          <p className="mat-page-description">
            Create and manage team updates,
            reminders and important notices.
          </p>
        </div>

        <button
          type="button"
          className="mat-primary-button"
          onClick={
            openCreateForm
          }
        >
          <Plus size={19} />
          New Announcement
        </button>

      </section>

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      <div className="mat-announcement-tabs">

        <button
          type="button"
          className={
            view === 'current'
              ? 'active'
              : ''
          }
          onClick={() =>
            setView(
              'current'
            )
          }
        >
          Current
          <span>
            {
              currentAnnouncements.length
            }
          </span>
        </button>

        <button
          type="button"
          className={
            view === 'scheduled'
              ? 'active'
              : ''
          }
          onClick={() =>
            setView(
              'scheduled'
            )
          }
        >
          Scheduled
          <span>
            {
              scheduledAnnouncements.length
            }
          </span>
        </button>

        <button
          type="button"
          className={
            view === 'archive'
              ? 'active'
              : ''
          }
          onClick={() =>
            setView(
              'archive'
            )
          }
        >
          Archive
          <span>
            {
              archivedAnnouncements.length
            }
          </span>
        </button>

      </div>

      {visibleAnnouncements.length ===
      0 ? (
        <div className="mat-empty-state">

          <Megaphone
            size={34}
          />

          <strong>
            No announcements here
          </strong>

          <span>
            Create a new announcement when
            you have something to share.
          </span>

        </div>
      ) : (
        <div className="mat-announcement-list">

          {visibleAnnouncements.map(
            (announcement) => (
              <article
                key={
                  announcement.id
                }
                className={`mat-announcement-card ${getPriorityClass(
                  announcement.priority
                )}`}
              >

                <div className="mat-announcement-card-top">

                  <div className="mat-announcement-card-badges">

                    <span
                      className={`mat-announcement-priority ${getPriorityClass(
                        announcement.priority
                      )}`}
                    >
                      {announcement.priority ===
                      'urgent' ? (
                        <AlertTriangle
                          size={12}
                        />
                      ) : (
                        <Megaphone
                          size={12}
                        />
                      )}

                      {
                        announcement.priority
                      }
                    </span>

                    {announcement.featured && (
                      <span className="mat-announcement-featured">
                        Featured
                      </span>
                    )}

                  </div>

                  <div className="mat-announcement-card-actions">

                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          announcement
                        )
                      }
                    >
                      <Pencil
                        size={14}
                      />
                      Edit
                    </button>

                    {announcement.is_active && (
                      <button
                        type="button"
                        onClick={() =>
                          archiveAnnouncement(
                            announcement
                          )
                        }
                      >
                        <Archive
                          size={14}
                        />
                        Archive
                      </button>
                    )}

                  </div>

                </div>

                <h3>
                  {
                    announcement.title
                  }
                </h3>

                <p>
                  {
                    announcement.message
                  }
                </p>

                <div className="mat-announcement-dates">

                  <span>
                    <CalendarDays
                      size={13}
                    />

                    Publishes{' '}
                    {formatDate(
                      announcement.publish_date
                    )}
                  </span>

                  {announcement.expiration_date && (
                    <span>
                      Expires{' '}
                      {formatDate(
                        announcement.expiration_date
                      )}
                    </span>
                  )}

                </div>

              </article>
            )
          )}

        </div>
      )}

      {showForm && (
        <AnnouncementForm
          editingAnnouncement={
            editingAnnouncement
          }
          onClose={
            closeForm
          }
          onSaved={
            onAnnouncementsChanged
          }
        />
      )}

    </div>
  )
}

export default AnnouncementsPage