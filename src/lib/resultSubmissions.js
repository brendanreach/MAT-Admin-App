import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Same order as the admin Tournaments page. An empty stage means "competed, no result".
export const RESULT_STAGES = [
  'Gold',
  'Silver',
  'Bronze',
  'Quarterfinals',
  'Round of 16',
  'Round of 32',
  'Round of 64',
  'Round of 128',
]

export const MEDAL_STAGES = ['Gold', 'Silver', 'Bronze']

const SETUP_MESSAGE =
  'Result submissions need a database update first. Run supabase/tournament-result-submissions.sql in the Supabase SQL editor.'

const REFRESH_INTERVAL_MS = 60 * 1000

export function friendlySubmissionError(error) {
  const message = error?.message || 'Something went wrong.'
  return /tournament_result_submissions|submit_tournament_results|review_result_submission|withdraw_result_submission/.test(
    message,
  ) && /does not exist|could not find|schema cache/i.test(message)
    ? SETUP_MESSAGE
    : message
}

export async function loadMemberSubmissions(memberId) {
  const { data, error } = await supabase
    .from('tournament_result_submissions')
    .select('*')
    .eq('member_id', memberId)
    .order('submitted_at', { ascending: false })

  if (error) throw new Error(friendlySubmissionError(error))
  return data || []
}

export async function loadSubmissionsForReview(status) {
  let query = supabase
    .from('tournament_result_submissions')
    .select('*')
    .order(status === 'pending' ? 'submitted_at' : 'reviewed_at', {
      ascending: status === 'pending',
    })

  query =
    status === 'pending' ? query.eq('status', 'pending') : query.neq('status', 'pending').limit(100)

  const { data, error } = await query
  if (error) throw new Error(friendlySubmissionError(error))
  return data || []
}

export async function submitTournamentResults(tournamentId, memberId, results) {
  const { data, error } = await supabase.rpc('submit_tournament_results', {
    requested_tournament_id: tournamentId,
    requested_member_id: memberId,
    requested_results: results,
  })

  if (error) throw new Error(friendlySubmissionError(error))
  return data || []
}

export async function withdrawResultSubmission(submissionId) {
  const { error } = await supabase.rpc('withdraw_result_submission', {
    submission_id: submissionId,
  })
  if (error) throw new Error(friendlySubmissionError(error))
}

export async function reviewResultSubmission(submissionId, approve, note) {
  const { error } = await supabase.rpc('review_result_submission', {
    submission_id: submissionId,
    approve,
    note: note || null,
  })

  if (error) throw new Error(friendlySubmissionError(error))
}

// Number of submissions waiting for an admin, for the nav badge.
export function usePendingResultSubmissionCount(enabled) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!enabled) return
    const { count: pending, error } = await supabase
      .from('tournament_result_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) {
      console.error('Could not check pending result approvals:', error.message)
      return
    }
    setCount(pending || 0)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return undefined

    refresh()

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const interval = window.setInterval(refreshWhenVisible, REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [enabled, refresh])

  return { count: enabled ? count : 0, refresh }
}
