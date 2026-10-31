import {
  Award,
  ChevronRight,
  MapPin,
  Medal,
  MessageCircle,
  Target,
  Trophy,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  DEFAULT_SLIDE_IMAGES,
  buildCarouselSlides,
  formatDate,
  formatDateRange,
  getTodayString,
  useHomeCarouselRows,
  useRecentTopics,
} from '../lib/homeCarousel.js'
import HomeCarousel from './HomeCarousel.jsx'
import TeamMessagesCard from './TeamMessagesCard.jsx'
import './HomeLayout.css'

function getMedalType(result) {
  if (!result) return ''
  if (result.result_stage === 'Gold' || result.medal === 'Gold' || Number(result.placement) === 1) return 'Gold'
  if (result.result_stage === 'Silver' || result.medal === 'Silver' || Number(result.placement) === 2) return 'Silver'
  if (result.result_stage === 'Bronze' || result.medal === 'Bronze' || Number(result.placement) === 3) return 'Bronze'
  return ''
}

export default function AthleteHomePage({
  member,
  tournaments = [],
  tournamentEntries = [],
  tournamentResults = [],
  onNavigate,
}) {
  const topics = useRecentTopics()
  const { rows: carouselRows } = useHomeCarouselRows()
  const today = useMemo(() => getTodayString(), [])

  const athleteEntryIds = useMemo(
    () => tournamentEntries.map((entry) => entry.id),
    [tournamentEntries]
  )
  const athleteResults = useMemo(
    () => tournamentResults.filter((result) => athleteEntryIds.includes(result.tournament_entry_id)),
    [tournamentResults, athleteEntryIds]
  )
  const goldCount = athleteResults.filter((result) => getMedalType(result) === 'Gold').length
  const totalMedals = athleteResults.filter((result) => getMedalType(result)).length
  const totalEventsEntered = tournamentEntries.reduce((total, entry) => total + (entry.events?.length || 0), 0)

  const upcomingTournaments = useMemo(
    () => tournaments
      .filter((tournament) => (tournament.end_date || tournament.event_date || '') >= today)
      .sort((a, b) => String(a.event_date || '').localeCompare(String(b.event_date || ''))),
    [tournaments, today]
  )

  const nextTournament = upcomingTournaments[0] || null
  const nextEntry = nextTournament
    ? tournamentEntries.find((entry) => entry.tournament_id === nextTournament.id) || null
    : null

  const slides = useMemo(
    () => buildCarouselSlides(carouselRows, {
      view: 'athlete',
      nextTournament,
      topic: topics[0],
      welcome: {
        kicker: 'Competition Team',
        title: member ? `Welcome, ${member.first_name}` : 'Michigan Academy of Taekwondo',
        body: 'Stay connected with your team, coaches, tournaments, and competition progress.',
        meta: member?.belt_rank ? `${member.belt_rank} Belt` : 'MAT Team Portal',
        action: 'My Profile',
        target: 'my-profile',
      },
    }),
    [carouselRows, nextTournament, topics, member]
  )

  if (!member) {
    return (
      <div className="mat-new-home-empty">
        <h1>Athlete Profile Not Linked</h1>
        <p>Your login has the Athlete role, but it is not linked to a member record yet.</p>
      </div>
    )
  }

  return (
    <div className="mat-new-home">
      <HomeCarousel slides={slides} onNavigate={onNavigate} />

      <section className="mat-new-home-stats" aria-label="Competition statistics">
        <button type="button" onClick={() => onNavigate('my-profile')}>
          <Trophy size={25} /><strong>{tournamentEntries.length}</strong><span>Tournaments</span>
        </button>
        <button type="button" onClick={() => onNavigate('my-profile')}>
          <Target size={25} /><strong>{totalEventsEntered}</strong><span>Events Entered</span>
        </button>
        <button type="button" onClick={() => onNavigate('my-profile')}>
          <Medal size={25} /><strong>{totalMedals}</strong><span>Total Medals</span>
        </button>
        <button type="button" onClick={() => onNavigate('my-profile')}>
          <Award size={25} /><strong>{goldCount}</strong><span>Gold Medals</span>
        </button>
      </section>

      <section className="mat-new-home-grid">
        <article className="mat-new-home-card mat-new-home-up-next">
          <header>
            <div><Trophy size={20} /><span>Up Next</span></div>
            <button type="button" onClick={() => onNavigate('tournaments')}>View All <ChevronRight size={15} /></button>
          </header>
          {nextTournament ? (
            <div className="mat-new-home-next-content">
              <img src={DEFAULT_SLIDE_IMAGES.next_tournament} alt="" />
              <div>
                <span className={`mat-new-home-status ${nextEntry ? 'registered' : ''}`}>
                  {nextEntry ? 'Registered' : 'Not Registered'}
                </span>
                <h2>{nextTournament.name}</h2>
                <p><Trophy size={15} /> {formatDateRange(nextTournament.event_date, nextTournament.end_date)}</p>
                {nextTournament.location && <p><MapPin size={15} /> {nextTournament.location}</p>}
                {nextTournament.registration_deadline && (
                  <p className="deadline">Registration closes {formatDate(nextTournament.registration_deadline)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mat-new-home-card-empty">No upcoming tournament is currently scheduled.</div>
          )}
          <div className="mat-new-home-card-actions">
            <button type="button" className="primary" onClick={() => onNavigate('tournaments')}>Tournament Details</button>
            <button type="button" onClick={() => onNavigate('messages')}><MessageCircle size={16} /> Team Discussion</button>
          </div>
        </article>

        <TeamMessagesCard topics={topics} onNavigate={onNavigate} />
      </section>
    </div>
  )
}
