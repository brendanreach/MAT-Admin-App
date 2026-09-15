import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from './lib/supabase.js'

import LoginPage from './components/LoginPage.jsx'
import TopNav from './components/TopNav.jsx'
import HomePage from './components/HomePage.jsx'
import NewMemberGuidePage from './components/NewMemberGuidePage.jsx'
import AthleteHomePage from './components/AthleteHomePage.jsx'
import AthleteProfileModal from './components/AthleteProfileModal.jsx'
import AthleteAnnouncementsPage from './components/AthleteAnnouncementsPage.jsx'
import AthleteCalendarPage from './components/AthleteCalendarPage.jsx'
import AthleteTournamentsPage from './components/AthleteTournamentsPage.jsx'
import AthleteCoachesPage from './components/AthleteCoachesPage.jsx'
import RosterPage from './components/RosterPage.jsx'
import CoachesPage from './components/CoachesPage.jsx'
import AdminPrivateLessonRequests from './components/AdminPrivateLessonRequests.jsx'
import TournamentsPage from './components/TournamentsPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import AnnouncementsPage from './components/AnnouncementsPage.jsx'
import FinancialsPage from './components/FinancialsPage.jsx'

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) {
    return []
  }

  return roles
    .filter(Boolean)
    .map((role) =>
      String(role)
        .trim()
        .toLowerCase()
    )
}

