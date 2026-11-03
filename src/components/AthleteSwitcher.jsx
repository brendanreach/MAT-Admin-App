import { UserRound } from 'lucide-react'
import './AthleteSwitcher.css'

function athleteName(member) {
  return [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Athlete'
}

export default function AthleteSwitcher({ athletes = [], activeAthleteId, onChange }) {
  if (athletes.length < 2) return null

  return (
    <nav className="mat-athlete-switcher" aria-label="Switch athlete">
      <span className="mat-athlete-switcher-label">Viewing</span>
      <div className="mat-athlete-switcher-options">
        {athletes.map((member) => {
          const active = member.id === activeAthleteId
          return (
            <button
              key={member.id}
              type="button"
              className={active ? 'active' : ''}
              aria-pressed={active}
              onClick={() => onChange(member.id)}
            >
              <UserRound size={16} />
              <span>{athleteName(member)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
