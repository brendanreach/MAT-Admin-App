import {
  Award,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Moon,
  ShieldCheck,
  Sun,
  Trophy,
  UserCircle2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './TopNav.css'

const NAV_ITEMS = {
  admin: [
    ['home', 'Home', Home],
    ['roster', 'Roster', Users],
    ['coaches', 'Coaches', UserRound],
    ['tournaments', 'Tournaments', Trophy],
    ['calendar', 'Calendar', CalendarDays],
    ['announcements', 'Announcements', Megaphone],
    ['messages', 'Messages', MessagesSquare],
    ['financials', 'Financials', BarChart3],
  ],
  coach: [
    ['home', 'Home', Home],
    ['lesson-requests', 'Lesson Requests', ClipboardList],
    ['calendar', 'Calendar', CalendarDays],
    ['announcements', 'Announcements', Megaphone],
    ['messages', 'Messages', MessagesSquare],
  ],
  athlete: [
    ['home', 'Home', Home],
    ['coaches', 'Coaches', UserRound],
    ['tournaments', 'Tournaments', Trophy],
    ['calendar', 'Calendar', CalendarDays],
    ['announcements', 'Announcements', Megaphone],
    ['messages', 'Messages', MessagesSquare],
    ['my-profile', 'My Profile', Award],
    ['new-member-guide', 'Team Guide', ShieldCheck],
  ],
}

function normalizeRoles(roles) {
  return Array.isArray(roles)
    ? roles.filter(Boolean).map((role) => String(role).trim().toLowerCase())
    : []
}

function initialTheme() {
  const saved = localStorage.getItem('mat-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function TopNav({
  activeTab,
  onChangeTab,
  accountName,
  roles = [],
  viewMode = 'athlete',
  onChangeViewMode,
  onLogout,
}) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(initialTheme)
  const accountRef = useRef(null)

  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles])
  const views = useMemo(
    () => ['admin', 'coach', 'athlete'].filter((role) => normalizedRoles.includes(role)),
    [normalizedRoles],
  )
  const items = NAV_ITEMS[viewMode] || NAV_ITEMS.athlete

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('mat-theme', theme)
  }, [theme])

  useEffect(() => {
    const closeOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [activeTab, viewMode])

  const goTo = (tab) => {
    onChangeTab(tab)
    setMobileOpen(false)
  }

  const switchView = (view) => {
    onChangeViewMode?.(view)
    setAccountOpen(false)
    setMobileOpen(false)
  }

  const roleLabel = views.length
    ? views.map((view) => view[0].toUpperCase() + view.slice(1)).join(' + ')
    : 'Account'

  const renderItem = ([id, label, Icon], mobile = false) => (
    <button
      key={id}
      type="button"
      className={`${mobile ? 'mat-mobile-nav-button' : 'mat-nav-button'}${activeTab === id ? ' active' : ''}`}
      aria-current={activeTab === id ? 'page' : undefined}
      onClick={() => goTo(id)}
    >
      <Icon className={mobile ? 'mat-mobile-nav-icon' : 'mat-nav-icon'} />
      <span>{label}</span>
    </button>
  )

  return (
    <header className="mat-navbar">
      <div className="mat-navbar-inner">
        <button type="button" className="mat-brand" onClick={() => goTo('home')}>
          <img className="mat-logo" src="/mat-logo.jpg" alt="Michigan Academy of Taekwondo" />
        </button>

        <nav className="mat-nav-links" aria-label="Primary navigation">
          {items.map((item) => renderItem(item))}
        </nav>

        <div className="mat-navbar-actions">
          <button
            type="button"
            className="mat-theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
          </button>

          <button
            type="button"
            className="mat-mobile-menu-toggle"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mat-mobile-navigation"
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="mat-account-menu-wrap" ref={accountRef}>
            <button
              type="button"
              className="mat-account-menu-button"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((current) => !current)}
            >
              <span className="mat-account-icon"><UserCircle2 size={25} /></span>
              <span className="mat-account-name-wrap">
                <span className="mat-account-email">{accountName}</span>
                <span className="mat-account-role-label">{roleLabel}</span>
              </span>
              <ChevronDown className="mat-account-chevron" size={16} />
            </button>

            {accountOpen && (
              <div className="mat-account-dropdown">
                <div className="mat-account-dropdown-header">
                  <strong>{accountName}</strong>
                  <span>{roleLabel}</span>
                </div>

                {views.length > 1 && (
                  <div className="mat-view-switcher">
                    <div className="mat-view-switcher-label">Switch View</div>
                    {views.map((view) => (
                      <button
                        key={view}
                        type="button"
                        className={viewMode === view ? 'active' : ''}
                        onClick={() => switchView(view)}
                      >
                        {view === 'admin' ? <ShieldCheck size={17} /> : view === 'coach' ? <UserRound size={17} /> : <Award size={17} />}
                        <span>{view[0].toUpperCase() + view.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button type="button" className="mat-account-dropdown-logout" onClick={onLogout}>
                  <LogOut size={17} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="mat-mobile-navigation" className={`mat-mobile-navigation${mobileOpen ? ' open' : ''}`}>
        <div className="mat-mobile-navigation-heading">
          <span>Navigation</span>
          <strong>{viewMode[0].toUpperCase() + viewMode.slice(1)} View</strong>
        </div>
        <nav className="mat-mobile-navigation-grid" aria-label="Mobile navigation">
          {items.map((item) => renderItem(item, true))}
        </nav>
      </div>
    </header>
  )
}
