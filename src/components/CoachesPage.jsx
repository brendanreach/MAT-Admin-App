import {
  useEffect,
  useState,
} from 'react'

import {
  Award,
  Edit3,
  GraduationCap,
  Lightbulb,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'

import { supabase } from '../lib/supabase.js'

const emptyForm = {
  display_name: '',
  bio: '',
  accomplishments: '',
  certifications: '',
  fun_fact: '',
  poomsae: false,
  sparring: false,
  breaking: false,
  offers_private_lessons: false,
  lesson_rate: '',
  availability_notes: '',
  is_active: true,
}

function CoachForm({
  editingCoach,
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
    if (!editingCoach) {
      setFormData(emptyForm)
      return
    }

    const specialties =
      Array.isArray(
        editingCoach.specialties
      )
        ? editingCoach.specialties
        : []

    setFormData({
      display_name:
        editingCoach.display_name ||
        '',

      bio:
        editingCoach.bio ||
        '',

      accomplishments:
        editingCoach.accomplishments ||
        '',

      certifications:
        editingCoach.certifications ||
        '',

      fun_fact:
        editingCoach.fun_fact ||
        '',

      poomsae:
        specialties.includes(
          'Poomsae'
        ),

      sparring:
        specialties.includes(
          'Sparring'
        ),

      breaking:
        specialties.includes(
          'Breaking'
        ),

      offers_private_lessons:
        editingCoach.offers_private_lessons ??
        false,

      lesson_rate:
        editingCoach.lesson_rate ??
        '',

      availability_notes:
        editingCoach.availability_notes ||
        '',

      is_active:
        editingCoach.is_active ??
        true,
    })
  }, [
    editingCoach,
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

    const specialties = []

    if (formData.poomsae) {
      specialties.push(
        'Poomsae'
      )
    }

    if (formData.sparring) {
      specialties.push(
        'Sparring'
      )
    }

    if (formData.breaking) {
      specialties.push(
        'Breaking'
      )
    }

    let lessonRate = null

    if (
      formData.offers_private_lessons &&
      formData.lesson_rate !== ''
    ) {
      lessonRate =
        Number(
          formData.lesson_rate
        )

      if (
        Number.isNaN(
          lessonRate
        )
      ) {
        setMessage(
          'Lesson rate must be a valid number.'
        )

        setSaving(false)
        return
      }
    }

    const payload = {
      display_name:
        formData.display_name.trim(),

      bio:
        formData.bio.trim() ||
        null,

      accomplishments:
        formData.accomplishments.trim() ||
        null,

      certifications:
        formData.certifications.trim() ||
        null,

      fun_fact:
        formData.fun_fact.trim() ||
        null,

      specialties,

      offers_private_lessons:
        formData.offers_private_lessons,

      lesson_rate:
        formData.offers_private_lessons
          ? lessonRate
          : null,

      availability_notes:
        formData.availability_notes.trim() ||
        null,

      is_active:
        formData.is_active,

      updated_at:
        new Date().toISOString(),
    }

    let error = null

    if (editingCoach) {
      const response =
        await supabase
          .from('coaches')
          .update(payload)
          .eq(
            'id',
            editingCoach.id
          )

      error =
        response.error
    } else {
      const response =
        await supabase
          .from('coaches')
          .insert(payload)

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

    await onSaved()

    setSaving(false)
    onClose()
  }

  return (
    <div className="mat-modal-backdrop">

      <div className="mat-modal">

        <div className="mat-modal-header">

          <h2 className="mat-modal-title">
            {editingCoach
              ? 'Edit Coach'
              : 'Add Coach'}
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
          onSubmit={
            handleSubmit
          }
        >

          <div className="mat-form-group">

            <label>
              Coach Name
            </label>

            <input
              className="mat-input"
              name="display_name"
              value={
                formData.display_name
              }
              onChange={
                handleChange
              }
              required
            />

          </div>

          <div className="mat-form-group">

            <label>
              Bio
            </label>

            <textarea
              className="mat-textarea"
              name="bio"
              rows="4"
              value={
                formData.bio
              }
              onChange={
                handleChange
              }
              placeholder="Short introduction, coaching background, competition experience, etc."
            />

          </div>

          <div className="mat-form-group">

            <label>
              Accomplishments
            </label>

            <textarea
              className="mat-textarea"
              name="accomplishments"
              rows="4"
              value={
                formData.accomplishments
              }
              onChange={
                handleChange
              }
              placeholder="Example: National medalist, state champion, coached athletes at Nationals..."
            />

          </div>

          <div className="mat-form-group">

            <label>
              Certifications
            </label>

            <textarea
              className="mat-textarea"
              name="certifications"
              rows="4"
              value={
                formData.certifications
              }
              onChange={
                handleChange
              }
              placeholder="Example: Kukkiwon certification, USA Taekwondo coach, referee certification, SafeSport, CPR..."
            />

          </div>

          <div className="mat-form-group">

            <label>
              Fun Fact
            </label>

            <textarea
              className="mat-textarea"
              name="fun_fact"
              rows="3"
              value={
                formData.fun_fact
              }
              onChange={
                handleChange
              }
              placeholder="Something fun or personal that helps athletes and families get to know this coach."
            />

          </div>

          <div className="mat-form-group">

            <span className="mat-form-label">
              Specialties
            </span>

            <p className="mat-form-help">
              Select the areas this
              coach specializes in.
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

          <label className="mat-checkbox-row">

            <input
              type="checkbox"
              name="offers_private_lessons"
              checked={
                formData.offers_private_lessons
              }
              onChange={
                handleChange
              }
            />

            Offers Private Lessons

          </label>

          {formData.offers_private_lessons && (
            <>

              <div className="mat-form-group">

                <label>
                  Private Lesson Rate
                </label>

                <input
                  className="mat-input"
                  type="number"
                  name="lesson_rate"
                  value={
                    formData.lesson_rate
                  }
                  min="0"
                  step="0.01"
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                />

              </div>

              <div className="mat-form-group">

                <label>
                  Availability Notes
                </label>

                <textarea
                  className="mat-textarea"
                  name="availability_notes"
                  rows="3"
                  value={
                    formData.availability_notes
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Weeknights after 6 PM"
                />

              </div>

            </>
          )}

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

            Active Coach

          </label>

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
                saving
              }
            >
              {saving
                ? 'Saving...'
                : editingCoach
                  ? 'Save Changes'
                  : 'Add Coach'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

function CoachesPage() {
  const [
    coaches,
    setCoaches,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingCoach,
    setEditingCoach,
  ] = useState(null)

  useEffect(() => {
    loadCoaches()
  }, [])

  async function loadCoaches() {
    setLoading(true)
    setMessage('')

    const {
      data,
      error,
    } =
      await supabase
        .from('coaches')
        .select('*')
        .order(
          'display_name',
          {
            ascending: true,
          }
        )

    if (error) {
      setMessage(
        error.message
      )

      setLoading(false)
      return
    }

    setCoaches(
      data || []
    )

    setLoading(false)
  }

  function handleAddCoach() {
    setEditingCoach(null)
    setShowForm(true)
  }

  function handleEditCoach(
    coach
  ) {
    setEditingCoach(
      coach
    )

    setShowForm(true)
  }

  function handleCloseForm() {
    setEditingCoach(null)
    setShowForm(false)
  }

  async function handleDeleteCoach(
    coach
  ) {
    const confirmed =
      window.confirm(
        `Delete ${coach.display_name}? This cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    setMessage('')

    const {
      error,
    } =
      await supabase
        .from('coaches')
        .delete()
        .eq(
          'id',
          coach.id
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    await loadCoaches()
  }

  return (
    <div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >

        <div>

          <h1
            style={{
              marginBottom: '6px',
            }}
          >
            Coaches
          </h1>

          <p
            className="mat-muted"
            style={{
              margin: 0,
            }}
          >
            Manage coach profiles,
            credentials and private
            lesson availability.
          </p>

        </div>

        <button
          type="button"
          className="mat-primary-button"
          onClick={
            handleAddCoach
          }
        >
          <Plus size={18} />

          Add Coach
        </button>

      </div>

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      {loading && (
        <div className="mat-muted">
          Loading coaches...
        </div>
      )}

      {!loading &&
        coaches.length === 0 && (
          <div
            style={{
              padding: '36px',
              border:
                '1px solid #dfe7f1',
              borderRadius:
                '16px',
              background:
                '#ffffff',
              textAlign:
                'center',
            }}
          >

            <UserRound
              size={38}
              style={{
                marginBottom:
                  '12px',
              }}
            />

            <h2>
              No Coaches Yet
            </h2>

            <p className="mat-muted">
              Add your first coach
              profile to begin
              building the team
              directory.
            </p>

            <button
              type="button"
              className="mat-primary-button"
              onClick={
                handleAddCoach
              }
            >
              <Plus size={18} />

              Add Coach
            </button>

          </div>
        )}

      {!loading &&
        coaches.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '18px',
            }}
          >

            {coaches.map(
              (coach) => (
                <div
                  key={
                    coach.id
                  }
                  style={{
                    background:
                      '#ffffff',
                    border:
                      '1px solid #dfe7f1',
                    borderRadius:
                      '16px',
                    padding:
                      '20px',
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'flex-start',
                      justifyContent:
                        'space-between',
                      gap: '12px',
                    }}
                  >

                    <div>

                      <h2
                        style={{
                          margin:
                            '0 0 6px',
                        }}
                      >
                        {
                          coach.display_name
                        }
                      </h2>

                      <div className="mat-muted">
                        {coach.is_active
                          ? 'Active Coach'
                          : 'Inactive Coach'}
                      </div>

                    </div>

                    <UserRound
                      size={30}
                    />

                  </div>

                  {coach.bio && (
                    <p
                      style={{
                        lineHeight: 1.6,
                      }}
                    >
                      {coach.bio}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop:
                        '16px',
                    }}
                  >

                    <strong>
                      Specialties
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '6px',
                      }}
                    >
                      {coach.specialties
                        ?.length
                        ? coach.specialties.join(
                            ' • '
                          )
                        : 'None listed'}
                    </div>

                  </div>

                  {coach.accomplishments && (
                    <div
                      style={{
                        marginTop:
                          '18px',
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '6px',
                        }}
                      >

                        <Award
                          size={17}
                        />

                        <strong>
                          Accomplishments
                        </strong>

                      </div>

                      <div
                        style={{
                          whiteSpace:
                            'pre-line',
                          lineHeight:
                            1.55,
                        }}
                      >
                        {
                          coach.accomplishments
                        }
                      </div>

                    </div>
                  )}

                  {coach.certifications && (
                    <div
                      style={{
                        marginTop:
                          '18px',
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '6px',
                        }}
                      >

                        <GraduationCap
                          size={17}
                        />

                        <strong>
                          Certifications
                        </strong>

                      </div>

                      <div
                        style={{
                          whiteSpace:
                            'pre-line',
                          lineHeight:
                            1.55,
                        }}
                      >
                        {
                          coach.certifications
                        }
                      </div>

                    </div>
                  )}

                  {coach.fun_fact && (
                    <div
                      style={{
                        marginTop:
                          '18px',
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '7px',
                          marginBottom:
                            '6px',
                        }}
                      >

                        <Lightbulb
                          size={17}
                        />

                        <strong>
                          Fun Fact
                        </strong>

                      </div>

                      <div
                        style={{
                          whiteSpace:
                            'pre-line',
                          lineHeight:
                            1.55,
                        }}
                      >
                        {
                          coach.fun_fact
                        }
                      </div>

                    </div>
                  )}

                  <div
                    style={{
                      marginTop:
                        '18px',
                    }}
                  >

                    <strong>
                      Private Lessons
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '6px',
                      }}
                    >
                      {coach.offers_private_lessons
                        ? 'Available'
                        : 'Not currently offered'}
                    </div>

                    {coach.offers_private_lessons &&
                      coach.lesson_rate !==
                        null && (
                        <div className="mat-muted">
                          $
                          {Number(
                            coach.lesson_rate
                          ).toFixed(
                            2
                          )}
                          {' '}
                          per lesson
                        </div>
                      )}

                    {coach.offers_private_lessons &&
                      coach.availability_notes && (
                        <div
                          className="mat-muted"
                          style={{
                            marginTop:
                              '4px',
                          }}
                        >
                          {
                            coach.availability_notes
                          }
                        </div>
                      )}

                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      gap: '10px',
                      marginTop:
                        '22px',
                      flexWrap:
                        'wrap',
                    }}
                  >

                    <button
                      type="button"
                      className="mat-secondary-button"
                      onClick={() =>
                        handleEditCoach(
                          coach
                        )
                      }
                    >
                      <Edit3
                        size={16}
                      />

                      Edit
                    </button>

                    <button
                      type="button"
                      className="mat-secondary-button"
                      onClick={() =>
                        handleDeleteCoach(
                          coach
                        )
                      }
                    >
                      <Trash2
                        size={16}
                      />

                      Delete
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      {showForm && (
        <CoachForm
          editingCoach={
            editingCoach
          }
          onClose={
            handleCloseForm
          }
          onSaved={
            loadCoaches
          }
        />
      )}

    </div>
  )
}

export default CoachesPage