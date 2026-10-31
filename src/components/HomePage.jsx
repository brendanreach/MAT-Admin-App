import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ImagePlus,
  MapPin,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
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
import HomeCarouselManager from './HomeCarouselManager.jsx'
import TeamMessagesCard from './TeamMessagesCard.jsx'
import './HomeLayout.css'

const DEADLINE_WINDOW_DAYS = 14
const EVENTS_WINDOW_DAYS = 7

function stringToDate(value) {
  return value ? new Date(`${value}T00:00:00`) : null
}

function dateToString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(value, days) {
  const date = stringToDate(value)
  date.setDate(date.getDate() + days)
  return dateToString(date)
}

function daysBetween(fromValue, toValue) {
  return Math.round((stringToDate(toValue) - stringToDate(fromValue)) / 86400000)
}

function formatTime(value) {
  if (!value) return ''
  const [hours, minutes] = value.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function getNextOccurrence(event, today) {
  if (event.recurrence_type !== 'weekly') {
    return event.event_date >= today ? event.event_date : null
  }

  const occurrence = stringToDate(event.event_date)
  const todayDate = stringToDate(today)
  if (!occurrence || !todayDate) return null

  while (occurrence < todayDate) {
    occurrence.setDate(occurrence.getDate() + 7)
  }

  const occurrenceString = dateToString(occurrence)
  if (event.recurrence_end_date && occurrenceString > event.recurrence_end_date) return null
  return occurrenceString
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function HomePage({
  members = [],
  tournaments = [],
  allTournamentEntries = [],
  calendarEvents = [],
  accountName,
  onNavigate,
}) {
  const topics = useRecentTopics()
  const { rows: carouselRows, configured: carouselConfigured, reload: reloadCarousel } = useHomeCarouselRows()
  const [managingSlides, setManagingSlides] = useState(false)
  const today = useMemo(() => getTodayString(), [])
  const deadlineCutoff = addDays(today, DEADLINE_WINDOW_DAYS)
  const eventsCutoff = addDays(today, EVENTS_WINDOW_DAYS)

  const activeMembers = useMemo(
    () => members.filter((member) => member.is_active !== false),
    [members]
  )

  const upcomingTournaments = useMemo(
    () => tournaments
      .filter((tournament) => (tournament.end_date || tournament.event_date || '') >= today)
      .sort((a, b) => String(a.event_date || '').localeCompare(String(b.event_date || ''))),
    [tournaments, today]
  )

  const nextTournament = upcomingTournaments[0] || null

  const entryCountByTournament = useMemo(() => {
    const counts = {}
    allTournamentEntries.forEach((entry) => {
      counts[entry.tournament_id] = (counts[entry.tournament_id] || 0) + 1
    })
    return counts
  }, [allTournamentEntries])

  const closingSoon = useMemo(
    () => upcomingTournaments
      .filter((tournament) => tournament.registration_deadline
        && tournament.registration_deadline >= today
        && tournament.registration_deadline <= deadlineCutoff)
      .sort((a, b) => a.registration_deadline.localeCompare(b.registration_deadline)),
    [upcomingTournaments, today, deadlineCutoff]
  )

  const upcomingItems = useMemo(() => {
    const items = []

    calendarEvents.forEach((event) => {
      const nextDate = getNextOccurrence(event, today)
      if (!nextDate) return
      items.push({
        id: `calendar-${event.id}-${nextDate}`,
        title: event.title,
        date: nextDate,
        detail: [event.event_type, event.all_day ? 'All day' : formatTime(event.start_time)].filter(Boolean).join(' · '),
        target: 'calendar',
      })
    })

    upcomingTournaments.forEach((tournament) => {
      if (tournament.event_date >= today) {
        items.push({
          id: `tournament-${tournament.id}`,
          title: tournament.name,
          date: tournament.event_date,
          detail: ['Tournament', tournament.location].filter(Boolean).join(' · '),
          target: 'tournaments',
        })
      }
      if (tournament.registration_deadline && tournament.registration_deadline >= today) {
        items.push({
          id: `deadline-${tournament.id}`,
          title: `${tournament.name} registration closes`,
          date: tournament.registration_deadline,
          detail: 'Registration deadline',
          target: 'tournaments',
        })
      }
    })

    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [calendarEvents, upcomingTournaments, today])

  const eventsThisWeek = upcomingItems.filter((item) => item.date <= eventsCutoff).length

  const attentionItems = useMemo(() => {
    const items = closingSoon.map((tournament) => {
      const daysLeft = daysBetween(today, tournament.registration_deadline)
      const entered = entryCountByTournament[tournament.id] || 0
      return {
        id: `deadline-${tournament.id}`,
        title: `${tournament.name} registration closes ${daysLeft === 0 ? 'today' : `in ${plural(daysLeft, 'day')}`}`,
        detail: `${plural(entered, 'athlete')} entered · Closes ${formatDate(tournament.registration_deadline)}`,
        icon: Clock,
        onClick: () => onNavigate('tournaments'),
      }
    })

    const missingBirthdate = activeMembers.filter((member) => !member.birthdate).length
    const missingBelt = activeMembers.filter((member) => !member.belt_rank).length

    if (missingBirthdate) {
      items.push({
        id: 'missing-birthdate',
        title: `${plural(missingBirthdate, 'athlete')} missing a birthdate`,
        detail: 'Needed for tournament age divisions',
        icon: UserRound,
        onClick: () => onNavigate('roster'),
      })
    }

    if (missingBelt) {
      items.push({
        id: 'missing-belt',
        title: `${plural(missingBelt, 'athlete')} missing a belt rank`,
        detail: 'Needed for tournament divisions',
        icon: UserRound,
        onClick: () => onNavigate('roster'),
      })
    }

    if (!carouselConfigured) {
      items.push({
        id: 'carousel-setup',
        title: 'Home page carousel isn’t set up yet',
        detail: 'Run supabase/home-carousel.sql to enable custom slides',
        icon: ImagePlus,
        onClick: () => setManagingSlides(true),
      })
    }

    return items
  }, [closingSoon, activeMembers, entryCountByTournament, carouselConfigured, today, onNavigate])

  const firstName = String(accountName || '').trim().split(/[\s@]/)[0]

  const slides = useMemo(
    () => buildCarouselSlides(carouselRows, {
      view: 'admin',
      nextTournament,
      topic: topics[0],
      welcome: {
        kicker: 'Michigan Academy of Taekwondo',
        title: firstName ? `Welcome, ${firstName}` : 'Welcome to MAT',
        body: 'Here’s what’s happening across the competition team.',
        meta: `${plural(activeMembers.length, 'active athlete')}`,
        action: 'View Roster',
        target: 'roster',
      },
    }),
    [carouselRows, nextTournament, topics, firstName, activeMembers.length]
  )

  return (
    <div className="mat-new-home">
      <HomeCarousel slides={slides} onNavigate={onNavigate} onManage={() => setManagingSlides(true)} />

      <section className="mat-new-home-stats" aria-label="Team overview">
        <button type="button" onClick={() => onNavigate('roster')}>
          <Users size={25} /><strong>{activeMembers.length}</strong><span>Active Athletes</span>
        </button>
        <button type="button" onClick={() => onNavigate('tournaments')}>
          <Trophy size={25} /><strong>{upcomingTournaments.length}</strong><span>Upcoming Tournaments</span>
        </button>
        <button type="button" onClick={() => onNavigate('tournaments')}>
          <Clock size={25} /><strong>{closingSoon.length}</strong><span>Deadlines in {DEADLINE_WINDOW_DAYS} Days</span>
        </button>
        <button type="button" onClick={() => onNavigate('calendar')}>
          <CalendarDays size={25} /><strong>{eventsThisWeek}</strong><span>Events This Week</span>
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
                <span className={`mat-new-home-status ${entryCountByTournament[nextTournament.id] ? 'registered' : ''}`}>
                  {plural(entryCountByTournament[nextTournament.id] || 0, 'athlete')} entered
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
            <button type="button" onClick={() => onNavigate('calendar')}><CalendarDays size={16} /> Calendar</button>
          </div>
        </article>

        <article className="mat-new-home-card">
          <header>
            <div><AlertTriangle size={20} /><span>Needs Attention</span></div>
          </header>
          {attentionItems.length === 0 ? (
            <div className="mat-new-home-all-clear">
              <CheckCircle2 size={28} />
              <span>You’re all caught up.</span>
            </div>
          ) : (
            <div className="mat-new-home-list">
              {attentionItems.map((item) => {
                const Icon = item.icon
                return (
                  <button key={item.id} type="button" onClick={item.onClick}>
                    <span className="mat-new-home-list-icon warning"><Icon size={17} /></span>
                    <span>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                )
              })}
            </div>
          )}
        </article>

        <TeamMessagesCard topics={topics} onNavigate={onNavigate} />

        <article className="mat-new-home-card">
          <header>
            <div><CalendarDays size={20} /><span>Coming Up</span></div>
            <button type="button" onClick={() => onNavigate('calendar')}>View Calendar <ChevronRight size={15} /></button>
          </header>
          {upcomingItems.length === 0 ? (
            <div className="mat-new-home-card-empty">Nothing is scheduled yet.</div>
          ) : (
            <div className="mat-new-home-list">
              {upcomingItems.slice(0, 5).map((item) => {
                const date = stringToDate(item.date)
                return (
                  <button key={item.id} type="button" onClick={() => onNavigate(item.target)}>
                    <span className="mat-new-home-list-icon date">
                      <small>{date.toLocaleDateString(undefined, { month: 'short' })}</small>
                      <b>{date.getDate()}</b>
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </span>
                    {item.date === today && <span className="mat-new-home-list-tag">Today</span>}
                  </button>
                )
              })}
            </div>
          )}
        </article>
      </section>

      {managingSlides && (
        <HomeCarouselManager
          rows={carouselRows}
          configured={carouselConfigured}
          onClose={() => setManagingSlides(false)}
          onChanged={reloadCarousel}
        />
      )}
    </div>
  )
}

export default HomePage
