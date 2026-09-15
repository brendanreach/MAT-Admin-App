import {
  AlertTriangle,
  CalendarDays,
  Megaphone,
  X,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

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

function AnnouncementForm({
  editingAnnouncement,
  onClose,
  onSaved,
}) {
  const [
    title,
    setTitle,
  ] = useState('')

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    priority,
    setPriority,
  ] = useState('normal')

  const [
    publishDate,
    setPublishDate,
  ] = useState(
    getTodayString()
  )

  const [
    expirationDate,
    setExpirationDate,
  ] = useState('')

  const [
    featured,
    setFeatured,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    formMessage,
    setFormMessage,
  ] = useState('')

  useEffect(() => {
    if (
      !editingAnnouncement
    ) {
      setTitle('')
      setMessage('')
      setPriority('normal')
      setPublishDate(
        getTodayString()
      )
      setExpirationDate('')
      setFeatured(false)
      return
    }

    setTitle(
      editingAnnouncement.title ||
        ''
    )

    setMessage(
      editingAnnouncement.message ||
        ''
    )

    setPriority(
      editingAnnouncement.priority ||
        'normal'
    )

    setPublishDate(
      editingAnnouncement.publish_date ||
        getTodayString()
    )

    setExpirationDate(
      editingAnnouncement.expiration_date ||
        ''
    )

    setFeatured(
      Boolean(
        editingAnnouncement.featured
      )
    )
  }, [
    editingAnnouncement,
  ])

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setFormMessage('')

    if (!title.trim()) {
      setFormMessage(
        'Please enter an announcement title.'
      )
      return
    }

    if (!message.trim()) {
      setFormMessage(
        'Please enter an announcement message.'
      )
      return
    }

    if (!publishDate) {
      setFormMessage(
        'Please choose a publish date.'
      )
      return
    }

    if (
      expirationDate &&
      expirationDate <
        publishDate
    ) {
      setFormMessage(
        'The expiration date cannot be before the publish date.'
      )
      return
    }

    setSaving(true)

    const payload = {
      title:
        title.trim(),

      message:
        message.trim(),

      priority,

      publish_date:
        publishDate,

      expiration_date:
        expirationDate ||
        null,

      featured,

      is_active:
        true,

      updated_at:
        new Date().toISOString(),
    }

    let data
    let error

    if (
      editingAnnouncement
    ) {
      const response =
        await supabase
          .from(
            'announcements'
          )
          .update(
            payload
          )
          .eq(
            'id',
            editingAnnouncement.id
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
            'announcements'
          )
          .insert([
            payload,
          ])
          .select()
          .single()

      data =
        response.data

      error =
        response.error
    }

    if (error) {
      setFormMessage(
        error.message
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
        className="mat-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="mat-modal-header">

          <div>
            <div className="mat-eyebrow">
              Team Communication
            </div>

            <h2>
              {editingAnnouncement
                ? 'Edit Announcement'
                : 'Create Announcement'}
            </h2>
          </div>

          <button
            type="button"
            className="mat-history-close"
            onClick={onClose}
            aria-label="Close announcement form"
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

          {formMessage && (
            <div className="mat-error">
              {formMessage}
            </div>
          )}

          <div className="mat-form-group">

            <label htmlFor="announcement-title">
              <Megaphone
                size={15}
              />

              Title
            </label>

            <input
              id="announcement-title"
              className="mat-input"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Example: Tournament Registration Closing"
              autoFocus
              required
            />

          </div>

          <div className="mat-form-group">

            <label htmlFor="announcement-message">
              Message
            </label>

            <textarea
              id="announcement-message"
              className="mat-textarea"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              placeholder="Enter the announcement..."
              rows={6}
              required
            />

          </div>

          <div className="mat-form-group">

            <label htmlFor="announcement-priority">
              <AlertTriangle
                size={15}
              />

              Priority
            </label>

            <select
              id="announcement-priority"
              className="mat-input"
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value
                )
              }
            >
              <option value="normal">
                Normal
              </option>

              <option value="important">
                Important
              </option>

              <option value="urgent">
                Urgent
              </option>
            </select>

          </div>

          <div className="mat-form-grid">

            <div className="mat-form-group">

              <label htmlFor="announcement-publish-date">
                <CalendarDays
                  size={15}
                />

                Publish Date
              </label>

              <input
                id="announcement-publish-date"
                className="mat-input"
                type="date"
                value={
                  publishDate
                }
                onChange={(event) =>
                  setPublishDate(
                    event.target.value
                  )
                }
                required
              />

            </div>

            <div className="mat-form-group">

              <label htmlFor="announcement-expiration-date">
                <CalendarDays
                  size={15}
                />

                Expiration Date
              </label>

              <input
                id="announcement-expiration-date"
                className="mat-input"
                type="date"
                min={
                  publishDate ||
                  undefined
                }
                value={
                  expirationDate
                }
                onChange={(event) =>
                  setExpirationDate(
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
                checked={featured}
                onChange={(event) =>
                  setFeatured(
                    event.target.checked
                  )
                }
              />

              Feature this announcement on the main page

            </label>

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
                : editingAnnouncement
                  ? 'Save Changes'
                  : 'Create Announcement'}
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default AnnouncementForm