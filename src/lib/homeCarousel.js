import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

export const HOME_CAROUSEL_BUCKET = 'home-carousel'

export const DEFAULT_SLIDE_IMAGES = {
  next_tournament: '/home-hero-competition.jpg',
  latest_discussion: '/home-hero-training.jpg',
  welcome: '/home-hero-team.jpg',
  custom: '/home-hero-team.jpg',
}

export const AUTO_SLIDE_LABELS = {
  next_tournament: 'Next tournament',
  latest_discussion: 'Latest team discussion',
  welcome: 'Welcome message',
}

export const AUTO_SLIDE_DESCRIPTIONS = {
  next_tournament: 'Shows the next upcoming tournament. Hidden when none is scheduled.',
  latest_discussion: 'Shows the newest pinned or active team discussion.',
  welcome: 'Greets the signed-in person by name.',
}

export const AUDIENCE_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'athletes', label: 'Athletes only' },
  { value: 'admins', label: 'Admins only' },
]

export const SLIDE_TARGETS = [
  { value: 'tournaments', label: 'Tournaments', views: ['admin', 'athlete'] },
  { value: 'calendar', label: 'Calendar', views: ['admin', 'athlete'] },
  { value: 'messages', label: 'Messages', views: ['admin', 'athlete'] },
  { value: 'coaches', label: 'Coaches', views: ['admin', 'athlete'] },
  { value: 'new-member-guide', label: 'Team Guide', views: ['admin', 'athlete'] },
  { value: 'my-profile', label: 'My Profile (athletes)', views: ['athlete'] },
  { value: 'roster', label: 'Roster (admins)', views: ['admin'] },
  { value: 'financials', label: 'Financials (admins)', views: ['admin'] },
]

const DEFAULT_ROWS = [
  { id: 'default-next_tournament', slide_type: 'next_tournament', audience: 'everyone', is_active: true, sort_order: 10 },
  { id: 'default-latest_discussion', slide_type: 'latest_discussion', audience: 'everyone', is_active: true, sort_order: 20 },
  { id: 'default-welcome', slide_type: 'welcome', audience: 'everyone', is_active: true, sort_order: 30 },
]

const SIGNED_URL_SECONDS = 60 * 60
const MAX_SOURCE_BYTES = 40 * 1024 * 1024

export function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseDate(value) {
  return value ? new Date(`${value}T00:00:00`) : null
}

export function formatDate(value, includeYear = true) {
  const date = parseDate(value)
  if (!date) return 'Date TBD'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  })
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Date TBD'
  if (!endDate || endDate === startDate) return formatDate(startDate)
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end) return formatDate(startDate)
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
  }
  return `${formatDate(startDate, false)} – ${formatDate(endDate)}`
}

export function truncate(value, length = 120) {
  const text = String(value || '').trim()
  return text.length > length ? `${text.slice(0, length).trim()}…` : text
}

export function isSlideScheduledNow(row, today = getTodayString()) {
  if (row.starts_on && row.starts_on > today) return false
  if (row.ends_on && row.ends_on < today) return false
  return true
}

export function isTargetAvailable(target, view) {
  return SLIDE_TARGETS.some((option) => option.value === target && option.views.includes(view))
}

function audienceMatchesView(audience, view) {
  if (audience === 'everyone') return true
  return view === 'admin' ? audience === 'admins' : audience === 'athletes'
}

export function getSlideImage(row) {
  return row.image_url || DEFAULT_SLIDE_IMAGES[row.slide_type] || DEFAULT_SLIDE_IMAGES.custom
}

// Turns stored slide rows into what the carousel displays for a given view.
// Automatic slides take their text from live data; custom slides use the admin's text.
export function buildCarouselSlides(rows, { view, nextTournament, topic, welcome }) {
  const today = getTodayString()

  return rows
    .filter((row) => row.is_active && audienceMatchesView(row.audience, view) && isSlideScheduledNow(row, today))
    .map((row) => {
      const image = getSlideImage(row)

      if (row.slide_type === 'next_tournament') {
        if (!nextTournament) return null
        return {
          id: row.id,
          image,
          alt: row.alt_text || '',
          kicker: 'Upcoming Tournament',
          title: nextTournament.name,
          body: nextTournament.location || 'The next team competition is coming up.',
          meta: formatDateRange(nextTournament.event_date, nextTournament.end_date),
          action: 'View Tournament',
          target: 'tournaments',
        }
      }

      if (row.slide_type === 'latest_discussion') {
        if (!topic) return null
        return {
          id: row.id,
          image,
          alt: row.alt_text || '',
          kicker: topic.is_pinned ? 'Pinned Team Discussion' : 'Team Discussion',
          title: topic.title,
          body: truncate(topic.body, 145),
          meta: `${topic.discussion_comments?.[0]?.count || 0} comments`,
          action: 'View Messages',
          target: 'messages',
        }
      }

      if (row.slide_type === 'welcome') {
        return { id: row.id, image, alt: row.alt_text || '', ...welcome }
      }

      const hasButton = row.button_label && isTargetAvailable(row.button_target, view)
      return {
        id: row.id,
        image,
        alt: row.alt_text || '',
        kicker: row.kicker || '',
        title: row.title || '',
        body: row.body || '',
        meta: '',
        action: hasButton ? row.button_label : '',
        target: hasButton ? row.button_target : '',
      }
    })
    .filter(Boolean)
}

// Loads slide rows plus temporary links for their images.
// Falls back to the built-in automatic slides if the carousel table has not been set up yet.
export function useHomeCarouselRows() {
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('home_carousel_slides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Could not load home carousel slides:', error.message)
      setConfigured(false)
      setRows(DEFAULT_ROWS)
      setLoading(false)
      return
    }

    const paths = (data || []).map((row) => row.image_path).filter(Boolean)
    let urlsByPath = {}

    if (paths.length) {
      const { data: signed, error: signError } = await supabase.storage
        .from(HOME_CAROUSEL_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_SECONDS)

      if (signError) {
        console.error('Could not load home carousel images:', signError.message)
      } else {
        urlsByPath = Object.fromEntries(
          (signed || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl])
        )
      }
    }

    setConfigured(true)
    setRows((data || []).map((row) => ({ ...row, image_url: urlsByPath[row.image_path] || '' })))
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { rows, configured, loading, reload }
}

export function useRecentTopics(limit = 5) {
  const [topics, setTopics] = useState([])

  useEffect(() => {
    let active = true
    async function loadTopics() {
      const { data, error } = await supabase
        .from('discussion_topics')
        .select('id,title,body,is_pinned,created_at,last_activity_at,discussion_comments(count)')
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
        .limit(limit)
      if (active && !error) setTopics(data || [])
    }
    loadTopics()
    return () => { active = false }
  }, [limit])

  return topics
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

// Shrinks a photo in the browser so uploads stay small (usually well under 1 MB).
export async function compressCarouselImage(file, { maxWidth = 1920, maxHeight = 1080, quality = 0.82 } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG or WebP).')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('That image is larger than 40 MB. Please choose a smaller photo.')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('That image could not be read. Try saving it as a JPG or PNG first.')
  }

  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }
  if (!blob) {
    throw new Error('That image could not be processed.')
  }

  return { blob, width, height }
}

export async function uploadCarouselImage(blob) {
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `slides/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(HOME_CAROUSEL_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) throw new Error(error.message)
  return path
}

export async function removeCarouselImage(path) {
  if (!path) return
  const { error } = await supabase.storage.from(HOME_CAROUSEL_BUCKET).remove([path])
  if (error) console.error('Could not remove old carousel image:', error.message)
}
