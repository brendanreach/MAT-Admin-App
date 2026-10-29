import {
  Award,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Medal,
  MessageCircle,
  Pin,
  Target,
  Trophy,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import './AthleteHomePage.css'

const HERO_IMAGES = [
  '/home-hero-competition.png',
  '/home-hero-training.png',
  '/home-hero-team.png',
]

function parseDate(value) {
  return value ? new Date(`${value}T00:00:00`) : null
}

function formatDate(value, includeYear = true) {
  const date = parseDate(value)
  if (!date) return 'Date TBD'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  })
}

function formatDateRange(startDate, endDate) {
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

function getMedalType(result) {
  if (!result) return ''
  if (result.result_stage === 'Gold' || result.medal === 'Gold' || Number(result.placement) === 1) return 'Gold'
  if (result.result_stage === 'Silver' || result.medal === 'Silver' || Number(result.placement) === 2) return 'Silver'
  if (result.result_stage === 'Bronze' || result.medal === 'Bronze' || Number(result.placement) === 3) return 'Bronze'
  return ''
}

function truncate(value, length = 120) {
  const text = String(value || '').trim()
  return text.length > length ? `${text.slice(0, length).trim()}…` : text
}

export default function AthleteHomePage({
  member,
  tournaments = [],
  tournamentEntries = [],
  tournamentResults = [],
  onNavigate,
}) {
  const [topics, setTopics] = useState([])
  const [slideIndex, setSlideIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let active = true
    async function loadTopics() {
      const { data, error } = await supabase
        .from('discussion_topics')
        .select('id,title,body,is_pinned,created_at,last_activity_at,discussion_comments(count)')
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
        .limit(5)
      if (active && !error) setTopics(data || [])
    }
    loadTopics()
    return () => { active = false }
  }, [])

  const today = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

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

  const slides = useMemo(() => {
    const result = []
    if (nextTournament) {
      result.push({
        id: `tournament-${nextTournament.id}`,
        kicker: 'Upcoming Tournament',
        title: nextTournament.name,
        body: nextTournament.location || 'Your next team competition is coming up.',
        meta: formatDateRange(nextTournament.event_date, nextTournament.end_date),
        action: 'View Tournament',
        target: 'tournaments',
        image: HERO_IMAGES[0],
      })
    }
    if (topics[0]) {
      result.push({
        id: `topic-${topics[0].id}`,
        kicker: topics[0].is_pinned ? 'Pinned Team Discussion' : 'Team Discussion',
        title: topics[0].title,
        body: truncate(topics[0].body, 145),
        meta: `${topics[0].discussion_comments?.[0]?.count || 0} comments`,
        action: 'View Messages',
        target: 'messages',
        image: HERO_IMAGES[1],
      })
    }
    result.push({
      id: 'team-portal',
      kicker: 'Competition Team',
      title: member ? `Welcome, ${member.first_name}` : 'Michigan Academy of Taekwondo',
      body: 'Stay connected with your team, coaches, tournaments, and competition progress.',
      meta: member?.belt_rank ? `${member.belt_rank} Belt` : 'MAT Team Portal',
      action: 'My Profile',
      target: 'my-profile',
      image: HERO_IMAGES[2],
    })
    return result
  }, [nextTournament, topics, member])

  useEffect(() => {
    if (paused || slides.length < 2) return undefined
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length)
    }, 9000)
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  useEffect(() => {
    if (slideIndex >= slides.length) setSlideIndex(0)
  }, [slideIndex, slides.length])

  if (!member) {
    return (
      <div className="mat-new-home-empty">
        <h1>Athlete Profile Not Linked</h1>
        <p>Your login has the Athlete role, but it is not linked to a member record yet.</p>
      </div>
    )
  }

  const currentSlide = slides[slideIndex] || slides[0]

  return (
    <div className="mat-new-home">
      <section
        className="mat-new-home-hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <img src={currentSlide.image} alt="" className="mat-new-home-hero-image" />
        <div className="mat-new-home-hero-shade" />
        <div className="mat-new-home-hero-copy">
          <span>{currentSlide.kicker}</span>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.body}</p>
          <small>{currentSlide.meta}</small>
          <button type="button" onClick={() => onNavigate(currentSlide.target)}>
            {currentSlide.action}
            <ChevronRight size={18} />
          </button>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="mat-new-home-hero-arrow previous"
              aria-label="Previous feature"
              onClick={() => setSlideIndex((slideIndex - 1 + slides.length) % slides.length)}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              className="mat-new-home-hero-arrow next"
              aria-label="Next feature"
              onClick={() => setSlideIndex((slideIndex + 1) % slides.length)}
            >
              <ChevronRight size={24} />
            </button>
            <div className="mat-new-home-dots" aria-label="Featured content slides">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={index === slideIndex ? 'active' : ''}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === slideIndex ? 'true' : undefined}
                  onClick={() => setSlideIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </section>

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
              <img src={HERO_IMAGES[0]} alt="" />
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

        <article className="mat-new-home-card mat-new-home-messages">
          <header>
            <div><MessageCircle size={20} /><span>Team Messages</span></div>
            <button type="button" onClick={() => onNavigate('messages')}>View All <ChevronRight size={15} /></button>
          </header>
          <div className="mat-new-home-message-list">
            {topics.length === 0 ? (
              <div className="mat-new-home-card-empty">No recent team discussions.</div>
            ) : topics.slice(0, 4).map((topic) => (
              <button key={topic.id} type="button" onClick={() => onNavigate('messages')}>
                <span className="mat-new-home-message-icon">{topic.is_pinned ? <Pin size={17} /> : <MessageCircle size={17} />}</span>
                <span className="mat-new-home-message-copy">
                  <strong>{topic.title}</strong>
                  <span>{truncate(topic.body, 100)}</span>
                </span>
                <span className="mat-new-home-message-count">{topic.discussion_comments?.[0]?.count || 0}</span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
