import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Safety net in case a live update is missed (e.g. the phone was asleep).
const REFRESH_INTERVAL_MS = 60 * 1000

// Total unread direct messages for the signed-in account, kept current with
// live updates, a refresh when the app regains focus, and a slow background check.
export function useUnreadDirectMessages(accountId) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!accountId) return
    const { data, error } = await supabase.rpc('get_my_direct_conversations')
    if (error) {
      console.error('Could not check for unread messages:', error.message)
      return
    }
    setCount((data || []).reduce((total, item) => total + (Number(item.unread_count) || 0), 0))
  }, [accountId])

  useEffect(() => {
    if (!accountId) return undefined

    refresh()

    const channel = supabase
      .channel(`direct-message-unread-${accountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, refresh)
      .subscribe()

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const interval = window.setInterval(refreshWhenVisible, REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refresh)

    return () => {
      supabase.removeChannel(channel)
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [accountId, refresh])

  return { count: accountId ? count : 0, refresh }
}
