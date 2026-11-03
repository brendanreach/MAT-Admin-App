import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from './lib/supabase.js'
import { attachPosterUrls } from './lib/tournamentPosters.js'
import { useUnreadDirectMessages } from './lib/unreadDirectMessages.js'
import { usePendingResultSubmissionCount } from './lib/resultSubmissions.js'

import LoginPage from './components/LoginPage.jsx'
import AccessPendingPage from './components/AccessPendingPage.jsx'
import TopNav from './components/TopNav.jsx'
import HomePage from './components/HomePage.jsx'
import NewMemberGuidePage from './components/NewMemberGuidePage.jsx'
import AthleteHomePage from './components/AthleteHomePage.jsx'
import AthleteProfileModal from './components/AthleteProfileModal.jsx'
import AthleteCalendarPage from './components/AthleteCalendarPage.jsx'
import AthleteTournamentsPage from './components/AthleteTournamentsPage.jsx'
import AthleteCoachesPage from './components/AthleteCoachesPage.jsx'
import RosterPage from './components/RosterPage.jsx'
import AccountAthleteAssignments from './components/AccountAthleteAssignments.jsx'
import CoachesPage from './components/CoachesPage.jsx'
import AdminPrivateLessonRequests from './components/AdminPrivateLessonRequests.jsx'
import TournamentsPage from './components/TournamentsPage.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import FinancialsPage from './components/FinancialsPage.jsx'
import MessagesPage from './components/MessagesPage.jsx'
import AthleteSwitcher from './components/AthleteSwitcher.jsx'
import ResultApprovalsPage from './components/ResultApprovalsPage.jsx'

function activeAthleteStorageKey(userId) {
  return `mat-active-athlete-${userId}`
}

function readStoredAthleteId(userId) {
  try {
    return localStorage.getItem(activeAthleteStorageKey(userId))
  } catch {
    return null
  }
}

