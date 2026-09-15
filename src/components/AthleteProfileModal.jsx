import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Award,
  CalendarDays,
  Camera,
  CheckCircle2,
  Flag,
  Lock,
  MapPin,
  Medal,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase.js'

import {
  getCompetitionAge,
  getCurrentAge,
} from '../lib/age.js'

const PROFILE_BUCKET =
  'athlete-profile-images'

const PROGRESS_CHECKPOINTS = [
  1,
  5,
  10,
  25,
  50,
  100,
]

const RESULT_RANK = {
  Gold: 1,
  '1st Place': 1,

  Silver: 2,
  '2nd Place': 2,

  Bronze: 3,
  '3rd Place': 3,

  Quarterfinals: 4,
  'Round of 16': 5,
  'Round of 32': 6,
  'Round of 64': 7,
  'Round of 128': 8,
}

const TOURNAMENT_TITLES = {
  1: 'Competition Begins',
  5: 'Rising Competitor',
  10: 'Veteran Competitor',
  25: 'Seasoned Competitor',
  50: 'Elite Experience',
  100: 'Century Competitor',
}

const MEDAL_TITLES = {
  1: 'First Podium',
  5: 'Medal Collector',
  10: 'Double Digits',
  25: 'Podium Regular',
  50: 'Medal Machine',
  100: 'Century of Medals',
}

const GOLD_TITLES = {
  1: 'First Champion',
  5: 'Golden Five',
  10: 'Ten-Time Champion',
  25: 'Championship Standard',
  50: 'Golden Legacy',
  100: 'Century of Gold',
}