function App() {
  const [session, setSession] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [
    accountProfile,
    setAccountProfile,
  ] = useState(null)

  const [
    accountMemberLinks,
    setAccountMemberLinks,
  ] = useState([])

  const [
    viewMode,
    setViewMode,
  ] = useState('admin')

  const [
    activeTab,
    setActiveTab,
  ] = useState('home')

  const [
    members,
    setMembers,
  ] = useState([])

  const [
    tournaments,
    setTournaments,
  ] = useState([])

  const [
    allTournamentEntries,
    setAllTournamentEntries,
  ] = useState([])

  const [
    tournamentResults,
    setTournamentResults,
  ] = useState([])

  const [
    calendarEvents,
    setCalendarEvents,
  ] = useState([])

  const [
    announcements,
    setAnnouncements,
  ] = useState([])

  const [
    message,
    setMessage,
  ] = useState('')

  const userId =
    session?.user?.id ||
    null

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      const {
        data: {
          session:
            initialSession,
        },
      } =
        await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setSession(
        initialSession
      )

      setLoading(false)
    }

    getInitialSession()

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          nextSession
        ) => {
          setSession(
            nextSession
          )
        }
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (userId) {
      initializeSignedInUser()
      return
    }

    setAccountProfile(null)
    setAccountMemberLinks([])
    setMembers([])
    setTournaments([])
    setAllTournamentEntries([])
    setTournamentResults([])
    setCalendarEvents([])
    setAnnouncements([])
    setViewMode('admin')
    setActiveTab('home')
  }, [
    userId,
  ])

  const roles =
    useMemo(
      () =>
        normalizeRoles(
          accountProfile?.roles
        ),
      [
        accountProfile,
      ]
    )

  const isAdmin =
    roles.includes(
      'admin'
    )

  const isAthlete =
    roles.includes(
      'athlete'
    )

  useEffect(() => {
    if (!accountProfile) {
      return
    }

    setViewMode(
      (
        currentMode
      ) => {
        if (
          currentMode ===
            'admin' &&
          isAdmin
        ) {
          return currentMode
        }

        if (
          currentMode ===
            'athlete' &&
          isAthlete
        ) {
          return currentMode
        }

        if (isAdmin) {
          return 'admin'
        }

        if (isAthlete) {
          return 'athlete'
        }

        return 'athlete'
      }
    )
  }, [
    accountProfile,
    isAdmin,
    isAthlete,
  ])

  async function initializeSignedInUser() {
    setMessage('')

    const profile =
      await loadAccountProfile()

    await Promise.all([
      loadMembers(
        profile?.roles
      ),
      loadTournaments(),
      loadAllTournamentEntries(),
      loadTournamentResults(),
      loadCalendarEvents(),
      loadAnnouncements(),
      loadAccountMemberLinks(),
    ])
  }

  async function loadAccountProfile() {
    if (!userId) {
      setAccountProfile(null)
      return null
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'account_profiles'
        )
        .select(
          'id, email, display_name, roles'
        )
        .eq(
          'id',
          userId
        )
        .maybeSingle()

    if (error) {
      console.error(
        'Could not load account profile:',
        error.message
      )

      setAccountProfile(null)

      setMessage(
        'Could not load account profile.'
      )

      return null
    }

    setAccountProfile(
      data || null
    )

    return data || null
  }

  async function loadAccountMemberLinks() {
    if (!userId) {
      setAccountMemberLinks([])
      return
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          'account_member_links'
        )
        .select(
          'id, account_id, member_id, relationship_type'
        )
        .eq(
          'account_id',
          userId
        )

    if (error) {
      console.error(
        'Could not load account member links:',
        error.message
      )

      setAccountMemberLinks([])
      return
    }

    setAccountMemberLinks(
      data || []
    )
  }

  async function loadMembers(
    rolesOverride = null
  ) {
    let rolesToUse =
      rolesOverride

    if (
      !Array.isArray(
        rolesToUse
      )
    ) {
      rolesToUse =
        accountProfile?.roles ||
        []
    }

    const normalizedRoles =
      normalizeRoles(
        rolesToUse
      )

    const userIsAdmin =
      normalizedRoles.includes(
        'admin'
      )

    const source =
      userIsAdmin
        ? 'members'
        : 'member_public_profiles'

    const {
      data,
      error,
    } =
      await supabase
        .from(source)
        .select('*')
        .order(
          'last_name',
          {
            ascending: true,
          }
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setMembers(
      data || []
    )
  }

  async function loadTournaments() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'tournaments'
        )
        .select('*')
        .order(
          'event_date',
          {
            ascending: true,
          }
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setTournaments(
      data || []
    )
  }

  async function loadAllTournamentEntries() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'tournament_entries'
        )
        .select('*')

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setAllTournamentEntries(
      data || []
    )
  }

  async function loadTournamentResults() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'tournament_results'
        )
        .select('*')

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setTournamentResults(
      data || []
    )
  }

  async function loadCalendarEvents() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'calendar_events'
        )
        .select('*')
        .order(
          'event_date',
          {
            ascending: true,
          }
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setCalendarEvents(
      data || []
    )
  }

  async function loadAnnouncements() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'announcements'
        )
        .select('*')
        .order(
          'publish_date',
          {
            ascending: false,
          }
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )

    if (error) {
      setMessage(
        error.message
      )
      return
    }

    setAnnouncements(
      data || []
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function handleViewModeChange(
    nextMode
  ) {
    if (
      nextMode ===
        'admin' &&
      !isAdmin
    ) {
      return
    }

    if (
      nextMode ===
        'athlete' &&
      !isAthlete
    ) {
      return
    }

    setViewMode(
      nextMode
    )

    setActiveTab(
      'home'
    )
  }

  const selfMemberLink =
    useMemo(() => {
      return (
        accountMemberLinks.find(
          (link) =>
            link.relationship_type ===
            'self'
        ) ||
        accountMemberLinks[0] ||
        null
      )
    }, [
      accountMemberLinks,
    ])

  const linkedMember =
    useMemo(() => {
      if (
        !selfMemberLink
      ) {
        return null
      }

      return (
        members.find(
          (member) =>
            member.id ===
            selfMemberLink.member_id
        ) ||
        null
      )
    }, [
      selfMemberLink,
      members,
    ])

  const linkedTournamentEntries =
    useMemo(() => {
      if (!linkedMember) {
        return []
      }

      return allTournamentEntries.filter(
        (entry) =>
          entry.member_id ===
          linkedMember.id
      )
    }, [
      linkedMember,
      allTournamentEntries,
    ])

  const accountName =
    accountProfile?.display_name ||
    session?.user?.email ||
    'Account'

  if (loading) {
    return (
      <div className="mat-login-page">

        <div
          style={{
            textAlign:
              'center',
          }}
        >
          <img
            src="/mat-logo.jpg"
            alt="MAT"
            style={{
              width:
                '250px',
              marginBottom:
                '20px',
            }}
          />

          <div className="mat-muted">
            Loading...
          </div>
        </div>

      </div>
    )
  }

  if (!session) {
    return (
      <LoginPage />
    )
  }

  return (
    <div className="mat-app">

      <TopNav
        activeTab={
          activeTab
        }
        onChangeTab={
          setActiveTab
        }
        accountName={
          accountName
        }
        roles={
          roles
        }
        viewMode={
          viewMode
        }
        onChangeViewMode={
          handleViewModeChange
        }
        onLogout={
          handleLogout
        }
      />

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      <main className="mat-content">

        {viewMode ===
          'admin' && (
          <>
            {activeTab ===
              'home' && (
              <HomePage
                members={
                  members
                }
                tournaments={
                  tournaments
                }
                calendarEvents={
                  calendarEvents
                }
                announcements={
                  announcements
                }
                onNavigate={
                  setActiveTab
                }
              />
            )}

            {activeTab ===
              'new-member-guide' && (
              <NewMemberGuidePage
                onNavigate={
                  setActiveTab
                }
              />
            )}

            {activeTab ===
              'roster' && (
              <RosterPage
                members={
                  members
                }
                tournaments={
                  tournaments
                }
                allTournamentEntries={
                  allTournamentEntries
                }
                tournamentResults={
                  tournamentResults
                }
                onMembersChanged={() =>
                  loadMembers(
                    accountProfile?.roles
                  )
                }
              />
            )}

            {activeTab ===
              'coaches' && (
              <>
                <CoachesPage />

                <AdminPrivateLessonRequests />
              </>
            )}

            {activeTab ===
              'tournaments' && (
              <TournamentsPage
                members={
                  members
                }
                tournaments={
                  tournaments
                }
                allTournamentEntries={
                  allTournamentEntries
                }
                tournamentResults={
                  tournamentResults
                }
                onTournamentsChanged={
                  loadTournaments
                }
                onEntriesChanged={
                  loadAllTournamentEntries
                }
                onResultsChanged={
                  loadTournamentResults
                }
              />
            )}

            {activeTab ===
              'calendar' && (
              <CalendarPage
                calendarEvents={
                  calendarEvents
                }
                tournaments={
                  tournaments
                }
                onCalendarEventsChanged={
                  loadCalendarEvents
                }
                onTournamentsChanged={
                  loadTournaments
                }
              />
            )}

            {activeTab ===
              'announcements' && (
              <AnnouncementsPage
                announcements={
                  announcements
                }
                onAnnouncementsChanged={
                  loadAnnouncements
                }
              />
            )}

            {activeTab ===
              'financials' && (
              <FinancialsPage
                members={
                  members
                }
                tournaments={
                  tournaments
                }
                allTournamentEntries={
                  allTournamentEntries
                }
              />
            )}
          </>
        )}

        {viewMode ===
          'athlete' && (
          <>
            {activeTab ===
              'home' && (
              <AthleteHomePage
                member={
                  linkedMember
                }
                tournaments={
                  tournaments
                }
                tournamentEntries={
                  linkedTournamentEntries
                }
                tournamentResults={
                  tournamentResults
                }
                announcements={
                  announcements
                }
                onNavigate={
                  setActiveTab
                }
              />
            )}

            {activeTab ===
              'coaches' && (
              <AthleteCoachesPage
                accountId={
                  userId
                }
                member={
                  linkedMember
                }
              />
            )}

            {activeTab ===
              'tournaments' && (
              <AthleteTournamentsPage
                member={
                  linkedMember
                }
                tournaments={
                  tournaments
                }
                tournamentEntries={
                  linkedTournamentEntries
                }
                tournamentResults={
                  tournamentResults
                }
              />
            )}

            {activeTab ===
              'calendar' && (
              <AthleteCalendarPage
                calendarEvents={
                  calendarEvents
                }
                tournaments={
                  tournaments
                }
              />
            )}

            {activeTab ===
              'announcements' && (
              <AthleteAnnouncementsPage
                announcements={
                  announcements
                }
              />
            )}

            {activeTab ===
              'my-profile' &&
              linkedMember && (
                <AthleteProfileModal
                  member={
                    linkedMember
                  }
                  tournaments={
                    tournaments
                  }
                  allTournamentEntries={
                    allTournamentEntries
                  }
                  tournamentResults={
                    tournamentResults
                  }
                  onMembersChanged={() =>
                    loadMembers(
                      accountProfile?.roles
                    )
                  }
                  onClose={() =>
                    setActiveTab(
                      'home'
                    )
                  }
                />
              )}

            {activeTab ===
              'my-profile' &&
              !linkedMember && (
                <div className="mat-athlete-link-missing">

                  <h2>
                    Athlete Profile Not Linked
                  </h2>

                  <p>
                    This login has the
                    Athlete role, but it
                    is not currently
                    linked to a member
                    record.
                  </p>

                </div>
              )}

            {activeTab ===
              'new-member-guide' && (
              <NewMemberGuidePage
                onNavigate={
                  setActiveTab
                }
              />
            )}
          </>
        )}

      </main>

      <footer className="mat-footer">

        <div>
          Michigan Academy of Taekwondo
        </div>

        <div className="mat-footer-values">
          Discipline &nbsp; | &nbsp;
          Respect &nbsp; | &nbsp;
          Confidence &nbsp; | &nbsp;
          Community
        </div>

      </footer>

    </div>
  )
}

export default App