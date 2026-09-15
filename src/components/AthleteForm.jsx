import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

const emptyForm = {
  first_name: '',
  last_name: '',
  birthdate: '',
  belt_rank: '',
  monthly_tuition: '',
  parent_email: '',
  is_active: true,
  poomsae: false,
  sparring: false,
  breaking: false,
  notes: '',
}

function AthleteForm({
  editingMember,
  onClose,
  onSaved,
}) {
  const [formData, setFormData] =
    useState(emptyForm)

  const [saving, setSaving] =
    useState(false)

  const [loadingPrivateDetails, setLoadingPrivateDetails] =
    useState(false)

  const [message, setMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadForm() {
      setMessage('')

      if (!editingMember) {
        setFormData(emptyForm)
        return
      }

      setFormData({
        first_name:
          editingMember.first_name ||
          '',

        last_name:
          editingMember.last_name ||
          '',

        birthdate:
          editingMember.birthdate ||
          '',

        belt_rank:
          editingMember.belt_rank ||
          '',

        monthly_tuition: '',

        parent_email: '',

        is_active:
          editingMember.is_active ??
          true,

        poomsae:
          editingMember.poomsae ??
          false,

        sparring:
          editingMember.sparring ??
          false,

        breaking:
          editingMember.breaking ??
          false,

        notes: '',
      })

      setLoadingPrivateDetails(true)

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'get_member_private_details_admin',
          {
            requested_member_id:
              editingMember.id,
          }
        )

      if (cancelled) {
        return
      }

      setLoadingPrivateDetails(false)

      if (error) {
        setMessage(
          error.message
        )
        return
      }

      const privateDetails =
        data?.[0] ||
        null

      setFormData(
        (current) => ({
          ...current,

          monthly_tuition:
            privateDetails
              ?.monthly_tuition ??
            '',

          parent_email:
            privateDetails
              ?.parent_email ||
            '',

          notes:
            privateDetails
              ?.notes ||
            '',
        })
      )
    }

    loadForm()

    return () => {
      cancelled = true
    }
  }, [
    editingMember,
  ])

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormData(
      (current) => ({
        ...current,

        [name]:
          type === 'checkbox'
            ? checked
            : value,
      })
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setMessage('')

    const monthlyTuition =
      formData.monthly_tuition === ''
        ? 0
        : Number(
            formData.monthly_tuition
          )

    if (
      Number.isNaN(
        monthlyTuition
      )
    ) {
      setMessage(
        'Monthly tuition must be a valid number.'
      )

      setSaving(false)
      return
    }

    const {
      error,
    } =
      await supabase.rpc(
        'save_member_admin',
        {
          requested_member_id:
            editingMember?.id ||
            null,

          new_first_name:
            formData.first_name.trim(),

          new_last_name:
            formData.last_name.trim(),

          new_birthdate:
            formData.birthdate ||
            null,

          new_belt_rank:
            formData.belt_rank ||
            null,

          new_is_active:
            formData.is_active,

          new_poomsae:
            formData.poomsae,

          new_sparring:
            formData.sparring,

          new_breaking:
            formData.breaking,

          new_monthly_tuition:
            monthlyTuition,

          new_parent_email:
            formData.parent_email.trim() ||
            null,

          new_notes:
            formData.notes.trim() ||
            null,
        }
      )

    if (error) {
      setMessage(
        error.message
      )

      setSaving(false)
      return
    }

    await onSaved()

    setSaving(false)
    onClose()
  }

  return (
    <div className="mat-modal-backdrop">

      <div className="mat-modal">

        <div className="mat-modal-header">

          <h2 className="mat-modal-title">
            {editingMember
              ? 'Edit Athlete'
              : 'Add Athlete'}
          </h2>

          <button
            type="button"
            className="mat-close-button"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <form
          className="mat-form"
          onSubmit={handleSubmit}
        >

          <div className="mat-form-grid">

            <div className="mat-form-group">
              <label>
                First Name
              </label>

              <input
                className="mat-input"
                name="first_name"
                value={
                  formData.first_name
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

            <div className="mat-form-group">
              <label>
                Last Name
              </label>

              <input
                className="mat-input"
                name="last_name"
                value={
                  formData.last_name
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

            <div className="mat-form-group">
              <label>
                Birthdate
              </label>

              <input
                className="mat-input"
                type="date"
                name="birthdate"
                value={
                  formData.birthdate
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="mat-form-group">
              <label>
                Belt Rank
              </label>

              <select
                className="mat-input"
                name="belt_rank"
                value={
                  formData.belt_rank
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  Select belt
                </option>

                <option value="White">
                  White
                </option>

                <option value="Yellow">
                  Yellow
                </option>

                <option value="Green">
                  Green
                </option>

                <option value="Blue">
                  Blue
                </option>

                <option value="Red">
                  Red
                </option>

                <option value="Black">
                  Black
                </option>
              </select>
            </div>

            <div className="mat-form-group">
              <label>
                Monthly Tuition
              </label>

              <input
                className="mat-input"
                type="number"
                name="monthly_tuition"
                value={
                  formData.monthly_tuition
                }
                min="0"
                step="0.01"
                onChange={
                  handleChange
                }
                disabled={
                  loadingPrivateDetails
                }
              />
            </div>

            <div className="mat-form-group">
              <label>
                Parent Email
              </label>

              <input
                className="mat-input"
                type="email"
                name="parent_email"
                value={
                  formData.parent_email
                }
                onChange={
                  handleChange
                }
                disabled={
                  loadingPrivateDetails
                }
              />
            </div>

          </div>

          <div className="mat-form-group">

            <span className="mat-form-label">
              Disciplines
            </span>

            <p className="mat-form-help">
              Select every discipline
              this athlete participates
              in.
            </p>

            <div className="mat-discipline-options">

              <label
                className={`mat-discipline-option ${
                  formData.poomsae
                    ? 'selected'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  name="poomsae"
                  checked={
                    formData.poomsae
                  }
                  onChange={
                    handleChange
                  }
                />

                Poomsae
              </label>

              <label
                className={`mat-discipline-option ${
                  formData.sparring
                    ? 'selected'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  name="sparring"
                  checked={
                    formData.sparring
                  }
                  onChange={
                    handleChange
                  }
                />

                Sparring
              </label>

              <label
                className={`mat-discipline-option ${
                  formData.breaking
                    ? 'selected'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  name="breaking"
                  checked={
                    formData.breaking
                  }
                  onChange={
                    handleChange
                  }
                />

                Breaking
              </label>

            </div>

          </div>

          <div className="mat-form-group">
            <label>
              Notes
            </label>

            <textarea
              className="mat-textarea"
              name="notes"
              rows="4"
              value={
                formData.notes
              }
              onChange={
                handleChange
              }
              disabled={
                loadingPrivateDetails
              }
            />
          </div>

          <label className="mat-checkbox-row">

            <input
              type="checkbox"
              name="is_active"
              checked={
                formData.is_active
              }
              onChange={
                handleChange
              }
            />

            Active Athlete

          </label>

          {loadingPrivateDetails && (
            <div className="mat-muted">
              Loading private athlete details...
            </div>
          )}

          {message && (
            <div className="mat-error">
              {message}
            </div>
          )}

          <div className="mat-form-actions">

            <button
              type="button"
              className="mat-secondary-button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="mat-primary-button"
              disabled={
                saving ||
                loadingPrivateDetails
              }
            >
              {saving
                ? 'Saving...'
                : editingMember
                  ? 'Save Changes'
                  : 'Save Athlete'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default AthleteForm