function storeAthleteId(userId, memberId) {
  try {
    localStorage.setItem(activeAthleteStorageKey(userId), memberId)
  } catch {
    // Remembering the choice is a convenience only.
  }
}

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
    accountLoading,
    setAccountLoading,
  ] = useState(false)

  const [
    accountProfile,
    setAccountProfile,
  ] = useState(null)

  const [
    accountMemberLinks,
    setAccountMemberLinks,
  ] = useState([])

  // The athlete picked in this session, tagged with the account that
  // picked it so a different login never inherits the choice.
  const [
    athleteSelection,
    setAthleteSelection,
  ] = useState(null)

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
    message,
    setMessage,
  ] = useState('')

  const userId =
    session?.user?.id ||
    null

  const {
    count: unreadMessageCount,
    refresh: refreshUnreadMessages,
  } = useUnreadDirectMessages(
    userId
  )

  // Show the unread count in the browser tab, e.g. "(2) MAT Competition Team".
  useEffect(() => {
    const baseTitle =
      document.title.replace(
        /^\(\d+\)\s*/,
        ''
      )

    document.title =
      unreadMessageCount > 0
        ? `(${unreadMessageCount}) ${baseTitle}`
        : baseTitle
  }, [
    unreadMessageCount,
  ])

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
    setAccountLoading(false)
    setAccountMemberLinks([])
    setMembers([])
    setTournaments([])
    setAllTournamentEntries([])
    setTournamentResults([])
    setCalendarEvents([])
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

  const approvedRoles = [
    'admin',
    'coach',
    'athlete',
  ]

  const hasApprovedRole =
    roles.some((role) =>
      approvedRoles.includes(role)
    )

  const isAdmin =
    roles.includes(
      'admin'
    )

  const isCoach =
    roles.includes(
      'coach'
    )

  const isAthlete =
    roles.includes(
      'athlete'
    )

  const {
    count: pendingApprovalCount,
    refresh: refreshPendingApprovals,
  } = usePendingResultSubmissionCount(
    isAdmin
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
            'coach' &&
          isCoach
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

        if (isCoach) {
          return 'coach'
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
    isCoach,
    isAthlete,
  ])

  async function initializeSignedInUser() {
    setMessage('')
    setAccountLoading(true)

    const profile =
      await loadAccountProfile()

    const approvedRoles = normalizeRoles(profile?.roles)
    const hasApprovedRole = approvedRoles.some((role) =>
      ['admin', 'coach', 'athlete'].includes(role)
    )

    if (!hasApprovedRole) {
      setMembers([])
      setTournaments([])
      setAllTournamentEntries([])
      setTournamentResults([])
      setCalendarEvents([])
        await loadAccountMemberLinks()
      setAccountLoading(false)
      return
    }

    await Promise.all([
      loadMembers(
        profile?.roles
      ),
      loadTournaments(),
      loadAllTournamentEntries(),
      loadTournamentResults(),
      loadCalendarEvents(),
      loadAccountMemberLinks(),
    ])

    setAccountLoading(false)
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

    // Admins and coaches see the full roster; athletes see
    // the limited public profiles.
    const userIsStaff =
      normalizedRoles.includes(
        'admin'
      ) ||
      normalizedRoles.includes(
        'coach'
      )

    const source =
      userIsStaff
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
      await attachPosterUrls(
        data || []
      )
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
        'coach' &&
      !isCoach
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

  // Every athlete this account is linked to, with the account's own
  // athlete record (relationship "self") listed first.
  const linkedAthletes =
    useMemo(() => {
      const orderedLinks = [
        ...accountMemberLinks.filter(
          (link) =>
            link.relationship_type ===
            'self'
        ),
        ...accountMemberLinks.filter(
          (link) =>
            link.relationship_type !==
            'self'
        ),
      ]

      const seen = new Set()

      return orderedLinks
        .map((link) =>
          members.find(
            (member) =>
              member.id ===
              link.member_id
          )
        )
        .filter((member) => {
          if (
            !member ||
            seen.has(member.id)
          ) {
            return false
          }

          seen.add(member.id)
          return true
        })
    }, [
      accountMemberLinks,
      members,
    ])

  const storedAthleteId =
    useMemo(
      () =>
        userId
          ? readStoredAthleteId(userId)
          : null,
      [userId]
    )

  const selectedAthleteId =
    athleteSelection?.userId === userId
      ? athleteSelection.memberId
      : storedAthleteId

  const linkedMember =
    linkedAthletes.find(
      (member) =>
        String(member.id) ===
        String(selectedAthleteId)
    ) ||
    linkedAthletes[0] ||
    null

  function handleAthleteChange(
    memberId
  ) {
    setAthleteSelection({
      userId,
      memberId,
    })
    storeAthleteId(userId, memberId)
  }

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

  if (accountLoading) {
    return (
      <div className="mat-login-page">
        <div style={{ textAlign: 'center' }}>
          <img
            src="/mat-logo.jpg"
            alt="MAT"
            style={{ width: '250px', marginBottom: '20px' }}
          />
          <div className="mat-muted">
            Checking account access...
          </div>
        </div>
      </div>
    )
  }

  if (!hasApprovedRole) {
    return (
      <AccessPendingPage
        email={session.user?.email}
        onLogout={handleLogout}
      />
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
        badgeCounts={{
          messages:
            unreadMessageCount,
          approvals:
            pendingApprovalCount,
        }}
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
                allTournamentEntries={
                  allTournamentEntries
                }
                calendarEvents={
                  calendarEvents
                }
                accountName={
                  accountName
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
              <>
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
                <AccountAthleteAssignments
                  members={members}
                  onChanged={async () => {
                    await loadAccountMemberLinks()
                    await loadAccountProfile()
                  }}
                />
              </>
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
                members={
                  members
                }
                showPrivateLessons
                onCalendarEventsChanged={
                  loadCalendarEvents
                }
                onTournamentsChanged={
                  loadTournaments
                }
              />
            )}

            {activeTab ===
              'approvals' && (
              <ResultApprovalsPage
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
                onReviewed={() =>
                  Promise.all([
                    loadAllTournamentEntries(),
                    loadTournamentResults(),
                    refreshPendingApprovals(),
                  ])
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
              />
            )}
          </>
        )}

        {viewMode ===
          'athlete' && (
          <>
            <AthleteSwitcher
              athletes={
                linkedAthletes
              }
              activeAthleteId={
                linkedMember?.id
              }
              onChange={
                handleAthleteChange
              }
            />

            {activeTab ===
              'home' && (
              <AthleteHomePage
                key={
                  linkedMember?.id
                }
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
                onNavigate={
                  setActiveTab
                }
              />
            )}

            {activeTab ===
              'coaches' && (
              <AthleteCoachesPage
                key={
                  linkedMember?.id
                }
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
                key={
                  linkedMember?.id
                }
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
                onEntriesChanged={
                  loadAllTournamentEntries
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
              'my-profile' &&
              linkedMember && (
                <AthleteProfileModal
                  key={
                    linkedMember.id
                  }
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


        {viewMode ===
          'coach' && (
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
                allTournamentEntries={
                  allTournamentEntries
                }
                calendarEvents={
                  calendarEvents
                }
                accountName={
                  accountName
                }
                onNavigate={
                  setActiveTab
                }
                view="coach"
                canManageCarousel={
                  false
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
                canEdit={
                  false
                }
              />
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
              'lesson-requests' && (
              <AdminPrivateLessonRequests />
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
                members={
                  members
                }
                showPrivateLessons
                readOnly
              />
            )}
          </>
        )}

        {activeTab === 'messages' && (
          <MessagesPage
            accountId={userId}
            roles={roles}
            unreadMessageCount={
              unreadMessageCount
            }
            onReadStateChanged={
              refreshUnreadMessages
            }
          />
        )}
      </main>

      <footer className="mat-footer">

        <div>
          Michigan Academy of Taekwondo
        </div>

        <div className="mat-footer-values">
          Courtesy &nbsp; | &nbsp;
          Integrity &nbsp; | &nbsp;
          Perseverance &nbsp; | &nbsp;
          Self-Control &nbsp; | &nbsp;
          Indomitable Spirit
        </div>

      </footer>

    </div>
  )
}

export default App