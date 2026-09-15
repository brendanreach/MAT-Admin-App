import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  RefreshCw,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

function formatDate(dateString) {
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

function formatTime(timeString) {
  if (!timeString) {
    return 'Flexible'
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

function getStatusLabel(status) {
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

function getStatusStyle(status) {
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

function AdminPrivateLessonRequests() {
  const [
    requests,
    setRequests,
  ] = useState([])

  const [
    coaches,
    setCoaches,
  ] = useState([])

  const [
    members,
    setMembers,
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
    selectedStatus,
    setSelectedStatus,
  ] = useState('pending')

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null)

  const [
    notes,
    setNotes,
  ] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setMessage('')

    const [
      requestsResult,
      coachesResult,
      membersResult,
    ] =
      await Promise.all([
        supabase
          .from(
            'private_lesson_requests'
          )
          .select('*')
          .order(
            'requested_date',
            {
              ascending: true,
            }
          ),

        supabase
          .from('coaches')
          .select(
            'id, display_name'
          )
          .order(
            'display_name',
            {
              ascending: true,
            }
          ),

        supabase
          .from('members')
          .select(
            'id, first_name, last_name'
          )
          .order(
            'last_name',
            {
              ascending: true,
            }
          ),
      ])

    if (
      requestsResult.error
    ) {
      setMessage(
        requestsResult.error.message
      )

      setLoading(false)
      return
    }

    if (
      coachesResult.error
    ) {
      setMessage(
        coachesResult.error.message
      )

      setLoading(false)
      return
    }

    if (
      membersResult.error
    ) {
      setMessage(
        membersResult.error.message
      )

      setLoading(false)
      return
    }

    setRequests(
      requestsResult.data ||
        []
    )

    setCoaches(
      coachesResult.data ||
        []
    )

    setMembers(
      membersResult.data ||
        []
    )

    const initialNotes = {}

    for (
      const request of
      requestsResult.data ||
      []
    ) {
      initialNotes[
        request.id
      ] =
        request.coach_note ||
        ''
    }

    setNotes(
      initialNotes
    )

    setLoading(false)
  }

  async function updateStatus(
    request,
    nextStatus
  ) {
    setUpdatingId(
      request.id
    )

    setMessage('')

    const {
      error,
    } =
      await supabase.rpc(
        'update_private_lesson_request_status',
        {
          requested_request_id:
            request.id,

          requested_status:
            nextStatus,

          requested_coach_note:
            notes[
              request.id
            ] ||
            null,
        }
      )

    if (error) {
      setMessage(
        error.message
      )

      setUpdatingId(
        null
      )
      return
    }

    await loadData()

    setUpdatingId(
      null
    )
  }

  const enrichedRequests =
    useMemo(() => {
      return requests.map(
        (request) => {
          const coach =
            coaches.find(
              (
                item
              ) =>
                item.id ===
                request.coach_id
            )

          const member =
            members.find(
              (
                item
              ) =>
                item.id ===
                request.member_id
            )

          return {
            ...request,
            coachName:
              coach?.display_name ||
              'Unknown Coach',

            athleteName:
              member
                ? `${member.first_name} ${member.last_name}`
                : 'Unknown Athlete',
          }
        }
      )
    }, [
      requests,
      coaches,
      members,
    ])

  const filteredRequests =
    useMemo(() => {
      if (
        selectedStatus ===
        'all'
      ) {
        return enrichedRequests
      }

      return enrichedRequests.filter(
        (request) =>
          request.status ===
          selectedStatus
      )
    }, [
      enrichedRequests,
      selectedStatus,
    ])

  const pendingCount =
    requests.filter(
      (request) =>
        request.status ===
        'pending'
    ).length

  const approvedCount =
    requests.filter(
      (request) =>
        request.status ===
        'approved'
    ).length

  return (
    <section
      style={{
        marginTop:
          '36px',
      }}
    >

      <div
        style={{
          display:
            'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-start',
          gap:
            '16px',
          flexWrap:
            'wrap',
          marginBottom:
            '18px',
        }}
      >

        <div>

          <span className="mat-athlete-eyebrow">
            Private Lessons
          </span>

          <h2
            style={{
              margin:
                '5px 0 6px',
            }}
          >
            Lesson Requests
          </h2>

          <p
            className="mat-muted"
            style={{
              margin:
                0,
            }}
          >
            Review athlete lesson
            requests and update their
            status.
          </p>

        </div>

        <button
          type="button"
          className="mat-secondary-button"
          onClick={
            loadData
          }
          disabled={
            loading
          }
        >
          <RefreshCw
            size={16}
          />

          Refresh
        </button>

      </div>

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      <div
        style={{
          display:
            'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap:
            '12px',
          marginBottom:
            '18px',
        }}
      >

        <div
          style={{
            background:
              '#ffffff',
            border:
              '1px solid #dfe7f1',
            borderRadius:
              '14px',
            padding:
              '16px',
          }}
        >
          <div className="mat-muted">
            Pending
          </div>

          <strong
            style={{
              fontSize:
                '1.7rem',
            }}
          >
            {pendingCount}
          </strong>
        </div>

        <div
          style={{
            background:
              '#ffffff',
            border:
              '1px solid #dfe7f1',
            borderRadius:
              '14px',
            padding:
              '16px',
          }}
        >
          <div className="mat-muted">
            Approved
          </div>

          <strong
            style={{
              fontSize:
                '1.7rem',
            }}
          >
            {approvedCount}
          </strong>
        </div>

        <div
          style={{
            background:
              '#ffffff',
            border:
              '1px solid #dfe7f1',
            borderRadius:
              '14px',
            padding:
              '16px',
          }}
        >
          <div className="mat-muted">
            Total
          </div>

          <strong
            style={{
              fontSize:
                '1.7rem',
            }}
          >
            {requests.length}
          </strong>
        </div>

      </div>

      <div
        style={{
          display:
            'flex',
          flexWrap:
            'wrap',
          gap:
            '8px',
          marginBottom:
            '18px',
        }}
      >

        {[
          [
            'pending',
            'Pending',
          ],
          [
            'approved',
            'Approved',
          ],
          [
            'denied',
            'Denied',
          ],
          [
            'completed',
            'Completed',
          ],
          [
            'cancelled',
            'Cancelled',
          ],
          [
            'all',
            'All',
          ],
        ].map(
          ([
            value,
            label,
          ]) => (
            <button
              key={
                value
              }
              type="button"
              className={
                selectedStatus ===
                value
                  ? 'mat-primary-button'
                  : 'mat-secondary-button'
              }
              onClick={() =>
                setSelectedStatus(
                  value
                )
              }
            >
              {label}
            </button>
          )
        )}

      </div>

      {loading && (
        <div className="mat-muted">
          Loading lesson requests...
        </div>
      )}

      {!loading &&
        filteredRequests.length ===
          0 && (
          <div
            style={{
              background:
                '#ffffff',
              border:
                '1px solid #dfe7f1',
              borderRadius:
                '16px',
              padding:
                '24px',
              textAlign:
                'center',
            }}
          >
            <p
              className="mat-muted"
              style={{
                margin:
                  0,
              }}
            >
              No lesson requests in
              this category.
            </p>
          </div>
        )}

      {!loading &&
        filteredRequests.length >
          0 && (
          <div
            style={{
              display:
                'grid',
              gap:
                '14px',
            }}
          >

            {filteredRequests.map(
              (request) => (
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
                        <UserRound
                          size={18}
                        />

                        <strong
                          style={{
                            fontSize:
                              '1.1rem',
                          }}
                        >
                          {
                            request.athleteName
                          }
                        </strong>
                      </div>

                      <div
                        className="mat-muted"
                        style={{
                          marginTop:
                            '5px',
                        }}
                      >
                        with{' '}
                        {
                          request.coachName
                        }
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
                        fontSize:
                          '0.82rem',
                        fontWeight:
                          700,
                      }}
                    >
                      {getStatusLabel(
                        request.status
                      )}
                    </span>

                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      flexWrap:
                        'wrap',
                      gap:
                        '18px',
                      marginTop:
                        '16px',
                    }}
                  >

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap:
                          '6px',
                      }}
                    >
                      <CalendarDays
                        size={17}
                      />

                      {formatDate(
                        request.requested_date
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap:
                          '6px',
                      }}
                    >
                      <Clock3
                        size={17}
                      />

                      {formatTime(
                        request.requested_time
                      )}
                    </div>

                  </div>

                  {request.lesson_focus && (
                    <div
                      style={{
                        marginTop:
                          '14px',
                      }}
                    >
                      <strong>
                        Focus:
                      </strong>{' '}
                      {
                        request.lesson_focus
                      }
                    </div>
                  )}

                  {request.athlete_note && (
                    <div
                      style={{
                        marginTop:
                          '12px',
                        padding:
                          '12px 14px',
                        background:
                          '#f8fafc',
                        borderRadius:
                          '10px',
                      }}
                    >
                      <strong>
                        Athlete Note
                      </strong>

                      <div
                        style={{
                          marginTop:
                            '5px',
                          whiteSpace:
                            'pre-line',
                        }}
                      >
                        {
                          request.athlete_note
                        }
                      </div>
                    </div>
                  )}

                  {request.status !==
                    'cancelled' && (
                    <div
                      style={{
                        marginTop:
                          '16px',
                      }}
                    >

                      <label
                        style={{
                          display:
                            'block',
                          fontWeight:
                            700,
                          marginBottom:
                            '7px',
                        }}
                      >
                        Coach / Admin Note
                      </label>

                      <textarea
                        className="mat-textarea"
                        rows="3"
                        value={
                          notes[
                            request.id
                          ] ||
                          ''
                        }
                        onChange={(
                          event
                        ) =>
                          setNotes(
                            (
                              current
                            ) => ({
                              ...current,

                              [request.id]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="Optional note for the athlete..."
                      />

                    </div>
                  )}

                  {request.status ===
                    'pending' && (
                    <div
                      style={{
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          '9px',
                        marginTop:
                          '14px',
                      }}
                    >

                      <button
                        type="button"
                        className="mat-primary-button"
                        disabled={
                          updatingId ===
                          request.id
                        }
                        onClick={() =>
                          updateStatus(
                            request,
                            'approved'
                          )
                        }
                      >
                        <Check
                          size={17}
                        />

                        Approve
                      </button>

                      <button
                        type="button"
                        className="mat-secondary-button"
                        disabled={
                          updatingId ===
                          request.id
                        }
                        onClick={() =>
                          updateStatus(
                            request,
                            'denied'
                          )
                        }
                      >
                        <X
                          size={17}
                        />

                        Deny
                      </button>

                    </div>
                  )}

                  {request.status ===
                    'approved' && (
                    <div
                      style={{
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          '9px',
                        marginTop:
                          '14px',
                      }}
                    >

                      <button
                        type="button"
                        className="mat-primary-button"
                        disabled={
                          updatingId ===
                          request.id
                        }
                        onClick={() =>
                          updateStatus(
                            request,
                            'completed'
                          )
                        }
                      >
                        <CheckCircle2
                          size={17}
                        />

                        Mark Completed
                      </button>

                      <button
                        type="button"
                        className="mat-secondary-button"
                        disabled={
                          updatingId ===
                          request.id
                        }
                        onClick={() =>
                          updateStatus(
                            request,
                            'denied'
                          )
                        }
                      >
                        <XCircle
                          size={17}
                        />

                        Deny
                      </button>

                    </div>
                  )}

                  {updatingId ===
                    request.id && (
                    <div
                      className="mat-muted"
                      style={{
                        marginTop:
                          '10px',
                      }}
                    >
                      Updating...
                    </div>
                  )}

                </article>
              )
            )}

          </div>
        )}

    </section>
  )
}

export default AdminPrivateLessonRequests