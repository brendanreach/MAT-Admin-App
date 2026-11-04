import './NewMemberGuidePage.css'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Compass,
  ExternalLink,
  GraduationCap,
  Info,
  Scale,
  Search,
  ShieldCheck,
  Trophy,
} from 'lucide-react'

import {
  formOrganizations,
  getSparringWeights,
  guideRuleVersion,
  nonUsatkdRegistrationNote,
  registrationPhases,
  sparringDivisions,
  terminology,
  tournamentDayGroups,
} from '../data/memberGuide'

const TABS = [
  { id: 'start', label: 'Start Here', icon: Compass },
  { id: 'registration', label: 'Registration', icon: ClipboardList },
  { id: 'forms', label: 'Forms', icon: GraduationCap },
  { id: 'sparring', label: 'Sparring', icon: Scale },
  { id: 'tournament-day', label: 'Tournament Day', icon: Trophy },
  { id: 'glossary', label: 'Glossary', icon: BookOpen },
]

const QUICK_LINKS = [
  { tab: 'registration', title: 'Sign up for a tournament', text: 'Step-by-step registration, from Sport:80 to the deadline.' },
  { tab: 'forms', title: 'Which forms do I need?', text: 'Required poomsae by organization, belt and age division.' },
  { tab: 'sparring', title: 'Find a weight class', text: 'Sparring weight classes by age, level and gender.' },
  { tab: 'tournament-day', title: 'Get ready for the day', text: 'A checklist for the night before and the venue.' },
  { tab: 'glossary', title: 'Learn the lingo', text: 'Poomsae, kyorugi, geup, staging and more.' },
]

const TAB_STORAGE_KEY = 'mat-guide-tab'

function readStoredTab() {
  try {
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY)
    return TABS.some((tab) => tab.id === stored) ? stored : 'start'
  } catch {
    return 'start'
  }
}

function SectionIntro({ eyebrow, title, children }) {
  return (
    <header className="mat-guide-intro">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </header>
  )
}

