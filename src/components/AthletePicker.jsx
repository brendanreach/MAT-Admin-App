import { Search, X } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'

const fullName = (member) => `${member.first_name || ''} ${member.last_name || ''}`.trim()

// Type-to-search athlete picker. Matches any part of the first or last name.
export default function AthletePicker({ members = [], value, onChange, disabledIds = [], disabledLabel = 'Already linked' }) {
  const listId = useId()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const sorted = useMemo(
    () => [...members].sort((a, b) =>
      `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)),
    [members]
  )
  const selected = members.find((member) => member.id === value)

  const matches = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return sorted
    return sorted.filter((member) => {
      const name = fullName(member).toLowerCase()
      return terms.every((term) => name.includes(term))
    })
  }, [sorted, query])

  function choose(member) {
    if (!member || disabledIds.includes(member.id)) return
    onChange(member.id)
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange('')
    setQuery('')
    setOpen(true)
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => Math.min(Math.max(index + step, 0), Math.max(matches.length - 1, 0)))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      choose(matches[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const activeMember = open ? matches[activeIndex] : null

  return (
    <div className="mat-athlete-picker">
      <div className="mat-athlete-picker-field">
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeMember ? `${listId}-${activeMember.id}` : undefined}
          placeholder={selected ? '' : 'Search athletes...'}
          value={open || !selected ? query : fullName(selected)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setOpen(true)
            if (value) onChange('')
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {(selected || query) && (
          <button type="button" className="mat-athlete-picker-clear" onMouseDown={(event) => event.preventDefault()} onClick={clear} aria-label="Clear athlete">
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <ul id={listId} role="listbox" className="mat-athlete-picker-list">
          {matches.length === 0 ? (
            <li className="mat-athlete-picker-none">No athletes match "{query.trim()}"</li>
          ) : matches.map((member, index) => {
            const disabled = disabledIds.includes(member.id)
            return (
              <li
                key={member.id}
                id={`${listId}-${member.id}`}
                role="option"
                aria-selected={member.id === value}
                aria-disabled={disabled}
                className={`${index === activeIndex ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(member)}
              >
                <span>{fullName(member)}</span>
                {disabled && <small>{disabledLabel}</small>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
