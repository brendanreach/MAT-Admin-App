import {
  Award,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  Megaphone,
  ShieldCheck,
  Trophy,
  UserCircle2,
  UserRound,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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

function TopNav({
  activeTab,
  onChangeTab,
  accountName,
  roles = [],
  viewMode,
  onChangeViewMode,
  onLogout,
}) {
  const [
    accountMenuOpen,
    setAccountMenuOpen,
  ] = useState(false)

  const accountRef =
    useRef(null)

  const normalizedRoles =
    useMemo(
      () =>
        normalizeRoles(
          roles
        ),
      [roles]
    )

  const isAdmin =
    normalizedRoles.includes(
      'admin'
    )

  const isAthlete =
    normalizedRoles.includes(
      'athlete'
    )

  const isCoach =
    normalizedRoles.includes(
      'coach'
    )

  const availableViews =
    useMemo(() => {
      const views = []

      if (isAdmin) {
        views.push('admin')
      }

      if (isCoach) {
        views.push('coach')
      }

      if (isAthlete) {
        views.push('athlete')
      }

      return views
    }, [
      isAdmin,
      isCoach,
      isAthlete,
    ])

  useEffect(() => {
    function handleOutsideClick(
      event
    ) {
      if (
        accountRef.current &&
        !accountRef.current.contains(
          event.target
        )
      ) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  function getRoleLabel() {
    const labels = []

    if (isAdmin) {
      labels.push('Admin')
    }

    if (isCoach) {
      labels.push('Coach')
    }

    if (isAthlete) {
      labels.push('Athlete')
    }

    if (labels.length === 0) {
      return 'Account'
    }

    return labels.join(' + ')
  }

  function changeView(
    nextMode
  ) {
    onChangeViewMode(
      nextMode
    )

    setAccountMenuOpen(
      false
    )
  }

  return (
    <header className="mat-navbar">

      <div className="mat-navbar-inner">

        <div className="mat-brand">

          <img
            src="/mat-logo.jpg"
            alt="Michigan Academy of Taekwondo"
            className="mat-logo"
          />

        </div>

        <nav className="mat-nav-links">

          <button
            type="button"
            className={`mat-nav-button ${
              activeTab === 'home'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              onChangeTab(
                'home'
              )
            }
          >
            <Home className="mat-nav-icon" />

            <span>
              Home
            </span>
          </button>

          {viewMode ===
            'admin' && (
            <>
              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'roster'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'roster'
                  )
                }
              >
                <Users className="mat-nav-icon" />

                <span>
                  Roster
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'coaches'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'coaches'
                  )
                }
              >
                <UserRound className="mat-nav-icon" />

                <span>
                  Coaches
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'tournaments'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'tournaments'
                  )
                }
              >
                <Trophy className="mat-nav-icon" />

                <span>
                  Tournaments
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'calendar'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'calendar'
                  )
                }
              >
                <CalendarDays className="mat-nav-icon" />

                <span>
                  Calendar
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'announcements'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'announcements'
                  )
                }
              >
                <Megaphone className="mat-nav-icon" />

                <span>
                  Announcements
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'financials'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'financials'
                  )
                }
              >
                <BarChart3 className="mat-nav-icon" />

                <span>
                  Financials
                </span>
              </button>
            </>
          )}

          {viewMode ===
            'coach' && (
            <>
              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'lesson-requests'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'lesson-requests'
                  )
                }
              >
                <ClipboardList className="mat-nav-icon" />

                <span>
                  Lesson Requests
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'calendar'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'calendar'
                  )
                }
              >
                <CalendarDays className="mat-nav-icon" />

                <span>
                  Calendar
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'announcements'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'announcements'
                  )
                }
              >
                <Megaphone className="mat-nav-icon" />

                <span>
                  Announcements
                </span>
              </button>
            </>
          )}

          {viewMode ===
            'athlete' && (
            <>
              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'coaches'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'coaches'
                  )
                }
              >
                <UserRound className="mat-nav-icon" />

                <span>
                  Coaches
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'tournaments'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'tournaments'
                  )
                }
              >
                <Trophy className="mat-nav-icon" />

                <span>
                  Tournaments
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'calendar'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'calendar'
                  )
                }
              >
                <CalendarDays className="mat-nav-icon" />

                <span>
                  Calendar
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'announcements'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'announcements'
                  )
                }
              >
                <Megaphone className="mat-nav-icon" />

                <span>
                  Announcements
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'my-profile'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'my-profile'
                  )
                }
              >
                <Award className="mat-nav-icon" />

                <span>
                  My Profile
                </span>
              </button>

              <button
                type="button"
                className={`mat-nav-button ${
                  activeTab ===
                  'new-member-guide'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onChangeTab(
                    'new-member-guide'
                  )
                }
              >
                <ShieldCheck className="mat-nav-icon" />

                <span>
                  Team Guide
                </span>
              </button>
            </>
          )}

        </nav>

        <div
          className="mat-account mat-account-menu-wrap"
          ref={
            accountRef
          }
        >

          <button
            type="button"
            className="mat-account-menu-button"
            onClick={() =>
              setAccountMenuOpen(
                (
                  current
                ) =>
                  !current
              )
            }
          >

            <div className="mat-account-icon">

              <UserCircle2
                size={25}
              />

            </div>

            <div className="mat-account-name-wrap">

              <span className="mat-account-email">
                {accountName}
              </span>

              <span className="mat-account-role-label">
                {getRoleLabel()}
              </span>

            </div>

            <ChevronDown
              size={16}
              className={`mat-account-chevron ${
                accountMenuOpen
                  ? 'open'
                  : ''
              }`}
            />

          </button>

          {accountMenuOpen && (
            <div className="mat-account-dropdown">

              <div className="mat-account-dropdown-header">

                <strong>
                  {accountName}
                </strong>

                <span>
                  {getRoleLabel()}
                </span>

              </div>

              {availableViews.length >
                1 && (
                <div className="mat-view-switcher">

                  <div className="mat-view-switcher-label">
                    Switch View
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      className={
                        viewMode ===
                        'admin'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        changeView(
                          'admin'
                        )
                      }
                    >
                      <ShieldCheck
                        size={17}
                      />

                      <div>
                        <strong>
                          Admin
                        </strong>

                        <span>
                          Manage the team
                        </span>
                      </div>
                    </button>
                  )}

                  {isCoach && (
                    <button
                      type="button"
                      className={
                        viewMode ===
                        'coach'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        changeView(
                          'coach'
                        )
                      }
                    >
                      <UserRound
                        size={17}
                      />

                      <div>
                        <strong>
                          Coach
                        </strong>

                        <span>
                          Manage my coaching
                        </span>
                      </div>
                    </button>
                  )}

                  {isAthlete && (
                    <button
                      type="button"
                      className={
                        viewMode ===
                        'athlete'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        changeView(
                          'athlete'
                        )
                      }
                    >
                      <Award
                        size={17}
                      />

                      <div>
                        <strong>
                          Athlete
                        </strong>

                        <span>
                          View my athlete account
                        </span>
                      </div>
                    </button>
                  )}

                </div>
              )}

              <button
                type="button"
                className="mat-account-dropdown-logout"
                onClick={
                  onLogout
                }
              >
                <LogOut
                  size={17}
                />

                <span>
                  Log Out
                </span>
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  )
}

export default TopNav