function Callout({ icon: Icon = Info, children }) {
  return (
    <div className="mat-guide-callout">
      <Icon size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

function PillGroup({ label, options, value, onChange }) {
  return (
    <div className="mat-guide-pill-group">
      <span>{label}</span>
      <div role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={value === option.value ? 'active' : ''}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StartHere({ onOpenTab }) {
  return (
    <>
      <SectionIntro eyebrow="Welcome to the team" title="Where do you want to start?">
        Pick a topic below. Everything in this guide is also in the tabs above.
      </SectionIntro>

      <div className="mat-guide-quick-grid">
        {QUICK_LINKS.map((link) => {
          const tab = TABS.find((item) => item.id === link.tab)
          const Icon = tab.icon
          return (
            <button key={link.tab} type="button" className="mat-guide-quick-card" onClick={() => onOpenTab(link.tab)}>
              <span className="mat-guide-quick-icon"><Icon size={20} /></span>
              <span className="mat-guide-quick-text">
                <strong>{link.title}</strong>
                <small>{link.text}</small>
              </span>
              <ArrowRight size={18} className="mat-guide-quick-arrow" aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <Callout icon={ShieldCheck}>
        <strong>{guideRuleVersion.label}</strong> · checked {guideRuleVersion.verified}. {guideRuleVersion.note}
      </Callout>
    </>
  )
}

// First step number of each phase, so numbering runs on across phases.
const PHASE_START_NUMBERS = registrationPhases.reduce(
  (starts, phase, index) => [...starts, index === 0 ? 1 : starts[index - 1] + registrationPhases[index - 1].steps.length],
  []
)

function RegistrationGuide() {
  return (
    <>
      <SectionIntro eyebrow="Getting registered" title="Signing up for a tournament">
        Most USA Taekwondo events register through Sport:80. Work through these in order.
      </SectionIntro>

      <div className="mat-guide-phases">
        {registrationPhases.map((phase, phaseIndex) => (
          <section key={phase.id} className="mat-guide-phase">
            <h3>{phase.title}</h3>
            <ol>
              {phase.steps.map((step, stepIndex) => {
                return (
                  <li key={step.title}>
                    <span className="mat-guide-step-number">{PHASE_START_NUMBERS[phaseIndex] + stepIndex}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.text}</p>
                      {step.linkUrl && (
                        <a href={step.linkUrl} target="_blank" rel="noopener noreferrer" className="mat-guide-link">
                          {step.linkLabel}
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>

      <Callout>{nonUsatkdRegistrationNote}</Callout>
    </>
  )
}

function FormsGuide() {
  const [orgId, setOrgId] = useState(formOrganizations[0].id)
  const [categoryId, setCategoryId] = useState(formOrganizations[0].categories[0]?.id || '')
  const [search, setSearch] = useState('')

  const org = formOrganizations.find((item) => item.id === orgId)
  const category = org.categories.find((item) => item.id === categoryId) || org.categories[0]

  const query = search.trim().toLowerCase()
  const items = (category?.items || []).filter((item) =>
    !query || [item.title, item.detail, ...item.forms].join(' ').toLowerCase().includes(query)
  )

  function changeOrg(nextOrgId) {
    const nextOrg = formOrganizations.find((item) => item.id === nextOrgId)
    setOrgId(nextOrgId)
    setCategoryId(nextOrg.categories[0]?.id || '')
    setSearch('')
  }

  return (
    <>
      <SectionIntro eyebrow="Poomsae reference" title="Required forms">
        Form lists differ a little between organizations. Choose the one running your tournament.
      </SectionIntro>

      <div className="mat-guide-org-tabs" role="tablist" aria-label="Organization">
        {formOrganizations.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === orgId}
            className={item.id === orgId ? 'active' : ''}
            onClick={() => changeOrg(item.id)}
          >
            <strong>{item.short}</strong>
            <small>{item.label}</small>
          </button>
        ))}
      </div>

      <p className="mat-guide-org-description">{org.description}</p>

      {org.categories.length === 0 ? (
        <div className="mat-guide-pending">
          <GraduationCap size={28} aria-hidden="true" />
          <strong>{org.label} form lists are being added</strong>
          <p>Until then, check the tournament information packet or ask a MAT coach which forms you need.</p>
        </div>
      ) : (
        <>
          <div className="mat-guide-form-filters">
            <PillGroup
              label="Category"
              options={org.categories.map((item) => ({ value: item.id, label: item.label }))}
              value={category.id}
              onChange={(value) => { setCategoryId(value); setSearch('') }}
            />
            <label className="mat-guide-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search a belt, division or form"
                aria-label="Search forms"
              />
            </label>
          </div>

          {category.note && <Callout>{category.note}</Callout>}

          <div className="mat-guide-form-grid">
            {items.map((item, index) => (
              <article key={`${item.title}-${item.detail}-${index}`} className="mat-guide-form-card">
                <header>
                  <span>{category.cardLabel}</span>
                  <h3>{item.title}</h3>
                  <small>{item.detail}</small>
                </header>
                <ul>
                  {item.forms.map((form) => <li key={form}>{form}</li>)}
                </ul>
              </article>
            ))}
          </div>

          {items.length === 0 && (
            <p className="mat-guide-empty">Nothing matches “{search.trim()}”.</p>
          )}

          <Callout>
            These are the full pools a form can be drawn from. Each tournament announces its designated forms separately.
          </Callout>
        </>
      )}
    </>
  )
}

function SparringGuide() {
  const [division, setDivision] = useState('cadet')
  const [competitionClass, setCompetitionClass] = useState('world')
  const [gender, setGender] = useState('male')

  const selectedDivision = sparringDivisions.find((item) => item.id === division)
  const availableClasses = selectedDivision?.availableClasses || []
  const level = availableClasses.includes(competitionClass) ? competitionClass : availableClasses[0] || 'aspiring'
  const weights = getSparringWeights(division, level, gender)

  return (
    <>
      <SectionIntro eyebrow="Kyorugi reference" title="Sparring weight classes">
        USA Taekwondo weight classes. Pick the athlete’s age division, level and gender.
      </SectionIntro>

      <div className="mat-guide-sparring-controls">
        <PillGroup
          label="Age division"
          options={sparringDivisions.map((item) => ({ value: item.id, label: `${item.label} · ${item.ages}` }))}
          value={division}
          onChange={setDivision}
        />
        <div className="mat-guide-sparring-row">
          <PillGroup
            label="Level"
            options={[
              ...(availableClasses.includes('world') ? [{ value: 'world', label: 'World Class' }] : []),
              ...(availableClasses.includes('aspiring') ? [{ value: 'aspiring', label: 'Aspiring' }] : []),
            ]}
            value={level}
            onChange={setCompetitionClass}
          />
          <PillGroup
            label="Gender"
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
            value={gender}
            onChange={setGender}
          />
        </div>
      </div>

      <section className="mat-guide-weight-panel" aria-live="polite">
        <h3>
          {selectedDivision?.label} · {level === 'world' ? 'World Class' : 'Aspiring'} · {gender === 'male' ? 'Male' : 'Female'}
        </h3>
        <p>Competition age {selectedDivision?.ages}</p>
        <ul>
          {weights.map((weight) => <li key={weight}>{weight}</li>)}
        </ul>
      </section>

      <Callout icon={ShieldCheck}>
        Weight classes are competition divisions, not target body weights. Talk with your MAT coach about the right division.
      </Callout>
    </>
  )
}

function TournamentDayGuide() {
  return (
    <>
      <SectionIntro eyebrow="Competition prep" title="Tournament day checklist">
        What every athlete and parent should know before competing.
      </SectionIntro>

      <div className="mat-guide-day-grid">
        {tournamentDayGroups.map((group) => (
          <section key={group.id} className="mat-guide-day-card">
            <h3><CalendarCheck size={18} aria-hidden="true" />{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}><CheckCircle2 size={18} aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function Glossary() {
  const [search, setSearch] = useState('')
  const terms = useMemo(() => {
    const query = search.trim().toLowerCase()
    const sorted = [...terminology].sort((a, b) => a.term.localeCompare(b.term))
    if (!query) return sorted
    return sorted.filter((item) => `${item.term} ${item.definition}`.toLowerCase().includes(query))
  }, [search])

  return (
    <>
      <SectionIntro eyebrow="Competition vocabulary" title="Glossary">
        Words you’ll hear at MAT, at tournaments and in staging.
      </SectionIntro>

      <label className="mat-guide-search mat-guide-glossary-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search terms"
          aria-label="Search terms"
        />
      </label>

      <dl className="mat-guide-terms">
        {terms.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.definition}</dd>
          </div>
        ))}
      </dl>

      {terms.length === 0 && <p className="mat-guide-empty">No terms match “{search.trim()}”.</p>}
    </>
  )
}

export default function NewMemberGuidePage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState(readStoredTab)

  function openTab(tabId) {
    setActiveTab(tabId)
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, tabId)
    } catch {
      // Storage can be unavailable (private mode); the tab still switches.
    }
  }

  function handleTabKeyDown(event) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = TABS.findIndex((tab) => tab.id === activeTab)
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    openTab(next.id)
    document.getElementById(`mat-guide-tab-${next.id}`)?.focus()
  }

  return (
    <div className="mat-guide">
      <button type="button" className="mat-guide-back" onClick={() => onNavigate('home')}>
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <section className="mat-guide-hero">
        <div className="mat-guide-hero-icon"><GraduationCap size={28} /></div>
        <div>
          <div className="mat-eyebrow">Michigan Academy of Taekwondo</div>
          <h1>New Member Guide</h1>
          <p>Everything you need for your first tournaments, one topic at a time.</p>
        </div>
      </section>

      <div className="mat-guide-tabs" role="tablist" aria-label="Guide topics" onKeyDown={handleTabKeyDown}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const selected = tab.id === activeTab
          return (
            <button
              key={tab.id}
              id={`mat-guide-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="mat-guide-panel"
              tabIndex={selected ? 0 : -1}
              className={selected ? 'active' : ''}
              onClick={() => openTab(tab.id)}
            >
              <Icon size={17} aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <section
        id="mat-guide-panel"
        className="mat-guide-panel"
        role="tabpanel"
        aria-labelledby={`mat-guide-tab-${activeTab}`}
      >
        {activeTab === 'start' && <StartHere onOpenTab={openTab} />}
        {activeTab === 'registration' && <RegistrationGuide />}
        {activeTab === 'forms' && <FormsGuide />}
        {activeTab === 'sparring' && <SparringGuide />}
        {activeTab === 'tournament-day' && <TournamentDayGuide />}
        {activeTab === 'glossary' && <Glossary />}
      </section>
    </div>
  )
}
