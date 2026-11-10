import { supabase } from './supabase.js'
import { compressCarouselImage } from './homeCarousel.js'

export const TOURNAMENT_POSTER_BUCKET = 'tournament-posters'

// Poster links stay valid for 12 hours; they are refreshed whenever tournaments reload.
const SIGNED_URL_SECONDS = 12 * 60 * 60

// Adds a temporary poster_url to each tournament that has a poster.
// Tournaments without one (or if the links cannot be created) keep poster_url empty.
export async function attachPosterUrls(tournaments) {
  const paths = tournaments.map((tournament) => tournament.poster_path).filter(Boolean)
  if (!paths.length) return tournaments.map((tournament) => ({ ...tournament, poster_url: '' }))

  const { data, error } = await supabase.storage
    .from(TOURNAMENT_POSTER_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS)

  if (error) console.error('Could not load tournament posters:', error.message)

  const urlsByPath = Object.fromEntries(
    (data || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]),
  )

  return tournaments.map((tournament) => ({
    ...tournament,
    poster_url: urlsByPath[tournament.poster_path] || '',
  }))
}

// Posters are usually portrait, so allow more height than the landscape carousel images.
export function compressTournamentPoster(file) {
  return compressCarouselImage(file, { maxWidth: 1400, maxHeight: 2000 })
}

export async function uploadTournamentPoster(blob) {
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `posters/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(TOURNAMENT_POSTER_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) throw new Error(error.message)
  return path
}

export async function removeTournamentPoster(path) {
  if (!path) return
  const { error } = await supabase.storage.from(TOURNAMENT_POSTER_BUCKET).remove([path])
  if (error) console.error('Could not remove old tournament poster:', error.message)
}
