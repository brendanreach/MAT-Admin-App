import {
  Award,
  CalendarDays,
  Clock3,
  GraduationCap,
  Lightbulb,
  UserRound,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

const LESSON_FOCUS_OPTIONS = [
  'Poomsae',
  'Sparring',
  'Breaking',
  'Competition Preparation',
  'Technique',
  'Conditioning',
  'Other',
]

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

function formatDate(
  dateString
) {
  if (!dateString) {
    return '—'
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

function formatTime(
  timeString
) {
  if (!timeString) {
    return 'Time flexible'
  }

  const [
    hourValue,
    minuteValue,
  ] =
    timeString.split(':')

  const date =
    new Date()

  date.setHours(
    Number(hourValue),
    Number(minuteValue),
    0,
    0
  )

  return date.toLocaleTimeString(
    undefined,
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  )
}

function getStatusLabel(
  status
) {
  switch (status) {
    case 'approved':
      return 'Approved'

    case 'denied':
      return 'Denied'

    case 'cancelled':
      return 'Cancelled'

    case 'completed':
      return 'Completed'

    default:
      return 'Pending'
  }
}

function getStatusStyle(
  status
) {
  switch (status) {
    case 'approved':
      return {
        background:
          '#ecfdf3',
        color:
          '#166534',
        border:
          '1px solid #bbf7d0',
      }

    case 'denied':
      return {
        background:
          '#fef2f2',
        color:
          '#991b1b',
        border:
          '1px solid #fecaca',
      }

    case 'cancelled':
      return {
        background:
          '#f8fafc',
        color:
          '#475569',
        border:
          '1px solid #cbd5e1',
      }

    case 'completed':
      return {
        background:
          '#eff6ff',
        color:
          '#1d4ed8',
        border:
          '1px solid #bfdbfe',
      }

    default:
      return {
        background:
          '#fff7ed',
        color:
          '#9a3412',
        border:
          '1px solid #fed7aa',
      }
  }
}

function LessonRequestModal({
  coach,
  accountId,
  member,
  onClose,
  onSubmitted,
}) {
  const [
    requestedDate,
    setRequestedDate,
  ] = useState('')

  const [
    requestedTime,
    setRequestedTime,
  ] = useState('')

  const [
    lessonFocus,
    setLessonFocus,
  ] = useState('')

  const [
    athleteNote,
    setAthleteNote,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    if (
      !accountId ||
      !member?.id
    ) {
      setMessage(
        'Your athlete account is not linked to a member profile.'
      )
      return
    }

    if (!requestedDate) {
      setMessage(
        'Please choose a requested date.'
      )
      return
    }

    setSaving(true)
    setMessage('')

    const {
      error,
    } =
      await supabase
        .from(
          'private_lesson_requests'
        )
        .insert({
          athlete_account_id:
            accountId,

          member_id:
            member.id,

          coach_id:
            coach.id,

          requested_date:
            requestedDate,

          requested_time:
            requestedTime ||
            null,

          lesson_focus:
            lessonFocus ||
            null,

          athlete_note:
            athleteNote.trim() ||
            null,

          status:
            'pending',

          updated_at:
            new Date().toISOString(),
        })

    if (error) {
      setMessage(
        error.message
      )

      setSaving(false)
      return
    }

    await onSubmitted()

    setSaving(false)
    onClose()
  }

  return (
    <div className="mat-modal-backdrop">

      <div className="mat-modal">

        <div className="mat-modal-header">

          <div>

            <span className="mat-athlete-eyebrow">
              Private Lesson
            </span>

            <h2 className="mat-modal-title">
              Request a Lesson
            </h2>

            <p
              className="mat-muted"
              style={{
                margin:
                  '5px 0 0',
              }}
            >
              with{' '}
              {
                coach.display_name
              }
            </p>

          </div>

          <button
            type="button"
            className="mat-close-button"
            onClick={
              onClose
            }
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
              Requested Date
            </label>

            <input
              type="date"
              className="mat-input"
              value={
                requestedDate
              }
              min={
                getTodayString()
              }
              onChange={(
                event
              ) =>
                setRequestedDate(
                  event.target.value
                )
              }
              required
            />

          </div>

          <div className="mat-form-group">

            <label>
              Requested Time
            </label>

            <input
              type="time"
              className="mat-input"
              value={
                requestedTime
              }
              onChange={(
                event
              ) =>
                setRequestedTime(
                  event.target.value
                )
              }
            />

            <span className="mat-form-help">
              Leave blank if your
              schedule is flexible.
            </span>

          </div>

          <div className="mat-form-group">

            <label>
              Lesson Focus
            </label>

            <select
              className="mat-input"
              value={
                lessonFocus
              }
              onChange={(
                event
              ) =>
                setLessonFocus(
                  event.target.value
                )
              }
            >
              <option value="">
                Select a focus
              </option>

              {LESSON_FOCUS_OPTIONS.map(
                (
                  option
                ) => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                )
              )}

            </select>

          </div>

          <div className="mat-form-group">

            <label>
              Note to Coach
            </label>

            <textarea
              className="mat-textarea"
              rows="4"
              value={
                athleteNote
              }
              onChange={(
                event
              ) =>
                setAthleteNote(
                  event.target.value
                )
              }
              placeholder="Anything you would like the coach to know about what you want to work on or your availability."
            />

          </div>

          {coach.availability_notes && (
            <div
              style={{
                padding:
                  '13px 14px',
                background:
                  '#f8fafc',
                border:
                  '1px solid #e4eaf1',
                borderRadius:
                  '12px',
              }}
            >

              <strong>
                Coach Availability
              </strong>

              <div
                className="mat-muted"
                style={{
                  marginTop:
                    '5px',
                  whiteSpace:
                    'pre-line',
                }}
              >
                {
                  coach.availability_notes
                }
              </div>

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
                saving
              }
            >
              {saving
                ? 'Sending...'
                : 'Send Request'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

function AthleteCoachesPage({
  accountId,
  member,
}) {
  const [
    coaches,
    setCoaches,
  ] = useState([])

  const [
    lessonRequests,
    setLessonRequests,
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
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const [
    selectedCoach,
    setSelectedCoach,
  ] = useState(null)

  const [
    cancellingId,
    setCancellingId,
  ] = useState(null)

  useEffect(() => {
    loadPage()
  }, [
    accountId,
  ])

  async function loadPage() {
    setLoading(true)
    setMessage('')

    await Promise.all([
      loadCoaches(),
      loadLessonRequests(),
    ])

    setLoading(false)
  }

  async function loadCoaches() {
    const {
      data,
      error,
    } =
      await supabase
        .from('coaches')
        .select(
          `
            id,
            display_name,
            bio,
            accomplishments,
            certifications,
            fun_fact,
            specialties,
            offers_private_lessons,
            lesson_rate,
            availability_notes,
            profile_image_path,
            is_active
          `
        )
        .eq(
          'is_active',
          true
        )
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
      return
    }

    setCoaches(
      data || []
    )
  }

  async function loadLessonRequests() {
    if (!accountId) {
      setLessonRequests([])
      return
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'private_lesson_requests'
        )
        .select(
          `
            id,
            athlete_account_id,
            member_id,
            coach_id,
            requested_date,
            requested_time,
            lesson_focus,
            athlete_note,
            coach_note,
            status,
            created_at,
            updated_at
          `
        )
        .eq(
          'athlete_account_id',
          accountId
        )
        .order(
          'requested_date',
          {
            ascending: false,
          }
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setLessonRequests(
      data || []
    )
  }

  async function handleRequestSubmitted() {
    await loadLessonRequests()

    setSuccessMessage(
      'Your private lesson request was sent.'
    )
  }

  async function handleCancelRequest(
    request
  ) {
    const confirmed =
      window.confirm(
        'Cancel this private lesson request?'
      )

    if (!confirmed) {
      return
    }

    setCancellingId(
      request.id
    )

    setMessage('')
    setSuccessMessage('')

    const {
      error,
    } =
      await supabase.rpc(
        'cancel_private_lesson_request',
        {
          requested_request_id:
            request.id,
        }
      )

    if (error) {
      setMessage(
        error.message
      )

      setCancellingId(
        null
      )
      return
    }

    await loadLessonRequests()

    setCancellingId(
      null
    )

    setSuccessMessage(
      'Private lesson request cancelled.'
    )
  }

  const requestsWithCoaches =
    useMemo(
      () =>
        lessonRequests.map(
          (
            request
          ) => ({
            ...request,

            coach:
              coaches.find(
                (
                  coach
                ) =>
                  coach.id ===
                  request.coach_id
              ) ||
              null,
          })
        ),
      [
        lessonRequests,
        coaches,
      ]
    )

  return (
    <div>

      <section
        style={{
          marginBottom:
            '26px',
        }}
      >

        <span className="mat-athlete-eyebrow">
          Competition Team
        </span>

        <h1
          style={{
            marginBottom:
              '8px',
          }}
        >
          Meet the Coaches
        </h1>

        <p
          className="mat-muted"
          style={{
            margin: 0,
            maxWidth:
              '720px',
          }}
        >
          Get to know the MAT coaching
          team and request private
          lessons with coaches who
          currently offer them.
        </p>

      </section>

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            marginBottom:
              '18px',
            padding:
              '12px 14px',
            background:
              '#ecfdf3',
            color:
              '#166534',
            border:
              '1px solid #bbf7d0',
            borderRadius:
              '12px',
            fontWeight:
              600,
          }}
        >
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="mat-muted">
          Loading coaches...
        </div>
      )}

      {!loading &&
        coaches.length ===
          0 && (
          <div
            style={{
              background:
                '#ffffff',
              border:
                '1px solid #dfe7f1',
              borderRadius:
                '18px',
              padding:
                '38px',
              textAlign:
                'center',
            }}
          >

            <UserRound
              size={42}
            />

            <h2>
              No Coaches Listed
            </h2>

            <p className="mat-muted">
              Coach profiles will
              appear here when they
              become available.
            </p>

          </div>
        )}

      {!loading &&
        coaches.length >
          0 && (
          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap:
                '20px',
            }}
          >

            {coaches.map(
              (coach) => (
                <article
                  key={
                    coach.id
                  }
                  style={{
                    background:
                      '#ffffff',
                    border:
                      '1px solid #dfe7f1',
                    borderRadius:
                      '18px',
                    padding:
                      '22px',
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap:
                      '18px',
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap:
                        '14px',
                    }}
                  >

                    <div
                      style={{
                        width:
                          '60px',
                        height:
                          '60px',
                        borderRadius:
                          '50%',
                        background:
                          '#eef5ff',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        flexShrink:
                          0,
                      }}
                    >
                      <UserRound
                        size={30}
                      />
                    </div>

                    <div>

                      <span className="mat-athlete-dashboard-card-label">
                        Coach
                      </span>

                      <h2
                        style={{
                          margin:
                            '3px 0 0',
                        }}
                      >
                        {
                          coach.display_name
                        }
                      </h2>

                    </div>

                  </div>

                  {coach.bio && (
                    <p
                      style={{
                        margin:
                          0,
                        lineHeight:
                          1.65,
                      }}
                    >
                      {coach.bio}
                    </p>
                  )}

                  <div>

                    <strong>
                      Specialties
                    </strong>

                    <div
                      style={{
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          '8px',
                        marginTop:
                          '9px',
                      }}
                    >

                      {coach.specialties
                        ?.length >
                      0 ? (
                        coach.specialties.map(
                          (
                            specialty
                          ) => (
                            <span
                              key={
                                specialty
                              }
                              className="mat-athlete-home-event-pill"
                            >
                              {
                                specialty
                              }
                            </span>
                          )
                        )
                      ) : (
                        <span className="mat-muted">
                          General Coaching
                        </span>
                      )}

                    </div>

                  </div>

                  {coach.accomplishments && (
                    <div
                      style={{
                        padding:
                          '14px 15px',
                        background:
                          '#f8fafc',
                        border:
                          '1px solid #e4eaf1',
                        borderRadius:
                          '14px',
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '8px',
                          marginBottom:
                            '8px',
                        }}
                      >
                        <Award
                          size={18}
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
                            1.6,
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
                        padding:
                          '14px 15px',
                        background:
                          '#f8fafc',
                        border:
                          '1px solid #e4eaf1',
                        borderRadius:
                          '14px',
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '8px',
                          marginBottom:
                            '8px',
                        }}
                      >
                        <GraduationCap
                          size={18}
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
                            1.6,
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
                        padding:
                          '14px 15px',
                        background:
                          '#f8fafc',
                        border:
                          '1px solid #e4eaf1',
                        borderRadius:
                          '14px',
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '8px',
                          marginBottom:
                            '8px',
                        }}
                      >
                        <Lightbulb
                          size={18}
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
                            1.6,
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
                        'auto',
                      paddingTop:
                        '16px',
                      borderTop:
                        '1px solid #e7edf5',
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap:
                          '8px',
                      }}
                    >
                      <GraduationCap
                        size={18}
                      />

                      <strong>
                        Private Lessons
                      </strong>
                    </div>

                    {coach.offers_private_lessons ? (
                      <div
                        style={{
                          marginTop:
                            '9px',
                        }}
                      >

                        <div>
                          Available
                        </div>

                        {coach.lesson_rate !==
                          null &&
                          coach.lesson_rate !==
                            undefined && (
                            <div
                              className="mat-muted"
                              style={{
                                marginTop:
                                  '4px',
                              }}
                            >
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

                        {coach.availability_notes && (
                          <div
                            className="mat-muted"
                            style={{
                              marginTop:
                                '6px',
                              whiteSpace:
                                'pre-line',
                            }}
                          >
                            {
                              coach.availability_notes
                            }
                          </div>
                        )}

                        <button
                          type="button"
                          className="mat-primary-button"
                          style={{
                            marginTop:
                              '14px',
                            width:
                              '100%',
                            justifyContent:
                              'center',
                          }}
                          disabled={
                            !member ||
                            !accountId
                          }
                          onClick={() => {
                            setMessage('')
                            setSuccessMessage('')
                            setSelectedCoach(
                              coach
                            )
                          }}
                        >
                          <CalendarDays
                            size={17}
                          />

                          Request Private Lesson
                        </button>

                        {(!member ||
                          !accountId) && (
                          <p
                            className="mat-muted"
                            style={{
                              margin:
                                '8px 0 0',
                              fontSize:
                                '0.85rem',
                            }}
                          >
                            Your athlete
                            profile must
                            be linked
                            before you
                            can request
                            lessons.
                          </p>
                        )}

                      </div>
                    ) : (
                      <p
                        className="mat-muted"
                        style={{
                          margin:
                            '9px 0 0',
                        }}
                      >
                        Not currently
                        offering private
                        lessons.
                      </p>
                    )}

                  </div>

                </article>
              )
            )}

          </div>
        )}

      {!loading && (
        <section
          style={{
            marginTop:
              '34px',
          }}
        >

          <div
            style={{
              marginBottom:
                '16px',
            }}
          >
            <span className="mat-athlete-eyebrow">
              Private Lessons
            </span>

            <h2
              style={{
                margin:
                  '5px 0 0',
              }}
            >
              My Lesson Requests
            </h2>
          </div>

          {requestsWithCoaches.length ===
          0 ? (
            <div
              style={{
                background:
                  '#ffffff',
                border:
                  '1px solid #dfe7f1',
                borderRadius:
                  '16px',
                padding:
                  '22px',
              }}
            >
              <p
                className="mat-muted"
                style={{
                  margin:
                    0,
                }}
              >
                You have not requested
                any private lessons yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                display:
                  'grid',
                gap:
                  '12px',
              }}
            >

              {requestsWithCoaches.map(
                (
                  request
                ) => (
                  <article
                    key={
                      request.id
                    }
                    style={{
                      background:
                        '#ffffff',
                      border:
                        '1px solid #dfe7f1',
                      borderRadius:
                        '16px',
                      padding:
                        '18px',
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap:
                          '16px',
                        flexWrap:
                          'wrap',
                      }}
                    >

                      <div>

                        <strong
                          style={{
                            fontSize:
                              '1.05rem',
                          }}
                        >
                          {request.coach
                            ?.display_name ||
                            'Coach'}
                        </strong>

                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap:
                              '6px',
                            marginTop:
                              '8px',
                          }}
                        >
                          <CalendarDays
                            size={16}
                          />

                          <span>
                            {formatDate(
                              request.requested_date
                            )}
                          </span>
                        </div>

                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap:
                              '6px',
                            marginTop:
                              '5px',
                          }}
                        >
                          <Clock3
                            size={16}
                          />

                          <span>
                            {formatTime(
                              request.requested_time
                            )}
                          </span>
                        </div>

                      </div>

                      <span
                        style={{
                          ...getStatusStyle(
                            request.status
                          ),
                          alignSelf:
                            'flex-start',
                          padding:
                            '6px 10px',
                          borderRadius:
                            '999px',
                          fontWeight:
                            700,
                          fontSize:
                            '0.82rem',
                        }}
                      >
                        {getStatusLabel(
                          request.status
                        )}
                      </span>

                    </div>

                    {request.lesson_focus && (
                      <div
                        style={{
                          marginTop:
                            '14px',
                        }}
                      >
                        <strong>
                          Focus:{' '}
                        </strong>

                        {
                          request.lesson_focus
                        }
                      </div>
                    )}

                    {request.athlete_note && (
                      <div
                        style={{
                          marginTop:
                            '9px',
                        }}
                      >
                        <strong>
                          My Note:{' '}
                        </strong>

                        {
                          request.athlete_note
                        }
                      </div>
                    )}

                    {request.coach_note && (
                      <div
                        style={{
                          marginTop:
                            '9px',
                          padding:
                            '12px',
                          background:
                            '#f8fafc',
                          borderRadius:
                            '10px',
                        }}
                      >
                        <strong>
                          Coach Note
                        </strong>

                        <div
                          style={{
                            marginTop:
                              '4px',
                            whiteSpace:
                              'pre-line',
                          }}
                        >
                          {
                            request.coach_note
                          }
                        </div>
                      </div>
                    )}

                    {request.status ===
                      'pending' && (
                      <button
                        type="button"
                        className="mat-secondary-button"
                        style={{
                          marginTop:
                            '14px',
                        }}
                        disabled={
                          cancellingId ===
                          request.id
                        }
                        onClick={() =>
                          handleCancelRequest(
                            request
                          )
                        }
                      >
                        <X
                          size={16}
                        />

                        {cancellingId ===
                        request.id
                          ? 'Cancelling...'
                          : 'Cancel Request'}
                      </button>
                    )}

                  </article>
                )
              )}

            </div>
          )}

        </section>
      )}

      {selectedCoach && (
        <LessonRequestModal
          coach={
            selectedCoach
          }
          accountId={
            accountId
          }
          member={
            member
          }
          onClose={() =>
            setSelectedCoach(
              null
            )
          }
          onSubmitted={
            handleRequestSubmitted
          }
        />
      )}

    </div>
  )
}

export default AthleteCoachesPage