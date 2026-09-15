import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Info,
  Scale,
  ShieldCheck,
  Trophy,
} from 'lucide-react'

import {
  getSparringWeights,
  guideRuleVersion,
  recognizedBlackBeltPoomsae,
  recognizedColorBeltPoomsae,
  sparringDivisions,
  terminology,
  tournamentDayGuide,
  tournamentRegistrationGuide,
  traditionalPoomsae,
} from '../data/memberGuide'

function FormsGuide() {
  const [formType, setFormType] = useState('recognized-black')
  const [search, setSearch] = useState('')

  const selectedData = useMemo(() => {
    if (formType === 'recognized-color') {
      return recognizedColorBeltPoomsae.map((item) => ({
        title: item.rank,
        detail: item.geup,
        forms: item.forms,
      }))
    }

    if (formType === 'traditional') {
      return traditionalPoomsae.map((item) => ({
        title: item.rank,
        detail: item.detail,
        forms: item.forms,
      }))
    }

    return recognizedBlackBeltPoomsae.map((item) => ({
      title: item.divisions.join(' / '),
      detail: item.ages,
      forms: item.forms,
    }))
  }, [formType])

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return selectedData
    }

    return selectedData.filter((item) => {
      const searchableText = [
        item.title,
        item.detail,
        ...item.forms,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [search, selectedData])

  return (
    <>
      <div className="mat-guide-rule-controls">
        <label>
          Form Guide
          <select
            value={formType}
            onChange={(event) =>
              setFormType(event.target.value)
            }
          >
            <option value="recognized-black">
              Recognized - Black Belt
            </option>

            <option value="recognized-color">
              Recognized - Color Belt
            </option>

            <option value="traditional">
              Traditional Poomsae
            </option>
          </select>
        </label>

        <label>
          Search Rank or Division
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Example: Cadet, Red, 1st Dan..."
          />
        </label>
      </div>

      <div className="mat-guide-info-box">
        <Info size={16} />

        <span>
          The compulsory poomsae pool is not always the
          same as the forms performed at a specific
          tournament. Event-specific designated poomsae
          may be announced separately in the tournament
          information.
        </span>
      </div>

      <div className="mat-guide-rule-grid">
        {filteredData.map((item, index) => (
          <article
            className="mat-guide-rule-card"
            key={`${item.title}-${item.detail}-${index}`}
          >
            <div className="mat-guide-rule-card-heading">
              <div>
                <span>Division / Rank</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
            </div>

            <div className="mat-guide-form-chips">
              {item.forms.map((form) => (
                <span key={form}>{form}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="mat-guide-info-box">
          <Info size={16} />
          <span>
            No matching rank or division was found.
          </span>
        </div>
      )}
    </>
  )
}

function SparringWeightGuide() {
  const [division, setDivision] = useState('cadet')
  const [competitionClass, setCompetitionClass] =
    useState('world')
  const [gender, setGender] = useState('male')

  const selectedDivision = sparringDivisions.find(
    (item) => item.id === division
  )

  const availableClasses =
    selectedDivision?.availableClasses || []

  const effectiveCompetitionClass =
    availableClasses.includes(competitionClass)
      ? competitionClass
      : availableClasses[0] || 'aspiring'

  const weights = getSparringWeights(
    division,
    effectiveCompetitionClass,
    gender
  )

  function handleDivisionChange(event) {
    const newDivision = event.target.value
    setDivision(newDivision)

    const nextDivision = sparringDivisions.find(
      (item) => item.id === newDivision
    )

    if (
      !nextDivision?.availableClasses.includes(
        competitionClass
      )
    ) {
      setCompetitionClass(
        nextDivision?.availableClasses[0] || 'aspiring'
      )
    }
  }

  return (
    <>
      <div className="mat-guide-weight-controls">
        <label>
          Age Division
          <select
            value={division}
            onChange={handleDivisionChange}
          >
            {sparringDivisions.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.label} ({item.ages})
              </option>
            ))}
          </select>
        </label>

        <label>
          Competition Level
          <select
            value={effectiveCompetitionClass}
            onChange={(event) =>
              setCompetitionClass(event.target.value)
            }
          >
            {availableClasses.includes('world') && (
              <option value="world">
                World Class
              </option>
            )}

            {availableClasses.includes('aspiring') && (
              <option value="aspiring">
                Aspiring
              </option>
            )}
          </select>
        </label>

        <label>
          Gender Division
          <select
            value={gender}
            onChange={(event) =>
              setGender(event.target.value)
            }
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
      </div>

      <div className="mat-guide-weight-result">
        <div className="mat-guide-weight-heading">
          <span>Sparring Divisions</span>

          <h3>
            {selectedDivision?.label} ·{' '}
            {effectiveCompetitionClass === 'world'
              ? 'World Class'
              : 'Aspiring'}{' '}
            · {gender === 'male' ? 'Male' : 'Female'}
          </h3>

          <p>
            Competition age:{' '}
            {selectedDivision?.ages}
          </p>
        </div>

        <div className="mat-guide-weight-chips">
          {weights.map((weight) => (
            <div
              className="mat-guide-weight-chip"
              key={weight}
            >
              {weight}
            </div>
          ))}
        </div>
      </div>

      <div className="mat-guide-info-box">
        <ShieldCheck size={16} />

        <span>
          Sparring weight classes are competition
          divisions, not target body weights. Athletes
          and parents should discuss the correct
          tournament division with their MAT coach.
        </span>
      </div>
    </>
  )
}

export default function NewMemberGuidePage({
  onNavigate,
}) {
  return (
    <div className="mat-guide">
      <button
        type="button"
        className="mat-guide-back"
        onClick={() => onNavigate('home')}
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <section className="mat-guide-hero">
        <div className="mat-guide-hero-icon">
          <GraduationCap size={28} />
        </div>

        <div>
          <div className="mat-eyebrow">
            Michigan Academy of Taekwondo
          </div>

          <h1>New Member Guide</h1>

          <p>
            A simple guide to tournament registration,
            competition divisions, poomsae requirements,
            tournament day, and common Taekwondo
            terminology.
          </p>
        </div>
      </section>

      <div className="mat-guide-version">
        <Info size={17} />

        <div>
          <strong>{guideRuleVersion.label}</strong>
          <span>
            Verified {guideRuleVersion.verified}.{' '}
            {guideRuleVersion.note}
          </span>
        </div>
      </div>

      <nav
        className="mat-guide-jump-grid"
        aria-label="New member guide sections"
      >
        <a
          href="#registration"
          className="mat-guide-jump-card"
        >
          <BookOpen size={18} />
          <span>Tournament Registration</span>
        </a>

        <a
          href="#forms"
          className="mat-guide-jump-card"
        >
          <GraduationCap size={18} />
          <span>Poomsae Forms</span>
        </a>

        <a
          href="#sparring"
          className="mat-guide-jump-card"
        >
          <Scale size={18} />
          <span>Sparring Divisions</span>
        </a>

        <a
          href="#tournament-day"
          className="mat-guide-jump-card"
        >
          <Trophy size={18} />
          <span>Tournament Day</span>
        </a>
      </nav>

      <section
        id="registration"
        className="mat-guide-section"
      >
        <div className="mat-guide-section-heading">
          <div className="mat-guide-section-icon">
            <BookOpen size={19} />
          </div>

          <div>
            <span>Getting Registered</span>
            <h2>Tournament Registration</h2>
            <p>
              The exact registration process depends on
              the tournament. For USA Taekwondo
              sanctioned events, athletes will commonly
              use the USATKD Sport:80 system.
            </p>
          </div>
        </div>

        <div className="mat-guide-step-list">
          {tournamentRegistrationGuide.map(
            (step, index) => (
              <div
                className="mat-guide-step"
                key={step.title}
              >
                <div className="mat-guide-step-number">
                  {index + 1}
                </div>

                <div>
                  <strong>{step.title}</strong>

                  <p>{step.text}</p>

                  {step.linkUrl && (
                    <a
                      href={step.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mat-guide-step-link"
                    >
                      {step.linkLabel}
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section
        id="forms"
        className="mat-guide-section"
      >
        <div className="mat-guide-section-heading">
          <div className="mat-guide-section-icon">
            <GraduationCap size={19} />
          </div>

          <div>
            <span>Poomsae Reference</span>
            <h2>Required Form Guide</h2>
            <p>
              Use the controls below to review the
              poomsae associated with different ranks
              and competition divisions.
            </p>
          </div>
        </div>

        <FormsGuide />
      </section>

      <section
        id="sparring"
        className="mat-guide-section"
      >
        <div className="mat-guide-section-heading">
          <div className="mat-guide-section-icon">
            <Scale size={19} />
          </div>

          <div>
            <span>Kyorugi Reference</span>
            <h2>Sparring Weight Classes</h2>
            <p>
              Select the athlete division, competition
              level, and gender division to view the
              corresponding sparring weight categories.
            </p>
          </div>
        </div>

        <SparringWeightGuide />
      </section>

      <section
        id="tournament-day"
        className="mat-guide-section"
      >
        <div className="mat-guide-section-heading">
          <div className="mat-guide-section-icon">
            <Trophy size={19} />
          </div>

          <div>
            <span>Competition Preparation</span>
            <h2>Tournament Day Basics</h2>
            <p>
              A few important things every athlete and
              parent should know before competition day.
            </p>
          </div>
        </div>

        <div className="mat-guide-checklist">
          {tournamentDayGuide.map((item) => (
            <div
              className="mat-guide-check-item"
              key={item}
            >
              <CheckCircle2 size={16} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="terminology"
        className="mat-guide-section"
      >
        <div className="mat-guide-section-heading">
          <div className="mat-guide-section-icon">
            <BookOpen size={19} />
          </div>

          <div>
            <span>Competition Vocabulary</span>
            <h2>Useful Terminology</h2>
            <p>
              Common words you may hear at MAT,
              tournaments, weigh-ins, and competition
              staging.
            </p>
          </div>
        </div>

        <div className="mat-guide-terms">
          {terminology.map((item) => (
            <div
              className="mat-guide-term"
              key={item.term}
            >
              <strong>{item.term}</strong>
              <p>{item.definition}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}