function AthleteProfileModal({
  member,
  tournaments,
  allTournamentEntries,
  tournamentResults,
  onMembersChanged,
  onClose,
}) {
  const fileInputRef =
    useRef(null)

  const [
    activeProfileTab,
    setActiveProfileTab,
  ] = useState('overview')

  const [
    imagePath,
    setImagePath,
  ] = useState(
    member.profile_image_path || null
  )

  const [
    imageStatus,
    setImageStatus,
  ] = useState(
    member.profile_image_status || 'none'
  )

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false)

  const [
    privateDetails,
    setPrivateDetails,
  ] = useState(null)

  const [
    privateDetailsLoading,
    setPrivateDetailsLoading,
  ] = useState(false)

  const [
    imageUrl,
    setImageUrl,
  ] = useState('')

  const [
    imageLoading,
    setImageLoading,
  ] = useState(false)

  const [
    imageMessage,
    setImageMessage,
  ] = useState('')

  useEffect(() => {
    setImagePath(
      member.profile_image_path || null
    )

    setImageStatus(
      member.profile_image_status || 'none'
    )
  }, [
    member.id,
    member.profile_image_path,
    member.profile_image_status,
  ])

  useEffect(() => {
    let isMounted =
      true

    async function loadAdminStatus() {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          'is_admin'
        )

      if (!isMounted) {
        return
      }

      if (error) {
        setIsAdmin(false)
        setPrivateDetails(null)
        return
      }

      const admin =
        Boolean(data)

      setIsAdmin(
        admin
      )

      if (!admin) {
        setPrivateDetails(null)
        return
      }

      setPrivateDetailsLoading(
        true
      )

      const {
        data:
          privateData,
        error:
          privateError,
      } =
        await supabase.rpc(
          'get_member_private_details_admin',
          {
            requested_member_id:
              member.id,
          }
        )

      if (!isMounted) {
        return
      }

      setPrivateDetailsLoading(
        false
      )

      if (privateError) {
        console.error(
          'Could not load member private details:',
          privateError.message
        )

        setPrivateDetails(
          null
        )

        return
      }

      setPrivateDetails(
        privateData?.[0] ||
        null
      )
    }

    loadAdminStatus()

    return () => {
      isMounted =
        false
    }
  }, [
    member.id,
  ])

  useEffect(() => {
    setActiveProfileTab(
      'overview'
    )
  }, [
    member.id,
  ])

  useEffect(() => {
    const canDisplayPhoto =
      imagePath &&
      (
        imageStatus ===
          'approved' ||
        isAdmin
      )

    if (!canDisplayPhoto) {
      setImageUrl('')
      return
    }

    loadProfileImage(
      imagePath
    )
  }, [
    imagePath,
    imageStatus,
    isAdmin,
  ])

  async function loadProfileImage(
    path
  ) {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          PROFILE_BUCKET
        )
        .createSignedUrl(
          path,
          60 * 60
        )

    if (error) {
      setImageUrl('')
      return
    }

    setImageUrl(
      data?.signedUrl || ''
    )
  }

  async function handlePhotoSelected(
    event
  ) {
    const file =
      event.target.files?.[0]

    event.target.value =
      ''

    if (!file) {
      return
    }

    setImageMessage('')

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setImageMessage(
        'Please choose a JPG, PNG, or WebP image.'
      )

      return
    }

    const maxSize =
      5 * 1024 * 1024

    if (
      file.size >
      maxSize
    ) {
      setImageMessage(
        'Profile photos must be 5 MB or smaller.'
      )

      return
    }

    setImageLoading(
      true
    )

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg'

    const newPath =
      `${member.id}/profile-${Date.now()}.${extension}`

    const oldPath =
      imagePath

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          PROFILE_BUCKET
        )
        .upload(
          newPath,
          file,
          {
            contentType:
              file.type,

            upsert: false,
          }
        )

    if (uploadError) {
      setImageMessage(
        uploadError.message
      )

      setImageLoading(
        false
      )

      return
    }

    const {
      error: memberError,
    } =
      await supabase.rpc(
        'set_member_profile_image',
        {
          requested_member_id:
            member.id,

          new_image_path:
            newPath,
        }
      )

    if (memberError) {
      await supabase.storage
        .from(
          PROFILE_BUCKET
        )
        .remove([
          newPath,
        ])

      setImageMessage(
        memberError.message
      )

      setImageLoading(
        false
      )

      return
    }

    if (
      oldPath &&
      oldPath !==
        newPath
    ) {
      await supabase.storage
        .from(
          PROFILE_BUCKET
        )
        .remove([
          oldPath,
        ])
    }

    const nextStatus =
      isAdmin
        ? 'approved'
        : 'pending'

    setImagePath(
      newPath
    )

    setImageStatus(
      nextStatus
    )

    if (
      nextStatus ===
      'approved'
    ) {
      await loadProfileImage(
        newPath
      )
    } else {
      setImageUrl('')
    }

    if (
      onMembersChanged
    ) {
      await onMembersChanged()
    }

    setImageMessage(
      nextStatus ===
        'approved'
        ? 'Profile photo updated.'
        : 'Profile photo submitted for approval.'
    )

    setImageLoading(
      false
    )
  }

  async function approvePhoto() {
    if (!imagePath) {
      return
    }

    setImageLoading(
      true
    )

    setImageMessage('')

    const {
      error,
    } =
      await supabase.rpc(
        'approve_member_profile_image',
        {
          requested_member_id:
            member.id,
        }
      )

    if (error) {
      setImageMessage(
        error.message
      )

      setImageLoading(
        false
      )

      return
    }

    setImageStatus(
      'approved'
    )

    await loadProfileImage(
      imagePath
    )

    if (
      onMembersChanged
    ) {
      await onMembersChanged()
    }

    setImageMessage(
      'Profile photo approved.'
    )

    setImageLoading(
      false
    )
  }

  async function rejectPhoto() {
    if (!imagePath) {
      return
    }

    const confirmed =
      window.confirm(
        `Reject the profile photo for ${member.first_name} ${member.last_name}?`
      )

    if (!confirmed) {
      return
    }

    setImageLoading(
      true
    )

    setImageMessage('')

    const {
      error,
    } =
      await supabase.rpc(
        'reject_member_profile_image',
        {
          requested_member_id:
            member.id,
        }
      )

    if (error) {
      setImageMessage(
        error.message
      )

      setImageLoading(
        false
      )

      return
    }

    setImageStatus(
      'rejected'
    )

    if (
      onMembersChanged
    ) {
      await onMembersChanged()
    }

    setImageMessage(
      'Profile photo rejected.'
    )

    setImageLoading(
      false
    )
  }

  async function removePhoto() {
    if (!imagePath) {
      return
    }

    const confirmed =
      window.confirm(
        `Remove the profile photo for ${member.first_name} ${member.last_name}?`
      )

    if (!confirmed) {
      return
    }

    setImageLoading(
      true
    )

    setImageMessage('')

    const {
      data: clearedPath,
      error: memberError,
    } =
      await supabase.rpc(
        'clear_member_profile_image',
        {
          requested_member_id:
            member.id,
        }
      )

    if (memberError) {
      setImageMessage(
        memberError.message
      )

      setImageLoading(
        false
      )

      return
    }

    const pathToRemove =
      clearedPath ||
      imagePath

    if (pathToRemove) {
      const {
        error: removeError,
      } =
        await supabase.storage
          .from(
            PROFILE_BUCKET
          )
          .remove([
            pathToRemove,
          ])

      if (removeError) {
        setImageMessage(
          `Profile photo cleared, but storage cleanup failed: ${removeError.message}`
        )

        setImagePath(null)
        setImageStatus('none')
        setImageUrl('')

        if (
          onMembersChanged
        ) {
          await onMembersChanged()
        }

        setImageLoading(
          false
        )

        return
      }
    }

    setImagePath(null)
    setImageStatus('none')
    setImageUrl('')

    if (
      onMembersChanged
    ) {
      await onMembersChanged()
    }

    setImageMessage(
      'Profile photo removed.'
    )

    setImageLoading(
      false
    )
  }

  function getResultStage(
    result
  ) {
    if (!result) {
      return ''
    }

    if (
      result.result_stage
    ) {
      return result.result_stage
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

    if (
      Number(
        result.placement
      ) === 1
    ) {
      return '1st Place'
    }

    if (
      Number(
        result.placement
      ) === 2
    ) {
      return '2nd Place'
    }

    if (
      Number(
        result.placement
      ) === 3
    ) {
      return '3rd Place'
    }

    if (
      result.placement
    ) {
      return `${result.placement}th Place`
    }

    return ''
  }

  function getMedalType(
    result
  ) {
    const stage =
      getResultStage(
        result
      )

    if (
      stage === 'Gold' ||
      stage === '1st Place'
    ) {
      return 'Gold'
    }

    if (
      stage === 'Silver' ||
      stage === '2nd Place'
    ) {
      return 'Silver'
    }

    if (
      stage === 'Bronze' ||
      stage === '3rd Place'
    ) {
      return 'Bronze'
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

  function getDisciplineFromEvent(
    eventName
  ) {
    const normalized =
      String(
        eventName || ''
      )
        .trim()
        .toLowerCase()

    if (
      normalized.includes(
        'sparring'
      )
    ) {
      return 'sparring'
    }

    if (
      normalized.includes(
        'poomsae'
      )
    ) {
      return 'poomsae'
    }

    if (
      normalized.includes(
        'breaking'
      )
    ) {
      return 'breaking'
    }

    return 'other'
  }

  function getBestResult(
    results
  ) {
    const valid =
      (
        results || []
      )
        .map(
          (result) => ({
            result,

            stage:
              getResultStage(
                result
              ),
          })
        )
        .filter(
          ({
            stage,
          }) =>
            stage &&
            RESULT_RANK[
              stage
            ]
        )
        .sort(
          (
            a,
            b
          ) =>
            RESULT_RANK[
              a.stage
            ] -
            RESULT_RANK[
              b.stage
            ]
        )

    return (
      valid[0] ||
      null
    )
  }

  function getBestFinishLabel(
    results
  ) {
    const best =
      getBestResult(
        results
      )

    if (!best) {
      return '—'
    }

    const medal =
      getMedalType(
        best.result
      )

    return (
      medal ||
      best.stage
    )
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
        month:
          'short',

        day:
          'numeric',

        year:
          'numeric',
      }
    )
  }

  const athleteEntries =
    useMemo(() => {
      return (
        allTournamentEntries ||
        []
      )
        .filter(
          (entry) =>
            entry.member_id ===
            member.id
        )
        .map(
          (entry) => {
            const tournament =
              (
                tournaments ||
                []
              ).find(
                (item) =>
                  item.id ===
                  entry.tournament_id
              )

            const results =
              (
                tournamentResults ||
                []
              ).filter(
                (result) =>
                  result.tournament_entry_id ===
                  entry.id
              )

            return {
              ...entry,
              tournament,
              results,
            }
          }
        )
        .filter(
          (entry) =>
            entry.tournament
        )
        .sort(
          (
            a,
            b
          ) => {
            const dateA =
              a.tournament
                ?.event_date ||
              ''

            const dateB =
              b.tournament
                ?.event_date ||
              ''

            return dateB.localeCompare(
              dateA
            )
          }
        )
    }, [
      member.id,
      tournaments,
      allTournamentEntries,
      tournamentResults,
    ])

  const chronologicalEntries =
    useMemo(
      () =>
        [
          ...athleteEntries,
        ].sort(
          (
            a,
            b
          ) => {
            const dateA =
              a.tournament
                ?.event_date ||
              ''

            const dateB =
              b.tournament
                ?.event_date ||
              ''

            return dateA.localeCompare(
              dateB
            )
          }
        ),
      [
        athleteEntries,
      ]
    )

  const resultRecords =
    useMemo(() => {
      const records =
        []

      chronologicalEntries.forEach(
        (entry) => {
          ;(
            entry.results ||
            []
          ).forEach(
            (result) => {
              records.push({
                entry,
                result,
              })
            }
          )
        }
      )

      return records
    }, [
      chronologicalEntries,
    ])

  const recordedResultRecords =
    useMemo(
      () =>
        resultRecords.filter(
          ({
            result,
          }) =>
            Boolean(
              getResultStage(
                result
              )
            )
        ),
      [
        resultRecords,
      ]
    )

  const medalRecords =
    useMemo(
      () =>
        resultRecords.filter(
          ({
            result,
          }) =>
            Boolean(
              getMedalType(
                result
              )
            )
        ),
      [
        resultRecords,
      ]
    )

  const goldRecords =
    useMemo(
      () =>
        resultRecords.filter(
          ({
            result,
          }) =>
            getMedalType(
              result
            ) ===
            'Gold'
        ),
      [
        resultRecords,
      ]
    )

  const allEnteredEvents =
    useMemo(() => {
      const records =
        []

      chronologicalEntries.forEach(
        (entry) => {
          ;(
            entry.events ||
            []
          ).forEach(
            (eventName) => {
              records.push({
                entry,

                eventName,

                discipline:
                  getDisciplineFromEvent(
                    eventName
                  ),
              })
            }
          )
        }
      )

      return records
    }, [
      chronologicalEntries,
    ])

  const totalEventsEntered =
    allEnteredEvents.length

  const goldCount =
    medalRecords.filter(
      ({
        result,
      }) =>
        getMedalType(
          result
        ) ===
        'Gold'
    ).length

  const silverCount =
    medalRecords.filter(
      ({
        result,
      }) =>
        getMedalType(
          result
        ) ===
        'Silver'
    ).length

  const bronzeCount =
    medalRecords.filter(
      ({
        result,
      }) =>
        getMedalType(
          result
        ) ===
        'Bronze'
    ).length

  const totalMedals =
    medalRecords.length

  const sparringEvents =
    allEnteredEvents.filter(
      (record) =>
        record.discipline ===
        'sparring'
    )

  const poomsaeEvents =
    allEnteredEvents.filter(
      (record) =>
        record.discipline ===
        'poomsae'
    )

  const breakingEvents =
    allEnteredEvents.filter(
      (record) =>
        record.discipline ===
        'breaking'
    )

  const sparringResults =
    recordedResultRecords.filter(
      ({
        result,
      }) =>
        getDisciplineFromEvent(
          result.event_name
        ) ===
        'sparring'
    )

  const poomsaeResults =
    recordedResultRecords.filter(
      ({
        result,
      }) =>
        getDisciplineFromEvent(
          result.event_name
        ) ===
        'poomsae'
    )

  const breakingResults =
    recordedResultRecords.filter(
      ({
        result,
      }) =>
        getDisciplineFromEvent(
          result.event_name
        ) ===
        'breaking'
    )

  const careerDisciplines = [
    {
      id:
        'sparring',

      label:
        'Sparring',

      icon:
        Target,

      events:
        sparringEvents.length,

      results:
        sparringResults.length,

      bestFinish:
        getBestFinishLabel(
          sparringResults.map(
            ({
              result,
            }) => result
          )
        ),
    },

    {
      id:
        'poomsae',

      label:
        'Poomsae',

      icon:
        CheckCircle2,

      events:
        poomsaeEvents.length,

      results:
        poomsaeResults.length,

      bestFinish:
        getBestFinishLabel(
          poomsaeResults.map(
            ({
              result,
            }) => result
          )
        ),
    },

    {
      id:
        'breaking',

      label:
        'Breaking',

      icon:
        Sparkles,

      events:
        breakingEvents.length,

      results:
        breakingResults.length,

      bestFinish:
        getBestFinishLabel(
          breakingResults.map(
            ({
              result,
            }) => result
          )
        ),
    },
  ]

  function getTimelineStatus(
    entry
  ) {
    const results =
      entry.results ||
      []

    const recordedResults =
      results.filter(
        (result) =>
          Boolean(
            getResultStage(
              result
            )
          )
      )

    if (
      recordedResults.length ===
      0
    ) {
      return {
        label:
          'Result not recorded',

        className:
          'pending',
      }
    }

    const gold =
      recordedResults.find(
        (result) =>
          getMedalType(
            result
          ) ===
          'Gold'
      )

    if (gold) {
      return {
        label:
          'Gold Medal',

        className:
          'gold',
      }
    }

    const silver =
      recordedResults.find(
        (result) =>
          getMedalType(
            result
          ) ===
          'Silver'
      )

    if (silver) {
      return {
        label:
          'Silver Medal',

        className:
          'silver',
      }
    }

    const bronze =
      recordedResults.find(
        (result) =>
          getMedalType(
            result
          ) ===
          'Bronze'
      )

    if (bronze) {
      return {
        label:
          'Bronze Medal',

        className:
          'bronze',
      }
    }

    return {
      label:
        'Results Recorded',

      className:
        'recorded',
    }
  }

  function getProgressInfo(
    count,
    records
  ) {
    const achieved =
      [
        ...PROGRESS_CHECKPOINTS,
      ]
        .reverse()
        .find(
          (checkpoint) =>
            count >=
            checkpoint
        ) ||
      0

    const next =
      PROGRESS_CHECKPOINTS.find(
        (checkpoint) =>
          checkpoint >
          count
      ) ||
      null

    const achievedRecord =
      achieved > 0
        ? records[
            achieved - 1
          ] ||
          null
        : null

    return {
      count,
      achieved,
      next,
      achievedRecord,
    }
  }

  const tournamentProgress =
    getProgressInfo(
      chronologicalEntries.length,
      chronologicalEntries
    )

  const medalProgress =
    getProgressInfo(
      medalRecords.length,
      medalRecords
    )

  const goldProgress =
    getProgressInfo(
      goldRecords.length,
      goldRecords
    )

  function getRecordEntry(
    record
  ) {
    if (!record) {
      return null
    }

    if (
      record.entry
    ) {
      return record.entry
    }

    return record
  }

  function getProgressPercentage(
    progress
  ) {
    if (
      !progress.next
    ) {
      return 100
    }

    return Math.min(
      100,
      Math.round(
        (
          progress.count /
          progress.next
        ) *
          100
      )
    )
  }

  const firstSparring =
    recordedResultRecords.find(
      ({
        result,
      }) =>
        getDisciplineFromEvent(
          result.event_name
        ) ===
        'sparring'
    ) ||
    null

  const firstPoomsae =
    recordedResultRecords.find(
      ({
        result,
      }) =>
        getDisciplineFromEvent(
          result.event_name
        ) ===
        'poomsae'
    ) ||
    null

  const firstBreaking =
    recordedResultRecords.find(
      ({
        result,
      }) =>
        getDisciplineFromEvent(
          result.event_name
        ) ===
        'breaking'
    ) ||
    null

  const progressiveMilestones = [
    {
      id:
        'tournaments',

      title:
        'Tournament Experience',

      noun:
        'Tournament',

      plural:
        'Tournaments',

      icon:
        Trophy,

      progress:
        tournamentProgress,

      description:
        'Keep building competition experience.',
    },

    {
      id:
        'medals',

      title:
        'Medal Collection',

      noun:
        'Medal',

      plural:
        'Medals',

      icon:
        Medal,

      progress:
        medalProgress,

      description:
        'Earn medals across all competition events.',
    },

    {
      id:
        'gold-medals',

      title:
        'Gold Medal Collection',

      noun:
        'Gold',

      plural:
        'Gold Medals',

      icon:
        Star,

      progress:
        goldProgress,

      description:
        'Keep adding championship finishes.',
    },
  ]

  const disciplineMilestones = [
    {
      id:
        'sparring',

      title:
        'First Sparring Result',

      description:
        'Record the first competitive sparring result.',

      icon:
        Target,

      record:
        firstSparring,
    },

    {
      id:
        'poomsae',

      title:
        'First Poomsae Result',

      description:
        'Record the first competitive poomsae result.',

      icon:
        CheckCircle2,

      record:
        firstPoomsae,
    },

    {
      id:
        'breaking',

      title:
        'First Breaking Result',

      description:
        'Record the first competitive breaking result.',

      icon:
        Sparkles,

      record:
        firstBreaking,
    },
  ]

  function buildProgressAchievements(
    type,
    label,
    records,
    titleMap,
    icon
  ) {
    return PROGRESS_CHECKPOINTS.map(
      (
        checkpoint
      ) => {
        const earned =
          records.length >=
          checkpoint

        const record =
          earned
            ? records[
                checkpoint -
                  1
              ] ||
              null
            : null

        const entry =
          getRecordEntry(
            record
          )

        return {
          id:
            `${type}-${checkpoint}`,

          type,

          checkpoint,

          label:
            checkpoint === 1
              ? `First ${label}`
              : `${checkpoint} ${label}s`,

          subtitle:
            titleMap[
              checkpoint
            ] ||
            'Achievement',

          earned,

          record,

          entry,

          icon,

          current:
            records.length,

          goal:
            checkpoint,
        }
      }
    )
  }

  const tournamentAchievements =
    buildProgressAchievements(
      'tournament',
      'Tournament',
      chronologicalEntries,
      TOURNAMENT_TITLES,
      Trophy
    )

  const medalAchievements =
    buildProgressAchievements(
      'medal',
      'Medal',
      medalRecords,
      MEDAL_TITLES,
      Medal
    )

  const goldAchievements =
    buildProgressAchievements(
      'gold',
      'Gold',
      goldRecords,
      GOLD_TITLES,
      Star
    )

  const disciplineAchievements = [
    {
      id:
        'discipline-sparring',

      type:
        'discipline',

      label:
        'First Sparring Result',

      subtitle:
        'Sparring Debut',

      icon:
        Target,

      earned:
        Boolean(
          firstSparring
        ),

      record:
        firstSparring,

      entry:
        firstSparring?.entry ||
        null,
    },

    {
      id:
        'discipline-poomsae',

      type:
        'discipline',

      label:
        'First Poomsae Result',

      subtitle:
        'Poomsae Debut',

      icon:
        CheckCircle2,

      earned:
        Boolean(
          firstPoomsae
        ),

      record:
        firstPoomsae,

      entry:
        firstPoomsae?.entry ||
        null,
    },

    {
      id:
        'discipline-breaking',

      type:
        'discipline',

      label:
        'First Breaking Result',

      subtitle:
        'Breaking Debut',

      icon:
        Sparkles,

      earned:
        Boolean(
          firstBreaking
        ),

      record:
        firstBreaking,

      entry:
        firstBreaking?.entry ||
        null,
    },
  ]

  const trophyCollections = [
    {
      id:
        'tournaments',

      title:
        'Tournament Journey',

      description:
        'Competition experience earned tournament by tournament.',

      icon:
        Trophy,

      achievements:
        tournamentAchievements,
    },

    {
      id:
        'medals',

      title:
        'Medal Collection',

      description:
        'Milestones reached through podium finishes.',

      icon:
        Medal,

      achievements:
        medalAchievements,
    },

    {
      id:
        'gold',

      title:
        'Gold Collection',

      description:
        'Championship milestones earned through first-place finishes.',

      icon:
        Star,

      achievements:
        goldAchievements,
    },

    {
      id:
        'disciplines',

      title:
        'Discipline Achievements',

      description:
        'First recorded results across MAT competition disciplines.',

      icon:
        Award,

      achievements:
        disciplineAchievements,
    },
  ]

  const allAchievements =
    trophyCollections.flatMap(
      (
        collection
      ) =>
        collection.achievements
    )

  const earnedAchievements =
    allAchievements.filter(
      (
        achievement
      ) =>
        achievement.earned
    )

  const trophyCompletion =
    allAchievements.length > 0
      ? Math.round(
          (
            earnedAchievements.length /
            allAchievements.length
          ) *
            100
        )
      : 0

  const latestAchievement =
    [
      ...earnedAchievements,
    ]
      .sort(
        (
          a,
          b
        ) => {
          const dateA =
            a.entry
              ?.tournament
              ?.event_date ||
            ''

          const dateB =
            b.entry
              ?.tournament
              ?.event_date ||
            ''

          return dateB.localeCompare(
            dateA
          )
        }
      )[0] ||
    null

  function getAchievementProgress(
    achievement
  ) {
    if (
      achievement.earned
    ) {
      return 100
    }

    if (
      !achievement.goal
    ) {
      return 0
    }

    return Math.min(
      100,
      Math.round(
        (
          achievement.current /
          achievement.goal
        ) *
          100
      )
    )
  }

  function renderAchievementCard(
    achievement
  ) {
    const Icon =
      achievement.icon

    const tournament =
      achievement.entry
        ?.tournament ||
      null

    const progress =
      getAchievementProgress(
        achievement
      )

    return (
      <article
        key={
          achievement.id
        }
        className={`mat-trophy-achievement ${
          achievement.earned
            ? 'earned'
            : 'locked'
        } ${achievement.type}`}
      >

        <div className="mat-trophy-achievement-medallion">

          {achievement.earned ? (
            <Icon
              size={27}
            />
          ) : (
            <Lock
              size={23}
            />
          )}

        </div>

        <div className="mat-trophy-achievement-copy">

          <span className="mat-trophy-achievement-kicker">
            {
              achievement.subtitle
            }
          </span>

          <h4>
            {
              achievement.label
            }
          </h4>

          {achievement.earned ? (
            <>

              <div className="mat-trophy-earned-label">

                <CheckCircle2
                  size={14}
                />

                Earned

              </div>

              {tournament && (
                <div className="mat-trophy-earned-detail">

                  <span>
                    {formatDate(
                      tournament.event_date
                    )}
                  </span>

                  <strong>
                    {
                      tournament.name
                    }
                  </strong>

                </div>
              )}

            </>
          ) : (
            <>

              {achievement.goal ? (
                <>
                  <div className="mat-trophy-locked-progress">

                    <span>
                      {
                        achievement.current
                      }
                      {' / '}
                      {
                        achievement.goal
                      }
                    </span>

                    <div className="mat-trophy-mini-meter">

                      <div
                        className="mat-trophy-mini-meter-fill"
                        style={{
                          width:
                            `${progress}%`,
                        }}
                      />

                    </div>

                  </div>
                </>
              ) : (
                <div className="mat-trophy-locked-label">
                  Locked
                </div>
              )}

            </>
          )}

        </div>

      </article>
    )
  }

  return (
    <div
      className="mat-modal-backdrop"
      onClick={
        onClose
      }
    >
      <div
        className="mat-profile-modal"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        <div className="mat-profile-header">

          <div className="mat-profile-identity">

            <div className="mat-profile-photo-wrap">

              {imageUrl ? (
                <img
                  src={
                    imageUrl
                  }
                  alt={`${member.first_name} ${member.last_name}`}
                  className="mat-profile-photo"
                />
              ) : (
                <div className="mat-profile-avatar">

                  <UserRound
                    size={30}
                  />

                </div>
              )}

            </div>

            <div>

              <div className="mat-eyebrow">
                Athlete Profile
              </div>

              <h2>
                {
                  member.first_name
                }{' '}
                {
                  member.last_name
                }
              </h2>

              <p>
                {member.is_active
                  ? 'Active Team Member'
                  : 'Inactive Team Member'}
              </p>

            </div>

          </div>

          <button
            type="button"
            className="mat-history-close"
            onClick={
              onClose
            }
            aria-label="Close"
          >
            <X
              size={20}
            />
          </button>

        </div>

        <div className="mat-profile-photo-controls">

          <div>

            <strong>
              Profile Photo
            </strong>

            <span>
              JPG, PNG, or WebP.
              Maximum 5 MB.
            </span>

            {imageStatus ===
              'pending' && (
              <span className="mat-muted">
                Pending admin approval
              </span>
            )}

            {imageStatus ===
              'approved' && (
              <span className="mat-muted">
                Approved
              </span>
            )}

            {imageStatus ===
              'rejected' && (
              <span className="mat-muted">
                Photo was not approved
              </span>
            )}

          </div>

          <div className="mat-profile-photo-actions">

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={
                handlePhotoSelected
              }
            />

            <button
              type="button"
              className="mat-primary-button mat-profile-photo-button"
              disabled={
                imageLoading
              }
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Camera
                size={16}
              />

              {imageLoading
                ? 'Working...'
                : imagePath
                  ? 'Change Photo'
                  : 'Upload Photo'}
            </button>

            {imagePath && (
              <button
                type="button"
                className="mat-profile-remove-photo"
                disabled={
                  imageLoading
                }
                onClick={
                  removePhoto
                }
              >
                <Trash2
                  size={15}
                />

                Remove
              </button>
            )}

          </div>

        </div>

        {isAdmin &&
          imagePath &&
          imageStatus ===
            'pending' && (
          <div className="mat-profile-photo-controls">

            <div>

              <strong>
                Admin Review
              </strong>

              <span>
                This photo was submitted
                by the athlete and is
                waiting for approval.
              </span>

            </div>

            <div className="mat-profile-photo-actions">

              <button
                type="button"
                className="mat-primary-button"
                disabled={
                  imageLoading
                }
                onClick={
                  approvePhoto
                }
              >
                <CheckCircle2
                  size={16}
                />

                Approve Photo
              </button>

              <button
                type="button"
                className="mat-profile-remove-photo"
                disabled={
                  imageLoading
                }
                onClick={
                  rejectPhoto
                }
              >
                <X
                  size={16}
                />

                Reject Photo
              </button>

            </div>

          </div>
        )}

        {isAdmin &&
          imagePath &&
          imageStatus ===
            'rejected' && (
          <div className="mat-profile-photo-controls">

            <div>

              <strong>
                Admin Review
              </strong>

              <span>
                This photo is currently
                rejected. You can approve
                it if needed.
              </span>

            </div>

            <div className="mat-profile-photo-actions">

              <button
                type="button"
                className="mat-primary-button"
                disabled={
                  imageLoading
                }
                onClick={
                  approvePhoto
                }
              >
                <CheckCircle2
                  size={16}
                />

                Approve Photo
              </button>

            </div>

          </div>
        )}

        {imageMessage && (
          <div className="mat-profile-image-message">
            {
              imageMessage
            }
          </div>
        )}

        <div className="mat-profile-tabs">

          <button
            type="button"
            className={
              activeProfileTab ===
              'overview'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveProfileTab(
                'overview'
              )
            }
          >

            <UserRound
              size={17}
            />

            Overview

          </button>

          <button
            type="button"
            className={
              activeProfileTab ===
              'trophy-case'
                ? 'active trophy'
                : 'trophy'
            }
            onClick={() =>
              setActiveProfileTab(
                'trophy-case'
              )
            }
          >

            <Trophy
              size={17}
            />

            Trophy Case

            <span className="mat-profile-tab-count">
              {
                earnedAchievements.length
              }
            </span>

          </button>

        </div>

        {activeProfileTab ===
          'overview' && (
          <div className="mat-profile-body">

            <section className="mat-profile-section">

              <div className="mat-profile-section-heading">

                <div>
                  <h3>
                    Athlete Information
                  </h3>

                  <p>
                    Personal and training
                    information.
                  </p>
                </div>

              </div>

              <div className="mat-profile-info-grid">

                <div>
                  <span>
                    Birthdate
                  </span>

                  <strong>
                    {formatDate(
                      member.birthdate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Current Age
                  </span>

                  <strong>
                    {getCurrentAge(
                      member.birthdate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Competition Age
                  </span>

                  <strong>
                    {getCompetitionAge(
                      member.birthdate
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Belt Rank
                  </span>

                  <strong>
                    {member.belt_rank ||
                      'White'}
                  </strong>
                </div>

                {isAdmin && (
                  <div>
                    <span>
                      Parent Email
                    </span>

                    <strong>
                      {privateDetailsLoading
                        ? 'Loading...'
                        : privateDetails
                            ?.parent_email ||
                          '—'}
                    </strong>
                  </div>
                )}

              </div>

              <div className="mat-profile-disciplines">

                <span>
                  Disciplines
                </span>

                <div>

                  {member.poomsae && (
                    <span className="mat-pill mat-poomsae">
                      Poomsae
                    </span>
                  )}

                  {member.sparring && (
                    <span className="mat-pill mat-sparring">
                      Sparring
                    </span>
                  )}

                  {member.breaking && (
                    <span className="mat-pill mat-breaking">
                      Breaking
                    </span>
                  )}

                  {!member.poomsae &&
                    !member.sparring &&
                    !member.breaking && (
                      <span className="mat-muted">
                        No disciplines
                        recorded
                      </span>
                    )}

                </div>

              </div>

              {isAdmin &&
                privateDetails?.notes && (
                <div className="mat-profile-notes">

                  <span>
                    Notes
                  </span>

                  <p>
                    {
                      privateDetails.notes
                    }
                  </p>

                </div>
              )}

            </section>

            <section className="mat-profile-section mat-career-summary-section">

              <div className="mat-profile-section-heading">

                <div>
                  <h3>
                    Career Summary
                  </h3>

                  <p>
                    Competition experience,
                    results, medals and
                    discipline history.
                  </p>
                </div>

                <Trophy
                  size={22}
                />

              </div>

              <div className="mat-career-stat-grid">

                <div className="mat-career-stat">
                  <span>
                    Tournaments
                  </span>

                  <strong>
                    {
                      athleteEntries.length
                    }
                  </strong>
                </div>

                <div className="mat-career-stat">
                  <span>
                    Events Entered
                  </span>

                  <strong>
                    {
                      totalEventsEntered
                    }
                  </strong>
                </div>

                <div className="mat-career-stat">
                  <span>
                    Results Recorded
                  </span>

                  <strong>
                    {
                      recordedResultRecords.length
                    }
                  </strong>
                </div>

                <div className="mat-career-stat">
                  <span>
                    Total Medals
                  </span>

                  <strong>
                    {
                      totalMedals
                    }
                  </strong>
                </div>

              </div>

              <div className="mat-career-medal-row">

                <div className="mat-career-medal gold">
                  <Medal
                    size={18}
                  />

                  <div>
                    <strong>
                      {
                        goldCount
                      }
                    </strong>

                    <span>
                      Gold
                    </span>
                  </div>
                </div>

                <div className="mat-career-medal silver">
                  <Medal
                    size={18}
                  />

                  <div>
                    <strong>
                      {
                        silverCount
                      }
                    </strong>

                    <span>
                      Silver
                    </span>
                  </div>
                </div>

                <div className="mat-career-medal bronze">
                  <Medal
                    size={18}
                  />

                  <div>
                    <strong>
                      {
                        bronzeCount
                      }
                    </strong>

                    <span>
                      Bronze
                    </span>
                  </div>
                </div>

              </div>

              <div className="mat-career-discipline-grid">

                {careerDisciplines.map(
                  (
                    discipline
                  ) => {
                    const Icon =
                      discipline.icon

                    return (
                      <div
                        key={
                          discipline.id
                        }
                        className="mat-career-discipline-card"
                      >

                        <div className="mat-career-discipline-heading">

                          <div className="mat-career-discipline-icon">
                            <Icon
                              size={19}
                            />
                          </div>

                          <strong>
                            {
                              discipline.label
                            }
                          </strong>

                        </div>

                        <div className="mat-career-discipline-stats">

                          <div>
                            <span>
                              Events
                            </span>

                            <strong>
                              {
                                discipline.events
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Results
                            </span>

                            <strong>
                              {
                                discipline.results
                              }
                            </strong>
                          </div>

                        </div>

                        <div className="mat-career-best-finish">

                          <span>
                            Best Finish
                          </span>

                          <strong>
                            {
                              discipline.bestFinish
                            }
                          </strong>

                        </div>

                      </div>
                    )
                  }
                )}

              </div>

            </section>

            <section className="mat-profile-section mat-milestones-section">

              <div className="mat-profile-section-heading">

                <div>
                  <h3>
                    Progress Milestones
                  </h3>

                  <p>
                    Goals automatically
                    advance as the athlete
                    gains competition
                    experience.
                  </p>
                </div>

                <Award
                  size={22}
                />

              </div>

              <div className="mat-progress-track-grid">

                {progressiveMilestones.map(
                  (
                    milestone
                  ) => {
                    const Icon =
                      milestone.icon

                    const progress =
                      milestone.progress

                    const achievedEntry =
                      getRecordEntry(
                        progress.achievedRecord
                      )

                    const percentage =
                      getProgressPercentage(
                        progress
                      )

                    return (
                      <div
                        key={
                          milestone.id
                        }
                        className="mat-progress-track-card"
                      >

                        <div className="mat-progress-track-top">

                          <div className="mat-progress-track-icon">
                            <Icon
                              size={21}
                            />
                          </div>

                          <div className="mat-progress-track-heading">

                            <h4>
                              {
                                milestone.title
                              }
                            </h4>

                            <p>
                              {
                                milestone.description
                              }
                            </p>

                          </div>

                        </div>

                        {progress.achieved >
                        0 ? (
                          <div className="mat-progress-achieved">

                            <CheckCircle2
                              size={16}
                            />

                            <div>

                              <strong>
                                {progress.achieved}{' '}
                                {progress.achieved ===
                                1
                                  ? milestone.noun
                                  : milestone.plural}{' '}
                                Achieved
                              </strong>

                              {achievedEntry
                                ?.tournament && (
                                <span>
                                  {formatDate(
                                    achievedEntry
                                      .tournament
                                      .event_date
                                  )}
                                  {' · '}
                                  {
                                    achievedEntry
                                      .tournament
                                      .name
                                  }
                                </span>
                              )}

                            </div>

                          </div>
                        ) : (
                          <div className="mat-progress-first-goal">
                            First checkpoint
                            ahead
                          </div>
                        )}

                        {progress.next ? (
                          <>

                            <div className="mat-progress-next-goal">

                              <span>
                                Next Goal
                              </span>

                              <strong>
                                {progress.next}{' '}
                                {progress.next ===
                                1
                                  ? milestone.noun
                                  : milestone.plural}
                              </strong>

                            </div>

                            <div className="mat-progress-meter-label">

                              <span>
                                Progress
                              </span>

                              <strong>
                                {
                                  progress.count
                                }
                                {' / '}
                                {
                                  progress.next
                                }
                              </strong>

                            </div>

                            <div className="mat-progress-meter">

                              <div
                                className="mat-progress-meter-fill"
                                style={{
                                  width:
                                    `${percentage}%`,
                                }}
                              />

                            </div>

                          </>
                        ) : (
                          <div className="mat-progress-max">

                            <Star
                              size={16}
                            />

                            All current checkpoints
                            achieved

                          </div>
                        )}

                      </div>
                    )
                  }
                )}

              </div>

              <div className="mat-milestone-subheading">

                <div>

                  <Flag
                    size={18}
                  />

                  <strong>
                    Discipline Achievements
                  </strong>

                </div>

                <span>
                  Permanent achievements
                  earned from competition
                  results.
                </span>

              </div>

              <div className="mat-discipline-milestone-grid">

                {disciplineMilestones.map(
                  (
                    milestone
                  ) => {
                    const Icon =
                      milestone.icon

                    const earned =
                      Boolean(
                        milestone.record
                      )

                    const entry =
                      milestone.record
                        ?.entry ||
                      null

                    return (
                      <div
                        key={
                          milestone.id
                        }
                        className={`mat-discipline-milestone ${
                          earned
                            ? 'earned'
                            : 'locked'
                        }`}
                      >

                        <div className="mat-discipline-milestone-icon">
                          <Icon
                            size={20}
                          />
                        </div>

                        <div className="mat-discipline-milestone-content">

                          <div className="mat-discipline-milestone-title">

                            <strong>
                              {
                                milestone.title
                              }
                            </strong>

                            <span>
                              {earned
                                ? 'Earned'
                                : 'Not Yet Earned'}
                            </span>

                          </div>

                          <p>
                            {
                              milestone.description
                            }
                          </p>

                          {earned &&
                            milestone.record && (
                            <div className="mat-discipline-milestone-detail">

                              <strong>
                                {getResultStage(
                                  milestone
                                    .record
                                    .result
                                ) ||
                                  'Result recorded'}
                              </strong>

                              <span>
                                {getEventDisplayName(
                                  milestone
                                    .record
                                    .result
                                    .event_name
                                )}
                              </span>

                              {entry
                                ?.tournament && (
                                <span>
                                  {formatDate(
                                    entry
                                      .tournament
                                      .event_date
                                  )}
                                  {' · '}
                                  {
                                    entry
                                      .tournament
                                      .name
                                  }
                                </span>
                              )}

                            </div>
                          )}

                        </div>

                      </div>
                    )
                  }
                )}

              </div>

            </section>

            <section className="mat-profile-section mat-results-timeline-section">

              <div className="mat-profile-section-heading">

                <div>
                  <h3>
                    Results Timeline
                  </h3>

                  <p>
                    Tournament history,
                    advancement rounds,
                    placements and medals.
                  </p>
                </div>

                <Trophy
                  size={22}
                />

              </div>

              <div className="mat-profile-medals">

                <div>
                  <strong>
                    {
                      athleteEntries.length
                    }
                  </strong>

                  <span>
                    Tournaments
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      totalMedals
                    }
                  </strong>

                  <span>
                    Total Medals
                  </span>
                </div>

                <div className="gold">

                  <Medal
                    size={17}
                  />

                  <strong>
                    {
                      goldCount
                    }
                  </strong>

                  <span>
                    Gold
                  </span>
                </div>

                <div className="silver">

                  <Medal
                    size={17}
                  />

                  <strong>
                    {
                      silverCount
                    }
                  </strong>

                  <span>
                    Silver
                  </span>
                </div>

                <div className="bronze">

                  <Medal
                    size={17}
                  />

                  <strong>
                    {
                      bronzeCount
                    }
                  </strong>

                  <span>
                    Bronze
                  </span>
                </div>

              </div>

              {athleteEntries.length ===
              0 ? (
                <div className="mat-profile-empty-line">
                  No tournament history
                  recorded yet.
                </div>
              ) : (
                <div className="mat-results-timeline">

                  {athleteEntries.map(
                    (
                      entry
                    ) => {
                      const status =
                        getTimelineStatus(
                          entry
                        )

                      return (
                        <article
                          key={
                            entry.id
                          }
                          className="mat-results-timeline-item"
                        >

                          <div className="mat-results-timeline-rail">

                            <div className="mat-results-timeline-dot">

                              <Trophy
                                size={14}
                              />

                            </div>

                            <div className="mat-results-timeline-line" />

                          </div>

                          <div className="mat-results-timeline-card">

                            <div className="mat-results-timeline-header">

                              <div className="mat-results-timeline-title">

                                <span className="mat-results-timeline-date">

                                  <CalendarDays
                                    size={14}
                                  />

                                  {formatDate(
                                    entry
                                      .tournament
                                      .event_date
                                  )}

                                </span>

                                <h4>
                                  {
                                    entry
                                      .tournament
                                      .name
                                  }
                                </h4>

                                {entry
                                  .tournament
                                  .location && (
                                  <span className="mat-results-timeline-location">

                                    <MapPin
                                      size={13}
                                    />

                                    {
                                      entry
                                        .tournament
                                        .location
                                    }

                                  </span>
                                )}

                              </div>

                              <span
                                className={`mat-results-timeline-status ${status.className}`}
                              >
                                {
                                  status.label
                                }
                              </span>

                            </div>

                            {entry.events
                              ?.length >
                            0 ? (
                              <div className="mat-results-event-list">

                                {entry.events.map(
                                  (
                                    eventName
                                  ) => {
                                    const result =
                                      entry.results.find(
                                        (
                                          item
                                        ) =>
                                          item.event_name ===
                                          eventName
                                      )

                                    const resultStage =
                                      getResultStage(
                                        result
                                      )

                                    const medalType =
                                      result
                                        ? getMedalType(
                                            result
                                          )
                                        : ''

                                    const medalResult =
                                      Boolean(
                                        medalType
                                      )

                                    return (
                                      <div
                                        key={
                                          eventName
                                        }
                                        className="mat-results-event"
                                      >

                                        <div className="mat-results-event-main">

                                          <strong>
                                            {getEventDisplayName(
                                              eventName
                                            )}
                                          </strong>

                                          {result
                                            ?.division && (
                                            <span>
                                              {
                                                result.division
                                              }
                                            </span>
                                          )}

                                        </div>

                                        <div className="mat-results-event-outcome">

                                          {medalResult && (
                                            <span
                                              className={`mat-medal-badge ${medalType.toLowerCase()}`}
                                            >
                                              <Medal
                                                size={13}
                                              />

                                              {
                                                medalType
                                              }
                                            </span>
                                          )}

                                          {resultStage &&
                                            !medalResult && (
                                              <span className="mat-results-placement">
                                                {
                                                  resultStage
                                                }
                                              </span>
                                            )}

                                          {!result && (
                                            <span className="mat-results-not-recorded">
                                              Result not
                                              recorded
                                            </span>
                                          )}

                                          {result &&
                                            !resultStage && (
                                              <span className="mat-results-recorded">
                                                Result
                                                recorded
                                              </span>
                                            )}

                                        </div>

                                        {result
                                          ?.notes && (
                                          <div className="mat-results-event-notes">
                                            {
                                              result.notes
                                            }
                                          </div>
                                        )}

                                      </div>
                                    )
                                  }
                                )}

                              </div>
                            ) : (
                              <div className="mat-profile-empty-line">
                                No events were
                                recorded for this
                                tournament.
                              </div>
                            )}

                            {entry.notes && (
                              <div className="mat-results-tournament-note">

                                <strong>
                                  Tournament Note
                                </strong>

                                <p>
                                  {
                                    entry.notes
                                  }
                                </p>

                              </div>
                            )}

                          </div>

                        </article>
                      )
                    }
                  )}

                </div>
              )}

            </section>

          </div>
        )}

        {activeProfileTab ===
          'trophy-case' && (
          <div className="mat-trophy-case">

            <section className="mat-trophy-hero">

              <div className="mat-trophy-hero-glow" />

              <div className="mat-trophy-hero-content">

                <div className="mat-trophy-hero-icon">
                  <Trophy
                    size={34}
                  />
                </div>

                <div>

                  <span className="mat-trophy-eyebrow">
                    MAT Achievement Collection
                  </span>

                  <h2>
                    Trophy Case
                  </h2>

                  <p>
                    Competition achievements
                    earned by{' '}
                    {
                      member.first_name
                    }.
                  </p>

                </div>

              </div>

              <div className="mat-trophy-completion">

                <div className="mat-trophy-completion-number">

                  <strong>
                    {
                      earnedAchievements.length
                    }
                  </strong>

                  <span>
                    of{' '}
                    {
                      allAchievements.length
                    }{' '}
                    unlocked
                  </span>

                </div>

                <div className="mat-trophy-completion-meter">

                  <div
                    className="mat-trophy-completion-fill"
                    style={{
                      width:
                        `${trophyCompletion}%`,
                    }}
                  />

                </div>

                <span className="mat-trophy-completion-percent">
                  {
                    trophyCompletion
                  }
                  % complete
                </span>

              </div>

            </section>

            {latestAchievement && (
              <section className="mat-trophy-latest">

                <div className="mat-trophy-latest-icon">
                  <Sparkles
                    size={24}
                  />
                </div>

                <div className="mat-trophy-latest-copy">

                  <span>
                    Latest Achievement
                  </span>

                  <h3>
                    {
                      latestAchievement.label
                    }
                  </h3>

                  <p>
                    {
                      latestAchievement.subtitle
                    }
                  </p>

                </div>

                {latestAchievement
                  .entry
                  ?.tournament && (
                  <div className="mat-trophy-latest-event">

                    <strong>
                      {
                        latestAchievement
                          .entry
                          .tournament
                          .name
                      }
                    </strong>

                    <span>
                      {formatDate(
                        latestAchievement
                          .entry
                          .tournament
                          .event_date
                      )}
                    </span>

                  </div>
                )}

              </section>
            )}

            {trophyCollections.map(
              (
                collection
              ) => {
                const CollectionIcon =
                  collection.icon

                const collectionEarned =
                  collection.achievements.filter(
                    (
                      achievement
                    ) =>
                      achievement.earned
                  ).length

                return (
                  <section
                    key={
                      collection.id
                    }
                    className="mat-trophy-collection"
                  >

                    <div className="mat-trophy-collection-heading">

                      <div className="mat-trophy-collection-title">

                        <div className="mat-trophy-collection-icon">

                          <CollectionIcon
                            size={20}
                          />

                        </div>

                        <div>

                          <h3>
                            {
                              collection.title
                            }
                          </h3>

                          <p>
                            {
                              collection.description
                            }
                          </p>

                        </div>

                      </div>

                      <span className="mat-trophy-collection-count">
                        {
                          collectionEarned
                        }
                        {' / '}
                        {
                          collection
                            .achievements
                            .length
                        }
                      </span>

                    </div>

                    <div className="mat-trophy-achievement-grid">

                      {collection.achievements.map(
                        renderAchievementCard
                      )}

                    </div>

                  </section>
                )
              }
            )}

          </div>
        )}

      </div>
    </div>
  )
}

export default AthleteProfileModal