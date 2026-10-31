import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Archive,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Grid2X2,
  Link2,
  List,
  Medal,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  StickyNote,
  Ticket,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase.js'
import TournamentForm from './TournamentForm.jsx'
import './TournamentsPage.css'
import {
  EVENT_GROUPS,
  getEventOptionLabel,
  getTournamentEventGroups,
  getTournamentEvents,
} from '../lib/tournamentEvents.js'

const RESULT_OPTIONS = [
  'Gold',
  'Silver',
  'Bronze',
  'Quarterfinals',
  'Round of 16',
  'Round of 32',
  'Round of 64',
  'Round of 128',
]

function getLocalTodayString() {
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

function getTournamentCompetitionAge(
  birthdate,
  eventDate
) {
  if (
    !birthdate ||
    !eventDate
  ) {
    return null
  }

  const birthYear =
    Number(
      birthdate.slice(
        0,
        4
      )
    )

  const tournamentYear =
    Number(
      eventDate.slice(
        0,
        4
      )
    )

  if (
    !birthYear ||
    !tournamentYear
  ) {
    return null
  }

  return (
    tournamentYear -
    birthYear
  )
}

function getEventDisplayName(
  eventName
) {
  if (
    eventName ===
    'Recognized Poomsae - Individual'
  ) {
    return 'Individual'
  }

  if (
    eventName ===
    'World Class Poomsae - Individual'
  ) {
    return 'Individual'
  }

  if (
    eventName ===
    'World Class Poomsae - Mixed Pairs'
  ) {
    return 'Mixed Pairs'
  }

  if (
    eventName ===
    'World Class Poomsae - Team'
  ) {
    return 'Team'
  }

  return eventName
}

function getEventShortName(
  eventName
) {
  return String(
    eventName ||
      ''
  )
    .replace(
      'World Class Poomsae - ',
      'WC '
    )
    .replace(
      'Recognized Poomsae - Individual',
      'Recognized Poomsae'
    )
}

function getResultStageFromExisting(
  result
) {
  if (!result) {
    return ''
  }

  if (
    result.result_stage
  ) {
    return (
      result.result_stage
    )
  }

  if (
    result.medal ===
    'Gold'
  ) {
    return 'Gold'
  }

  if (
    result.medal ===
    'Silver'
  ) {
    return 'Silver'
  }

  if (
    result.medal ===
    'Bronze'
  ) {
    return 'Bronze'
  }

  return ''
}

function getMedalFromResultStage(
  resultStage
) {
  if (
    resultStage ===
      'Gold' ||
    resultStage ===
      'Silver' ||
    resultStage ===
      'Bronze'
  ) {
    return resultStage
  }

  return 'None'
}

function getPlacementFromResultStage(
  resultStage
) {
  if (
    resultStage ===
    'Gold'
  ) {
    return 1
  }

  if (
    resultStage ===
    'Silver'
  ) {
    return 2
  }

  if (
    resultStage ===
    'Bronze'
  ) {
    return 3
  }

  return null
}

function TournamentsPage({
  members,
  tournaments,
  allTournamentEntries,
  tournamentResults,
  onTournamentsChanged,
  onEntriesChanged,
  onResultsChanged,
}) {
  const [
    viewMode,
    setViewMode,
  ] = useState(
    'upcoming'
  )

  const [
    archiveLayout,
    setArchiveLayout,
  ] = useState(() => localStorage.getItem('mat-archive-layout') || 'cards')

  const [
    selectedTournamentId,
    setSelectedTournamentId,
  ] = useState('')

  const [
    showTournamentForm,
    setShowTournamentForm,
  ] = useState(false)

  const [
    editingTournament,
    setEditingTournament,
  ] = useState(null)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    resultForms,
    setResultForms,
  ] = useState({})

  const [
    expandedAthletes,
    setExpandedAthletes,
  ] = useState({})

  const [participantSearch, setParticipantSearch] = useState('')
  const [participantEventFilter, setParticipantEventFilter] = useState('all')
  const [noteDrafts, setNoteDrafts] = useState({})
  const [savingNoteId, setSavingNoteId] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [showInactiveMembers, setShowInactiveMembers] = useState(false)
  const [addingMemberId, setAddingMemberId] = useState('')
  const tournamentDetailRef = useRef(null)

  useEffect(() => {
    if (
      selectedTournamentId &&
      !tournaments.some(
        (tournament) =>
          tournament.id ===
          selectedTournamentId
      )
    ) {
      setSelectedTournamentId(
        ''
      )
    }
  }, [
    tournaments,
    selectedTournamentId,
  ])

  useEffect(() => {
    localStorage.setItem('mat-archive-layout', archiveLayout)
  }, [archiveLayout])

  useEffect(() => {
    if (!selectedTournamentId) {
      return undefined
    }

    const scrollTimer = window.setTimeout(() => {
      tournamentDetailRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 80)

    return () => window.clearTimeout(scrollTimer)
  }, [selectedTournamentId])

  useEffect(() => {
    setExpandedAthletes({})
    setParticipantSearch('')
    setParticipantEventFilter('all')
    setNoteDrafts({})
    setMessage('')
  }, [
    selectedTournamentId,
  ])

  const todayString =
    getLocalTodayString()

  const upcomingTournaments =
    useMemo(
      () =>
        tournaments.filter(
          (tournament) => {
            const finalDate =
              tournament.end_date ||
              tournament.event_date

            return (
              !finalDate ||
              finalDate >=
                todayString
            )
          }
        ),
      [
        tournaments,
        todayString,
      ]
    )

  const archivedTournaments =
    useMemo(
      () =>
        tournaments
          .filter(
            (tournament) => {
              const finalDate =
                tournament.end_date ||
                tournament.event_date

              return (
                finalDate &&
                finalDate <
                  todayString
              )
            }
          )
          .sort(
            (a, b) =>
              (
                b.end_date ||
                b.event_date ||
                ''
              ).localeCompare(
                a.end_date ||
                  a.event_date ||
                  ''
              )
          ),
      [
        tournaments,
        todayString,
      ]
    )

  const visibleTournaments =
    viewMode ===
    'archive'
      ? archivedTournaments
      : upcomingTournaments

  const selectedTournament =
    useMemo(
      () =>
        tournaments.find(
          (tournament) =>
            tournament.id ===
            selectedTournamentId
        ),
      [
        tournaments,
        selectedTournamentId,
      ]
    )

  const selectedEntries =
    useMemo(
      () =>
        allTournamentEntries.filter(
          (entry) =>
            entry.tournament_id ===
            selectedTournamentId
        ),
      [
        allTournamentEntries,
        selectedTournamentId,
      ]
    )

  const sortedSelectedEntries =
    useMemo(
      () =>
        selectedEntries
          .map((entry) => ({
            entry,
            member:
              members.find(
                (item) =>
                  item.id ===
                  entry.member_id
              ),
          }))
          .filter(
            ({ member }) =>
              member
          )
          .sort((a, b) =>
            `${a.member.last_name} ${a.member.first_name}`.localeCompare(
              `${b.member.last_name} ${b.member.first_name}`
            )
          ),
      [
        selectedEntries,
        members,
      ]
    )

  const activeEventGroup =
    EVENT_GROUPS.find(
      (group) =>
        group.label ===
        participantEventFilter
    ) || null

  function entryMatchesEventFilter(
    entry,
    filter
  ) {
    const events =
      entry.events ||
      []

    if (filter === 'all') {
      return true
    }

    if (filter === 'none') {
      return events.length === 0
    }

    const group =
      EVENT_GROUPS.find(
        (item) =>
          item.label ===
          filter
      )

    return Boolean(
      group &&
        events.some(
          (eventName) =>
            group.events.includes(
              eventName
            )
        )
    )
  }

  const participantFilterOptions = [
    {
      value: 'all',
      label: 'All',
    },
    ...EVENT_GROUPS.map(
      (group) => ({
        value: group.label,
        label: group.label,
      })
    ),
    {
      value: 'none',
      label: 'No Events',
    },
  ].map((option) => ({
    ...option,
    count:
      sortedSelectedEntries.filter(
        ({ entry }) =>
          entryMatchesEventFilter(
            entry,
            option.value
          )
      ).length,
  }))

  const visibleParticipants =
    sortedSelectedEntries.filter(
      ({ entry, member }) =>
        entryMatchesEventFilter(
          entry,
          participantEventFilter
        ) &&
        `${member.first_name} ${member.last_name}`
          .toLowerCase()
          .includes(
            participantSearch
              .trim()
              .toLowerCase()
          )
    )

  const isSelectedArchived =
    Boolean(
      selectedTournament &&
      (
        selectedTournament.end_date ||
        selectedTournament.event_date
      ) &&
      (
        selectedTournament.end_date ||
        selectedTournament.event_date
      ) < todayString
    )

  const availableMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          !selectedEntries.some(
            (entry) => entry.member_id === member.id
          )
      ),
    [members, selectedEntries]
  )

  const activeAvailableCount = useMemo(
    () => availableMembers.filter((member) => member.is_active).length,
    [availableMembers]
  )

  const inactiveAvailableCount = useMemo(
    () => availableMembers.filter((member) => !member.is_active).length,
    [availableMembers]
  )

  const filteredAvailableMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()

    return [...availableMembers]
      .filter((member) => showInactiveMembers || member.is_active)
      .filter((member) => {
        if (!query) return true

        const searchable = [
          member.first_name,
          member.last_name,
          `${member.first_name || ''} ${member.last_name || ''}`,
          member.belt_rank,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchable.includes(query)
      })
      .sort((a, b) => {
        const aName = `${a.last_name || ''} ${a.first_name || ''}`.trim()
        const bName = `${b.last_name || ''} ${b.first_name || ''}`.trim()
        return aName.localeCompare(bName)
      })
  }, [availableMembers, memberSearch, showInactiveMembers])

  function getTournamentEntries(
    tournamentId
  ) {
    return allTournamentEntries.filter(
      (entry) =>
        entry.tournament_id ===
        tournamentId
    )
  }

  function getEntryResults(
    entryId
  ) {
    return tournamentResults.filter(
      (result) =>
        result.tournament_entry_id ===
        entryId
    )
  }

  function getTournamentResults(
    tournamentId
  ) {
    const entryIds =
      getTournamentEntries(
        tournamentId
      ).map(
        (entry) =>
          entry.id
      )

    return tournamentResults.filter(
      (result) =>
        entryIds.includes(
          result.tournament_entry_id
        )
    )
  }

  function getMedalCounts(
    tournamentId
  ) {
    const results =
      getTournamentResults(
        tournamentId
      )

    return {
      gold:
        results.filter(
          (result) =>
            result.medal ===
            'Gold'
        ).length,

      silver:
        results.filter(
          (result) =>
            result.medal ===
            'Silver'
        ).length,

      bronze:
        results.filter(
          (result) =>
            result.medal ===
            'Bronze'
        ).length,
    }
  }

  function getTournamentStats(
    tournament
  ) {
    return {
      totalAthletes:
        getTournamentEntries(
          tournament.id
        ).length,
    }
  }

  function formatFee(
    amount
  ) {
    if (
      amount === null ||
      amount === undefined ||
      amount === ''
    ) {
      return 'Not set'
    }

    return `$${Number(
      amount
    ).toFixed(2)}`
  }

  function formatDate(
    dateString
  ) {
    if (!dateString) {
      return 'Not set'
    }

    const date =
      new Date(
        `${dateString}T00:00:00`
      )

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  function formatTournamentDate(
    tournament
  ) {
    if (
      !tournament?.event_date
    ) {
      return 'Not set'
    }

    if (
      !tournament.end_date ||
      tournament.end_date ===
        tournament.event_date
    ) {
      return formatDate(
        tournament.event_date
      )
    }

    return `${formatDate(
      tournament.event_date
    )} – ${formatDate(
      tournament.end_date
    )}`
  }

  function getTournamentStatus(
    tournament
  ) {
    const finalDate =
      tournament.end_date ||
      tournament.event_date

    if (
      finalDate &&
      finalDate <
        todayString
    ) {
      return {
        label:
          'Completed',

        className:
          'mat-tournament-status completed',
      }
    }

    if (
      tournament.registration_deadline &&
      tournament.registration_deadline <
        todayString
    ) {
      return {
        label:
          'Registration Closed',

        className:
          'mat-tournament-status closed',
      }
    }

    return {
      label:
        'Upcoming',

      className:
        'mat-tournament-status upcoming',
    }
  }

  async function handleTournamentSaved(
    tournament
  ) {
    await onTournamentsChanged()

    setSelectedTournamentId(
      tournament.id
    )

    const finalDate =
      tournament.end_date ||
      tournament.event_date

    if (
      finalDate &&
      finalDate <
        todayString
    ) {
      setViewMode(
        'archive'
      )
    } else {
      setViewMode(
        'upcoming'
      )
    }

    setEditingTournament(
      null
    )

    setShowTournamentForm(
      false
    )
  }

  function openNewTournament() {
    setEditingTournament(
      null
    )

    setShowTournamentForm(
      true
    )
  }

  function openEditTournament() {
    if (
      !selectedTournament
    ) {
      return
    }

    setEditingTournament(
      selectedTournament
    )

    setShowTournamentForm(
      true
    )
  }

  function handleViewChange(
    nextView
  ) {
    setViewMode(
      nextView
    )

    setSelectedTournamentId(
      ''
    )

    setExpandedAthletes({})

    setMessage('')
  }

  function toggleAthleteExpanded(
    entryId
  ) {
    const opening =
      !expandedAthletes[entryId]

    // Only one participant editor is open at a time so the list stays short.
    setExpandedAthletes(
      opening
        ? { [entryId]: true }
        : {}
    )

    if (opening) {
      window.setTimeout(() => {
        document
          .getElementById(
            `mat-participant-${entryId}`
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 60)
    }
  }

  async function saveEntryNote(
    entry
  ) {
    const draft =
      noteDrafts[entry.id]

    if (
      draft === undefined ||
      draft.trim() ===
        (entry.notes || '')
    ) {
      return
    }

    setSavingNoteId(
      entry.id
    )

    const {
      error,
    } =
      await supabase
        .from(
          'tournament_entries'
        )
        .update({
          notes:
            draft.trim() ||
            null,
        })
        .eq(
          'id',
          entry.id
        )

    setSavingNoteId('')

    if (error) {
      setMessage(
        error.message
      )

      return
    }

    await onEntriesChanged()
  }

  async function addAthlete(
    member
  ) {
    if (
      !selectedTournamentId ||
      !selectedTournament
    ) {
      return
    }

    setMessage('')
    setAddingMemberId(member.id)

    const competitionAge =
      getTournamentCompetitionAge(
        member.birthdate,
        selectedTournament.event_date
      )

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'tournament_entries'
        )
        .insert([
          {
            member_id:
              member.id,

            tournament_id:
              selectedTournamentId,

            events: [],

            division_age_group:
              competitionAge ===
              null
                ? null
                : String(
                    competitionAge
                  ),

            has_paid:
              false,
          },
        ])
        .select()
        .single()

    if (error) {
      setMessage(
        error.message
      )
      setAddingMemberId('')

      return
    }

    await onEntriesChanged()

    if (
      data?.id &&
      isSelectedArchived
    ) {
      setExpandedAthletes(
        (current) => ({
          ...current,
          [data.id]: true,
        })
      )
    }

    setMessage(
      `${member.first_name} ${member.last_name} added.`
    )
    setAddingMemberId('')
    setMemberSearch('')
  }

  async function removeAthlete(
    entryId
  ) {
    const confirmed =
      window.confirm(
        isSelectedArchived
          ? 'Remove this athlete from the historical tournament record? Saved results for this tournament will also be removed.'
          : 'Remove this athlete from the tournament?'
      )

    if (!confirmed) {
      return
    }

    const {
      error,
    } =
      await supabase
        .from(
          'tournament_entries'
        )
        .delete()
        .eq(
          'id',
          entryId
        )

    if (error) {
      setMessage(
        error.message
      )

      return
    }

    await onEntriesChanged()
    await onResultsChanged()

    setExpandedAthletes(
      (current) => {
        const updated = {
          ...current,
        }

        delete updated[
          entryId
        ]

        return updated
      }
    )

    setMessage(
      'Athlete removed.'
    )
  }

  async function toggleEvent(
    entry,
    eventName
  ) {
    const currentEvents =
      entry.events ||
      []

    const removingEvent =
      currentEvents.includes(
        eventName
      )

    if (
      removingEvent
    ) {
      const existingResult =
        tournamentResults.find(
          (result) =>
            result.tournament_entry_id ===
              entry.id &&
            result.event_name ===
              eventName
        )

      if (
        existingResult
      ) {
        const confirmed =
          window.confirm(
            `${getEventDisplayName(
              eventName
            )} already has a saved result. Removing the event will also remove that result. Continue?`
          )

        if (
          !confirmed
        ) {
          return
        }

        const {
          error:
            resultDeleteError,
        } =
          await supabase
            .from(
              'tournament_results'
            )
            .delete()
            .eq(
              'id',
              existingResult.id
            )

        if (
          resultDeleteError
        ) {
          setMessage(
            resultDeleteError.message
          )

          return
        }
      }
    }

    const updatedEvents =
      removingEvent
        ? currentEvents.filter(
            (item) =>
              item !==
              eventName
          )
        : [
            ...currentEvents,
            eventName,
          ]

    const {
      error,
    } =
      await supabase
        .from(
          'tournament_entries'
        )
        .update({
          events:
            updatedEvents,
        })
        .eq(
          'id',
          entry.id
        )

    if (error) {
      setMessage(
        error.message
      )

      return
    }

    await onEntriesChanged()

    if (
      removingEvent
    ) {
      await onResultsChanged()
    }
  }

  function getResultFormKey(
    entryId,
    eventName
  ) {
    return `${entryId}|||${eventName}`
  }

  function getResultForm(
    entryId,
    eventName
  ) {
    const key =
      getResultFormKey(
        entryId,
        eventName
      )

    if (
      resultForms[key]
    ) {
      return (
        resultForms[key]
      )
    }

    const existing =
      tournamentResults.find(
        (result) =>
          result.tournament_entry_id ===
            entryId &&
          result.event_name ===
            eventName
      )

    return {
      result_stage:
        getResultStageFromExisting(
          existing
        ),

      division:
        existing?.division ||
        '',

      notes:
        existing?.notes ||
        '',
    }
  }

  function updateResultForm(
    entryId,
    eventName,
    field,
    value
  ) {
    const key =
      getResultFormKey(
        entryId,
        eventName
      )

    setResultForms(
      (current) => ({
        ...current,

        [key]: {
          ...getResultForm(
            entryId,
            eventName
          ),

          [field]:
            value,
        },
      })
    )
  }

  async function saveResult(
    entryId,
    eventName
  ) {
    const form =
      getResultForm(
        entryId,
        eventName
      )

    const resultStage =
      form.result_stage ||
      null

    const payload = {
      tournament_entry_id:
        entryId,

      event_name:
        eventName,

      result_stage:
        resultStage,

      placement:
        getPlacementFromResultStage(
          resultStage
        ),

      medal:
        getMedalFromResultStage(
          resultStage
        ),

      division:
        form.division.trim() ||
        null,

      notes:
        form.notes.trim() ||
        null,
    }

    const {
      error,
    } =
      await supabase
        .from(
          'tournament_results'
        )
        .upsert(
          payload,
          {
            onConflict:
              'tournament_entry_id,event_name',
          }
        )

    if (error) {
      setMessage(
        error.message
      )

      return
    }

    const key =
      getResultFormKey(
        entryId,
        eventName
      )

    setResultForms(
      (current) => {
        const updated = {
          ...current,
        }

        delete updated[
          key
        ]

        return updated
      }
    )

    setMessage(
      `${getEventDisplayName(
        eventName
      )} result saved.`
    )

    await onResultsChanged()
  }

  function renderResultEditor(
    entry,
    eventName
  ) {
    const form =
      getResultForm(
        entry.id,
        eventName
      )

    const existing =
      tournamentResults.find(
        (result) =>
          result.tournament_entry_id ===
            entry.id &&
          result.event_name ===
            eventName
      )

    const existingStage =
      getResultStageFromExisting(
        existing
      )

    return (
      <div className="mat-history-inline-result">

        <div className="mat-history-inline-result-header">

          <div>
            <strong>
              Result
            </strong>

            <span>
              {existing
                ? 'Saved result'
                : 'No result recorded yet'}
            </span>
          </div>

          {existingStage &&
            (
              existingStage ===
                'Gold' ||
              existingStage ===
                'Silver' ||
              existingStage ===
                'Bronze'
            ) && (
              <span
                className={`mat-medal-badge ${existingStage.toLowerCase()}`}
              >
                <Medal
                  size={14}
                />

                {
                  existingStage
                }
              </span>
            )}

        </div>

        <div className="mat-result-form-grid">

          <div className="mat-form-group">

            <label>
              Result
            </label>

            <select
              className="mat-input"
              value={
                form.result_stage
              }
              onChange={(
                event
              ) =>
                updateResultForm(
                  entry.id,
                  eventName,
                  'result_stage',
                  event.target.value
                )
              }
            >
              <option value="">
                No result recorded
              </option>

              {RESULT_OPTIONS.map(
                (
                  result
                ) => (
                  <option
                    key={
                      result
                    }
                    value={
                      result
                    }
                  >
                    {
                      result
                    }
                  </option>
                )
              )}

            </select>

          </div>

          <div className="mat-form-group">

            <label>
              Division
            </label>

            <input
              className="mat-input"
              type="text"
              placeholder="Optional division"
              value={
                form.division
              }
              onChange={(
                event
              ) =>
                updateResultForm(
                  entry.id,
                  eventName,
                  'division',
                  event.target.value
                )
              }
            />

          </div>

        </div>

        <div className="mat-form-group">

          <label>
            Notes
          </label>

          <input
            className="mat-input"
            type="text"
            placeholder="Optional result notes"
            value={
              form.notes
            }
            onChange={(
              event
            ) =>
                updateResultForm(
                  entry.id,
                  eventName,
                  'notes',
                  event.target.value
                )
              }
          />

        </div>

        <div className="mat-result-footer">

          <div>
            {form.result_stage && (
              <span>
                {
                  form.result_stage
                }
              </span>
            )}
          </div>

          <button
            type="button"
            className="mat-primary-button mat-result-save"
            onClick={() =>
              saveResult(
                entry.id,
                eventName
              )
            }
          >
            <Save
              size={16}
            />

            Save Result
          </button>

        </div>

      </div>
    )
  }

  function renderEventChoices(
    entry,
    historical
  ) {
    const knownEvents =
      getTournamentEvents(
        selectedTournament
      )

    const offeredGroups =
      getTournamentEventGroups(
        selectedTournament
      )

    const legacyEvents =
      (
        entry.events ||
        []
      ).filter(
        (eventName) =>
          !knownEvents.includes(
            eventName
          )
      )

    return (
      <div className="mat-history-event-editor">

        <div className="mat-tournament-event-groups">

          {offeredGroups.map(
            (group) => (
              <div
                key={
                  group.label
                }
                className="mat-tournament-event-group"
              >

                <div className="mat-tournament-events-label">
                  {
                    group.label
                  }
                </div>

                <div className="mat-tournament-events">

                  {group.events.map(
                    (
                      eventName
                    ) => {
                      const checked =
                        entry.events?.includes(
                          eventName
                        ) ||
                        false

                      return (
                        <div
                          key={
                            eventName
                          }
                          className="mat-history-event-block"
                        >

                          <label
                            className={`mat-tournament-event-option ${
                              checked
                                ? 'selected'
                                : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                toggleEvent(
                                  entry,
                                  eventName
                                )
                              }
                            />

                            <span>
                              {getEventOptionLabel(
                                group,
                                eventName
                              )}
                            </span>

                          </label>

                          {historical &&
                            checked &&
                            renderResultEditor(
                              entry,
                              eventName
                            )}

                        </div>
                      )
                    }
                  )}

                </div>

              </div>
            )
          )}

        </div>

        {legacyEvents.length >
          0 && (
          <div className="mat-tournament-event-group">

            <div className="mat-tournament-events-label">
              Not Offered at This Tournament
            </div>

            <div className="mat-tournament-events">

              {legacyEvents.map(
                (
                  eventName
                ) => (
                  <div
                    key={
                      eventName
                    }
                    className="mat-history-event-block"
                  >

                    <label className="mat-tournament-event-option selected">

                      <input
                        type="checkbox"
                        checked
                        onChange={() =>
                          toggleEvent(
                            entry,
                            eventName
                          )
                        }
                      />

                      <span>
                        {
                          eventName
                        }
                      </span>

                    </label>

                    {historical &&
                      renderResultEditor(
                        entry,
                        eventName
                      )}

                  </div>
                )
              )}

            </div>

          </div>
        )}

      </div>
    )
  }

  function renderParticipantRow(
    entry,
    member,
    historical = false
  ) {
    const expanded =
      Boolean(
        expandedAthletes[
          entry.id
        ]
      )

    const events =
      entry.events ||
      []

    const results =
      getEntryResults(
        entry.id
      )

    const noteValue =
      noteDrafts[entry.id] ??
      entry.notes ??
      ''

    const meta = [
      entry.division_age_group,
      member.belt_rank &&
        `${member.belt_rank} Belt`,
      !member.is_active &&
        'Inactive',
    ].filter(Boolean)

    return (
      <li
        key={
          entry.id
        }
        id={`mat-participant-${entry.id}`}
        className={`mat-participant ${
          expanded
            ? 'expanded'
            : ''
        }`}
      >

        <button
          type="button"
          className="mat-participant-row"
          aria-expanded={
            expanded
          }
          onClick={() =>
            toggleAthleteExpanded(
              entry.id
            )
          }
        >

          <span className="mat-participant-avatar">
            {member.first_name
              ?.charAt(0)
              .toUpperCase()}

            {member.last_name
              ?.charAt(0)
              .toUpperCase()}
          </span>

          <span className="mat-participant-name">
            <strong>
              {member.first_name}{' '}
              {member.last_name}
            </strong>

            {meta.length > 0 && (
              <span>
                {meta.join(
                  ' · '
                )}
              </span>
            )}
          </span>

          <span className="mat-participant-events">
            {events.length ===
            0 ? (
              <span className="mat-participant-chip empty">
                No events yet
              </span>
            ) : (
              events.map(
                (eventName) => {
                  const stage =
                    getResultStageFromExisting(
                      results.find(
                        (result) =>
                          result.event_name ===
                          eventName
                      )
                    )

                  const medal =
                    [
                      'Gold',
                      'Silver',
                      'Bronze',
                    ].includes(
                      stage
                    )

                  return (
                    <span
                      key={
                        eventName
                      }
                      className={`mat-participant-chip ${
                        medal
                          ? stage.toLowerCase()
                          : ''
                      } ${
                        activeEventGroup?.events.includes(
                          eventName
                        )
                          ? 'match'
                          : ''
                      }`}
                      title={
                        stage
                          ? `${eventName}: ${stage}`
                          : eventName
                      }
                    >
                      {medal && (
                        <Medal
                          size={12}
                        />
                      )}

                      {getEventShortName(
                        eventName
                      )}
                    </span>
                  )
                }
              )
            )}

            {entry.self_registered && (
              <span
                className="mat-participant-chip self"
                title="The athlete marked themselves as registered from the app"
              >
                <UserCheck
                  size={12}
                />

                Self-registered
              </span>
            )}

            {entry.notes && (
              <span
                className="mat-participant-chip note"
                title={
                  entry.notes
                }
              >
                <StickyNote
                  size={12}
                />

                Note
              </span>
            )}
          </span>

          <span className="mat-participant-edit">
            {expanded
              ? 'Close'
              : 'Edit'}

            {expanded ? (
              <ChevronUp
                size={16}
              />
            ) : (
              <ChevronDown
                size={16}
              />
            )}
          </span>

        </button>

        {expanded && (
          <div
            className={`mat-participant-editor ${
              historical
                ? 'historical'
                : ''
            }`}
          >

            <div className="mat-participant-editor-heading">
              <strong>
                {historical
                  ? 'Events & Results'
                  : 'Events'}
              </strong>

              <span>
                {historical
                  ? 'Tick the events this athlete competed in, then record each result below it.'
                  : 'Tick each event this athlete is entered in. Changes save automatically.'}
              </span>
            </div>

            {renderEventChoices(
              entry,
              historical
            )}

            <div className="mat-participant-note">
              <label
                htmlFor={`mat-entry-note-${entry.id}`}
              >
                Entry Note

                <span>
                  Visible to the athlete on their Tournaments page. Saves when you click away.
                </span>
              </label>

              <textarea
                id={`mat-entry-note-${entry.id}`}
                className="mat-input"
                rows={2}
                placeholder="e.g. Ring 4, report by 9:00 AM. Bring both doboks."
                value={
                  noteValue
                }
                onChange={(event) =>
                  setNoteDrafts(
                    (current) => ({
                      ...current,
                      [entry.id]:
                        event.target.value,
                    })
                  )
                }
                onBlur={() =>
                  saveEntryNote(
                    entry
                  )
                }
              />

              {savingNoteId ===
                entry.id && (
                <small>
                  Saving note...
                </small>
              )}
            </div>

            <div className="mat-participant-editor-footer">
              <button
                type="button"
                className="mat-tournament-remove"
                onClick={() =>
                  removeAthlete(
                    entry.id
                  )
                }
              >
                Remove from Tournament
              </button>

              <button
                type="button"
                className="mat-primary-button"
                onClick={() =>
                  toggleAthleteExpanded(
                    entry.id
                  )
                }
              >
                Done
              </button>
            </div>

          </div>
        )}

      </li>
    )
  }

  function renderAddAthleteSection(
    historical = false
  ) {
    return (
      <div className="mat-tournament-section">

        <div className="mat-tournament-section-heading">

          <div>
            <h3>
              {historical
                ? 'Add Historical Competitor'
                : 'Add Athlete'}
            </h3>

            <p>
              {historical
                ? 'Add any roster member who competed at this tournament. Inactive athletes are included for historical records.'
                : 'Active athletes not currently registered for this tournament.'}
            </p>
          </div>

          <UserPlus
            size={25}
          />

        </div>

        {availableMembers.length === 0 ? (
          <div className="mat-tournament-all-added">
            {historical
              ? 'Every roster member has already been added to this tournament.'
              : 'All active athletes are already registered.'}
          </div>
        ) : (
          <div className="mat-competitor-picker">
            <div className="mat-competitor-search-row">
              <div className="mat-competitor-search">
                <Search size={20} aria-hidden="true" />

                <input
                  type="search"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search by athlete name or belt rank..."
                  aria-label="Search roster members"
                />

                {memberSearch && (
                  <button
                    type="button"
                    className="mat-competitor-search-clear"
                    aria-label="Clear member search"
                    onClick={() => setMemberSearch('')}
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <div className="mat-competitor-search-count">
                {filteredAvailableMembers.length} shown
              </div>
            </div>

            <div className="mat-competitor-filter-row">
              <span>
                {activeAvailableCount} active athlete{activeAvailableCount === 1 ? '' : 's'} available
              </span>

              <label className="mat-competitor-inactive-toggle">
                <input
                  type="checkbox"
                  checked={showInactiveMembers}
                  onChange={(event) => setShowInactiveMembers(event.target.checked)}
                />

                <span className="mat-competitor-toggle-track" aria-hidden="true">
                  <span className="mat-competitor-toggle-thumb" />
                </span>

                <span>
                  Show inactive athletes
                  {inactiveAvailableCount > 0 ? ` (${inactiveAvailableCount})` : ''}
                </span>
              </label>
            </div>

            {filteredAvailableMembers.length === 0 ? (
              <div className="mat-competitor-empty">
                No available roster members match “{memberSearch}”.
              </div>
            ) : (
              <div className="mat-competitor-results">
                {filteredAvailableMembers.map((member) => {
                  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim()
                  const isAdding = addingMemberId === member.id

                  return (
                    <div className="mat-competitor-result" key={member.id}>

                      <div className="mat-tournament-add-avatar" aria-hidden="true">
                        {member.first_name?.charAt(0).toUpperCase()}
                        {member.last_name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="mat-competitor-result-copy">
                        <strong>
                          {fullName}
                        </strong>

                        <span>
                          {member.belt_rank || 'No belt set'}
                          {!member.is_active ? ' • Inactive' : ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="mat-competitor-add-button"
                        disabled={Boolean(addingMemberId)}
                        onClick={() => addAthlete(member)}
                      >
                        <Plus size={17} />

                        <span>
                          {isAdding
                            ? 'Adding...'
                            : historical
                              ? 'Add to History'
                              : 'Add Competitor'}
                        </span>
                      </button>

                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    )
  }

  const selectedStats =
    selectedTournament
      ? getTournamentStats(
          selectedTournament
        )
      : null

  const selectedMedals =
    selectedTournament
      ? getMedalCounts(
          selectedTournament.id
        )
      : {
          gold: 0,
          silver: 0,
          bronze: 0,
        }

  return (
    <div className="mat-page">

      <div className="mat-tournament-page-header">

        <div>
          <div className="mat-eyebrow">
            Admin Tournament Management
          </div>

          <h1 className="mat-section-title">
            Tournaments
          </h1>

          <p className="mat-section-description">
            Manage registrations,
            competition results,
            and tournament history.
          </p>
        </div>

        <button
          type="button"
          className="mat-primary-button"
          onClick={
            openNewTournament
          }
        >
          <Plus size={20} />
          New Tournament
        </button>

      </div>

      <div className="mat-tournament-tabs">

        <button
          type="button"
          className={
            viewMode ===
            'upcoming'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleViewChange(
              'upcoming'
            )
          }
        >
          <Trophy
            size={18}
          />

          Upcoming

          <span>
            {
              upcomingTournaments.length
            }
          </span>
        </button>

        <button
          type="button"
          className={
            viewMode ===
            'archive'
              ? 'active'
              : ''
          }
          onClick={() =>
            handleViewChange(
              'archive'
            )
          }
        >
          <Archive
            size={18}
          />

          Archive

          <span>
            {
              archivedTournaments.length
            }
          </span>
        </button>

      </div>

      {viewMode === 'archive' && (
        <div className="mat-archive-view-toolbar" aria-label="Archive view options">
          <span>
            View
          </span>

          <div className="mat-archive-view-toggle">

            <button
              type="button"
              className={archiveLayout === 'cards' ? 'active' : ''}
              aria-pressed={archiveLayout === 'cards'}
              onClick={() => setArchiveLayout('cards')}
            >
              <Grid2X2 size={17} />
              Cards
            </button>

            <button
              type="button"
              className={archiveLayout === 'list' ? 'active' : ''}
              aria-pressed={archiveLayout === 'list'}
              onClick={() => setArchiveLayout('list')}
            >
              <List size={18} />
              List
            </button>

          </div>
        </div>
      )}

      {visibleTournaments.length ===
      0 ? (
        <div className="mat-tournament-empty">

          <div className="mat-tournament-empty-icon">

            {viewMode ===
            'archive' ? (
              <Archive
                size={34}
              />
            ) : (
              <Trophy
                size={34}
              />
            )}

          </div>

          <h2>
            {viewMode ===
            'archive'
              ? 'No tournament history yet'
              : 'No upcoming tournaments'}
          </h2>

          <p>
            {viewMode ===
            'archive'
              ? 'Completed tournaments will automatically appear here.'
              : 'Create your next tournament to begin registering athletes.'}
          </p>

        </div>
      ) : (
        <>
          {viewMode === 'archive' && archiveLayout === 'list' && (
            <div className="mat-archive-list-wrap">
              <table className="mat-archive-list">
                <thead>
                  <tr>
                    <th>Tournament Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th className="numeric">Athletes</th>
                    <th className="numeric">Medals</th>
                    <th className="numeric medal-column">Gold</th>
                    <th className="numeric medal-column">Silver</th>
                    <th className="numeric medal-column">Bronze</th>
                    <th className="action-column">
                      <span className="sr-only">
                        Action
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleTournaments.map((tournament) => {
                    const stats = getTournamentStats(tournament)
                    const medals = getMedalCounts(tournament.id)
                    const totalMedals = medals.gold + medals.silver + medals.bronze
                    const selected = tournament.id === selectedTournamentId

                    return (
                      <tr
                        key={tournament.id}
                        className={selected ? 'selected' : ''}
                        tabIndex={0}
                        aria-selected={selected}
                        onClick={() => setSelectedTournamentId(tournament.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedTournamentId(tournament.id)
                          }
                        }}
                      >
                        <td>
                          <strong>
                            {tournament.name}
                          </strong>
                        </td>

                        <td>
                          {formatTournamentDate(tournament)}
                        </td>

                        <td>
                          {tournament.location || 'Location TBD'}
                        </td>

                        <td className="numeric">
                          {stats.totalAthletes}
                        </td>

                        <td className="numeric total-medals">
                          {totalMedals}
                        </td>

                        <td className="numeric medal-column gold">
                          {medals.gold}
                        </td>

                        <td className="numeric medal-column silver">
                          {medals.silver}
                        </td>

                        <td className="numeric medal-column bronze">
                          {medals.bronze}
                        </td>

                        <td className="action-column">
                          <button
                            type="button"
                            className="mat-archive-open-button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedTournamentId(tournament.id)
                            }}
                          >
                            Open
                            <ChevronRight size={17} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div
            className={`mat-tournament-grid ${
              viewMode === 'archive' && archiveLayout === 'list'
                ? 'mat-archive-grid-hidden'
                : ''
            }`}
          >

            {visibleTournaments.map(
              (tournament) => {
                const stats =
                  getTournamentStats(
                    tournament
                  )

                const status =
                  getTournamentStatus(
                    tournament
                  )

                const medals =
                  getMedalCounts(
                    tournament.id
                  )

                const totalMedals =
                  medals.gold +
                  medals.silver +
                  medals.bronze

                const isSelected =
                  tournament.id ===
                  selectedTournamentId

                return (
                  <button
                    type="button"
                    key={
                      tournament.id
                    }
                    className={`mat-tournament-tile ${
                      isSelected
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedTournamentId(
                        tournament.id
                      )
                    }
                  >

                    <div className="mat-tournament-tile-top">

                      <div className="mat-tournament-icon">
                        {viewMode ===
                        'archive' ? (
                          <Medal
                            size={23}
                          />
                        ) : (
                          <Trophy
                            size={23}
                          />
                        )}
                      </div>

                      <span
                        className={
                          status.className
                        }
                      >
                        {
                          status.label
                        }
                      </span>

                    </div>

                    <h2 className="mat-tournament-name">
                      {
                        tournament.name
                      }
                    </h2>

                    <div className="mat-tournament-meta">

                      <div>
                        <CalendarDays
                          size={16}
                        />

                        <span>
                          {formatTournamentDate(
                            tournament
                          )}
                        </span>
                      </div>

                      <div>
                        <MapPin
                          size={16}
                        />

                        <span>
                          {tournament.location ||
                            'Location not set'}
                        </span>
                      </div>

                    </div>

                    <div className="mat-tournament-tile-divider" />

                    {viewMode ===
                    'archive' ? (
                      <div className="mat-tournament-tile-stats">

                        <div>
                          <strong>
                            {
                              stats.totalAthletes
                            }
                          </strong>

                          <span>
                            Athletes
                          </span>
                        </div>

                        <div>
                          <strong>
                            {
                              totalMedals
                            }
                          </strong>

                          <span>
                            Medals
                          </span>
                        </div>

                      </div>
                    ) : (
                      <div className="mat-tournament-tile-stats">

                        <div>
                          <strong>
                            {
                              stats.totalAthletes
                            }
                          </strong>

                          <span>
                            Athletes
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatFee(
                              tournament.entry_fee
                            )}
                          </strong>

                          <span>
                            Entry Fee
                          </span>
                        </div>

                      </div>
                    )}

                    <div className="mat-tournament-view">

                      <span>
                        {viewMode ===
                        'archive'
                          ? 'Edit History'
                          : 'View Tournament'}
                      </span>

                      <ChevronRight
                        size={18}
                      />

                    </div>

                  </button>
                )
              }
            )}

          </div>
        </>
      )}

      {selectedTournament &&
        selectedStats && (
          <section
            className="mat-tournament-detail"
            ref={tournamentDetailRef}
          >

            <div className="mat-tournament-detail-hero">

              <div>

                <button
                  type="button"
                  className="mat-tournament-close-detail"
                  onClick={() =>
                    setSelectedTournamentId(
                      ''
                    )
                  }
                >
                  <X size={16} />
                  Close Details
                </button>

                <div className="mat-tournament-detail-title-row">

                  <div className="mat-tournament-detail-icon">

                    {isSelectedArchived ? (
                      <Medal
                        size={27}
                      />
                    ) : (
                      <Trophy
                        size={27}
                      />
                    )}

                  </div>

                  <div>

                    <div className="mat-tournament-detail-label">
                      {isSelectedArchived
                        ? 'Historical Tournament Record'
                        : 'Tournament Administration'}
                    </div>

                    <h2>
                      {
                        selectedTournament.name
                      }
                    </h2>

                  </div>

                </div>

                <div className="mat-tournament-detail-meta">

                  <div>
                    <CalendarDays
                      size={17}
                    />

                    <span>
                      {formatTournamentDate(
                        selectedTournament
                      )}
                    </span>
                  </div>

                  <div>
                    <MapPin
                      size={17}
                    />

                    <span>
                      {selectedTournament.location ||
                        'Location not set'}
                    </span>
                  </div>

                  {!isSelectedArchived && (
                    <div>
                      <Clock3
                        size={17}
                      />

                      <span>
                        Registration Deadline:{' '}
                        {formatDate(
                          selectedTournament.registration_deadline
                        )}
                      </span>
                    </div>
                  )}

                  {selectedTournament.registration_url && (
                    <div>
                      <Link2
                        size={17}
                      />

                      <a
                        className="mat-tournament-registration-url"
                        href={
                          selectedTournament.registration_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Registration Page
                      </a>
                    </div>
                  )}

                </div>

              </div>

              <div>

                <button
                  type="button"
                  className="mat-primary-button"
                  onClick={
                    openEditTournament
                  }
                >
                  <Pencil
                    size={16}
                  />

                  Edit Tournament
                </button>

              </div>

            </div>

            {isSelectedArchived ? (
              <div className="mat-archive-summary">

                <div>
                  <Users
                    size={21}
                  />

                  <div className="mat-historical-stat-value">
                    {
                      selectedStats.totalAthletes
                    }
                  </div>

                  <span className="mat-historical-stat-label">
                    Athletes
                  </span>
                </div>

                <div className="gold">
                  <Medal
                    size={21}
                  />

                  <div className="mat-historical-stat-value">
                    {
                      selectedMedals.gold
                    }
                  </div>

                  <span className="mat-historical-stat-label">
                    Gold
                  </span>
                </div>

                <div className="silver">
                  <Medal
                    size={21}
                  />

                  <div className="mat-historical-stat-value">
                    {
                      selectedMedals.silver
                    }
                  </div>

                  <span className="mat-historical-stat-label">
                    Silver
                  </span>
                </div>

                <div className="bronze">
                  <Medal
                    size={21}
                  />

                  <div className="mat-historical-stat-value">
                    {
                      selectedMedals.bronze
                    }
                  </div>

                  <span className="mat-historical-stat-label">
                    Bronze
                  </span>
                </div>

              </div>
            ) : (
              <div className="mat-tournament-detail-stats">

                <div className="mat-tournament-detail-stat">

                  <div className="mat-tournament-small-icon athletes">
                    <Users
                      size={20}
                    />
                  </div>

                  <div>
                    <div className="mat-historical-stat-value">
                      {
                        selectedStats.totalAthletes
                      }
                    </div>

                    <span className="mat-historical-stat-label">
                      Registered Athletes
                    </span>
                  </div>

                </div>

                <div className="mat-tournament-detail-stat">

                  <div className="mat-tournament-small-icon outstanding">
                    <CircleDollarSign
                      size={20}
                    />
                  </div>

                  <div>
                    <div className="mat-historical-stat-value">
                      {formatFee(
                        selectedTournament.entry_fee
                      )}
                    </div>

                    <span className="mat-historical-stat-label">
                      Entry Fee (per athlete)
                    </span>
                  </div>

                </div>

                <div className="mat-tournament-detail-stat">

                  <div className="mat-tournament-small-icon paid">
                    <Ticket
                      size={20}
                    />
                  </div>

                  <div>
                    <div className="mat-historical-stat-value">
                      {formatFee(
                        selectedTournament.spectator_fee
                      )}
                    </div>

                    <span className="mat-historical-stat-label">
                      Spectator Fee
                    </span>
                  </div>

                </div>

              </div>
            )}

            {!isSelectedArchived && (
              <div className="mat-tournament-fee-note">
                <CircleDollarSign
                  size={16}
                />

                <span>
                  {selectedTournament.fee_notes ||
                    'Fees are paid directly to the tournament organizer during registration. MAT does not collect them.'}
                </span>
              </div>
            )}

            {message && (
              <div className="mat-tournament-message">
                {message}
              </div>
            )}

            <div className="mat-tournament-section">

              <div className="mat-tournament-section-heading">

                <div>
                  <h3>
                    {isSelectedArchived
                      ? 'Historical Competitors'
                      : 'Participants'}
                  </h3>

                  <p>
                    {isSelectedArchived
                      ? 'Tap a participant to edit their events and results.'
                      : 'Tap a participant to edit their events and entry note.'}
                  </p>
                </div>

                <span className="mat-tournament-count">
                  {
                    selectedEntries.length
                  }
                </span>

              </div>

              {selectedEntries.length ===
              0 ? (
                <div className="mat-tournament-no-athletes">

                  <Users
                    size={30}
                  />

                  <div className="mat-historical-stat-value">
                    No athletes added yet
                  </div>

                </div>
              ) : (
                <>
                  <div className="mat-participant-toolbar">

                    <div
                      className="mat-participant-filters"
                      role="group"
                      aria-label="Filter participants by event"
                    >
                      {participantFilterOptions.map(
                        (option) => (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            className={`mat-participant-filter ${
                              participantEventFilter ===
                              option.value
                                ? 'active'
                                : ''
                            } ${
                              option.count === 0
                                ? 'empty'
                                : ''
                            } ${
                              option.value === 'none'
                                ? 'warning'
                                : ''
                            }`}
                            aria-pressed={
                              participantEventFilter ===
                              option.value
                            }
                            onClick={() =>
                              setParticipantEventFilter(
                                option.value
                              )
                            }
                          >
                            {
                              option.label
                            }

                            <span>
                              {
                                option.count
                              }
                            </span>
                          </button>
                        )
                      )}
                    </div>

                    {sortedSelectedEntries.length >
                      6 && (
                      <div className="mat-participant-search">
                        <Search
                          size={16}
                        />

                        <input
                          type="search"
                          placeholder="Find a participant"
                          aria-label="Find a participant"
                          value={
                            participantSearch
                          }
                          onChange={(event) =>
                            setParticipantSearch(
                              event.target.value
                            )
                          }
                        />
                      </div>
                    )}

                  </div>

                  {participantEventFilter !==
                    'all' && (
                    <div className="mat-participant-filter-summary">
                      <span>
                        Showing{' '}
                        <strong>
                          {
                            visibleParticipants.length
                          }
                        </strong>{' '}
                        of{' '}
                        {
                          sortedSelectedEntries.length
                        }{' '}
                        {participantEventFilter ===
                        'none'
                          ? 'participants with no events yet'
                          : `participants entered in ${participantEventFilter}`}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setParticipantEventFilter(
                            'all'
                          )
                        }
                      >
                        Clear filter
                      </button>
                    </div>
                  )}

                  {visibleParticipants.length ===
                  0 ? (
                    <div className="mat-participant-no-match">
                      {participantSearch.trim()
                        ? 'No participants match that name.'
                        : participantEventFilter === 'none'
                          ? 'Every participant has at least one event.'
                          : `No participants are entered in ${participantEventFilter}.`}
                    </div>
                  ) : (
                    <ul className="mat-participant-list">
                      {visibleParticipants.map(
                        ({ entry, member }) =>
                          renderParticipantRow(
                            entry,
                            member,
                            isSelectedArchived
                          )
                      )}
                    </ul>
                  )}
                </>
              )}

            </div>

            {renderAddAthleteSection(
              isSelectedArchived
            )}

          </section>
        )}

      {showTournamentForm && (
        <TournamentForm
          editingTournament={
            editingTournament
          }
          onClose={() => {
            setShowTournamentForm(
              false
            )

            setEditingTournament(
              null
            )
          }}
          onSaved={
            handleTournamentSaved
          }
        />
      )}

    </div>
  )
}

export default TournamentsPage