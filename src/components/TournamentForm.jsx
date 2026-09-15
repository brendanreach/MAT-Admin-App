import {
  useEffect,
  useState,
} from 'react'

import {
  CalendarDays,
  CircleDollarSign,
  Info,
  MapPin,
  Trophy,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase.js'

const emptyForm = {
  name: '',
  location: '',
  event_date: '',
  end_date: '',
  registration_deadline: '',
  entry_fee: '',
}

function TournamentForm({
  editingTournament,
  onClose,
  onSaved,
}) {
  const [
    formData,
    setFormData,
  ] = useState(emptyForm)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  useEffect(() => {
    if (!editingTournament) {
      setFormData(
        emptyForm
      )
      return
    }

    setFormData({
      name:
        editingTournament.name ||
        '',

      location:
        editingTournament.location ||
        '',

      event_date:
        editingTournament.event_date ||
        '',

      end_date:
        editingTournament.end_date ||
        '',

      registration_deadline:
        editingTournament.registration_deadline ||
        '',

      entry_fee:
        editingTournament.entry_fee ??
        '',
    })
  }, [
    editingTournament,
  ])

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    )
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setMessage('')

    if (
      formData.end_date &&
      formData.end_date <
        formData.event_date
    ) {
      setMessage(
        'The tournament end date cannot be before the start date.'
      )
      return
    }

    if (
      formData.registration_deadline &&
      formData.event_date &&
      formData.registration_deadline >
        formData.event_date
    ) {
      setMessage(
        'The registration deadline cannot be after the tournament start date.'
      )
      return
    }

    setSaving(true)

    const tournamentData = {
      name:
        formData.name.trim(),

      location:
        formData.location.trim() ||
        null,

      event_date:
        formData.event_date,

      end_date:
        formData.end_date ||
        null,

      registration_deadline:
        formData.registration_deadline ||
        null,

      entry_fee:
        formData.entry_fee === ''
          ? 0
          : Number(
              formData.entry_fee
            ),
    }

    let data
    let error

    if (
      editingTournament
    ) {
      const response =
        await supabase
          .from(
            'tournaments'
          )
          .update(
            tournamentData
          )
          .eq(
            'id',
            editingTournament.id
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
            'tournaments'
          )
          .insert([
            tournamentData,
          ])
          .select()
          .single()

      data =
        response.data

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
        className="mat-tournament-form-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="mat-tournament-form-header">

          <h2>
            {editingTournament
              ? 'Edit Tournament'
              : 'Create Tournament'}
          </h2>

          <button
            type="button"
            className="mat-tournament-form-close"
            onClick={onClose}
            aria-label="Close tournament form"
          >
            <X size={24} />
          </button>

        </div>

        <form
          className="mat-tournament-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="mat-tournament-form-field">

            <label htmlFor="tournament-name">
              <span className="mat-tournament-form-label-icon">
                <Trophy size={21} />
              </span>

              <span>
                Tournament Name
              </span>
            </label>

            <input
              id="tournament-name"
              className="mat-tournament-form-input"
              name="name"
              type="text"
              placeholder="Enter tournament name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="tournament-location">

              <span className="mat-tournament-form-label-icon">
                <MapPin size={21} />
              </span>

              <span>
                Location
              </span>

            </label>

            <input
              id="tournament-location"
              className="mat-tournament-form-input"
              name="location"
              type="text"
              placeholder="Enter location (city, state)"
              value={
                formData.location
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="event-date">

              <span className="mat-tournament-form-label-icon">
                <CalendarDays size={21} />
              </span>

              <span>
                Start Date
              </span>

            </label>

            <input
              id="event-date"
              className="mat-tournament-form-input"
              name="event_date"
              type="date"
              value={
                formData.event_date
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="end-date">

              <span className="mat-tournament-form-label-icon">
                <CalendarDays size={21} />
              </span>

              <span>
                End Date
              </span>

            </label>

            <input
              id="end-date"
              className="mat-tournament-form-input"
              name="end_date"
              type="date"
              min={
                formData.event_date ||
                undefined
              }
              value={
                formData.end_date
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="registration-deadline">

              <span className="mat-tournament-form-label-icon">
                <CalendarDays size={21} />
              </span>

              <span>
                Registration Deadline
              </span>

            </label>

            <input
              id="registration-deadline"
              className="mat-tournament-form-input"
              name="registration_deadline"
              type="date"
              max={
                formData.event_date ||
                undefined
              }
              value={
                formData.registration_deadline
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-field">

            <label htmlFor="entry-fee">

              <span className="mat-tournament-form-label-icon">
                <CircleDollarSign size={21} />
              </span>

              <span>
                Entry Fee
              </span>

            </label>

            <input
              id="entry-fee"
              className="mat-tournament-form-input"
              name="entry_fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter entry fee amount (e.g. 75.00)"
              value={
                formData.entry_fee
              }
              onChange={
                handleChange
              }
            />

          </div>

          <div className="mat-tournament-form-info">

            <div className="mat-tournament-form-info-icon">
              <Info size={19} />
            </div>

            <p>
              Entry fees are paid by athletes
              toward tournament registration
              and are not MAT revenue.
            </p>

          </div>

          {message && (
            <div className="mat-tournament-form-error">
              {message}
            </div>
          )}

          <div className="mat-tournament-form-actions">

            <button
              type="button"
              className="mat-tournament-form-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="mat-tournament-form-submit"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingTournament
                  ? 'Save Changes'
                  : 'Create Tournament'}
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default TournamentForm